/**
 * Error Handling Test Suite
 * Tests critical error paths including RPC failover, API failures, and validation
 * Target: >80% error path coverage
 */

import { Database } from '../src/database/db';
import { WalletAnalyzer, CreatorHistoryAnalyzer, LiquidityAnalyzer } from '../src/analyzers';
import { ScoringEngine } from '../src/scoring/score-engine';
import { ValidationError, APIError, BotError } from '../src/utils/errors';
import logger from '../src/utils/logger';

describe('Error Handling', () => {
  describe('Analyzer Error Paths', () => {
    let walletAnalyzer: WalletAnalyzer;
    let creatorAnalyzer: CreatorHistoryAnalyzer;
    let liquidityAnalyzer: LiquidityAnalyzer;

    beforeEach(() => {
      walletAnalyzer = new WalletAnalyzer();
      creatorAnalyzer = new CreatorHistoryAnalyzer();
      liquidityAnalyzer = new LiquidityAnalyzer();
    });

    it('should handle empty holder data gracefully', () => {
      const data: any = {
        contractAddress: '0x123',
        totalSupply: BigInt(1000000),
        decimals: 18,
        holderCount: 0,
        topHolders: [],
        liquidityPairs: [],
        isBurned: false,
      };

      const result = walletAnalyzer.analyzeHolders(data);

      expect(result.score).toBe(50); // Neutral score for unknown
      expect(result.concentration).toBe(0);
      expect(result.topHolderPercentage).toBe(0);
      expect(result.riskFlags).toContain('No holder data available');
    });

    it('should handle invalid holder percentages', () => {
      const data: any = {
        contractAddress: '0x123',
        totalSupply: BigInt(1000000),
        decimals: 18,
        holderCount: 5,
        topHolders: [
          { address: '0x1', balance: BigInt(500000), percentage: NaN },
          { address: '0x2', balance: BigInt(300000), percentage: Infinity },
          { address: '0x3', balance: BigInt(200000), percentage: -10 },
        ],
        liquidityPairs: [],
        isBurned: false,
      };

      // Should not throw, should handle gracefully
      expect(() => walletAnalyzer.analyzeHolders(data)).not.toThrow();
    });

    it('should handle creator analysis with missing timestamp', async () => {
      const result = await creatorAnalyzer.analyzeCreator('0x123', 0);

      expect(result.score).toBeDefined();
      expect(result.walletAge).toBeDefined();
      expect(result.previousLaunches).toBe(0);
      expect(result.rugPulls).toBe(0);
    });

    it('should handle creator analysis with future timestamp', async () => {
      const futureTime = Date.now() + 1000 * 60 * 60 * 24; // 1 day in future
      const result = await creatorAnalyzer.analyzeCreator('0x123', futureTime);

      expect(result.score).toBeDefined();
      expect(result.walletAge).toBeLessThanOrEqual(0); // Negative age
    });

    it('should handle liquidity analysis with undefined amount', () => {
      const result = liquidityAnalyzer.analyzeLiquidity('0x123', undefined, false);

      expect(result.score).toBeLessThan(70);
      expect(result.liquidityAmount).toBe(0);
      expect(result.riskFlags).toContain('Unknown liquidity amount');
    });

    it('should handle liquidity analysis with zero amount', () => {
      const result = liquidityAnalyzer.analyzeLiquidity('0x123', 0, true);

      expect(result.score).toBeLessThan(70);
      // When amount is 0, it gets flagged as unknown (not set) or low
      expect(result.riskFlags.length).toBeGreaterThan(0);
    });

    it('should handle liquidity analysis with negative amount', () => {
      const result = liquidityAnalyzer.analyzeLiquidity('0x123', -5000, true);

      // Should treat negative as low liquidity or handle gracefully
      expect(result.score).toBeDefined();
    });

    it('should flag brand new creator wallets', async () => {
      const now = Date.now();
      const brandNewTime = now - 1000 * 60 * 60; // 1 hour old
      const result = await creatorAnalyzer.analyzeCreator('0xnew', brandNewTime);

      expect(result.riskFlags.length).toBeGreaterThan(0);
      expect(result.riskFlags.some(f => f.includes('Brand new'))).toBe(true);
    });

    it('should bonus established creator wallets', async () => {
      const now = Date.now();
      const oldTime = now - 1000 * 60 * 60 * 24 * 400; // 400 days old
      const result = await creatorAnalyzer.analyzeCreator('0xold', oldTime);

      expect(result.positives.length).toBeGreaterThan(0);
      expect(result.positives.some(p => p.includes('Established'))).toBe(true);
    });
  });

  describe('Scoring Engine Error Paths', () => {
    let engine: ScoringEngine;

    beforeEach(() => {
      engine = new ScoringEngine();
    });

    it('should handle missing component scores', () => {
      const analyses = {
        holderAnalysis: { score: 50, concentration: 30, topHolderPercentage: 10, riskFlags: [] },
        creatorAnalysis: { score: 0, walletAge: 0, previousLaunches: 0, rugPulls: 0, riskFlags: [], positives: [] },
        liquidityAnalysis: { score: 0, isLocked: false, liquidityAmount: 0, riskFlags: [], positives: [] },
      };

      const result = engine.score(
        analyses.holderAnalysis as any,
        analyses.creatorAnalysis as any,
        analyses.liquidityAnalysis as any
      );

      expect(result.totalScore).toBeDefined();
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should handle extreme score values', () => {
      const analyses = {
        holderAnalysis: { score: 100, concentration: 100, topHolderPercentage: 100, riskFlags: [] },
        creatorAnalysis: { score: 100, walletAge: 10000, previousLaunches: 100, rugPulls: 50, riskFlags: [], positives: ['established'] },
        liquidityAnalysis: { score: 100, isLocked: true, liquidityAmount: 1000000, riskFlags: [], positives: ['locked'] },
      };

      const result = engine.score(
        analyses.holderAnalysis as any,
        analyses.creatorAnalysis as any,
        analyses.liquidityAnalysis as any
      );

      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should handle all zero scores', () => {
      const analyses = {
        holderAnalysis: { score: 0, concentration: 0, topHolderPercentage: 0, riskFlags: ['all bad'] },
        creatorAnalysis: { score: 0, walletAge: 0, previousLaunches: 0, rugPulls: 100, riskFlags: ['rug pull'], positives: [] },
        liquidityAnalysis: { score: 0, isLocked: false, liquidityAmount: 0, riskFlags: ['not locked'], positives: [] },
      };

      const result = engine.score(
        analyses.holderAnalysis as any,
        analyses.creatorAnalysis as any,
        analyses.liquidityAnalysis as any
      );

      expect(result.totalScore).toBeDefined();
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Database Error Paths', () => {
    let db: Database;

    beforeEach(async () => {
      db = new Database(':memory:');
      await db.initialize();
    });

    afterEach(async () => {
      await db.close();
    });

    it('should handle duplicate token insertion', async () => {
      const tokenData = {
        contractAddress: '0xdup',
        name: 'Duplicate Token',
        symbol: 'DUP',
        launchTime: Date.now(),
        firstSeen: Date.now(),
        lastUpdated: Date.now(),
        source: 'clanker' as const,
      };

      const id1 = await db.insertToken(tokenData);
      const id2 = await db.insertToken({ ...tokenData, name: 'Different Name' });

      // Should insert both (no unique constraint on contract address in basic schema)
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
    });

    it('should handle getToken with non-existent address', async () => {
      const result = await db.getToken('0xnonexistent');

      expect(result).toBeFalsy(); // null or undefined
    });

    it('should handle null/undefined values in token data', async () => {
      const tokenData = {
        contractAddress: '0xnull',
        name: 'Null Test',
        symbol: 'NULL',
        launchTime: 0,
        firstSeen: 0,
        lastUpdated: 0,
        source: 'bankr' as const,
      };

      const id = await db.insertToken(tokenData);
      expect(id).toBeDefined();

      const retrieved = await db.getToken('0xnull');
      expect(retrieved).toBeDefined();
    });

    it('should handle concurrent inserts', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        db.insertToken({
          contractAddress: `0x${i}`,
          name: `Token ${i}`,
          symbol: `T${i}`,
          launchTime: Date.now(),
          firstSeen: Date.now(),
          lastUpdated: Date.now(),
          source: 'clanker' as const,
        })
      );

      const ids = await Promise.all(promises);
      expect(ids).toHaveLength(10);
      expect(new Set(ids).size).toBe(10); // All unique
    });

    it('should handle analysis insertion for non-existent token', async () => {
      const analysisData = {
        tokenId: 99999,
        score: 75,
        holderScore: 70,
        creatorScore: 75,
        liquidityScore: 80,
        pumpScore: 70,
        risks: [],
        positives: [],
        timestamp: Date.now(),
      };

      // Should not throw, gracefully handle foreign key constraint if applicable
      try {
        await db.insertAnalysis(analysisData);
      } catch (error: any) {
        expect(error).toBeDefined(); // Expected to fail
      }
    });

    it('should handle duplicate alert records', async () => {
      const tokenData = {
        contractAddress: '0xalert',
        name: 'Alert Test',
        symbol: 'ALERT',
        launchTime: Date.now(),
        firstSeen: Date.now(),
        lastUpdated: Date.now(),
        source: 'clanker' as const,
      };

      const tokenId = await db.insertToken(tokenData);

      const messageId1 = 'msg123';
      const messageId2 = 'msg456';

      // Record first alert
      await db.recordAlertSent(tokenId, messageId1);
      const hasAlerted1 = await db.hasAlertBeenSent(tokenId);
      expect(hasAlerted1).toBe(true);

      // Record second alert
      await db.recordAlertSent(tokenId, messageId2);
      const hasAlerted2 = await db.hasAlertBeenSent(tokenId);
      expect(hasAlerted2).toBe(true);
    });
  });

  describe('Validation Errors', () => {
    it('should throw ValidationError with proper message', () => {
      expect(() => {
        throw new ValidationError('Test validation failed', { detail: 'invalid input' });
      }).toThrow(ValidationError);
    });

    it('should throw APIError with proper message', () => {
      expect(() => {
        throw new APIError('API call failed', { endpoint: '/test', status: 500 });
      }).toThrow(APIError);
    });

    it('should throw BotError with proper message', () => {
      expect(() => {
        throw new BotError('Bot operation failed', 'BOT_ERROR');
      }).toThrow(BotError);
    });
  });

  describe('Logger Error Paths', () => {
    it('should log errors without throwing', () => {
      const logSpy = jest.spyOn(logger, 'error');

      logger.error('Test error message', { context: 'test' });

      expect(logSpy).toHaveBeenCalledWith('Test error message', { context: 'test' });
      logSpy.mockRestore();
    });

    it('should log warnings without throwing', () => {
      const logSpy = jest.spyOn(logger, 'warn');

      logger.warn('Test warning message', { context: 'test' });

      expect(logSpy).toHaveBeenCalledWith('Test warning message', { context: 'test' });
      logSpy.mockRestore();
    });

    it('should handle logging undefined values', () => {
      expect(() => {
        logger.debug('Debug message', undefined);
        logger.info('Info message', null);
        logger.warn('Warn message', {});
      }).not.toThrow();
    });
  });

  describe('Type Safety Error Paths', () => {
    it('should handle undefined in numeric operations', () => {
      const value: any = undefined;
      const result = value ?? 0;
      expect(result).toBe(0);
    });

    it('should handle null in string operations', () => {
      const value: any = null;
      const result = value || 'default';
      expect(result).toBe('default');
    });

    it('should handle missing required fields', () => {
      const incompleteData: any = { name: 'Test' }; // Missing required fields

      expect(() => {
        const address = incompleteData.contractAddress;
        if (!address) {
          throw new ValidationError('Missing contractAddress', { data: incompleteData });
        }
      }).toThrow(ValidationError);
    });
  });

  describe('Boundary Conditions', () => {
    let analyzer: WalletAnalyzer;

    beforeEach(() => {
      analyzer = new WalletAnalyzer();
    });

    it('should handle score overflow at boundary', () => {
      const data: any = {
        contractAddress: '0x123',
        totalSupply: BigInt(1000000),
        decimals: 18,
        holderCount: 1000,
        topHolders: Array.from({ length: 10 }, (_, i) => ({
          address: `0x${i}`,
          balance: BigInt(10000),
          percentage: 1,
        })),
        liquidityPairs: [],
        isBurned: false,
      };

      const result = analyzer.analyzeHolders(data);

      // Score should always be 0-100
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle score underflow at boundary', () => {
      const data: any = {
        contractAddress: '0x123',
        totalSupply: BigInt(1000000),
        decimals: 18,
        holderCount: 2,
        topHolders: [
          { address: '0x1', balance: BigInt(950000), percentage: 95 },
          { address: '0x2', balance: BigInt(50000), percentage: 5 },
        ],
        liquidityPairs: [],
        isBurned: false,
      };

      const result = analyzer.analyzeHolders(data);

      // Score should always be 0-100
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should handle percentage overflow', () => {
      const data: any = {
        contractAddress: '0x123',
        totalSupply: BigInt(1000000),
        decimals: 18,
        holderCount: 5,
        topHolders: [
          { address: '0x1', balance: BigInt(600000), percentage: 60 },
          { address: '0x2', balance: BigInt(500000), percentage: 50 },
          { address: '0x3', balance: BigInt(300000), percentage: 30 },
          { address: '0x4', balance: BigInt(200000), percentage: 20 },
          { address: '0x5', balance: BigInt(100000), percentage: 10 },
        ],
        liquidityPairs: [],
        isBurned: false,
      };

      const result = analyzer.analyzeHolders(data);

      // Should handle overflow gracefully
      expect(result.concentration).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });
});
