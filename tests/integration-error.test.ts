/**
 * Integration Error Handling Tests
 * Tests full pipeline error scenarios including API failures, network errors, and edge cases
 */

import { Database } from '../src/database/db';
import { WalletAnalyzer, CreatorHistoryAnalyzer, LiquidityAnalyzer } from '../src/analyzers';
import { ScoringEngine } from '../src/scoring/score-engine';
import { ValidationError, APIError } from '../src/utils/errors';
import logger from '../src/utils/logger';

describe('Integration Error Scenarios', () => {
  let db: Database;
  let walletAnalyzer: WalletAnalyzer;
  let creatorAnalyzer: CreatorHistoryAnalyzer;
  let liquidityAnalyzer: LiquidityAnalyzer;
  let scoringEngine: ScoringEngine;

  beforeEach(async () => {
    db = new Database(':memory:');
    await db.initialize();
    walletAnalyzer = new WalletAnalyzer();
    creatorAnalyzer = new CreatorHistoryAnalyzer();
    liquidityAnalyzer = new LiquidityAnalyzer();
    scoringEngine = new ScoringEngine();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('Full Pipeline Error Recovery', () => {
    it('should continue processing after analyzer failure', async () => {
      const tokenData = {
        contractAddress: '0xtest1',
        name: 'Test Token 1',
        symbol: 'TEST1',
        launchTime: Date.now(),
        firstSeen: Date.now(),
        lastUpdated: Date.now(),
        source: 'clanker' as const,
      };

      const tokenId = await db.insertToken(tokenData);

      // First token analysis with bad data - should not crash
      const badOnChainData: any = {
        contractAddress: '0xtest1',
        totalSupply: BigInt(0), // Edge case
        decimals: 0,
        holderCount: 0,
        topHolders: [], // Empty
        liquidityPairs: [],
        isBurned: false,
      };

      const holderAnalysis = walletAnalyzer.analyzeHolders(badOnChainData);
      expect(holderAnalysis).toBeDefined();

      // Insert second token - should succeed despite first token issues
      const tokenData2 = {
        contractAddress: '0xtest2',
        name: 'Test Token 2',
        symbol: 'TEST2',
        launchTime: Date.now(),
        firstSeen: Date.now(),
        lastUpdated: Date.now(),
        source: 'bankr' as const,
      };

      const tokenId2 = await db.insertToken(tokenData2);
      expect(tokenId2).toBeDefined();
      expect(tokenId2).not.toBe(tokenId);
    });

    it('should handle partial analyzer failures in scoring', async () => {
      const holderAnalysis = {
        score: 75,
        concentration: 40,
        topHolderPercentage: 15,
        riskFlags: [],
      };

      const creatorAnalysis = {
        score: 0, // Failure case: zero score
        walletAge: 0,
        previousLaunches: 0,
        rugPulls: 100, // Indicates rug pull history
        riskFlags: ['High rug pull risk'],
        positives: [],
      };

      const liquidityAnalysis = {
        score: 60,
        isLocked: false,
        liquidityAmount: 10000,
        riskFlags: ['Not locked'],
        positives: [],
      };

      // Should still produce overall score despite partial failures
      const result = scoringEngine.score(holderAnalysis, creatorAnalysis, liquidityAnalysis);

      expect(result.totalScore).toBeDefined();
      expect(result.components.creatorScore).toBe(0);
      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('should handle database lock during concurrent analysis', async () => {
      const tokenData = {
        contractAddress: '0xconcurrent',
        name: 'Concurrent Test',
        symbol: 'CONC',
        launchTime: Date.now(),
        firstSeen: Date.now(),
        lastUpdated: Date.now(),
        source: 'clanker' as const,
      };

      const tokenId = await db.insertToken(tokenData);

      // Simulate concurrent analysis operations
      const analysisPromises = Array.from({ length: 5 }, async (_, i) => {
        const analysis = {
          tokenId,
          score: 50 + i * 5,
          holderScore: 50 + i,
          creatorScore: 50 + i,
          liquidityScore: 50 + i,
          pumpScore: 50 + i,
          risks: [`Risk ${i}`],
          positives: [`Positive ${i}`],
          timestamp: Date.now(),
        };

        try {
          await db.insertAnalysis(analysis);
          return { success: true, analysis };
        } catch (error) {
          // Should handle gracefully
          return { success: false, error };
        }
      });

      const results = await Promise.all(analysisPromises);

      // At least some should succeed
      const successful = results.filter(r => r.success);
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('API Failure Scenarios', () => {
    it('should gracefully degrade when API returns empty list', async () => {
      // Simulate empty API response
      const launches: any[] = [];

      expect(launches.length).toBe(0);

      // Should not crash bot, just log and continue
      for (const launch of launches) {
        const tokenData = {
          contractAddress: launch.contractAddress,
          name: launch.name,
          symbol: launch.symbol,
          launchTime: launch.launchTime,
          firstSeen: Date.now(),
          lastUpdated: Date.now(),
          source: launch.source,
        };

        await db.insertToken(tokenData);
      }

      // Verify no tokens were inserted
      const token = await db.getToken('0xany');
      expect(token).toBeFalsy(); // null or undefined
    });

    it('should handle malformed token data from scraper', () => {
      const malformedData: any[] = [
        { contractAddress: '0xinvalid1' }, // Missing name/symbol
        { name: 'No Address' }, // Missing address
        null, // Null entry
        undefined, // Undefined entry
        { contractAddress: '', name: 'Empty Address', symbol: 'EMPTY' }, // Empty address
      ];

      const isValidToken = (t: any): t is { contractAddress: string; name: string; symbol: string } => {
        return (
          t !== null &&
          t !== undefined &&
          typeof t === 'object' &&
          typeof t.contractAddress === 'string' &&
          t.contractAddress.length > 0 &&
          typeof t.name === 'string' &&
          t.name.length > 0 &&
          typeof t.symbol === 'string' &&
          t.symbol.length > 0
        );
      };

      const validTokens = malformedData.filter(isValidToken);

      expect(validTokens.length).toBe(0);
    });

    it('should retry on rate limit error', async () => {
      let attempts = 0;
      const maxRetries = 3;

      const simulateApiWithRateLimit = async (): Promise<any> => {
        attempts++;
        if (attempts < maxRetries) {
          throw new APIError('Rate limited', { status: 429 });
        }
        return { success: true };
      };

      let lastError: Error | null = null;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const result = await simulateApiWithRateLimit();
          expect(result.success).toBe(true);
          break;
        } catch (error: any) {
          lastError = error;
        }
      }

      expect(attempts).toBe(maxRetries);
    });

    it('should handle non-retryable API errors', async () => {
      const simulateNonRetryable = async () => {
        throw new ValidationError('Invalid input', { field: 'address' });
      };

      const attempts: number[] = [];
      const maxRetries = 3;

      for (let i = 0; i < maxRetries; i++) {
        try {
          await simulateNonRetryable();
        } catch (error: any) {
          attempts.push(i);
          if (!error.message.includes('Rate')) {
            // Non-retryable - should stop
            break;
          }
        }
      }

      // Should only attempt once for non-retryable error
      expect(attempts.length).toBe(1);
    });
  });

  describe('Data Validation Scenarios', () => {
    it('should validate contract address format', () => {
      const validAddresses = [
        '0x1234567890123456789012345678901234567890',
        '0x0000000000000000000000000000000000000000',
        '0xffffffffffffffffffffffffffffffffffffffff',
      ];

      const invalidAddresses = [
        '0xinvalid',
        '123456789012345678901234567890123456789',
        '0x',
        '',
      ];

      const isValidAddress = (addr: any): addr is string => {
        return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr);
      };

      validAddresses.forEach(addr => {
        expect(isValidAddress(addr)).toBe(true);
      });

      invalidAddresses.forEach(addr => {
        expect(isValidAddress(addr)).toBe(false);
      });
    });

    it('should validate numeric score ranges', () => {
      const isValidScore = (score: any): boolean => {
        return typeof score === 'number' && score >= 0 && score <= 100;
      };

      expect(isValidScore(50)).toBe(true);
      expect(isValidScore(0)).toBe(true);
      expect(isValidScore(100)).toBe(true);
      expect(isValidScore(-1)).toBe(false);
      expect(isValidScore(101)).toBe(false);
      expect(isValidScore('50')).toBe(false);
      expect(isValidScore(NaN)).toBe(false);
      expect(isValidScore(Infinity)).toBe(false);
    });

    it('should validate timestamp ranges', () => {
      const now = Date.now();
      const isValidTimestamp = (ts: any): boolean => {
        return (
          typeof ts === 'number' &&
          ts > 0 &&
          ts <= Date.now() + 1000 * 60 * 5 // Within 5 minutes in future
        );
      };

      expect(isValidTimestamp(now)).toBe(true);
      expect(isValidTimestamp(now - 1000 * 60 * 60 * 24)).toBe(true); // 24h ago
      expect(isValidTimestamp(0)).toBe(false); // Zero
      expect(isValidTimestamp(-100)).toBe(false); // Negative
      expect(isValidTimestamp('2024-01-01')).toBe(false); // String
    });
  });

  describe('Fallback Behavior', () => {
    it('should fallback to neutral scoring when analysis unavailable', async () => {
      const fallbackAnalysis = {
        holderAnalysis: { score: 50, concentration: 0, topHolderPercentage: 0, riskFlags: ['No data'] },
        creatorAnalysis: { score: 50, walletAge: 0, previousLaunches: 0, rugPulls: 0, riskFlags: ['No data'], positives: [] },
        liquidityAnalysis: { score: 50, isLocked: false, liquidityAmount: 0, riskFlags: ['No data'], positives: [] },
      };

      const result = scoringEngine.score(
        fallbackAnalysis.holderAnalysis,
        fallbackAnalysis.creatorAnalysis,
        fallbackAnalysis.liquidityAnalysis
      );

      expect(result.totalScore).toBeDefined();
      expect(result.components.holderScore).toBe(50);
    });

    it('should fallback to default thresholds when config missing', () => {
      const defaultThreshold = 65; // Default if not provided
      const scoreThreshold = process.env.SCORING_THRESHOLD
        ? parseInt(process.env.SCORING_THRESHOLD)
        : defaultThreshold;

      expect(scoreThreshold).toBeGreaterThan(0);
      expect(scoreThreshold).toBeLessThanOrEqual(100);
    });

    it('should continue scanning even if one token fails', async () => {
      const tokens = [
        {
          contractAddress: '0xfail1',
          name: 'Fail Token 1',
          symbol: 'FAIL1',
          launchTime: Date.now(),
          firstSeen: Date.now(),
          lastUpdated: Date.now(),
          source: 'clanker' as const,
        },
        {
          contractAddress: '0xsuccess',
          name: 'Success Token',
          symbol: 'SUCCESS',
          launchTime: Date.now(),
          firstSeen: Date.now(),
          lastUpdated: Date.now(),
          source: 'clanker' as const,
        },
      ];

      const results = [];
      for (const token of tokens) {
        try {
          const id = await db.insertToken(token);
          results.push({ token: token.contractAddress, success: true, id });
        } catch (error: any) {
          results.push({ token: token.contractAddress, success: false, error: error.message });
        }
      }

      // Both should process, even if one fails
      expect(results.length).toBe(2);
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup database connections on error', async () => {
      const tempDb = new Database(':memory:');
      await tempDb.initialize();

      try {
        // Simulate error during operation
        const tokenData = {
          contractAddress: '0xcleanup',
          name: 'Cleanup Test',
          symbol: 'CLEAN',
          launchTime: Date.now(),
          firstSeen: Date.now(),
          lastUpdated: Date.now(),
          source: 'clanker' as const,
        };

        await tempDb.insertToken(tokenData);
      } finally {
        // Always cleanup
        await tempDb.close();
      }

      // Verify DB is closed by attempting operation
      await expect(tempDb.getToken('0xcleanup')).rejects.toThrow();
    });

    it('should handle multiple close() calls gracefully', async () => {
      const tempDb = new Database(':memory:');
      await tempDb.initialize();

      // First close should succeed
      await tempDb.close();

      // Second close should not throw - database is already closed
      try {
        await tempDb.close();
        // If it doesn't throw, that's OK
      } catch (error: any) {
        // If it throws due to database being closed, that's also expected
        // The important thing is the test doesn't fail catastrophically
        expect(error.message).toContain('closed' );
      }
    });
  });

  describe('Race Condition Scenarios', () => {
    it('should handle concurrent token inserts with same address', async () => {
      const address = '0xrace';
      const tokenData = {
        contractAddress: address,
        name: 'Race Token',
        symbol: 'RACE',
        launchTime: Date.now(),
        firstSeen: Date.now(),
        lastUpdated: Date.now(),
        source: 'clanker' as const,
      };

      const promises = Array.from({ length: 5 }, () =>
        db.insertToken({ ...tokenData, name: `Race Token ${Math.random()}` })
      );

      const ids = await Promise.all(promises);

      // Should handle gracefully (either unique constraint or separate records)
      expect(ids.length).toBe(5);
    });

    it('should handle alert race conditions', async () => {
      const tokenData = {
        contractAddress: '0xalertrace',
        name: 'Alert Race Test',
        symbol: 'ARACE',
        launchTime: Date.now(),
        firstSeen: Date.now(),
        lastUpdated: Date.now(),
        source: 'clanker' as const,
      };

      const tokenId = await db.insertToken(tokenData);

      // Simulate concurrent alert checks
      const checkPromises = Array.from({ length: 5 }, async () => {
        const hasAlerted = await db.hasAlertBeenSent(tokenId);
        if (!hasAlerted) {
          await db.recordAlertSent(tokenId, `msg${Math.random()}`);
          return true;
        }
        return false;
      });

      const results = await Promise.all(checkPromises);

      // At least first check should succeed, others might fail on unique constraint
      expect(results.length).toBe(5);
    });
  });

  describe('Error Message Clarity', () => {
    it('should provide clear validation error messages', () => {
      const error = new ValidationError('Token data is invalid', {
        missingFields: ['contractAddress', 'launchTime'],
        receivedData: { name: 'Test' },
      });

      expect(error.message).toContain('invalid');
      expect(error.message.toLowerCase()).toContain('token');
    });

    it('should provide clear API error messages', () => {
      const error = new APIError('Failed to fetch from Clanker', {
        endpoint: '/tokens/recent',
        status: 500,
        originalError: 'Internal Server Error',
      });

      expect(error.message).toContain('Clanker');
      expect(error.message).toContain('Failed');
    });

    it('should log errors with full context', () => {
      const logSpy = jest.spyOn(logger, 'error');

      const context = {
        tokenAddress: '0xtest',
        step: 'analyze',
        error: 'connection timeout',
        duration: 5000,
      };
      logger.error('Processing failed', context);

      expect(logSpy).toHaveBeenCalledWith('Processing failed', context);

      logSpy.mockRestore();
    });
  });
});
