"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringEngine = exports.SCORING_WEIGHTS = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
exports.SCORING_WEIGHTS = {
    holders: 0.30, // 30%
    creator: 0.40, // 40%
    liquidity: 0.15, // 15%
    pump: 0.15, // 15%
};
class ScoringEngine {
    score(holderAnalysis, creatorAnalysis, liquidityAnalysis, pumpScore = 50) {
        logger_1.default.debug('Calculating token score', {
            holderScore: holderAnalysis.score,
            creatorScore: creatorAnalysis.score,
            liquidityScore: liquidityAnalysis.score,
            pumpScore,
        });
        // Weighted average
        const totalScore = Math.round((holderAnalysis.score * exports.SCORING_WEIGHTS.holders) +
            (creatorAnalysis.score * exports.SCORING_WEIGHTS.creator) +
            (liquidityAnalysis.score * exports.SCORING_WEIGHTS.liquidity) +
            (pumpScore * exports.SCORING_WEIGHTS.pump));
        // Combine all risk/positive flags
        const risks = [
            ...holderAnalysis.riskFlags,
            ...creatorAnalysis.riskFlags,
            ...liquidityAnalysis.riskFlags,
        ];
        const positives = [
            ...creatorAnalysis.positives,
            ...liquidityAnalysis.positives,
        ];
        // Determine recommendation
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