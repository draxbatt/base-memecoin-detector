"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemecoinBot = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const launchers_1 = require("./scrapers/launchers");
const rpc_1 = require("./scrapers/rpc");
const db_1 = require("./database/db");
const analyzers_1 = require("./analyzers");
const score_engine_1 = require("./scoring/score-engine");
const telegram_notifier_1 = require("./alerts/telegram-notifier");
const env_1 = require("./config/env");
const logger_1 = __importDefault(require("./utils/logger"));
/**
 * MemecoinBot - Main orchestrator for memecoin detection and analysis.
 *
 * Responsibilities:
 * - Coordinates all bot components (scrapers, analyzers, database, alerts)
 * - Manages scan lifecycle (fetch → analyze → score → alert)
 * - Handles graceful startup and shutdown
 * - Implements periodic scanning with cron scheduler
 *
 * @example
 * const bot = new MemecoinBot();
 * await bot.initialize();
 * await bot.start(); // Runs indefinitely with periodic scans
 */
class MemecoinBot {
    /**
     * Constructs MemecoinBot instance with all dependencies.
     * Initializes scrapers, analyzers, and alert services from config.
     */
    constructor() {
        this.isRunning = false;
        this.cronJob = null;
        this.clankerScraper = new launchers_1.ClankerScraper(env_1.config.clankerApiUrl);
        this.bankrScraper = new launchers_1.BankrScraper(env_1.config.bankrApiUrl);
        this.rpc = new rpc_1.RpcIntegration(env_1.config.baseRpcUrl, env_1.config.basescanApiKey);
        this.database = new db_1.Database(env_1.config.databasePath);
        this.walletAnalyzer = new analyzers_1.WalletAnalyzer();
        this.creatorAnalyzer = new analyzers_1.CreatorHistoryAnalyzer();
        this.liquidityAnalyzer = new analyzers_1.LiquidityAnalyzer();
        this.scoringEngine = new score_engine_1.ScoringEngine();
        this.telegramNotifier = new telegram_notifier_1.TelegramNotifier(env_1.config.telegramBotToken, env_1.config.telegramChatId);
    }
    /**
     * Initializes all bot components and verifies connections.
     *
     * Steps:
     * 1. Initialize SQLite database and create tables
     * 2. Verify RPC endpoint connectivity
     * 3. Verify Telegram bot token and chat ID
     *
     * @throws {Error} If any component initialization fails
     *
     * @example
     * await bot.initialize();
     * console.log('Bot ready!');
     */
    async initialize() {
        logger_1.default.info('Initializing Memecoin Bot');
        try {
            // Initialize database
            await this.database.initialize();
            logger_1.default.info('Database initialized');
            // Test connections
            await this.rpc.verifyConnection();
            logger_1.default.info('RPC connection verified');
            await this.telegramNotifier.testConnection();
            logger_1.default.info('Telegram connection verified');
            logger_1.default.info('Bot initialization complete');
        }
        catch (error) {
            logger_1.default.error('Initialization failed', { error: error.message });
            throw error;
        }
    }
    /**
     * Starts the bot's main scan loop.
     *
     * Flow:
     * 1. Runs immediate scan (don't wait for cron)
     * 2. Schedules periodic scans based on config.scanIntervalSeconds
     * 3. Registers graceful shutdown handlers (SIGTERM/SIGINT)
     * 4. Sets isRunning flag
     *
     * @throws {Error} If scan loop cannot be started
     *
     * @example
     * await bot.start(); // Blocks until SIGTERM
     */
    async start() {
        if (this.isRunning) {
            logger_1.default.warn('Bot is already running');
            return;
        }
        logger_1.default.info('Starting Memecoin Bot', { scanInterval: env_1.config.scanIntervalSeconds });
        // Run initial scan
        await this.scan();
        // Schedule periodic scans
        const cronExpression = `*/${Math.max(1, Math.floor(env_1.config.scanIntervalSeconds / 60))} * * * *`;
        this.cronJob = node_cron_1.default.schedule(cronExpression, async () => {
            try {
                await this.scan();
            }
            catch (error) {
                logger_1.default.error('Scan failed', { error: error.message });
            }
        });
        this.isRunning = true;
        logger_1.default.info('Bot started and running');
        // Handle graceful shutdown
        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());
    }
    /**
     * Executes one complete scan cycle.
     *
     * Scan flow:
     * 1. Fetch recent launches from Clanker API (if enabled)
     * 2. Fetch recent launches from Bankr API (if enabled)
     * 3. Deduplicate launches by contract address
     * 4. Process each new token (analyze, score, alert)
     *
     * Timing: Logs total duration per scan (for monitoring latency).
     * Error handling: Continues on individual scraper/token failure.
     *
     * @private
     *
     * @example
     * // Called internally by cron job and at startup
     * await this.scan();
     */
    async scan() {
        logger_1.default.info('Starting scan cycle');
        const startTime = Date.now();
        try {
            const launches = [];
            // Fetch from Clanker
            if (env_1.config.enableClankerScraper) {
                try {
                    const clankerLaunches = await this.clankerScraper.fetchLatestLaunches(50);
                    launches.push(...clankerLaunches);
                    logger_1.default.info('Fetched Clanker launches', { count: clankerLaunches.length });
                }
                catch (error) {
                    logger_1.default.error('Clanker scrape failed', { error: error.message });
                }
            }
            // Fetch from Bankr
            if (env_1.config.enableBankrScraper) {
                try {
                    const bankrLaunches = await this.bankrScraper.fetchLatestLaunches(50);
                    launches.push(...bankrLaunches);
                    logger_1.default.info('Fetched Bankr launches', { count: bankrLaunches.length });
                }
                catch (error) {
                    logger_1.default.error('Bankr scrape failed', { error: error.message });
                }
            }
            logger_1.default.info('Processing launches', { total: launches.length });
            // Process each launch
            for (const launch of launches) {
                try {
                    await this.processLaunch(launch);
                }
                catch (error) {
                    logger_1.default.error('Failed to process launch', {
                        contract: launch.contractAddress,
                        error: error.message,
                    });
                }
            }
            const duration = Date.now() - startTime;
            logger_1.default.info('Scan cycle complete', {
                processed: launches.length,
                durationMs: duration,
            });
        }
        catch (error) {
            logger_1.default.error('Scan cycle failed', { error: error.message });
        }
    }
    /**
     * Processes a single token launch.
     *
     * Steps:
     * 1. Check if token already in database (skip if exists)
     * 2. Insert token record with metadata
     * 3. Fetch on-chain data via RPC (holders, liquidity, etc.)
     * 4. Run all analyzers:
     *    - WalletAnalyzer: holder concentration + diversity
     *    - CreatorHistoryAnalyzer: creator reputation + history
     *    - LiquidityAnalyzer: lock status + amount thresholds
     * 5. Calculate weighted score (0-100)
     * 6. Store analysis result in database
     * 7. If score >= config.scoringThreshold: send Telegram alert
     *
     * @param launch - Token launch data from scraper (Clanker/Bankr)
     * @throws {Error} Errors are logged but don't stop scan cycle
     *
     * @private
     *
     * @example
     * // Called for each launch in scan cycle
     * await this.processLaunch({ contractAddress: '0x...', name: 'Doge', ... });
     */
    async processLaunch(launch) {
        const { contractAddress, name, symbol, launchTime, creatorAddress } = launch;
        // Check if already processed
        const existing = await this.database.getToken(contractAddress);
        if (existing) {
            logger_1.default.debug('Token already in database', { contractAddress });
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
        logger_1.default.debug('Token inserted', { tokenId, contractAddress });
        try {
            // Fetch on-chain data
            const onChainData = await this.rpc.getTokenMetadata(contractAddress);
            const isLocked = await this.rpc.checkLiquidityLock(contractAddress);
            // Analyze
            const holderAnalysis = this.walletAnalyzer.analyzeHolders(onChainData);
            const creatorAnalysis = await this.creatorAnalyzer.analyzeCreator(creatorAddress, launchTime);
            const liquidityAnalysis = this.liquidityAnalyzer.analyzeLiquidity(contractAddress, launch.initialLiquidity, isLocked);
            // Score
            const scoring = this.scoringEngine.score(holderAnalysis, creatorAnalysis, liquidityAnalysis);
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
            logger_1.default.info('Analysis complete', {
                tokenId,
                contractAddress,
                score: scoring.totalScore,
            });
            // Send alert if score meets threshold
            if (scoring.totalScore >= env_1.config.scoringThreshold) {
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
                        logger_1.default.info('Alert sent', { tokenId, messageId });
                    }
                    catch (error) {
                        logger_1.default.error('Failed to send alert', {
                            tokenId,
                            error: error.message,
                        });
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.error('Failed to process token', {
                contractAddress,
                error: error.message,
            });
        }
    }
    /**
     * Gracefully shuts down the bot.
     *
     * Steps:
     * 1. Stop accepting new scans
     * 2. Cancel scheduled cron job
     * 3. Close database connection
     * 4. Exit process
     *
     * Called on SIGTERM/SIGINT signals to ensure clean shutdown.
     *
     * @example
     * // Called automatically on signal, or manually:
     * await bot.stop();
     */
    async stop() {
        logger_1.default.info('Stopping bot');
        this.isRunning = false;
        if (this.cronJob) {
            this.cronJob.stop();
        }
        await this.database.close();
        logger_1.default.info('Bot stopped');
        process.exit(0);
    }
}
exports.MemecoinBot = MemecoinBot;
//# sourceMappingURL=index.js.map