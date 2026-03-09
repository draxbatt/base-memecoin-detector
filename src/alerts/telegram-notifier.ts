import TelegramBot from 'node-telegram-bot-api';
import logger from '../utils/logger';
import { APIError } from '../utils/errors';
import { ScoringResult } from '../scoring/score-engine';

export interface AlertPayload {
  tokenName: string;
  symbol: string;
  contractAddress: string;
  score: ScoringResult;
  launchTime: number;
}

export class TelegramNotifier {
  private bot: TelegramBot;
  private chatId: string;
  private lastAlertTime = 0;
  private alertCooldown = 120000; // 2 minutes between alerts

  constructor(botToken: string, chatId: string) {
    this.bot = new TelegramBot(botToken, { polling: false });
    this.chatId = chatId;
  }

  async sendAlert(alert: AlertPayload): Promise<string> {
    // Rate limiting check
    const now = Date.now();
    if (now - this.lastAlertTime < this.alertCooldown) {
      logger.warn('Alert rate limited', {
        cooldownMs: this.alertCooldown,
        timeSinceLastAlert: now - this.lastAlertTime,
      });
      throw new APIError('Alert rate limited', { cooldownMs: this.alertCooldown });
    }

    try {
      const message = this.formatAlert(alert);
      logger.debug('Sending Telegram alert', {
        tokenName: alert.tokenName,
        score: alert.score.totalScore,
      });

      const result = await this.bot.sendMessage(this.chatId, message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      this.lastAlertTime = now;
      logger.info('Alert sent successfully', {
        messageId: result.message_id,
        tokenName: alert.tokenName,
      });

      return result.message_id.toString();
    } catch (error: any) {
      throw new APIError('Failed to send Telegram alert', {
        error: error.message,
        tokenName: alert.tokenName,
      });
    }
  }

  private formatAlert(alert: AlertPayload): string {
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

  private formatTimeAgo(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return '<1m';
  }

  private escapeMarkdown(text: string): string {
    return text.replace(/[_*\[\]()~`>#+=|\-\.!]/g, '\\$&');
  }

  async testConnection(): Promise<boolean> {
    try {
      logger.debug('Testing Telegram connection');
      const me = await this.bot.getMe();
      logger.info('Telegram bot connected', { botUsername: me.username });
      return true;
    } catch (error: any) {
      throw new APIError('Telegram connection failed', { error: error.message });
    }
  }
}
