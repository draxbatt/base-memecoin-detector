"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const errors_1 = require("../utils/errors");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Database - SQLite persistence layer for memecoin bot.
 *
 * Manages three tables:
 * - tokens: Detected memecoin launches
 * - analyses: Scoring results for tokens
 * - alerts_sent: Deduplication of Telegram alerts
 *
 * All methods return Promises and handle SQLite async operations.
 * Errors are wrapped in DatabaseError with context.
 *
 * @example
 * const db = new Database('./bot.db');
 * await db.initialize();
 * const tokenId = await db.insertToken({ contractAddress: '0x...', ... });
 * await db.close();
 */
class Database {
    /**
     * Constructs Database instance.
     *
     * Opens SQLite connection at specified path.
     * If file doesn't exist, creates it.
     *
     * @param {string} dbPath - Path to SQLite database file (e.g., './bot.db')
     * @throws {DatabaseError} If connection fails
     */
    constructor(dbPath) {
        this.db = new sqlite3_1.default.Database(dbPath, (err) => {
            if (err) {
                throw new errors_1.DatabaseError('Failed to open database', { dbPath, error: err.message });
            }
            logger_1.default.info('Database connected', { dbPath });
        });
    }
    /**
     * Initializes database schema.
     *
     * Creates three tables if they don't exist:
     * 1. tokens - Unique memecoin launches (unique on contractAddress)
     * 2. analyses - Scoring results (many-to-one with tokens)
     * 3. alerts_sent - Alert history (one-to-one with tokens)
     *
     * Runs all CREATE TABLE statements in serialized mode (one after another).
     *
     * @returns {Promise<void>}
     * @throws {DatabaseError} If table creation fails
     *
     * @example
     * await db.initialize();
     * console.log('Tables ready');
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // Tokens table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contractAddress TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            symbol TEXT NOT NULL,
            launchTime INTEGER NOT NULL,
            firstSeen INTEGER NOT NULL,
            lastUpdated INTEGER NOT NULL,
            source TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
                    if (err)
                        reject(new errors_1.DatabaseError('Failed to create tokens table', { error: err.message }));
                });
                // Analyses table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tokenId INTEGER NOT NULL,
            score INTEGER NOT NULL,
            holderScore INTEGER NOT NULL,
            creatorScore INTEGER NOT NULL,
            liquidityScore INTEGER NOT NULL,
            pumpScore INTEGER NOT NULL,
            risks TEXT,
            positives TEXT,
            timestamp INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tokenId) REFERENCES tokens(id)
          )
        `, (err) => {
                    if (err)
                        reject(new errors_1.DatabaseError('Failed to create analyses table', { error: err.message }));
                });
                // Alerts sent table
                this.db.run(`
          CREATE TABLE IF NOT EXISTS alerts_sent (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tokenId INTEGER NOT NULL,
            alertTime INTEGER NOT NULL,
            messageId TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(tokenId),
            FOREIGN KEY (tokenId) REFERENCES tokens(id)
          )
        `, (err) => {
                    if (err)
                        reject(new errors_1.DatabaseError('Failed to create alerts_sent table', { error: err.message }));
                    else
                        resolve();
                });
            });
        });
    }
    /**
     * Inserts or updates token record.
     *
     * Uses ON CONFLICT clause to handle duplicate contract addresses:
     * - If contractAddress exists: Updates lastUpdated timestamp only
     * - If new: Inserts new row
     *
     * @param {TokenRecord} token - Token data to insert
     * @returns {Promise<number>} Database row ID
     * @throws {DatabaseError} If insert fails
     *
     * @example
     * const tokenId = await db.insertToken({
     *   contractAddress: '0x123...',
     *   name: 'Shib Inu',
     *   symbol: 'SHIB',
     *   launchTime: 1700000000000,
     *   firstSeen: Date.now(),
     *   lastUpdated: Date.now(),
     *   source: 'clanker'
     * });
     */
    async insertToken(token) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO tokens (contractAddress, name, symbol, launchTime, firstSeen, lastUpdated, source)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(contractAddress) DO UPDATE SET lastUpdated = excluded.lastUpdated
      `;
            this.db.run(sql, [token.contractAddress, token.name, token.symbol, token.launchTime, token.firstSeen, token.lastUpdated, token.source], function (err) {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to insert token', { token, error: err.message }));
                else
                    resolve(this.lastID);
            });
        });
    }
    /**
     * Retrieves token by contract address.
     *
     * @param {string} contractAddress - ERC-20 contract address to look up
     * @returns {Promise<TokenRecord | null>} Token record or null if not found
     * @throws {DatabaseError} If query fails
     *
     * @example
     * const token = await db.getToken('0x123...');
     * if (token) console.log(`Found ${token.name}`);
     */
    async getToken(contractAddress) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM tokens WHERE contractAddress = ?', [contractAddress], (err, row) => {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to get token', { contractAddress, error: err.message }));
                else
                    resolve(row || null);
            });
        });
    }
    /**
     * Inserts analysis result for a token.
     *
     * Stores component scores and risk/positive flags.
     * JSON stringifies arrays before inserting (SQLite stores as TEXT).
     *
     * @param {AnalysisRecord} analysis - Analysis data to store
     * @returns {Promise<number>} Database row ID
     * @throws {DatabaseError} If insert fails
     *
     * @example
     * const analysisId = await db.insertAnalysis({
     *   tokenId: 1,
     *   score: 72,
     *   holderScore: 60,
     *   creatorScore: 85,
     *   liquidityScore: 75,
     *   pumpScore: 50,
     *   risks: ['High concentration'],
     *   positives: ['Locked liquidity'],
     *   timestamp: Date.now()
     * });
     */
    async insertAnalysis(analysis) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO analyses (tokenId, score, holderScore, creatorScore, liquidityScore, pumpScore, risks, positives, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            this.db.run(sql, [
                analysis.tokenId,
                analysis.score,
                analysis.holderScore,
                analysis.creatorScore,
                analysis.liquidityScore,
                analysis.pumpScore,
                JSON.stringify(analysis.risks),
                JSON.stringify(analysis.positives),
                analysis.timestamp,
            ], function (err) {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to insert analysis', { tokenId: analysis.tokenId, error: err.message }));
                else
                    resolve(this.lastID);
            });
        });
    }
    /**
     * Checks if Telegram alert has already been sent for token.
     *
     * Used to prevent sending duplicate alerts for same token.
     *
     * @param {number} tokenId - Token ID to check
     * @returns {Promise<boolean>} True if alert was sent, false otherwise
     * @throws {DatabaseError} If query fails
     *
     * @example
     * if (!await db.hasAlertBeenSent(tokenId)) {
     *   await telegramNotifier.sendAlert(...);
     *   await db.recordAlertSent(tokenId);
     * }
     */
    async hasAlertBeenSent(tokenId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT id FROM alerts_sent WHERE tokenId = ?', [tokenId], (err, row) => {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to check alert', { tokenId, error: err.message }));
                else
                    resolve(!!row);
            });
        });
    }
    /**
     * Records that Telegram alert was sent for token.
     *
     * Prevents duplicate alerts by storing alert timestamp and Telegram message ID.
     * Uses REPLACE to update if record already exists.
     *
     * @param {number} tokenId - Token ID that alert was sent for
     * @param {string} [messageId] - Optional Telegram message ID for reference
     * @returns {Promise<number>} Database row ID
     * @throws {DatabaseError} If insert/replace fails
     *
     * @example
     * await db.recordAlertSent(tokenId, 'tg_msg_12345');
     */
    async recordAlertSent(tokenId, messageId) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT OR REPLACE INTO alerts_sent (tokenId, alertTime, messageId)
        VALUES (?, ?, ?)
      `;
            this.db.run(sql, [tokenId, Date.now(), messageId], function (err) {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to record alert', { tokenId, error: err.message }));
                else
                    resolve(this.lastID);
            });
        });
    }
    /**
     * Retrieves most recent analysis for a token.
     *
     * Parses JSON arrays (risks, positives) back to strings.
     *
     * @param {number} tokenId - Token ID to query
     * @returns {Promise<AnalysisRecord | null>} Latest analysis or null if not found
     * @throws {DatabaseError} If query fails
     *
     * @example
     * const analysis = await db.getLatestAnalysis(tokenId);
     * console.log(`Last score: ${analysis?.score}`);
     */
    async getLatestAnalysis(tokenId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM analyses WHERE tokenId = ? ORDER BY timestamp DESC LIMIT 1';
            this.db.get(sql, [tokenId], (err, row) => {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to get analysis', { tokenId, error: err.message }));
                else
                    resolve(row ? { ...row, risks: JSON.parse(row.risks), positives: JSON.parse(row.positives) } : null);
            });
        });
    }
    /**
     * Verifies that all required database tables exist.
     *
     * Used for testing and diagnostics.
     *
     * @returns {Promise<boolean>} True if all 3 tables exist, false otherwise
     *
     * @example
     * if (!await db.verifyTables()) throw new Error('Database corrupted');
     */
    async verifyTables() {
        return new Promise((resolve) => {
            const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('tokens', 'analyses', 'alerts_sent')`;
            this.db.all(sql, (err, rows) => {
                if (err) {
                    logger_1.default.error('Failed to verify tables', { error: err.message });
                    resolve(false);
                }
                else {
                    resolve(rows && rows.length >= 3);
                }
            });
        });
    }
    /**
     * Gets total number of tokens in database.
     *
     * Used for testing and progress monitoring.
     *
     * @returns {Promise<number>} Total token count
     * @throws {DatabaseError} If query fails
     *
     * @example
     * const count = await db.getTokenCount();
     * console.log(`${count} tokens analyzed`);
     */
    async getTokenCount() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT COUNT(*) as count FROM tokens', (err, row) => {
                if (err)
                    reject(new errors_1.DatabaseError('Failed to get token count', { error: err.message }));
                else
                    resolve(row?.count || 0);
            });
        });
    }
    /**
     * Closes database connection gracefully.
     *
     * Should be called during bot shutdown to prevent hanging connections.
     *
     * @returns {Promise<void>}
     * @throws {Error} If connection close fails
     *
     * @example
     * await db.close();
     * process.exit(0);
     */
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err)
                    reject(err);
                else {
                    logger_1.default.info('Database closed');
                    resolve();
                }
            });
        });
    }
}
exports.Database = Database;
//# sourceMappingURL=db.js.map