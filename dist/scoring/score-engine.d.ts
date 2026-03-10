import { HolderAnalysis, CreatorAnalysis, LiquidityAnalysis } from '../analyzers';
/**
 * Result of token scoring calculation.
 *
 * Contains:
 * - totalScore: weighted average (0-100)
 * - Component scores: breakdown by analysis type
 * - Risk flags: red flags from all analyzers
 * - Positives: green flags from all analyzers
 * - Recommendation: SAFE/CAUTION/AVOID based on thresholds
 */
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
/**
 * Weight distribution for weighted scoring.
 *
 * Weights are designed to prioritize creator reputation and holder diversity:
 * - Holder diversity (30%): Distribution of tokens among addresses
 * - Creator reputation (40%): Wallet age, history, previous launches
 * - Liquidity status (15%): Lock status, amount threshold
 * - Pump pattern (15%): Early volume spikes, momentum detection
 *
 * Total: 100%
 *
 * @constant
 */
export declare const SCORING_WEIGHTS: {
    holders: number;
    creator: number;
    liquidity: number;
    pump: number;
};
/**
 * ScoringEngine - Calculates final risk score for tokens.
 *
 * Takes component scores from analyzers and applies weighted formula:
 * totalScore = (holder×0.30) + (creator×0.40) + (liquidity×0.15) + (pump×0.15)
 *
 * Result ranges 0-100 with recommendations:
 * - 70+: SAFE (green)
 * - 50-69: CAUTION (yellow)
 * - <50: AVOID (red)
 *
 * All risk flags and positive indicators are aggregated for alert message.
 */
export declare class ScoringEngine {
    /**
     * Calculates final risk score for a token.
     *
     * Algorithm:
     * 1. Apply weights to each component score (holder, creator, liquidity, pump)
     * 2. Sum weighted scores to get totalScore (0-100)
     * 3. Aggregate all risk flags and positive indicators
     * 4. Determine recommendation based on totalScore thresholds
     * 5. Log debug information for score breakdown
     *
     * Scoring thresholds:
     * - 70+: SAFE (high confidence, low risk)
     * - 50-69: CAUTION (mixed signals, moderate risk)
     * - <50: AVOID (warning signs, high risk)
     *
     * @param holderAnalysis - Holder concentration analysis (weighted 30%)
     * @param creatorAnalysis - Creator reputation analysis (weighted 40%)
     * @param liquidityAnalysis - Liquidity lock status analysis (weighted 15%)
     * @param pumpScore - Pump pattern score, default 50 (weighted 15%)
     *
     * @returns {ScoringResult} Complete scoring breakdown with recommendation
     *
     * @example
     * const result = scoringEngine.score(
     *   { score: 60, riskFlags: ['High concentration'], positives: [] },
     *   { score: 80, riskFlags: [], positives: ['Old wallet'] },
     *   { score: 75, riskFlags: [], positives: ['Locked liquidity'] },
     *   55
     * );
     * // Result: { totalScore: 72, recommendation: 'SAFE', ... }
     *
     * @public
     */
    score(holderAnalysis: HolderAnalysis, creatorAnalysis: CreatorAnalysis, liquidityAnalysis: LiquidityAnalysis, pumpScore?: number): ScoringResult;
}
//# sourceMappingURL=score-engine.d.ts.map