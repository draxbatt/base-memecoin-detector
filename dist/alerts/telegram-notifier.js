"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramNotifier = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
/**
 * TelegramNotifier - Sends alerts to Telegram chat.
 *
 * Features:
 * - Formats alerts with Markdown for readability
 * - Rate limiting (2-minute cooldown between alerts)
 * - Embeds links to Dexscreener and Basescan explorers
 * - Aggregates risk flags and positive indicators
 * - Validates Telegram bot connection
 *
 * Message format includes:
 * - Token name, symbol, contract address
 * - Overall score and recommendation (SAFE/CAUTION/AVOID)
 * - Component scores (holder, creator, liquidity, pump)
 * - Top 3 positive indicators (green flags)
 * - Top 3 risk flags (red flags)
 * - Direct links to trading/blockchain explorers
 *
 * @example
 * const notifier = new TelegramNotifier(botToken, chatId);
 * await notifier.testConnection();
 * const messageId = await notifier.sendAlert(alertPayload);
 */
class TelegramNotifier {
    /**
     * Constructs TelegramNotifier instance.
     *
     * Initializes Telegram bot client (without polling).
     * Stores target chat ID for alert delivery.
     *
     * @param {string} botToken - Telegram bot API token (from BotFather)
     * @param {string} chatId - Target chat ID (personal or group)
     * @throws {Error} If botToken is invalid
     */
    constructor(botToken, chatId) {
        this.lastAlertTime = 0;
        this.alertCooldown = 120000; // 2 minutes between alerts
        this.bot = new node_telegram_bot_api_1.default(botToken, { polling: false });
        this.chatId = chatId;
    }
    /**
     * Sends formatted alert to Telegram chat.
     *
     * Flow:
     * 1. Check rate limiting (prevent alert spam)
     * 2. Format alert message with Markdown
     * 3. Send via Telegram Bot API
     * 4. Update last alert timestamp
     * 5. Return message ID for tracking
     *
     * Rate limiting: 2-minute cooldown between alerts (configurable).
     * If cooldown not met, throws APIError without sending.
     *
     * @param {AlertPayload} alert - Token alert data
     * @returns {Promise<string>} Telegram message ID
     * @throws {APIError} If rate limited or send fails
     *
     * @example
     * try {
     *   const msgId = await notifier.sendAlert({
     *     tokenName: 'Doge Inu',
     *     symbol: 'DOGE',
     *     contractAddress: '0x123...',
     *     score: { totalScore: 72, ... },
     *     launchTime: Date.now() - 300000
     *   });
     *   console.log(`Alert sent: ${msgId}`);
     * } catch (e) {
     *   console.error('Alert failed:', e.message);
     * }
     */
    async sendAlert(alert) {
        // Rate limiting check
        const now = Date.now();
        if (now - this.lastAlertTime < this.alertCooldown) {
            logger_1.default.warn('Alert rate limited', {
                cooldownMs: this.alertCooldown,
                timeSinceLastAlert: now - this.lastAlertTime,
            });
            throw new errors_1.APIError('Alert rate limited', { cooldownMs: this.alertCooldown });
        }
        try {
            const message = this.formatAlert(alert);
            logger_1.default.debug('Sending Telegram alert', {
                tokenName: alert.tokenName,
                score: alert.score.totalScore,
            });
            const result = await this.bot.sendMessage(this.chatId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
            });
            this.lastAlertTime = now;
            logger_1.default.info('Alert sent successfully', {
                messageId: result.message_id,
                tokenName: alert.tokenName,
            });
            return result.message_id.toString();
        }
        catch (error) {
            throw new errors_1.APIError('Failed to send Telegram alert', {
                error: error.message,
                tokenName: alert.tokenName,
            });
        }
    }
    /**
     * Formats alert into Markdown message for Telegram.
     *
     * Message structure:
     * 1. Header: "🚨 NEW TOKEN ALERT"
     * 2. Token info: name, symbol, contract, launch time
     * 3. Score section: total score, recommendation color
     * 4. Positive indicators: up to 3 green flags
     * 5. Risk flags: up to 3 red flags
     * 6. Component breakdown: holder, creator, liquidity, pump scores
     * 7. Quick links: Dexscreener and Basescan explorers
     *
     * Scoring colors:
     * - 🟢 70+: SAFE (low risk)
     * - 🟡 50-69: CAUTION (mixed signals)
     * - 🔴 <50: AVOID (high risk)
     *
     * @param {AlertPayload} alert - Token alert data
     * @returns {string} Markdown-formatted message
     *
     * @private
     */
    formatAlert(alert) {
        const { tokenName, symbol, contractAddress, score, launchTime } = alert;
        const timeAgo = this.formatTimeAgo(Date.now() - launchTime);
        const dexLink = `https://dexscreener.com/base/${contractAddress}`;
        const explorerLink = `https://basescan.org/token/${contractAddress}`;
        const scoreColor = score.totalScore >= 70 ? '🟢' : score.totalScore >= 50 ? '🟡' : '🔴';
        let message = `🚨 *NEW TOKEN ALERT*\n\n`;
        message += `*${tokenName}* (\`${symbol}\`)\n`;
        message += `Contract: \`${contractAddress}\`\n`;
        message += `Launched: ${timeAgo} ago\n\n`;
        message += `${scoreColor} *SCORE: ${score.totalScore}/100*\n`;
        message += `Recommendation: *${score.recommendation}*\n\n`;
        if (score.positives.length > 0) {
            message += `✅ *Positives:*\n`;
            for (const positive of score.positives.slice(0, 3)) {
                message += `• ${this.escapeMarkdown(positive)}\n`;
            }
            message += '\n';
        }
        if (score.risks.length > 0) {
            message += `⚠️ *Risks:*\n`;
            for (const risk of score.risks.slice(0, 3)) {
                message += `• ${this.escapeMarkdown(risk)}\n`;
            }
            message += '\n';
        }
        message += `📊 *Component Scores:*\n`;
        message += `• Holders: ${score.components.holderScore}/100\n`;
        message += `• Creator: ${score.components.creatorScore}/100\n`;
        message += `• Liquidity: ${score.components.liquidityScore}/100\n`;
        message += `• Pump: ${score.components.pumpScore}/100\n\n`;
        message += `🔗 [Dexscreener](${dexLink}) | [Basescan](${explorerLink})\n`;
        return message;
    }
    /**
     * Converts milliseconds to human-readable time format.
     *
     * Returns largest unit: days > hours > minutes > seconds.
     *
     * @param {number} ms - Milliseconds to format
     * @returns {string} Time string (e.g., "5d", "3h", "45m", "<1m")
     *
     * @private
     *
     * @example
     * formatTimeAgo(300000) // "5m"
     * formatTimeAgo(3600000) // "1h"
     */
    formatTimeAgo(ms) {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (days > 0)
            return `${days}d`;
        if (hours > 0)
            return `${hours}h`;
        if (minutes > 0)
            return `${minutes}m`;
        return '<1m';
    }
    /**
     * Escapes special Markdown characters in text.
     *
     * Prevents accidental formatting when text contains Markdown symbols.
     * Escapes: _ * [ ] ( ) ~ ` > # + = | - . !
     *
     * @param {string} text - Raw text to escape
     * @returns {string} Escaped text safe for Markdown
     *
     * @private
     *
     * @example
     * escapeMarkdown("Hello_world[test]") // "Hello\\_world\\[test\\]"
     */
    escapeMarkdown(text) {
        return text.replace(/[_*\[\]()~`>#+=|\-\.!]/g, '\\$&');
    }
    /**
     * Verifies Telegram bot connection.
     *
     * Calls Telegram getMe() API to validate bot token and connectivity.
     * Logs bot username on success.
     *
     * Should be called during bot.initialize() to fail fast on auth errors.
     *
     * @returns {Promise<boolean>} Always true on success
     * @throws {APIError} If connection fails or bot token invalid
     *
     * @example
     * try {
     *   await notifier.testConnection();
     *   console.log('Telegram ready!');
     * } catch (e) {
     *   console.error('Invalid bot token:', e.message);
     * }
     */
    async testConnection() {
        try {
            logger_1.default.debug('Testing Telegram connection');
            const me = await this.bot.getMe();
            logger_1.default.info('Telegram bot connected', { botUsername: me.username });
            return true;
        }
        catch (error) {
            throw new errors_1.APIError('Telegram connection failed', { error: error.message });
        }
    }
}
exports.TelegramNotifier = TelegramNotifier;
//# sourceMappingURL=telegram-notifier.js.map