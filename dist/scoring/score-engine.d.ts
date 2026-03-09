import { HolderAnalysis, CreatorAnalysis, LiquidityAnalysis } from '../analyzers';
export interface ScoringResult {
    totalScore: number;
    components: {
        holderScore: number;
        creatorScore: number;
        liquidityScore: number;
        pumpScore: number;
    };
    risks: string[];
    positives: string[];
    recommendation: 'SAFE' | 'CAUTION' | 'AVOID';
}
export declare const SCORING_WEIGHTS: {
    holders: number;
    creator: number;
    liquidity: number;
    pump: number;
};
export declare class ScoringEngine {
    score(holderAnalysis: HolderAnalysis, creatorAnalysis: CreatorAnalysis, liquidityAnalysis: LiquidityAnalysis, pumpScore?: number): ScoringResult;
}
//# sourceMappingURL=score-engine.d.ts.map