"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramNotifier = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
class TelegramNotifier {
    constructor(botToken, chatId) {
        this.lastAlertTime = 0;
        this.alertCooldown = 120000; // 2 minutes between alerts
        this.bot = new node_telegram_bot_api_1.default(botToken, { polling: false });
        this.chatId = chatId;
    }
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
    escapeMarkdown(text) {
        return text.replace(/[_*\[\]()~`>#+=|\-\.!]/g, '\\$&');
    }
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