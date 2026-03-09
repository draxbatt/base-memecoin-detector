export declare class BankrScraper {
    private baseURL;
    private retryAttempts;
    getAnalysis(address: string): Promise<any | null>;
    getHistoricalData(address: string, days?: number): Promise<any[]>;
    getHolders(address: string, limit?: number): Promise<any | null>;
    getLiquidity(address: string): Promise<any | null>;
    getVolume(address: string, period?: string): Promise<any | null>;
    getSentiment(address: string): Promise<any | null>;
    getCreator(address: string): Promise<any | null>;
    getContractAnalysis(address: string): Promise<any | null>;
    getPumpDetection(address: string): Promise<any | null>;
}
//# sourceMappingURL=bankr.d.ts.map