"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
dotenv_1.default.config();
function validateConfig() {
    const required = [
        'TELEGRAM_BOT_TOKEN',
        'TELEGRAM_CHAT_ID',
        'BASE_RPC_URL',
    ];
    const missing = [];
    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }
    if (missing.length > 0) {
        const message = `Missing required environment variables: ${missing.join(', ')}.\nPlease check .env.example for configuration.`;
        logger_1.default.error('Configuration validation failed', { missing });
        throw new errors_1.ValidationError(message, { missing });
    }
    // Validate numeric values
    const scoringThreshold = parseInt(process.env.SCORING_THRESHOLD || '65');
    if (isNaN(scoringThreshold) || scoringThreshold < 0 || scoringThreshold > 100) {
        throw new errors_1.ValidationError('SCORING_THRESHOLD must be a number between 0 and 100', {
            value: process.env.SCORING_THRESHOLD,
        });
    }
    const premiumScoreThreshold = parseInt(process.env.PREMIUM_SCORE_THRESHOLD || '80');
    if (isNaN(premiumScoreThreshold) || premiumScoreThreshold < 0 || premiumScoreThreshold > 100) {
        throw new errors_1.ValidationError('PREMIUM_SCORE_THRESHOLD must be a number between 0 and 100', {
            value: process.env.PREMIUM_SCORE_THRESHOLD,
        });
    }
    const scanInterval = parseInt(process.env.SCAN_INTERVAL_SECONDS || '300');
    if (isNaN(scanInterval) || scanInterval < 10) {
        throw new errors_1.ValidationError('SCAN_INTERVAL_SECONDS must be a number >= 10', {
            value: process.env.SCAN_INTERVAL_SECONDS,
        });
    }
    const config = {
        clankerApiUrl: process.env.CLANKER_API_URL || 'https://api.clanker.world',
        bankrApiUrl: process.env.BANKR_API_URL || 'https://api.bankr.world',
        baseRpcUrl: process.env.BASE_RPC_URL,
        blockExplorerUrl: process.env.BLOCK_EXPLORER_URL || 'https://basescan.org',
        basescanApiKey: process.env.BASESCAN_API_KEY,
        scoringThreshold,
        premiumScoreThreshold,
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
        telegramChatId: process.env.TELEGRAM_CHAT_ID,
        scanIntervalSeconds: scanInterval,
        databasePath: process.env.DATABASE_PATH || 'data/bot.db',
        logLevel: process.env.LOG_LEVEL || 'info',
        enableClankerScraper: process.env.ENABLE_CLANKER !== 'false',
        enableBankrScraper: process.env.ENABLE_BANKR !== 'false',
    };
    // Log warnings for optional but recommended configs
    if (!config.basescanApiKey) {
        logger_1.default.warn('BASESCAN_API_KEY not set - using RPC-only holder data (slower)', {
            recommendation: 'Get free API key at https://basescan.org/apis',
        });
    }
    logger_1.default.info('Configuration loaded successfully', {
        rpcUrl: config.baseRpcUrl.split('/').slice(0, 3).join('/') + '/...', // Hide API key
        databasePath: config.databasePath,
        logLevel: config.logLevel,
        scanInterval: config.scanIntervalSeconds,
    });
    return config;
}
exports.config = validateConfig();
//# sourceMappingURL=env.js.map