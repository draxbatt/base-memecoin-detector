import { ScoringEngine, SCORING_WEIGHTS } from '../src/scoring/score-engine';
import { HolderAnalysis, CreatorAnalysis, LiquidityAnalysis } from '../src/analyzers';

describe('ScoringEngine', () => {
  let engine: ScoringEngine;

  beforeEach(() => {
    engine = new ScoringEngine();
  });

  it('should calculate weighted score correctly', () => {
    const holderAnalysis: HolderAnalysis = {
      score: 80,
      concentration: 45,
      topHolderPercentage: 15,
      riskFlags: [],
    };

    const creatorAnalysis: CreatorAnalysis = {
      score: 75,
      walletAge: 200,
      previousLaunches: 2,
      rugPulls: 0,
      riskFlags: [],
      positives: ['Established wallet'],
    };

    const liquidityAnalysis: LiquidityAnalysis = {
      score: 70,
      isLocked: true,
      liquidityAmount: 50000,
      riskFlags: [],
      positives: ['Liquidity locked'],
    };

    const result = engine.score(holderAnalysis, creatorAnalysis, liquidityAnalysis, 60);

    // Expected: (80 * 0.30) + (75 * 0.40) + (70 * 0.15) + (60 * 0.15) = 72.5
    expect(result.totalScore).toBe(73); // Rounded

    expect(result.components.holderScore).toBe(80);
    expect(result.components.creatorScore).toBe(75);
    expect(result.components.liquidityScore).toBe(70);
    expect(result.components.pumpScore).toBe(60);
  });

  it('should recommend SAFE for high scores', () => {
    const analyses = {
      holders: { score: 85, concentration: 40, topHolderPercentage: 12, riskFlags: [] },
      creator: { score: 80, walletAge: 365, previousLaunches: 5, rugPulls: 0, riskFlags: [], positives: ['Established'] },
      liquidity: { score: 80, isLocked: true, liquidityAmount: 100000, riskFlags: [], positives: ['Locked'] },
    };

    const result = engine.score(analyses.holders, analyses.creator, analyses.liquidity, 80);
    expect(result.recommendation).toBe('SAFE');
  });

  it('should recommend CAUTION for mid-range scores', () => {
    const analyses = {
      holders: { score: 60, concentration: 60, topHolderPercentage: 25, riskFlags: ['Moderate concentration'] },
      creator: { score: 50, walletAge: 30, previousLaunches: 0, rugPulls: 0, riskFlags: ['New wallet'], positives: [] },
      liquidity: { score: 60, isLocked: false, liquidityAmount: 15000, riskFlags: ['Not locked'], positives: [] },
    };

    const result = engine.score(analyses.holders, analyses.creator, analyses.liquidity, 50);
    expect(result.recommendation).toBe('CAUTION');
  });

  it('should recommend AVOID for low scores', () => {
    const analyses = {
      holders: { score: 30, concentration: 85, topHolderPercentage: 60, riskFlags: ['Highly concentrated'] },
      creator: { score: 20, walletAge: 2, previousLaunches: 0, rugPulls: 3, riskFlags: ['Brand new', 'History of rugs'], positives: [] },
      liquidity: { score: 30, isLocked: false, liquidityAmount: 1000, riskFlags: ['Very low liquidity', 'Not locked'], positives: [] },
    };

    const result = engine.score(analyses.holders, analyses.creator, analyses.liquidity, 20);
    expect(result.recommendation).toBe('AVOID');
  });

  it('should combine risk and positive flags', () => {
    const analyses = {
      holders: { score: 50, concentration: 55, topHolderPercentage: 22, riskFlags: ['Moderate concentration'] },
      creator: { score: 70, walletAge: 90, previousLaunches: 1, rugPulls: 0, riskFlags: [], positives: ['Some history'] },
      liquidity: { score: 65, isLocked: true, liquidityAmount: 25000, riskFlags: [], positives: ['Liquidity locked'] },
    };

    const result = engine.score(analyses.holders, analyses.creator, analyses.liquidity, 55);
    
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.positives.length).toBeGreaterThan(0);
    expect(result.risks).toContain('Moderate concentration');
    expect(result.positives).toContain('Liquidity locked');
  });
});
