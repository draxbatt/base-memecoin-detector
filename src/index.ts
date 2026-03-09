import cron from 'node-cron';
import { ClankerScraper, BankrScraper } from './scrapers/launchers';
import { RpcIntegration } from './scrapers/rpc';
import { Database } from './database/db';
import { WalletAnalyzer, CreatorHistoryAnalyzer, LiquidityAnalyzer } from './analyzers';
import { ScoringEngine } from './scoring/score-engine';
import { TelegramNotifier } from './alerts/telegram-notifier';
import { config } from './config/env';
import logger from './utils/logger';
import { BotError } from './utils/errors';

export class MemecoinBot {
  private clankerScraper: ClankerScraper;
  private bankrScraper: BankrScraper;
  private rpc: RpcIntegration;
  private database: Database;
  private walletAnalyzer: WalletAnalyzer;
  private creatorAnalyzer: CreatorHistoryAnalyzer;
  private liquidityAnalyzer: LiquidityAnalyzer;
  private scoringEngine: ScoringEngine;
  private telegramNotifier: TelegramNotifier;
  private isRunning = false;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.clankerScraper = new ClankerScraper(config.clankerApiUrl);
    this.bankrScraper = new BankrScraper(config.bankrApiUrl);
    this.rpc = new RpcIntegration(config.baseRpcUrl);
    this.database = new Database(config.databasePath);
    this.walletAnalyzer = new WalletAnalyzer();
    this.creatorAnalyzer = new CreatorHistoryAnalyzer();
    this.liquidityAnalyzer = new LiquidityAnalyzer();
    this.scoringEngine = new ScoringEngine();
    this.telegramNotifier = new TelegramNotifier(config.telegramBotToken, config.telegramChatId);
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Memecoin Bot');

    try {
      // Initialize database
      await this.database.initialize();
      logger.info('Database initialized');

      // Test connections
      await this.rpc.verifyConnection();
      logger.info('RPC connection verified');

      await this.telegramNotifier.testConnection();
      logger.info('Telegram connection verified');

      logger.info('Bot initialization complete');
    } catch (error: any) {
      logger.error('Initialization failed', { error: error.message });
      throw error;
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    logger.info('Starting Memecoin Bot', { scanInterval: config.scanIntervalSeconds });

    // Run initial scan
    await this.scan();

    // Schedule periodic scans
    const cronExpression = `*/${Math.max(1, Math.floor(config.scanIntervalSeconds / 60))} * * * *`;
    this.cronJob = cron.schedule(cronExpression, async () => {
      try {
        await this.scan();
      } catch (error: any) {
        logger.error('Scan failed', { error: error.message });
      }
    });

    this.isRunning = true;
    logger.info('Bot started and running');

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  private async scan(): Promise<void> {
    logger.info('Starting scan cycle');
    const startTime = Date.now();

    try {
      const launches: any[] = [];

      // Fetch from Clanker
      if (config.enableClankerScraper) {
        try {
          const clankerLaunches = await this.clankerScraper.fetchLatestLaunches(50);
          launches.push(...clankerLaunches);
          logger.info('Fetched Clanker launches', { count: clankerLaunches.length });
        } catch (error: any) {
          logger.error('Clanker scrape failed', { error: error.message });
        }
      }

      // Fetch from Bankr
      if (config.enableBankrScraper) {
        try {
          const bankrLaunches = await this.bankrScraper.fetchLatestLaunches(50);
          launches.push(...bankrLaunches);
          logger.info('Fetched Bankr launches', { count: bankrLaunches.length });
        } catch (error: any) {
          logger.error('Bankr scrape failed', { error: error.message });
        }
      }

      logger.info('Processing launches', { total: launches.length });

      // Process each launch
      for (const launch of launches) {
        try {
          await this.processLaunch(launch);
        } catch (error: any) {
          logger.error('Failed to process launch', {
            contract: launch.contractAddress,
            error: error.message,
          });
        }
      }

      const duration = Date.now() - startTime;
      logger.info('Scan cycle complete', {
        processed: launches.length,
        durationMs: duration,
      });
    } catch (error: any) {
      logger.error('Scan cycle failed', { error: error.message });
    }
  }

  private async processLaunch(launch: any): Promise<void> {
    const { contractAddress, name, symbol, launchTime, creatorAddress } = launch;

    // Check if already processed
    const existing = await this.database.getToken(contractAddress);
    if (existing) {
      logger.debug('Token already in database', { contractAddress });
      return;
    }

    // Insert token
    const tokenId = await this.database.insertToken({
      contractAddress,
      name,
      symbol,
      launchTime,
      firstSeen: Date.now(),
      lastUpdated: Date.now(),
      source: launch.source,
    });

    logger.debug('Token inserted', { tokenId, contractAddress });

    try {
      // Fetch on-chain data
      const onChainData = await this.rpc.getTokenMetadata(contractAddress);
      const isLocked = await this.rpc.checkLiquidityLock(contractAddress);

      // Analyze
      const holderAnalysis = this.walletAnalyzer.analyzeHolders(onChainData);
      const creatorAnalysis = await this.creatorAnalyzer.analyzeCreator(creatorAddress, launchTime);
      const liquidityAnalysis = this.liquidityAnalyzer.analyzeLiquidity(
        contractAddress,
        launch.initialLiquidity,
        isLocked
      );

      // Score
      const scoring = this.scoringEngine.score(
        holderAnalysis,
        creatorAnalysis,
        liquidityAnalysis
      );

      // Store analysis
      await this.database.insertAnalysis({
        tokenId,
        score: scoring.totalScore,
        holderScore: scoring.components.holderScore,
        creatorScore: scoring.components.creatorScore,
        liquidityScore: scoring.components.liquidityScore,
        pumpScore: scoring.components.pumpScore,
        risks: scoring.risks,
        positives: scoring.positives,
        timestamp: Date.now(),
      });

      logger.info('Analysis complete', {
        tokenId,
        contractAddress,
        score: scoring.totalScore,
      });

      // Send alert if score meets threshold
      if (scoring.totalScore >= config.scoringThreshold) {
        const hasAlerted = await this.database.hasAlertBeenSent(tokenId);
        if (!hasAlerted) {
          try {
            const messageId = await this.telegramNotifier.sendAlert({
              tokenName: name,
              symbol,
              contractAddress,
              score: scoring,
              launchTime,
            });
            await this.database.recordAlertSent(tokenId, messageId);
            logger.info('Alert sent', { tokenId, messageId });
          } catch (error: any) {
            logger.error('Failed to send alert', {
              tokenId,
              error: error.message,
            });
          }
        }
      }
    } catch (error: any) {
      logger.error('Failed to process token', {
        contractAddress,
        error: error.message,
      });
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping bot');
    this.isRunning = false;

    if (this.cronJob) {
      this.cronJob.stop();
    }

    await this.database.close();
    logger.info('Bot stopped');
    process.exit(0);
  }
}
