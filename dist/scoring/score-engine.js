"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringEngine = exports.SCORING_WEIGHTS = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
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
exports.SCORING_WEIGHTS = {
    holders: 0.30, // 30% - Holder concentration/diversity
    creator: 0.40, // 40% - Creator reputation (highest weight)
    liquidity: 0.15, // 15% - Liquidity lock & amount
    pump: 0.15, // 15% - Pump pattern detection
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
class ScoringEngine {
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
    score(holderAnalysis, creatorAnalysis, liquidityAnalysis, pumpScore = 50) {
        logger_1.default.debug('Calculating token score', {
            holderScore: holderAnalysis.score,
            creatorScore: creatorAnalysis.score,
            liquidityScore: liquidityAnalysis.score,
            pumpScore,
        });
        // Weighted average formula
        const totalScore = Math.round((holderAnalysis.score * exports.SCORING_WEIGHTS.holders) +
            (creatorAnalysis.score * exports.SCORING_WEIGHTS.creator) +
            (liquidityAnalysis.score * exports.SCORING_WEIGHTS.liquidity) +
            (pumpScore * exports.SCORING_WEIGHTS.pump));
        // Combine all risk/positive flags for alert message
        const risks = [
            ...holderAnalysis.riskFlags,
            ...creatorAnalysis.riskFlags,
            ...liquidityAnalysis.riskFlags,
        ];
        const positives = [
            ...creatorAnalysis.positives,
            ...liquidityAnalysis.positives,
        ];
        // Determine recommendation based on score thresholds
        let recommendation = 'AVOID';
        if (totalScore >= 70) {
            recommendation = 'SAFE';
        }
        else if (totalScore >= 50) {
            recommendation = 'CAUTION';
        }
        return {
            totalScore,
            components: {
                holderScore: holderAnalysis.score,
                creatorScore: creatorAnalysis.score,
                liquidityScore: liquidityAnalysis.score,
                pumpScore,
            },
            risks,
            positives,
            recommendation,
        };
    }
}
exports.ScoringEngine = ScoringEngine;
//# sourceMappingURL=score-engine.js.map