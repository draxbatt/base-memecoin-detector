/**
 * Clanker API Response Types
 */
export interface ClankerToken {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    creator: string;
    launchTime: number;
    launchTx?: string;
    marketCap?: number;
    holders?: number;
    socialLinks?: {
        twitter?: string;
        telegram?: string;
        website?: string;
        discord?: string;
    };
}
/**
 * Clanker Scraper
 * Fetches memecoin launch data from Clanker platform (Base chain)
 *
 * API Rate Limit: 100 requests per minute
 * Implements exponential backoff retry logic with jitter
 */
export declare class ClankerScraper {
    private baseURL;
    private httpClient;
    private rateLimiter;
    private retryConfig;
    constructor();
    /**
     * Fetch latest launched memecoins from Clanker
     * @param limit - Number of tokens to fetch (default 50, max 100)
     * @returns Array of ClankerToken objects
     */
    fetchLatestLaunches(limit?: number): Promise<ClankerToken[]>;
    /**
     * Get detailed information about a specific token
     * @param tokenAddress - Token contract address on Base
     * @returns Token details or null if fetch fails
     */
    getTokenDetails(tokenAddress: string): Promise<ClankerToken | null>;
    /**
     * Get token metadata including social links
     * @param tokenAddress - Token contract address
     * @returns Metadata object or null if fetch fails
     */
    getTokenMetadata(tokenAddress: string): Promise<Record<string, any> | null>;
    /**
     * Make HTTP request with rate limiting, retry logic, and exponential backoff
     * @param endpoint - API endpoint (without base URL)
     * @param params - Query parameters
     * @returns Response data
     */
    private makeRequest;
    /**
     * Calculate exponential backoff delay with jitter
     * Formula: min(initialDelay * multiplier^attempt + random(0, 1000), maxDelay)
     */
    private calculateBackoffDelay;
    /**
     * Check if error is retryable (network, timeout, rate limit)
     */
    private isRetryableError;
    /**
     * Validate token response structure
     * Checks for required fields, allowing for alternative field names
     */
    private isValidToken;
    /**
     * Validate Ethereum address format
     */
    private isValidAddress;
    /**
     * Parse and normalize token response from Clanker API
     */
    private parseTokenResponse;
    /**
     * Health check - verify API connectivity
     */
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=clanker.d.ts.map