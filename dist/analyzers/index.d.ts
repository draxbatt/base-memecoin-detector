import { TokenOnChainData } from '../scrapers/rpc';
export interface HolderAnalysis {
    score: number;
    concentration: number;
    topHolderPercentage: number;
    riskFlags: string[];
}
export declare class WalletAnalyzer {
    analyzeHolders(onChainData: TokenOnChainData): HolderAnalysis;
}
export interface CreatorAnalysis {
    score: number;
    walletAge: number;
    previousLaunches: number;
    rugPulls: number;
    riskFlags: string[];
    positives: string[];
}
export declare class CreatorHistoryAnalyzer {
    analyzeCreator(creatorAddress: string, launchTime: number): Promise<CreatorAnalysis>;
}
export interface LiquidityAnalysis {
    score: number;
    isLocked: boolean;
    liquidityAmount: number;
    riskFlags: string[];
    positives: string[];
}
export declare class LiquidityAnalyzer {
    analyzeLiquidity(contractAddress: string, liquidityAmount: number | undefined, isLocked: boolean): LiquidityAnalysis;
}
//# sourceMappingURL=index.d.ts.map