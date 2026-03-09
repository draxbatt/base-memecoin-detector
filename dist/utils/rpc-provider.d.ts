import { ethers } from 'ethers';
/**
 * Rate limiter for RPC requests
 */
export declare class RateLimiter {
    private readonly maxRequestsPerSecond;
    private requestTimestamps;
    constructor(maxRequestsPerSecond?: number);
    waitIfNeeded(): Promise<void>;
}
/**
 * RPC Provider Manager with failover and rate limiting
 */
export declare class RPCProvider {
    private providers;
    private activeProviderName;
    private rateLimiter;
    private lastHealthCheck;
    private readonly DEFAULT_PROVIDERS;
    constructor(maxRequestsPerSecond?: number);
    private initializeDefaultProviders;
    addProvider(name: string, url: string): void;
    getProvider(name: string): ethers.Provider | undefined;
    getActiveProvider(): ethers.Provider;
    getActiveProviderName(): string;
    testConnection(name: string, retries?: number): Promise<boolean>;
    failoverToNextProvider(): Promise<boolean>;
    getBlockNumber(retries?: number): Promise<number>;
    getGasPrice(): Promise<bigint>;
    getTokenDecimals(tokenAddress: string): Promise<number>;
    getTokenTotalSupply(tokenAddress: string): Promise<bigint>;
    getTokenBalance(tokenAddress: string, accountAddress: string): Promise<bigint>;
    getTopHolders(tokenAddress: string, blockRange?: number, limit?: number): Promise<Array<[string, bigint]>>;
    getUniswapV2Reserves(pairAddress: string): Promise<[bigint, bigint]>;
    getUniswapV2Tokens(pairAddress: string): Promise<[string, string]>;
    isLiquidityLocked(lpTokenAddress: string, threshold?: bigint): Promise<boolean>;
    private isValidAddress;
    private maskUrl;
    getProviderHealth(): Promise<Record<string, any>>;
}
export declare function getRPCProvider(maxRequestsPerSecond?: number): RPCProvider;
export default RPCProvider;
//# sourceMappingURL=rpc-provider.d.ts.map