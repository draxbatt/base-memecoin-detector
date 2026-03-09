"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const errors_1 = require("../utils/errors");
dotenv_1.default.config();
function validateConfig() {
    const required = [
        'TELEGRAM_BOT_TOKEN',
        'TELEGRAM_CHAT_ID',
        'BASE_RPC_URL',
    ];
    for (const key of required) {
        if (!process.env[key]) {
            throw new errors_1.ValidationError(`Missing required environment variable: ${key}`);
        }
    }
    return {
        clankerApiUrl: process.env.CLANKER_API_URL || 'https://api.clanker.world',
        bankrApiUrl: process.env.BANKR_API_URL || 'https://api.bankr.world',
        baseRpcUrl: process.env.BASE_RPC_URL,
        blockExplorerUrl: process.env.BLOCK_EXPLORER_URL || 'https://basescan.org',
        scoringThreshold: parseInt(process.env.SCORING_THRESHOLD || '65'),
        premiumScoreThreshold: parseInt(process.env.PREMIUM_SCORE_THRESHOLD || '80'),
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
        telegramChatId: process.env.TELEGRAM_CHAT_ID,
        scanIntervalSeconds: parseInt(process.env.SCAN_INTERVAL_SECONDS || '300'),
        databasePath: process.env.DATABASE_PATH || 'data/bot.db',
        logLevel: process.env.LOG_LEVEL || 'info',
        enableClankerScraper: process.env.ENABLE_CLANKER !== 'false',
        enableBankrScraper: process.env.ENABLE_BANKR !== 'false',
    };
}
exports.config = validateConfig();
//# sourceMappingURL=env.js.map