import { ScoringResult } from '../scoring/score-engine';
/**
 * Payload for Telegram alert message.
 *
 * Contains all information needed to generate and send a Telegram alert.
 *
 * @interface AlertPayload
 * @property {string} tokenName - Full token name (e.g., "Shiba Inu")
 * @property {string} symbol - Token ticker (e.g., "SHIB")
 * @property {string} contractAddress - ERC-20 contract address
 * @property {ScoringResult} score - Complete scoring breakdown
 * @property {number} launchTime - Timestamp of token launch
 */
export interface AlertPayload {
    tokenName: string;
    symbol: string;
    contractAddress: string;
    score: ScoringResult;
    launchTime: number;
}
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
export declare class TelegramNotifier {
    private bot;
    private chatId;
    private lastAlertTime;
    private alertCooldown;
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
    constructor(botToken: string, chatId: string);
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
    sendAlert(alert: AlertPayload): Promise<string>;
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
    private formatAlert;
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
    private formatTimeAgo;
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
    private escapeMarkdown;
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
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=telegram-notifier.d.ts.map