export interface TokenLaunch {
    contractAddress: string;
    name: string;
    symbol: string;
    launchTime: number;
    creatorAddress: string;
    initialLiquidity?: number;
    totalSupply?: string;
    source: 'clanker' | 'bankr';
}
export declare class ClankerScraper {
    private client;
    constructor(apiUrl: string);
    fetchLatestLaunches(limit?: number): Promise<TokenLaunch[]>;
}
export declare class BankrScraper {
    private client;
    constructor(apiUrl: string);
    fetchLatestLaunches(limit?: number): Promise<TokenLaunch[]>;
}
//# sourceMappingURL=launchers.d.ts.map