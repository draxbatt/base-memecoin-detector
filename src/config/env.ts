import dotenv from 'dotenv';
import { ValidationError } from '../utils/errors';

dotenv.config();

interface Config {
  // API endpoints
  clankerApiUrl: string;
  bankrApiUrl: string;
  baseRpcUrl: string;
  blockExplorerUrl: string;
  basescanApiKey?: string;

  // Scoring thresholds
  scoringThreshold: number;
  premiumScoreThreshold: number;

  // Telegram
  telegramBotToken: string;
  telegramChatId: string;

  // Scan frequency
  scanIntervalSeconds: number;

  // Database
  databasePath: string;

  // Logging
  logLevel: string;

  // Feature flags
  enableClankerScraper: boolean;
  enableBankrScraper: boolean;
}

function validateConfig(): Config {
  const required = [
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
    'BASE_RPC_URL',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new ValidationError(`Missing required environment variable: ${key}`);
    }
  }

  return {
    clankerApiUrl: process.env.CLANKER_API_URL || 'https://api.clanker.world',
    bankrApiUrl: process.env.BANKR_API_URL || 'https://api.bankr.world',
    baseRpcUrl: process.env.BASE_RPC_URL!,
    blockExplorerUrl: process.env.BLOCK_EXPLORER_URL || 'https://basescan.org',
    basescanApiKey: process.env.BASESCAN_API_KEY,

    scoringThreshold: parseInt(process.env.SCORING_THRESHOLD || '65'),
    premiumScoreThreshold: parseInt(process.env.PREMIUM_SCORE_THRESHOLD || '80'),

    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
    telegramChatId: process.env.TELEGRAM_CHAT_ID!,

    scanIntervalSeconds: parseInt(process.env.SCAN_INTERVAL_SECONDS || '300'),

    databasePath: process.env.DATABASE_PATH || 'data/bot.db',

    logLevel: process.env.LOG_LEVEL || 'info',

    enableClankerScraper: process.env.ENABLE_CLANKER !== 'false',
    enableBankrScraper: process.env.ENABLE_BANKR !== 'false',
  };
}

export const config = validateConfig();
