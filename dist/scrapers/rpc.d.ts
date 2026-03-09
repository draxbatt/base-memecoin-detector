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
    constructor(rpcUrl: string);
    getTokenSupply(contractAddress: string): Promise<bigint>;
    getTokenDecimals(contractAddress: string): Promise<number>;
    getTopHolders(contractAddress: string, limit?: number): Promise<TokenOnChainData['topHolders']>;
    getTokenMetadata(contractAddress: string): Promise<TokenOnChainData>;
    checkLiquidityLock(contractAddress: string): Promise<boolean>;
    verifyConnection(): Promise<boolean>;
}
//# sourceMappingURL=rpc.d.ts.map