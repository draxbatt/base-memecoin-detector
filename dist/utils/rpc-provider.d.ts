import { ethers } from 'ethers';
/**
 * Rate limiter for RPC requests
 */
export declare class RateLimiter {
    private readonly maxRequestsPerSecond;
    private requestTimestamps;
    /**
     * Initialize rate limiter
     * @param maxRequestsPerSecond Maximum allowed requests per second
     */
    constructor(maxRequestsPerSecond?: number);
    /**
     * Wait if rate limit would be exceeded
     */
    waitIfNeeded(): Promise<void>;
}
/**
 * RPC Provider Manager with failover and rate limiting
 * Manages multiple RPC endpoints for Base chain blockchain interaction
 */
export declare class RPCProvider {
    private providers;
    private activeProviderName;
    private rateLimiter;
    private healthCheckInterval;
    private lastHealthCheck;
    private readonly DEFAULT_PROVIDERS;
    /**
     * Initialize RPC Provider Manager
     * @param maxRequestsPerSecond Max RPC requests per second (default: 300)
     */
    constructor(maxRequestsPerSecond?: number);
    /**
     * Initialize default RPC providers
     */
    private initializeDefaultProviders;
    /**
     * Add a new RPC provider
     * @param name Provider identifier
     * @param url RPC endpoint URL
     * @throws APIError if provider initialization fails
     */
    addProvider(name: string, url: string): void;
    /**
     * Get a specific provider by name
     * @param name Provider identifier
     * @returns ethers Provider instance or undefined
     */
    getProvider(name: string): ethers.Provider | undefined;
    /**
     * Get active provider with automatic failover
     * @returns Active ethers Provider instance
     * @throws BlockchainError if no providers available
     */
    getActiveProvider(): ethers.Provider;
    /**
     * Get current active provider name
     * @returns Provider name
     */
    getActiveProviderName(): string;
    /**
     * Test connection to a provider with retry logic
     * @param name Provider identifier
     * @param retries Number of retry attempts
     * @returns True if connected, false otherwise
     */
    testConnection(name: string, retries?: number): Promise<boolean>;
    /**
     * Failover to next healthy provider
     * @returns True if failover successful, false if no healthy providers
     */
    failoverToNextProvider(): Promise<boolean>;
    /**
     * Get current block number
     * @returns Block number with retry logic
     * @throws BlockchainError on failure after retries
     */
    getBlockNumber(retries?: number): Promise<number>;
    /**
     * Get gas price from network
     * @returns Gas price in wei
     */
    getGasPrice(): Promise<bigint>;
    /**
     * Get token decimals via ERC-20
     * @param tokenAddress Token contract address
     * @returns Token decimals
     */
    getTokenDecimals(tokenAddress: string): Promise<number>;
    /**
     * Get token total supply
     * @param tokenAddress Token contract address
     * @returns Total supply as bigint
     */
    getTokenTotalSupply(tokenAddress: string): Promise<bigint>;
    /**
     * Get token balance of an account
     * @param tokenAddress Token contract address
     * @param accountAddress Account address
     * @returns Balance as bigint
     */
    getTokenBalance(tokenAddress: string, accountAddress: string): Promise<bigint>;
    /**
     * Get top token holders via eth_getLogs (Transfer events)
     * @param tokenAddress Token contract address
     * @param blockRange How many blocks to look back (default: 10000)
     * @param limit Maximum number of holders to return
     * @returns Array of [address, balance] tuples
     */
    getTopHolders(tokenAddress: string, blockRange?: number, limit?: number): Promise<Array<[string, bigint]>>;
    catch(error: any): void;
}
/**
 * Get or create global RPC Provider instance
 * @param maxRequestsPerSecond Max requests per second (only used on first call)
 * @returns Singleton RPCProvider instance
 */
export declare function getRPCProvider(maxRequestsPerSecond?: number): RPCProvider;
export default RPCProvider;
//# sourceMappingURL=rpc-provider.d.ts.map