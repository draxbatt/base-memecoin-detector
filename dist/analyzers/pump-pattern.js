"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PumpPatternAnalyzer = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const errors_1 = require("../utils/errors");
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
class PumpPatternAnalyzer {
    /**
     * Analyze pump pattern from price/volume history
     *
     * @param priceHistory - Array of historical price data points, ordered by timestamp ascending
     * @param launchPrice - The initial launch price in USDT
     * @returns PumpPatternAnalysis with score and risk flags
     * @throws APIError if price history is invalid or insufficient
     */
    analyzePumpPattern(priceHistory, launchPrice) {
        // Validate inputs
        if (!Array.isArray(priceHistory) || priceHistory.length === 0) {
            logger_1.default.warn('Empty price history provided for pump pattern analysis');
            return this.createNeutralAnalysis('No price history available');
        }
        if (launchPrice <= 0) {
            throw new errors_1.APIError('Invalid launch price', { launchPrice });
        }
        // Sort by timestamp ascending to ensure correct ordering
        const sortedHistory = [...priceHistory].sort((a, b) => a.timestamp - b.timestamp);
        try {
            // Extract metrics
            const currentPrice = sortedHistory[sortedHistory.length - 1].price;
            const priceMultiplier = currentPrice / launchPrice;
            // Calculate volume metrics
            const volumes = sortedHistory.map(p => p.volume);
            const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
            const maxVolume = Math.max(...volumes);
            const volumeMultiplier = currentPrice > 0 ? maxVolume / (avgVolume || 1) : 1;
            // Determine volume trend
            const volumeTrend = this.analyzeVolumeTrend(sortedHistory);
            // Calculate price momentum
            const priceMomentum = this.calculatePriceMomentum(sortedHistory);
            // Calculate volatility
            const volatility = this.calculateVolatility(sortedHistory);
            // Detect pump-and-dump patterns
            const hasExecutionRisk = this.detectExecutionRisk(sortedHistory, launchPrice);
            // Generate risk flags and positives
            const { riskFlags, positives } = this.generateFlags(priceMultiplier, volumeMultiplier, priceMomentum, volatility, volumeTrend, hasExecutionRisk, sortedHistory);
            // Calculate final score
            const score = this.calculateScore(priceMultiplier, volatility, priceMomentum, volumeMultiplier, volumeTrend, hasExecutionRisk);
            logger_1.default.debug('Pump pattern analysis complete', {
                priceMultiplier: priceMultiplier.toFixed(2),
                volumeMultiplier: volumeMultiplier.toFixed(2),
                volatility: volatility.toFixed(4),
                priceMomentum: priceMomentum.toFixed(4),
                score,
            });
            return {
                score: Math.max(0, Math.min(100, score)),
                priceMultiplier,
                volumeMultiplier,
                volumeTrend,
                priceMomentum,
                volatility,
                hasExecutionRisk,
                riskFlags,
                positives,
            };
        }
        catch (error) {
            throw new errors_1.APIError('Failed to analyze pump pattern', {
                historyLength: sortedHistory.length,
                error: error.message,
            });
        }
    }
    /**
     * Analyze the direction of volume trend
     *
     * @param sortedHistory - Price history sorted by timestamp
     * @returns 'increasing', 'decreasing', or 'stable'
     */
    analyzeVolumeTrend(sortedHistory) {
        if (sortedHistory.length < 2) {
            return 'stable';
        }
        // Compare first half avg volume vs second half avg volume
        const midpoint = Math.floor(sortedHistory.length / 2);
        const firstHalf = sortedHistory.slice(0, midpoint);
        const secondHalf = sortedHistory.slice(midpoint);
        const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.volume, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.volume, 0) / secondHalf.length;
        const volumeChange = (secondHalfAvg - firstHalfAvg) / (firstHalfAvg || 1);
        if (volumeChange > 0.15) {
            return 'increasing';
        }
        else if (volumeChange < -0.15) {
            return 'decreasing';
        }
        return 'stable';
    }
    /**
     * Calculate price momentum (rate of price change)
     * Returns ratio: (price_now - price_old) / price_old
     *
     * @param sortedHistory - Price history sorted by timestamp
     * @returns Momentum as decimal (e.g., 0.5 = 50% increase)
     */
    calculatePriceMomentum(sortedHistory) {
        if (sortedHistory.length < 2) {
            return 0;
        }
        const oldestPrice = sortedHistory[0].price;
        const currentPrice = sortedHistory[sortedHistory.length - 1].price;
        return (currentPrice - oldestPrice) / (oldestPrice || 1);
    }
    /**
     * Calculate volatility using standard deviation of returns
     *
     * @param sortedHistory - Price history sorted by timestamp
     * @returns Standard deviation of log returns
     */
    calculateVolatility(sortedHistory) {
        if (sortedHistory.length < 2) {
            return 0;
        }
        // Calculate log returns
        const returns = [];
        for (let i = 1; i < sortedHistory.length; i++) {
            const prevPrice = sortedHistory[i - 1].price;
            const currentPrice = sortedHistory[i].price;
            if (prevPrice > 0) {
                const logReturn = Math.log(currentPrice / prevPrice);
                returns.push(logReturn);
            }
        }
        if (returns.length === 0) {
            return 0;
        }
        // Calculate mean return
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        // Calculate variance
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
        // Return standard deviation
        return Math.sqrt(variance);
    }
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
    detectExecutionRisk(sortedHistory, launchPrice) {
        if (sortedHistory.length < 3) {
            return false;
        }
        // Find peak price and its position
        let peakPrice = launchPrice;
        let peakIndex = 0;
        for (let i = 0; i < sortedHistory.length; i++) {
            if (sortedHistory[i].price > peakPrice) {
                peakPrice = sortedHistory[i].price;
                peakIndex = i;
            }
        }
        // Check if peak occurred early (within first 30% of history)
        const peakOccurredEarly = peakIndex <= Math.floor(sortedHistory.length * 0.3);
        // Check for subsequent decline
        let hasSubsequentDecline = false;
        if (peakIndex < sortedHistory.length - 1) {
            const priceAfterPeak = sortedHistory[sortedHistory.length - 1].price;
            const priceDecline = (peakPrice - priceAfterPeak) / peakPrice;
            hasSubsequentDecline = priceDecline > 0.3; // 30% decline from peak
        }
        // Check for volume spike at peak
        const volumeAtPeak = sortedHistory[peakIndex].volume;
        const avgVolume = sortedHistory.reduce((sum, p) => sum + p.volume, 0) / sortedHistory.length;
        const volumeSpikeAtPeak = volumeAtPeak > avgVolume * 2;
        // Risk detected if: early peak + subsequent decline + volume spike
        return peakOccurredEarly && hasSubsequentDecline && volumeSpikeAtPeak;
    }
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
    generateFlags(priceMultiplier, volumeMultiplier, priceMomentum, volatility, volumeTrend, hasExecutionRisk, sortedHistory) {
        const riskFlags = [];
        const positives = [];
        // Price multiplier analysis
        if (priceMultiplier > 10) {
            riskFlags.push(`Extreme pump: ${(priceMultiplier * 100).toFixed(0)}x price increase`);
        }
        else if (priceMultiplier > 5) {
            riskFlags.push(`Large pump: ${(priceMultiplier * 100).toFixed(0)}x price increase`);
        }
        else if (priceMultiplier > 2) {
            positives.push(`Solid pump: ${(priceMultiplier * 100).toFixed(0)}x price increase`);
        }
        // Volatility analysis
        if (volatility > 0.5) {
            riskFlags.push(`Extreme volatility: ${(volatility * 100).toFixed(1)}%`);
        }
        else if (volatility > 0.2) {
            riskFlags.push(`High volatility: ${(volatility * 100).toFixed(1)}%`);
        }
        else if (volatility < 0.05) {
            positives.push('Stable price movement');
        }
        // Volume analysis
        if (volumeMultiplier > 5) {
            riskFlags.push(`Extreme volume spike: ${volumeMultiplier.toFixed(1)}x average`);
        }
        else if (volumeMultiplier > 2) {
            positives.push(`Strong volume: ${volumeMultiplier.toFixed(1)}x average`);
        }
        // Momentum analysis
        if (priceMomentum > 2) {
            riskFlags.push('Aggressive upward momentum - possible bubble');
        }
        else if (priceMomentum > 0.5) {
            positives.push('Strong upward momentum');
        }
        // Volume trend analysis
        if (volumeTrend === 'increasing') {
            positives.push('Volume trending upward');
        }
        else if (volumeTrend === 'decreasing') {
            riskFlags.push('Volume trending downward - potential dump phase');
        }
        // Execution risk
        if (hasExecutionRisk) {
            riskFlags.push('Pump-and-dump pattern detected');
        }
        // Check price stability (current price relative to peak)
        const maxPrice = Math.max(...sortedHistory.map(p => p.price));
        const currentPrice = sortedHistory[sortedHistory.length - 1].price;
        const pullbackPercentage = ((maxPrice - currentPrice) / maxPrice) * 100;
        if (pullbackPercentage > 50) {
            riskFlags.push(`Severe pullback from peak: ${pullbackPercentage.toFixed(1)}%`);
        }
        else if (pullbackPercentage > 20) {
            riskFlags.push(`Notable pullback from peak: ${pullbackPercentage.toFixed(1)}%`);
        }
        else if (pullbackPercentage < 5) {
            positives.push('Maintaining price near recent peak');
        }
        return { riskFlags, positives };
    }
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
    calculateScore(priceMultiplier, volatility, priceMomentum, volumeMultiplier, volumeTrend, hasExecutionRisk) {
        let score = 60; // Start at neutral baseline
        // Volatility penalty (high volatility = risky)
        if (volatility > 0.5) {
            score -= 30;
        }
        else if (volatility > 0.2) {
            score -= 15;
        }
        else if (volatility < 0.05) {
            score += 5;
        }
        // Price momentum analysis
        if (priceMomentum > 2) {
            score -= 25; // Extreme momentum = bubble risk
        }
        else if (priceMomentum > 1) {
            score -= 10; // High momentum = moderate risk
        }
        else if (priceMomentum > 0.5) {
            score += 5; // Good growth
        }
        else if (priceMomentum < 0) {
            score -= 20; // Decline from launch
        }
        // Price multiplier analysis
        if (priceMultiplier > 10) {
            score -= 25; // Extreme increase = bubble risk
        }
        else if (priceMultiplier > 5) {
            score -= 10; // Large increase = moderate risk
        }
        else if (priceMultiplier > 2) {
            score += 10; // Solid growth is good
        }
        // Volume multiplier bonus
        if (volumeMultiplier > 5) {
            score -= 20; // Extreme spike = execution risk
        }
        else if (volumeMultiplier > 2) {
            score += 10; // Strong volume = good
        }
        else if (volumeMultiplier < 0.5) {
            score -= 5; // Low volume = liquidity concern
        }
        // Volume trend bonus
        if (volumeTrend === 'increasing') {
            score += 10;
        }
        else if (volumeTrend === 'decreasing') {
            score -= 10;
        }
        // Execution risk penalty
        if (hasExecutionRisk) {
            score -= 40; // Strong indicator of manipulation
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Create a neutral analysis result for edge cases
     *
     * @param reason - Reason for neutral analysis
     * @returns Neutral PumpPatternAnalysis
     */
    createNeutralAnalysis(reason) {
        return {
            score: 50,
            priceMultiplier: 1,
            volumeMultiplier: 1,
            volumeTrend: 'stable',
            priceMomentum: 0,
            volatility: 0,
            hasExecutionRisk: false,
            riskFlags: [reason],
            positives: [],
        };
    }
}
exports.PumpPatternAnalyzer = PumpPatternAnalyzer;
exports.default = PumpPatternAnalyzer;
//# sourceMappingURL=pump-pattern.js.map