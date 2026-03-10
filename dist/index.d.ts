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
export declare class MemecoinBot {
    private clankerScraper;
    private bankrScraper;
    private rpc;
    private database;
    private walletAnalyzer;
    private creatorAnalyzer;
    private liquidityAnalyzer;
    private scoringEngine;
    private telegramNotifier;
    private isRunning;
    private cronJob;
    /**
     * Constructs MemecoinBot instance with all dependencies.
     * Initializes scrapers, analyzers, and alert services from config.
     */
    constructor();
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
    initialize(): Promise<void>;
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
    start(): Promise<void>;
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
    private scan;
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
    private processLaunch;
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
    stop(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map