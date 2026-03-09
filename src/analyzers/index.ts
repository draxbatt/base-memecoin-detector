import logger from '../utils/logger';
import { TokenOnChainData } from '../scrapers/rpc';

export interface HolderAnalysis {
  score: number; // 0-100
  concentration: number; // % in top 10
  topHolderPercentage: number;
  riskFlags: string[];
}

export class WalletAnalyzer {
  analyzeHolders(onChainData: TokenOnChainData): HolderAnalysis {
    logger.debug('Analyzing holder distribution', {
      contractAddress: onChainData.contractAddress,
      holderCount: onChainData.holderCount,
    });

    const topHolders = onChainData.topHolders.slice(0, 10);
    if (topHolders.length === 0) {
      return {
        score: 50, // Unknown
        concentration: 0,
        topHolderPercentage: 0,
        riskFlags: ['No holder data available'],
      };
    }

    const concentration = topHolders.reduce((sum, h) => sum + h.percentage, 0);
    const topHolderPct = topHolders[0]?.percentage || 0;

    let score = 100;
    const riskFlags: string[] = [];

    // Scoring logic
    if (concentration > 80) {
      score -= 40;
      riskFlags.push('Highly concentrated: >80% in top 10');
    } else if (concentration > 60) {
      score -= 20;
      riskFlags.push('Moderately concentrated: 60-80% in top 10');
    } else if (concentration < 30) {
      score += 10;
    }

    if (topHolderPct > 50) {
      score -= 30;
      riskFlags.push(`Single largest holder: ${topHolderPct.toFixed(1)}%`);
    } else if (topHolderPct > 30) {
      score -= 15;
      riskFlags.push(`Large single holder: ${topHolderPct.toFixed(1)}%`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      concentration,
      topHolderPercentage: topHolderPct,
      riskFlags,
    };
  }
}

export interface CreatorAnalysis {
  score: number; // 0-100
  walletAge: number; // Days
  previousLaunches: number;
  rugPulls: number;
  riskFlags: string[];
  positives: string[];
}

export class CreatorHistoryAnalyzer {
  async analyzeCreator(creatorAddress: string, launchTime: number): Promise<CreatorAnalysis> {
    logger.debug('Analyzing creator history', { creatorAddress });

    // TODO: Integrate with blockchain indexer to fetch creator's launch history
    // For now, return placeholder analysis
    const now = Date.now();
    const walletAgeMs = now - launchTime;
    const walletAgeDays = walletAgeMs / (1000 * 60 * 60 * 24);

    let score = 70;
    const riskFlags: string[] = [];
    const positives: string[] = [];

    if (walletAgeDays < 7) {
      score -= 30;
      riskFlags.push(`Brand new wallet: ${walletAgeDays.toFixed(1)} days old`);
    } else if (walletAgeDays < 30) {
      score -= 15;
      riskFlags.push(`Very new wallet: ${walletAgeDays.toFixed(1)} days old`);
    } else if (walletAgeDays > 365) {
      score += 15;
      positives.push(`Established wallet: ${walletAgeDays.toFixed(0)} days old`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      walletAge: Math.round(walletAgeDays),
      previousLaunches: 0, // Would fetch from indexer
      rugPulls: 0,
      riskFlags,
      positives,
    };
  }
}

export interface LiquidityAnalysis {
  score: number; // 0-100
  isLocked: boolean;
  liquidityAmount: number;
  riskFlags: string[];
  positives: string[];
}

export class LiquidityAnalyzer {
  analyzeLiquidity(
    contractAddress: string,
    liquidityAmount: number | undefined,
    isLocked: boolean
  ): LiquidityAnalysis {
    logger.debug('Analyzing liquidity', {
      contractAddress,
      liquidityAmount,
      isLocked,
    });

    let score = 70;
    const riskFlags: string[] = [];
    const positives: string[] = [];

    if (!isLocked) {
      score -= 25;
      riskFlags.push('Liquidity NOT locked - creator can pull anytime');
    } else {
      positives.push('Liquidity is locked');
      score += 10;
    }

    if (!liquidityAmount) {
      score -= 20;
      riskFlags.push('Unknown liquidity amount');
    } else if (liquidityAmount < 5000) {
      score -= 15;
      riskFlags.push(`Low liquidity: $${liquidityAmount.toFixed(0)}`);
    } else if (liquidityAmount > 50000) {
      score += 10;
      positives.push(`Significant liquidity: $${liquidityAmount.toFixed(0)}`);
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      isLocked,
      liquidityAmount: liquidityAmount || 0,
      riskFlags,
      positives,
    };
  }
}
