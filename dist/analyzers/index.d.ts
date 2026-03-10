import { TokenOnChainData } from '../scrapers/rpc';
export type { TokenOnChainData } from '../scrapers/rpc';
/**
 * Result of holder concentration analysis.
 *
 * Measures how concentrated token ownership is among top addresses.
 * High concentration = rug pull risk (large holders can dump).
 *
 * @interface HolderAnalysis
 * @property {number} score - Risk score (0-100, higher = safer)
 * @property {number} concentration - Percentage of tokens in top 10 holders
 * @property {number} topHolderPercentage - Largest holder's share
 * @property {string[]} riskFlags - Concentration warnings (e.g., "Highly concentrated: >80%")
 */
export interface HolderAnalysis {
    score: number;
    concentration: number;
    topHolderPercentage: number;
    riskFlags: string[];
}
/**
 * WalletAnalyzer - Analyzes token holder distribution.
 *
 * Scores based on:
 * - Concentration in top 10 holders (ideal <30%)
 * - Single largest holder (risk if >30%)
 *
 * Scoring formula:
 * - Start: 100 points
 * - Concentration >80%: -40 points
 * - Concentration 60-80%: -20 points
 * - Concentration <30%: +10 points (bonus for diversity)
 * - Single holder >50%: -30 points (major risk)
 * - Single holder 30-50%: -15 points
 *
 * Ideal token: well-distributed, no whale dominance.
 *
 * @example
 * const analyzer = new WalletAnalyzer();
 * const analysis = analyzer.analyzeHolders(onChainData);
 * if (analysis.concentration > 80) console.log('AVOID - too concentrated');
 */
export declare class WalletAnalyzer {
    /**
     * Analyzes token holder distribution using on-chain data.
     *
     * Fetches top 10 holders and calculates:
     * 1. Total concentration in top 10 (should be <60%)
     * 2. Largest single holder percentage (should be <30%)
     * 3. Risk flags for whale dominance
     * 4. Score (0-100, higher = safer)
     *
     * Edge case: If no holder data available, returns neutral score (50) with warning.
     *
     * @param {TokenOnChainData} onChainData - Token holder data from RPC
     * @returns {HolderAnalysis} Holder concentration score and risk assessment
     *
     * @example
     * const analysis = analyzer.analyzeHolders({
     *   contractAddress: '0x...',
     *   topHolders: [
     *     { address: '0x1', percentage: 25 },
     *     { address: '0x2', percentage: 15 },
     *     ...
     *   ],
     *   holderCount: 5000
     * });
     * // Returns: { score: 80, concentration: 55, topHolderPercentage: 25, riskFlags: [] }
     *
     * @public
     */
    analyzeHolders(onChainData: TokenOnChainData): HolderAnalysis;
}
/**
 * Result of creator reputation analysis.
 *
 * Measures creator wallet age and launch history.
 * New wallets = higher rug pull risk.
 *
 * @interface CreatorAnalysis
 * @property {number} score - Reputation score (0-100, higher = safer)
 * @property {number} walletAge - Creator wallet age in days
 * @property {number} previousLaunches - Number of prior token launches
 * @property {number} rugPulls - Number of detected rug pulls
 * @property {string[]} riskFlags - Age/history warnings (e.g., "Brand new wallet")
 * @property {string[]} positives - Age/history bonuses (e.g., "Established wallet")
 */
export interface CreatorAnalysis {
    score: number;
    walletAge: number;
    previousLaunches: number;
    rugPulls: number;
    riskFlags: string[];
    positives: string[];
}
/**
 * CreatorHistoryAnalyzer - Analyzes creator reputation.
 *
 * Scores based on:
 * - Wallet age (older = safer)
 * - Previous launches (more established = safer)
 * - Rug pull history (previous rug pulls = high risk)
 *
 * Scoring formula:
 * - Start: 70 points
 * - Brand new wallet (<7 days): -30 points
 * - Very new (<30 days): -15 points
 * - Established (>365 days): +15 points (bonus)
 *
 * NOTE: Currently uses placeholder implementation.
 * TODO: Integrate with blockchain indexer (Etherscan API, Covalent) to fetch:
 * - Creator's full launch history
 * - Rug pull detection via historical liquidity data
 * - Successful vs failed projects ratio
 *
 * @example
 * const analyzer = new CreatorHistoryAnalyzer();
 * const analysis = await analyzer.analyzeCreator(creatorAddress, launchTime);
 * if (analysis.walletAge < 7) console.log('AVOID - brand new creator');
 */
export declare class CreatorHistoryAnalyzer {
    /**
     * Analyzes creator wallet age and reputation.
     *
     * Currently uses wallet age (days since launch) as proxy for reputation.
     * In production, should integrate with blockchain indexer for:
     * - Previous token launches
     * - Rug pull detection
     * - Successful project history
     *
     * Flow:
     * 1. Calculate wallet age from creation timestamp
     * 2. Apply penalties for brand new creators (<7 days)
     * 3. Apply bonuses for established creators (>365 days)
     * 4. Return risk flags and positive indicators
     *
     * @param {string} creatorAddress - Wallet address to analyze
     * @param {number} launchTime - Timestamp of token creation
     * @returns {Promise<CreatorAnalysis>} Creator reputation score and history
     *
     * @example
     * const analysis = await analyzer.analyzeCreator('0x123...', Date.now() - 1000 * 60 * 60 * 24);
     * // Returns: { score: 55, walletAge: 1, riskFlags: ['Brand new wallet...'], ... }
     *
     * @public
     */
    analyzeCreator(creatorAddress: string, launchTime: number): Promise<CreatorAnalysis>;
}
/**
 * Result of liquidity lock analysis.
 *
 * Measures if liquidity is locked and how much capital is backing token.
 * Unlocked liquidity = creator can drain pool (rug pull).
 *
 * @interface LiquidityAnalysis
 * @property {number} score - Liquidity safety score (0-100, higher = safer)
 * @property {boolean} isLocked - Whether liquidity is in locked contract
 * @property {number} liquidityAmount - Total liquidity in USD
 * @property {string[]} riskFlags - Liquidity warnings (e.g., "NOT locked")
 * @property {string[]} positives - Liquidity bonuses (e.g., "Locked liquidity")
 */
export interface LiquidityAnalysis {
    score: number;
    isLocked: boolean;
    liquidityAmount: number;
    riskFlags: string[];
    positives: string[];
}
/**
 * LiquidityAnalyzer - Analyzes token liquidity safety.
 *
 * Scores based on:
 * - Lock status (is LP token locked in contract?)
 * - Liquidity amount (USD value of backing)
 *
 * Scoring formula:
 * - Start: 70 points
 * - NOT locked: -25 points (major risk)
 * - Locked: +10 points (bonus)
 * - Liquidity <$5K: -15 points
 * - Liquidity >$50K: +10 points (bonus)
 * - Unknown: -20 points
 *
 * Ideal token: Locked liquidity + $50K+ backing.
 *
 * @example
 * const analyzer = new LiquidityAnalyzer();
 * const analysis = analyzer.analyzeLiquidity('0x...', 75000, true);
 * if (analysis.isLocked) console.log('GOOD - liquidity locked');
 */
export declare class LiquidityAnalyzer {
    /**
     * Analyzes token liquidity lock and amount.
     *
     * Flow:
     * 1. Check if LP tokens are locked in smart contract
     * 2. Verify liquidity amount against thresholds ($5K min, $50K good)
     * 3. Flag risk if liquidity not locked (creator can pull)
     * 4. Bonus if liquidity is significant
     *
     * Note: "Liquidity lock" refers to LP tokens being in a timelock contract
     * (e.g., Uniswap V3 LockIt, Pancakeswap SmartChef, custom timelock).
     *
     * @param {string} contractAddress - ERC-20 token contract address
     * @param {number | undefined} liquidityAmount - Total liquidity in USD (optional)
     * @param {boolean} isLocked - Whether LP tokens are locked in timelock contract
     * @returns {LiquidityAnalysis} Liquidity safety score and assessment
     *
     * @example
     * const analysis = analyzer.analyzeLiquidity('0x...', 75000, true);
     * // Returns: { score: 90, isLocked: true, liquidityAmount: 75000, riskFlags: [], positives: [...] }
     *
     * @public
     */
    analyzeLiquidity(contractAddress: string, liquidityAmount: number | undefined, isLocked: boolean): LiquidityAnalysis;
}
//# sourceMappingURL=index.d.ts.map