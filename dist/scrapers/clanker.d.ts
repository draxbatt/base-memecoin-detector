/**
 * Clanker Scraper
 * Fetches memecoin launch data from Clanker platform
 */
export declare class ClankerScraper {
    private baseURL;
    private retryAttempts;
    private retryDelay;
    /**
     * Fetch latest memecoins from Clanker
     */
    getLatestMemecoins(limit?: number): Promise<any[]>;
    /**
     * Get detailed token info
     */
    getTokenInfo(tokenAddress: string): Promise<any | null>;
    /**
     * Get token metadata and social links
     */
    getTokenMetadata(tokenAddress: string): Promise<any | null>;
    /**
     * Retry request with exponential backoff
     */
    private retryRequest;
}
//# sourceMappingURL=clanker.d.ts.map