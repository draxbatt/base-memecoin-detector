/**
 * Token record stored in database.
 *
 * Represents a unique memecoin launch detected by scrapers.
 *
 * @interface TokenRecord
 * @property {number} [id] - Primary key (auto-generated)
 * @property {string} contractAddress - ERC-20 token contract address (UNIQUE)
 * @property {string} name - Token full name (e.g., "Doge Inu")
 * @property {string} symbol - Token ticker symbol (e.g., "DOGE")
 * @property {number} launchTime - Timestamp when token was launched
 * @property {number} firstSeen - Timestamp when bot first detected token
 * @property {number} lastUpdated - Timestamp of last scan/update
 * @property {('clanker' | 'bankr')} source - Data source (Clanker or Bankr)
 */
export interface TokenRecord {
    id?: number;
    contractAddress: string;
    name: string;
    symbol: string;
    launchTime: number;
    firstSeen: number;
    lastUpdated: number;
    source: 'clanker' | 'bankr';
}
/**
 * Analysis result stored in database.
 *
 * Stores the scoring breakdown and component scores for a token at a point in time.
 *
 * @interface AnalysisRecord
 * @property {number} [id] - Primary key (auto-generated)
 * @property {number} tokenId - Foreign key to tokens table
 * @property {number} score - Final weighted score (0-100)
 * @property {number} holderScore - Holder concentration score (0-100)
 * @property {number} creatorScore - Creator reputation score (0-100)
 * @property {number} liquidityScore - Liquidity lock score (0-100)
 * @property {number} pumpScore - Pump pattern score (0-100)
 * @property {string[]} risks - Red flags detected (e.g., "High concentration")
 * @property {string[]} positives - Green flags detected (e.g., "Locked liquidity")
 * @property {number} timestamp - When analysis was performed
 */
export interface AnalysisRecord {
    id?: number;
    tokenId: number;
    score: number;
    holderScore: number;
    creatorScore: number;
    liquidityScore: number;
    pumpScore: number;
    risks: string[];
    positives: string[];
    timestamp: number;
}
/**
 * Alert sent record.
 *
 * Tracks which tokens have had Telegram alerts sent (prevents duplicates).
 *
 * @interface AlertRecord
 * @property {number} [id] - Primary key (auto-generated)
 * @property {number} tokenId - Foreign key to tokens table (UNIQUE)
 * @property {number} alertTime - When Telegram alert was sent
 * @property {string} [messageId] - Telegram message ID for reference
 */
export interface AlertRecord {
    id?: number;
    tokenId: number;
    alertTime: number;
    messageId?: string;
}
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
export declare class Database {
    private db;
    /**
     * Constructs Database instance.
     *
     * Opens SQLite connection at specified path.
     * If file doesn't exist, creates it.
     *
     * @param {string} dbPath - Path to SQLite database file (e.g., './bot.db')
     * @throws {DatabaseError} If connection fails
     */
    constructor(dbPath: string);
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
    initialize(): Promise<void>;
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
    insertToken(token: TokenRecord): Promise<number>;
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
    getToken(contractAddress: string): Promise<TokenRecord | null>;
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
    insertAnalysis(analysis: AnalysisRecord): Promise<number>;
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
    hasAlertBeenSent(tokenId: number): Promise<boolean>;
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
    recordAlertSent(tokenId: number, messageId?: string): Promise<number>;
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
    getLatestAnalysis(tokenId: number): Promise<AnalysisRecord | null>;
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
    verifyTables(): Promise<boolean>;
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
    getTokenCount(): Promise<number>;
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
    close(): Promise<void>;
}
//# sourceMappingURL=db.d.ts.map