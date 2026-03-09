/**
 * Type Definitions for Memecoin Bot
 * 
 * Provides comprehensive TypeScript interfaces for all major data structures
 * used throughout the bot system, ensuring type safety across modules.
 * 
 * @module types
 */

/**
 * Holder information for a token
 * Represents a single token holder with address and balance
 */
export interface Holder {
  /** Ethereum address of the holder */
  address: string;
  /** Token balance held by this address */
  balance: string;
  /** Percentage of total supply held (0-100) */
  percentage: number;
}

/**
 * Token metadata from blockchain
 * Contains core information about a token retrieved from RPC
 */
export interface TokenMetadata {
  /** Token contract address on Base chain */
  contractAddress: string;
  /** Token name (e.g., "Pepe") */
  name: string;
  /** Token symbol (e.g., "PEPE") */
  symbol: string;
  /** Number of decimal places for token */
  decimals: number;
  /** Total supply in wei */
  totalSupply: string;
  /** Token creator/deployer address */
  creator: string;
  /** Timestamp when token was created */
  createdAt: number;
  /** Is token burnable */
  isBurnable?: boolean;
  /** Is token mintable */
  isMintable?: boolean;
}

/**
 * Liquidity pool information
 * Represents a Uniswap/DEX liquidity pair
 */
export interface LiquidityPool {
  /** Pool contract address */
  poolAddress: string;
  /** Amount of token A in pool (wei) */
  reserveA: string;
  /** Amount of token B in pool (wei) */
  reserveB: string;
  /** Is liquidity locked/burned */
  isLocked: boolean;
  /** Lock expiration timestamp (if applicable) */
  lockExpiresAt?: number;
  /** Pool fee tier (e.g., 3000 for 0.3%) */
  feeTier?: number;
  /** Liquidity value in USD (estimated) */
  liquidityUSD?: number;
}

/**
 * Creator history analysis result
 * Results from analyzing token creator's track record
 */
export interface CreatorHistoryResult {
  /** Creator wallet address */
  creatorAddress: string;
  /** Wallet age in seconds */
  walletAge: number;
  /** Number of previous token launches detected */
  previousLaunches: number;
  /** Whether creator has rug pull history */
  hasRugPullHistory: boolean;
  /** Array of previous token contract addresses */
  previousTokens: string[];
  /** Risk score component (0-100) */
  riskScore: number;
  /** Detailed analysis flags */
  flags: string[];
}

/**
 * Holder distribution analysis result
 * Results from analyzing token holder concentration
 */
export interface HolderAnalysisResult {
  /** Total number of holders */
  totalHolders: number;
  /** Top 10 holders' combined percentage */
  top10Concentration: number;
  /** Top 5 holders' combined percentage */
  top5Concentration: number;
  /** Top holder's percentage */
  topHolderPercentage: number;
  /** Is distribution concentrated (>50% in top 10) */
  isConcentrated: boolean;
  /** Array of top 10 holders */
  topHolders: Holder[];
  /** Risk score component (0-100) */
  riskScore: number;
  /** Detailed analysis flags */
  flags: string[];
}

/**
 * Liquidity analysis result
 * Results from analyzing token liquidity status
 */
export interface LiquidityAnalysisResult {
  /** Is liquidity locked */
  isLocked: boolean;
  /** Total liquidity in USD */
  totalLiquidityUSD: number;
  /** Pool count */
  poolCount: number;
  /** Meets minimum liquidity threshold */
  meetsThreshold: boolean;
  /** Liquidity pools details */
  pools: LiquidityPool[];
  /** Risk score component (0-100) */
  riskScore: number;
  /** Detailed analysis flags */
  flags: string[];
}

/**
 * Pump pattern analysis result
 * Results from detecting pump/manipulation patterns
 */
export interface PumpAnalysisResult {
  /** Price change from launch to current (%) */
  priceChangePercent: number;
  /** Is pump pattern detected */
  isPumpDetected: boolean;
  /** Estimated launch price in USD */
  launchPrice?: number;
  /** Current estimated price in USD */
  currentPrice?: number;
  /** Volume spike detection */
  volumeSpikes: number;
  /** Risk score component (0-100) */
  riskScore: number;
  /** Detailed analysis flags */
  flags: string[];
}

/**
 * Combined analysis result from all analyzers
 * Contains results from all analysis modules
 */
export interface Analysis {
  /** Token contract address being analyzed */
  tokenAddress: string;
  /** Timestamp of analysis */
  timestamp: number;
  /** Holder distribution analysis */
  holderAnalysis: HolderAnalysisResult;
  /** Creator history analysis */
  creatorAnalysis: CreatorHistoryResult;
  /** Liquidity analysis */
  liquidityAnalysis: LiquidityAnalysisResult;
  /** Pump pattern analysis */
  pumpAnalysis: PumpAnalysisResult;
  /** Overall risk score (0-100) */
  overallRiskScore: number;
}

/**
 * Scoring result from score engine
 * Final scoring and recommendation
 */
export interface ScoringResult {
  /** Token contract address */
  tokenAddress: string;
  /** Overall score (0-100) */
  score: number;
  /** Recommendation: SAFE, CAUTION, or AVOID */
  recommendation: 'SAFE' | 'CAUTION' | 'AVOID';
  /** Detailed score breakdown */
  breakdown: {
    /** Holder distribution score (0-100) */
    holders: number;
    /** Creator history score (0-100) */
    creator: number;
    /** Liquidity score (0-100) */
    liquidity: number;
    /** Pump pattern score (0-100) */
    pump: number;
  };
  /** Array of risk flags (max 3) */
  riskFlags: string[];
  /** Array of positive indicators (max 3) */
  positiveIndicators: string[];
  /** Human-readable justification */
  rationale: string;
}

/**
 * Token from Clanker launcher
 * Represents a memecoin detected via Clanker API
 */
export interface ClankerToken {
  /** Token contract address on Base */
  contractAddress: string;
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Creator/launcher address */
  creator: string;
  /** Launch timestamp */
  launchTime: number;
  /** Token metadata link or description */
  metadata?: string;
  /** Source API: 'clanker' */
  source: 'clanker';
}

/**
 * Token from Bankr launcher
 * Represents a memecoin detected via Bankr API
 */
export interface BankrToken {
  /** Token contract address on Base */
  contractAddress: string;
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Creator/launcher address */
  creator: string;
  /** Launch timestamp */
  launchTime: number;
  /** Token metadata link or description */
  metadata?: string;
  /** Source API: 'bankr' */
  source: 'bankr';
}

/**
 * Union type for tokens from any launcher
 * Can be either Clanker or Bankr token
 */
export type LauncherToken = ClankerToken | BankrToken;

/**
 * Unified token record in database
 * Stores token with all analysis and metadata
 */
export interface TokenRecord {
  /** Unique database ID */
  id: number;
  /** Token contract address */
  contractAddress: string;
  /** Token name */
  name: string;
  /** Token symbol */
  symbol: string;
  /** Token creator address */
  creator: string;
  /** When token was created on blockchain */
  createdAt: number;
  /** When this record was inserted into database */
  firstSeenAt: number;
  /** Last time this token was analyzed */
  lastAnalyzedAt: number;
  /** Token metadata (from RPC) */
  metadata?: Partial<TokenMetadata>;
  /** Overall scoring result */
  latestScore?: ScoringResult;
  /** All historical analyses */
  analyses: Analysis[];
  /** Whether alert has been sent for this token */
  alertSent: boolean;
  /** When alert was sent (if applicable) */
  alertSentAt?: number;
}

/**
 * Telegram alert message
 * Formatted message to send via Telegram
 */
export interface TelegramAlert {
  /** Recipient Telegram chat ID */
  chatId: string | number;
  /** Alert message in Markdown format */
  message: string;
  /** Parse mode (markdown, HTML) */
  parseMode: 'Markdown' | 'MarkdownV2' | 'HTML';
  /** Disable web preview (don't embed links) */
  disableWebPagePreview: boolean;
  /** Keyboard buttons (optional) */
  replyMarkup?: {
    inlineKeyboard: Array<Array<{
      text: string;
      url: string;
    }>>;
  };
}

/**
 * Configuration for bot environment
 * Runtime configuration loaded from .env
 */
export interface BotConfig {
  /** Node environment (development, production, test) */
  nodeEnv: 'development' | 'production' | 'test';
  /** Telegram bot token */
  telegramBotToken: string;
  /** Telegram chat ID for alerts */
  telegramChatId: string | number;
  /** Primary Ethereum RPC endpoint (Alchemy) */
  rpcUrl: string;
  /** Backup RPC endpoint (Infura) */
  rpcUrlBackup?: string;
  /** Backup RPC endpoint 2 (Ankr) */
  rpcUrlBackup2?: string;
  /** Etherscan API key for contract verification */
  etherscanApiKey?: string;
  /** Clanker API endpoint */
  clankerApiUrl: string;
  /** Bankr API endpoint */
  bankrApiUrl?: string;
  /** Database file path */
  dbPath: string;
  /** Scan interval in milliseconds (default: 10 minutes) */
  scanIntervalMs: number;
  /** Minimum score threshold to send alert (0-100, default: 65) */
  alertThreshold: number;
  /** Telegram rate limit (minimum seconds between alerts) */
  telegramRateLimitSec: number;
  /** Maximum API retries */
  maxRetries: number;
  /** Retry backoff multiplier (exponential) */
  retryBackoffMs: number;
  /** Log level (debug, info, warn, error) */
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  /** Enable detailed logging */
  debug: boolean;
}

/**
 * RPC request error with retry context
 * Wraps RPC errors with retry information
 */
export interface RpcError extends Error {
  /** Original error message */
  message: string;
  /** Error code (if RPC error) */
  code?: number;
  /** Current retry attempt number */
  attempt: number;
  /** Total retry attempts allowed */
  maxAttempts: number;
  /** Is error retryable */
  retryable: boolean;
}

/**
 * API response wrapper
 * Generic wrapper for API responses with metadata
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Response status code */
  status: number;
  /** Was request successful */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Response timestamp */
  timestamp: number;
  /** Response latency in milliseconds */
  latencyMs: number;
}

/**
 * Health check result
 * Status of all bot components
 */
export interface HealthCheckResult {
  /** Bot overall healthy status */
  healthy: boolean;
  /** Timestamp of check */
  timestamp: number;
  /** RPC connection status */
  rpc: {
    healthy: boolean;
    latencyMs?: number;
    lastError?: string;
  };
  /** Database status */
  database: {
    healthy: boolean;
    recordCount?: number;
    lastError?: string;
  };
  /** Telegram bot status */
  telegram: {
    healthy: boolean;
    lastError?: string;
  };
  /** Last successful scan timestamp */
  lastScanAt?: number;
  /** Tokens analyzed in last scan */
  tokensInLastScan?: number;
}

/**
 * Logging context for structured logging
 * Provides structured context for log entries
 */
export interface LogContext {
  /** Module/component name */
  module: string;
  /** Function or operation name */
  operation?: string;
  /** Token being processed (if applicable) */
  tokenAddress?: string;
  /** Error object (if applicable) */
  error?: Error | string;
  /** Additional context data */
  data?: Record<string, unknown>;
  /** Correlation ID for request tracing */
  correlationId?: string;
}

/**
 * Bot statistics
 * Cumulative metrics for bot operation
 */
export interface BotStatistics {
  /** Total tokens analyzed since startup */
  totalTokensAnalyzed: number;
  /** Total alerts sent since startup */
  totalAlertsSent: number;
  /** Current database size (record count) */
  databaseSize: number;
  /** Average analysis latency in milliseconds */
  avgAnalysisLatencyMs: number;
  /** Bot uptime in milliseconds */
  uptimeMs: number;
  /** Last scan completion time */
  lastScanAt?: number;
  /** API failure count (cumulative) */
  apiFailures: number;
  /** API success rate (percentage) */
  apiSuccessRate: number;
}

/**
 * Analysis component weights for scoring
 * Percentage weights for each analysis component
 */
export interface ScoringWeights {
  /** Weight for holder concentration (0-1) */
  holders: number;
  /** Weight for creator history (0-1) */
  creator: number;
  /** Weight for liquidity status (0-1) */
  liquidity: number;
  /** Weight for pump patterns (0-1) */
  pump: number;
}

/**
 * Pagination options for database queries
 * Standard pagination parameters
 */
export interface PaginationOptions {
  /** Results to skip */
  offset: number;
  /** Maximum results to return */
  limit: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction (asc/desc) */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Database query result with pagination
 * Paginated query results with metadata
 */
export interface PaginatedResult<T> {
  /** Array of results */
  items: T[];
  /** Total item count (without pagination) */
  total: number;
  /** Offset used in query */
  offset: number;
  /** Limit used in query */
  limit: number;
  /** Has more results available */
  hasMore: boolean;
}
