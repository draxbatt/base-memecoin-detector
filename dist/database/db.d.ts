export interface TokenRecord {
    id?: number;
    contractAddress: string;
    name: string;
    symbol: string;
    launchTime: number;
    firstSeen: number;
    lastUpdated: number;
    source: 'clanker' | 'bankr';
}
export interface AnalysisRecord {
    id?: number;
    tokenId: number;
    score: number;
    holderScore: number;
    creatorScore: number;
    liquidityScore: number;
    pumpScore: number;
    risks: string[];
    positives: string[];
    timestamp: number;
}
export interface AlertRecord {
    id?: number;
    tokenId: number;
    alertTime: number;
    messageId?: string;
}
export declare class Database {
    private db;
    constructor(dbPath: string);
    initialize(): Promise<void>;
    insertToken(token: TokenRecord): Promise<number>;
    getToken(contractAddress: string): Promise<TokenRecord | null>;
    insertAnalysis(analysis: AnalysisRecord): Promise<number>;
    hasAlertBeenSent(tokenId: number): Promise<boolean>;
    recordAlertSent(tokenId: number, messageId?: string): Promise<number>;
    getLatestAnalysis(tokenId: number): Promise<AnalysisRecord | null>;
    close(): Promise<void>;
}
//# sourceMappingURL=db.d.ts.map