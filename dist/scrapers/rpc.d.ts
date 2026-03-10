export interface TokenOnChainData {
    contractAddress: string;
    totalSupply: bigint;
    decimals: number;
    holderCount: number;
    topHolders: {
        address: string;
        balance: bigint;
        percentage: number;
    }[];
    liquidityPairs: any[];
    owner?: string;
    isBurned: boolean;
}
export declare class RpcIntegration {
    private provider;
    private httpClient;
    private basescanApiKey;
    private basescanApiUrl;
    private holdersCache;
    private readonly CACHE_TTL_MS;
    constructor(rpcUrl: string, basescanApiKey?: string);
    getTokenSupply(contractAddress: string): Promise<bigint>;
    getTokenDecimals(contractAddress: string): Promise<number>;
    /**
     * Fetch top holders from Basescan API with caching
     * Falls back gracefully if API key is missing or rate limited
     *
     * @param contractAddress Token contract address
     * @param limit Number of top holders to fetch (max 10000)
     * @returns Array of top holders with balances and percentages
     */
    getTopHolders(contractAddress: string, limit?: number): Promise<TokenOnChainData['topHolders']>;
    /**
     * Fetch holder data from Basescan API
     * Rate limit: 5 calls/sec for free tier
     */
    private fetchFromBasescan;
    /**
     * Estimate top holders by querying Transfer events
     * This is a fallback when Basescan API is unavailable
     */
    private estimateHoldersFromRpc;
    /**
     * Get cached holder data if still valid
     */
    private getFromCache;
    /**
     * Set holder data cache
     */
    private setCache;
    /**
     * Clear all cached data
     */
    clearCache(): void;
    getTokenMetadata(contractAddress: string): Promise<TokenOnChainData>;
    checkLiquidityLock(contractAddress: string): Promise<boolean>;
    verifyConnection(): Promise<boolean>;
}
//# sourceMappingURL=rpc.d.ts.map