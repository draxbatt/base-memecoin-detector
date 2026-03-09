/**
 * Price history data point for a token
 */
export interface PriceDataPoint {
    timestamp: number;
    price: number;
    volume: number;
}
/**
 * Result of pump pattern analysis
 */
export interface PumpPatternAnalysis {
    score: number;
    priceMultiplier: number;
    volumeMultiplier: number;
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    priceMomentum: number;
    volatility: number;
    hasExecutionRisk: boolean;
    riskFlags: string[];
    positives: string[];
}
/**
 * PumpPatternAnalyzer
 * Detects potential pump-and-dump schemes and analyzes price momentum
 *
 * Analysis includes:
 * - Price volatility and momentum
 * - Volume patterns and anomalies
 * - Rate of increase indicators
 * - Execution risk assessment
 */
export declare class PumpPatternAnalyzer {
    /**
     * Analyze pump pattern from price/volume history
     *
     * @param priceHistory - Array of historical price data points, ordered by timestamp ascending
     * @param launchPrice - The initial launch price in USDT
     * @returns PumpPatternAnalysis with score and risk flags
     * @throws APIError if price history is invalid or insufficient
     */
    analyzePumpPattern(priceHistory: PriceDataPoint[], launchPrice: number): PumpPatternAnalysis;
    /**
     * Analyze the direction of volume trend
     *
     * @param sortedHistory - Price history sorted by timestamp
     * @returns 'increasing', 'decreasing', or 'stable'
     */
    private analyzeVolumeTrend;
    /**
     * Calculate price momentum (rate of price change)
     * Returns ratio: (price_now - price_old) / price_old
     *
     * @param sortedHistory - Price history sorted by timestamp
     * @returns Momentum as decimal (e.g., 0.5 = 50% increase)
     */
    private calculatePriceMomentum;
    /**
     * Calculate volatility using standard deviation of returns
     *
     * @param sortedHistory - Price history sorted by timestamp
     * @returns Standard deviation of log returns
     */
    private calculateVolatility;
    /**
     * Detect execution risk indicators for pump-and-dump
     *
     * Looks for:
     * - Extreme price spike followed by selloff
     * - Volume spike at peak
     * - Rapid pullback after peak
     *
     * @param sortedHistory - Price history sorted by timestamp
     * @param launchPrice - Initial launch price
     * @returns True if pump-and-dump indicators detected
     */
    private detectExecutionRisk;
    /**
     * Generate risk flags and positive indicators
     *
     * @param priceMultiplier - Current price / launch price
     * @param volumeMultiplier - Max volume / avg volume
     * @param priceMomentum - Rate of price change
     * @param volatility - Standard deviation of returns
     * @param volumeTrend - Volume trend direction
     * @param hasExecutionRisk - Pump-and-dump detected
     * @param sortedHistory - Price history
     * @returns Object with riskFlags and positives arrays
     */
    private generateFlags;
    /**
     * Calculate the final pump pattern score (0-100)
     *
     * Scoring logic:
     * - High volatility → lower score
     * - Extreme price movements → lower score (bubble risk)
     * - Execution risk → significantly lower score
     * - Stable growth → higher score
     * - Strong volume → higher score
     *
     * @param priceMultiplier - Current price / launch price
     * @param volatility - Standard deviation of returns
     * @param priceMomentum - Rate of price change
     * @param volumeMultiplier - Max volume / avg volume
     * @param volumeTrend - Volume trend direction
     * @param hasExecutionRisk - Pump-and-dump detected
     * @returns Score between 0-100
     */
    private calculateScore;
    /**
     * Create a neutral analysis result for edge cases
     *
     * @param reason - Reason for neutral analysis
     * @returns Neutral PumpPatternAnalysis
     */
    private createNeutralAnalysis;
}
export default PumpPatternAnalyzer;
//# sourceMappingURL=pump-pattern.d.ts.map