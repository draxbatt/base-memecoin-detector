import { TokenAnalysis } from '../types/index';

/**
 * Pump Pattern Analyzer
 * Detects pump patterns and anomalies in token price/volume
 */
export class PumpPatternAnalyzer {
  /**
   * Detect pump pattern from historical data
   */
  async detectPumpPattern(analysis: TokenAnalysis): Promise<{ isPump: boolean; score: number; patterns: string[] }> {
    const patterns: string[] = [];
    let score = 0;

    // Check volume spike
    if (analysis.volumeChange > 300) {
      patterns.push('extreme_volume_spike');
      score += 25;
    } else if (analysis.volumeChange > 150) {
      patterns.push('volume_spike');
      score += 15;
    }

    // Check price volatility
    if (analysis.priceVolatility > 50) {
      patterns.push('high_volatility');
      score += 20;
    }

    // Check holder concentration
    if (analysis.topHolderPercent > 70) {
      patterns.push('concentrated_holders');
      score += 30;
    }

    // Check creator wallet activity
    if (analysis.creatorRecentSells > 0) {
      patterns.push('creator_selling');
      score += 20;
    }

    // Check liquidity ratio
    if (analysis.liquidityRatio < 0.3) {
      patterns.push('low_liquidity');
      score += 15;
    }

    return {
      isPump: score >= 60,
      score: Math.min(score, 100),
      patterns
    };
  }

  /**
   * Analyze momentum indicators
   */
  async analyzeMomentum(priceHistory: Array<{ price: number; volume: number; timestamp: number }>): Promise<{ momentum: number; trend: string }> {
    if (priceHistory.length < 2) {
      return { momentum: 0, trend: 'insufficient_data' };
    }

    const prices = priceHistory.map(p => p.price);
    const volumes = priceHistory.map(p => p.volume);

    // Calculate momentum
    const latestPrice = prices[prices.length - 1];
    const previousPrice = prices[0];
    const priceChange = ((latestPrice - previousPrice) / previousPrice) * 100;

    // Calculate volume trend
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const recentVolume = volumes[volumes.length - 1];
    const volumeRatio = recentVolume / avgVolume;

    let momentum = priceChange * 0.5 + (volumeRatio - 1) * 50;
    momentum = Math.max(-100, Math.min(100, momentum));

    let trend = 'neutral';
    if (momentum > 30) trend = 'strong_uptrend';
    else if (momentum > 10) trend = 'uptrend';
    else if (momentum < -30) trend = 'strong_downtrend';
    else if (momentum < -10) trend = 'downtrend';

    return { momentum, trend };
  }

  /**
   * Calculate risk score based on pump indicators
   */
  async calculateRiskScore(analysis: TokenAnalysis, momentum: { momentum: number; trend: string }): Promise<number> {
    let risk = 0;

    // Base risk from momentum
    if (momentum.trend === 'strong_uptrend') risk += 40;
    else if (momentum.trend === 'uptrend') risk += 20;

    // Risk from volatility
    if (analysis.priceVolatility > 75) risk += 30;
    else if (analysis.priceVolatility > 40) risk += 15;

    // Risk from holder concentration
    if (analysis.topHolderPercent > 80) risk += 35;
    else if (analysis.topHolderPercent > 60) risk += 20;

    // Risk from creator activity
    if (analysis.creatorRecentTransactions > 10) risk += 20;

    // Risk mitigation from liquidity
    if (analysis.liquidityRatio > 0.5) risk -= 10;

    return Math.max(0, Math.min(100, risk));
  }
}
