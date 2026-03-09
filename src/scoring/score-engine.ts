import logger from '../utils/logger';
import { HolderAnalysis, CreatorAnalysis, LiquidityAnalysis } from '../analyzers';

export interface ScoringResult {
  totalScore: number; // 0-100
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

export const SCORING_WEIGHTS = {
  holders: 0.30,      // 30%
  creator: 0.40,      // 40%
  liquidity: 0.15,    // 15%
  pump: 0.15,         // 15%
};

export class ScoringEngine {
  score(
    holderAnalysis: HolderAnalysis,
    creatorAnalysis: CreatorAnalysis,
    liquidityAnalysis: LiquidityAnalysis,
    pumpScore: number = 50
  ): ScoringResult {
    logger.debug('Calculating token score', {
      holderScore: holderAnalysis.score,
      creatorScore: creatorAnalysis.score,
      liquidityScore: liquidityAnalysis.score,
      pumpScore,
    });

    // Weighted average
    const totalScore = Math.round(
      (holderAnalysis.score * SCORING_WEIGHTS.holders) +
      (creatorAnalysis.score * SCORING_WEIGHTS.creator) +
      (liquidityAnalysis.score * SCORING_WEIGHTS.liquidity) +
      (pumpScore * SCORING_WEIGHTS.pump)
    );

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
    let recommendation: ScoringResult['recommendation'] = 'AVOID';
    if (totalScore >= 70) {
      recommendation = 'SAFE';
    } else if (totalScore >= 50) {
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
