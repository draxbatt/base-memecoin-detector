export declare class RetryClient {
    private maxRetries;
    private instance;
    private requestQueue;
    private isProcessing;
    private rateLimitUntil;
    constructor(baseURL?: string, maxRetries?: number);
    get(url: string, config?: any): Promise<any>;
    post(url: string, data?: any, config?: any): Promise<any>;
    private makeRequest;
    private sleep;
}
//# sourceMappingURL=http-client.d.ts.map