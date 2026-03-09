import { WalletAnalyzer, CreatorHistoryAnalyzer, LiquidityAnalyzer } from '../src/analyzers';
import { TokenOnChainData } from '../src/scrapers/rpc';

describe('Analyzers', () => {
  describe('WalletAnalyzer', () => {
    let analyzer: WalletAnalyzer;

    beforeEach(() => {
      analyzer = new WalletAnalyzer();
    });

    it('should score well for diversified holders', () => {
      const data: TokenOnChainData = {
        contractAddress: '0x123',
        totalSupply: BigInt(1000000),
        decimals: 18,
        holderCount: 1000,
        topHolders: Array.from({ length: 10 }, (_, i) => ({
          address: `0x${i}`,
          balance: BigInt(10000),
          percentage: 5,
        })),
        liquidityPairs: [],
        isBurned: false,
      };

      const result = analyzer.analyzeHolders(data);
      
      expect(result.score).toBeGreaterThan(70);
      expect(result.concentration).toBe(50);
      expect(result.riskFlags.length).toBe(0);
    });

    it('should flag highly concentrated holdings', () => {
      const data: TokenOnChainData = {
        contractAddress: '0x123',
        totalSupply: BigInt(1000000),
        decimals: 18,
        holderCount: 100,
        topHolders: [
          { address: '0x1', balance: BigInt(800000), percentage: 85 },
          ...Array.from({ length: 9 }, (_, i) => ({
            address: `0x${i + 2}`,
            balance: BigInt(1000),
            percentage: 2,
          })),
        ],
        liquidityPairs: [],
        isBurned: false,
      };

      const result = analyzer.analyzeHolders(data);
      
      expect(result.score).toBeLessThan(50);
      expect(result.riskFlags).toContain('Highly concentrated: >80% in top 10');
    });

    it('should handle missing holder data', () => {
      const data: TokenOnChainData = {
        contractAddress: '0x123',
        totalSupply: BigInt(1000000),
        decimals: 18,
        holderCount: 0,
        topHolders: [],
        liquidityPairs: [],
        isBurned: false,
      };

      const result = analyzer.analyzeHolders(data);
      
      expect(result.score).toBe(50);
      expect(result.riskFlags).toContain('No holder data available');
    });
  });

  describe('CreatorHistoryAnalyzer', () => {
    let analyzer: CreatorHistoryAnalyzer;

    beforeEach(() => {
      analyzer = new CreatorHistoryAnalyzer();
    });

    it('should penalize brand new wallets', async () => {
      const creatorAddress = '0xabc';
      const launchTime = Date.now() - 1000 * 60 * 60 * 24 * 2; // 2 days ago

      const result = await analyzer.analyzeCreator(creatorAddress, launchTime);

      expect(result.score).toBeLessThan(65);
      expect(result.riskFlags.some(f => f.includes('Brand new'))).toBe(true);
    });

    it('should reward established wallets', async () => {
      const creatorAddress = '0xabc';
      const launchTime = Date.now() - 1000 * 60 * 60 * 24 * 400; // 400 days ago

      const result = await analyzer.analyzeCreator(creatorAddress, launchTime);

      expect(result.score).toBeGreaterThan(70);
      expect(result.positives.some(p => p.includes('Established'))).toBe(true);
    });
  });

  describe('LiquidityAnalyzer', () => {
    let analyzer: LiquidityAnalyzer;

    beforeEach(() => {
      analyzer = new LiquidityAnalyzer();
    });

    it('should reward locked liquidity', () => {
      const result = analyzer.analyzeLiquidity('0x123', 50000, true);

      expect(result.score).toBeGreaterThan(70);
      expect(result.positives).toContain('Liquidity is locked');
    });

    it('should penalize unlocked liquidity', () => {
      const result = analyzer.analyzeLiquidity('0x123', 50000, false);

      expect(result.score).toBeLessThan(60);
      expect(result.riskFlags).toContain('Liquidity NOT locked - creator can pull anytime');
    });

    it('should penalize low liquidity', () => {
      const result = analyzer.analyzeLiquidity('0x123', 2000, true);

      expect(result.score).toBeLessThanOrEqual(65);
      expect(result.riskFlags.some(f => f.includes('Low liquidity'))).toBe(true);
    });

    it('should reward high liquidity', () => {
      const result = analyzer.analyzeLiquidity('0x123', 100000, true);

      expect(result.score).toBeGreaterThan(80);
      expect(result.positives.some(p => p.includes('Significant liquidity'))).toBe(true);
    });
  });
});
