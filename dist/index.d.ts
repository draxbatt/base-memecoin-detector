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
    constructor();
    initialize(): Promise<void>;
    start(): Promise<void>;
    private scan;
    private processLaunch;
    stop(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map