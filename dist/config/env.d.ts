interface Config {
    clankerApiUrl: string;
    bankrApiUrl: string;
    baseRpcUrl: string;
    blockExplorerUrl: string;
    basescanApiKey?: string;
    scoringThreshold: number;
    premiumScoreThreshold: number;
    telegramBotToken: string;
    telegramChatId: string;
    scanIntervalSeconds: number;
    databasePath: string;
    logLevel: string;
    enableClankerScraper: boolean;
    enableBankrScraper: boolean;
}
export declare const config: Config;
export {};
//# sourceMappingURL=env.d.ts.map