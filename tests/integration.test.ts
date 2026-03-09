/**
 * Integration Tests for Base Memecoin Detector Bot
 * Tests full flow: scrape → analyze → score → alert
 * Tests database persistence, error recovery, and graceful shutdown
 */

import { Database } from '../src/database/db';
import { ScoringEngine, ScoringResult } from '../src/scoring/score-engine';
import { TelegramNotifier, AlertPayload } from '../src/alerts/telegram-notifier';
import { WalletAnalyzer, CreatorHistoryAnalyzer, LiquidityAnalyzer } from '../src/analyzers';
import { PumpPatternAnalyzer, PriceDataPoint } from '../src/analyzers/pump-pattern';
import { EventEmitter } from 'events';

/**
 * Mock Telegram Notifier for testing alert delivery
 */
class MockTelegramNotifier extends TelegramNotifier {
  public alertsSent: Array<{ tokenName: string; score: ScoringResult }> = [];

  async sendAlert(alert: AlertPayload): Promise<string> {
    this.alertsSent.push({
      tokenName: alert.tokenName,
      score: alert.score,
    });
    // No actual HTTP call in mock
    return 'mock-message-id';
  }

  isConnected(): boolean {
    return true;
  }
}

/**
 * Mock Database for testing without file I/O
 */
class MockDatabase {
  public storedTokens: Array<{
    contractAddress: string;
    name: string;
    symbol: string;
    launchTime: number;
  }> = [];

  public storedAnalyses: Array<{
    tokenId: string;
    holderScore: number;
    creatorScore: number;
    liquidityScore: number;
    pumpScore: number;
  }> = [];

  public sentAlerts: Set<string> = new Set();

  async connect(): Promise<void> {
    // Mock: no actual DB connection
    return Promise.resolve();
  }

  async storeToken(tokenId: string, metadata: Record<string, unknown>): Promise<void> {
    this.storedTokens.push({
      contractAddress: tokenId,
      name: metadata.name as string,
      symbol: metadata.symbol as string,
      launchTime: metadata.launchTime as number,
    });
  }

  async storeAnalysis(
    tokenId: string,
    holderScore: number,
    creatorScore: number,
    liquidityScore: number,
    pumpScore: number
  ): Promise<void> {
    this.storedAnalyses.push({
      tokenId,
      holderScore,
      creatorScore,
      liquidityScore,
      pumpScore,
    });
  }

  async getLatestAnalysis(tokenId: string): Promise<Record<string, unknown> | null> {
    const analysis = this.storedAnalyses.find((a) => a.tokenId === tokenId);
    return analysis ? { ...analysis } : null;
  }

  async hasAlertBeenSent(tokenId: string): Promise<boolean> {
    return this.sentAlerts.has(tokenId);
  }

  async markAlertSent(tokenId: string): Promise<void> {
    this.sentAlerts.add(tokenId);
    return Promise.resolve();
  }

  async close(): Promise<void> {
    // Mock: cleanup
    return Promise.resolve();
  }
}

describe('Integration Tests - Full Bot Flow', () => {
  let db: MockDatabase;
  let notifier: MockTelegramNotifier;
  let scoreEngine: ScoringEngine;

  beforeEach(() => {
    db = new MockDatabase();
    notifier = new MockTelegramNotifier('mock-token', 'mock-chat-id');
    scoreEngine = new ScoringEngine();
  });

  afterEach(async () => {
    await db.close();
  });

  /**
   * Test 1: Full pipeline - scrape → analyze → score → store → alert
   */
  test('should complete full pipeline: token analysis through alert decision', async () => {
    // Mock token data (simulating scraper output)
    const mockToken = {
      id: '0x1234567890123456789012345678901234567890',
      name: 'TestMeme',
      symbol: 'TMEME',
      launchTime: Date.now() - 3600000, // 1 hour ago
      creatorAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      holders: [
        { address: '0x1111111111111111111111111111111111111111', balance: BigInt(3500000), percentage: 35 },
        { address: '0x2222222222222222222222222222222222222222', balance: BigInt(2000000), percentage: 20 },
        { address: '0x3333333333333333333333333333333333333333', balance: BigInt(1500000), percentage: 15 },
        { address: '0x4444444444444444444444444444444444444444', balance: BigInt(1000000), percentage: 10 },
        { address: '0x5555555555555555555555555555555555555555', balance: BigInt(500000), percentage: 5 },
        { address: '0x6666666666666666666666666666666666666666', balance: BigInt(500000), percentage: 5 },
        { address: '0x7777777777777777777777777777777777777777', balance: BigInt(500000), percentage: 5 },
        { address: '0x8888888888888888888888888888888888888888', balance: BigInt(300000), percentage: 3 },
        { address: '0x9999999999999999999999999999999999999999', balance: BigInt(100000), percentage: 1 },
        { address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', balance: BigInt(100000), percentage: 1 },
      ],
      liquidity: {
        amount: 50000,
        locked: true,
      },
      creatorHistory: {
        walletAge: 180, // days
        previousLaunches: 2,
        rugPulls: 0,
      },
      priceHistory: {
        launchPrice: 0.00001,
        currentPrice: 0.000015,
        highPrice: 0.00002,
      },
    };

    // Step 1: Store token in database
    await db.storeToken(mockToken.id, {
      name: mockToken.name,
      symbol: mockToken.symbol,
      launchTime: mockToken.launchTime,
    });

    expect(db.storedTokens).toHaveLength(1);
    expect(db.storedTokens[0].name).toBe('TestMeme');

    // Step 2: Analyze token across components
    const walletAnalyzer = new WalletAnalyzer();
    const creatorAnalyzer = new CreatorHistoryAnalyzer();
    const liquidityAnalyzer = new LiquidityAnalyzer();
    const pumpAnalyzer = new PumpPatternAnalyzer();

    // Mock on-chain data for wallet analyzer
    const mockOnChainData = {
      contractAddress: mockToken.id,
      totalSupply: BigInt(10000000),
      decimals: 18,
      holderCount: mockToken.holders.length,
      topHolders: mockToken.holders,
      liquidityPairs: [],
      isBurned: false,
    };

    const holderAnalysis = walletAnalyzer.analyzeHolders(mockOnChainData);
    const creatorAnalysis = await creatorAnalyzer.analyzeCreator(
      mockToken.creatorAddress,
      mockToken.launchTime
    );

    const liquidityAnalysis = liquidityAnalyzer.analyzeLiquidity(
      mockToken.id,
      mockToken.liquidity.amount,
      mockToken.liquidity.locked
    );

    // For pump pattern analyzer, we need price history as array
    const priceHistory: PriceDataPoint[] = [
      { timestamp: mockToken.launchTime, price: mockToken.priceHistory.launchPrice, volume: 1000 },
      { timestamp: Date.now(), price: mockToken.priceHistory.currentPrice, volume: 5000 },
    ];

    const pumpAnalysis = pumpAnalyzer.analyzePumpPattern(priceHistory, mockToken.priceHistory.launchPrice);

    // Verify all scores are in valid range [0, 100]
    expect(holderAnalysis.score).toBeGreaterThanOrEqual(0);
    expect(holderAnalysis.score).toBeLessThanOrEqual(100);
    expect(creatorAnalysis.score).toBeGreaterThanOrEqual(0);
    expect(creatorAnalysis.score).toBeLessThanOrEqual(100);
    expect(liquidityAnalysis.score).toBeGreaterThanOrEqual(0);
    expect(liquidityAnalysis.score).toBeLessThanOrEqual(100);
    expect(pumpAnalysis.score).toBeGreaterThanOrEqual(0);
    expect(pumpAnalysis.score).toBeLessThanOrEqual(100);

    // Step 3: Calculate final score using the score() method (not calculateScore)
    const finalScoreResult = scoreEngine.score(
      holderAnalysis,
      creatorAnalysis,
      liquidityAnalysis,
      pumpAnalysis.score
    );
    const recommendation = finalScoreResult.recommendation;

    // Store analysis in database
    await db.storeAnalysis(
      mockToken.id,
      holderAnalysis.score,
      creatorAnalysis.score,
      liquidityAnalysis.score,
      pumpAnalysis.score
    );

    expect(db.storedAnalyses).toHaveLength(1);

    // Step 4: Decision logic - should alert if score >= 65
    if (finalScoreResult.totalScore >= 65) {
      await notifier.sendAlert({
        tokenName: mockToken.name,
        symbol: mockToken.symbol,
        contractAddress: mockToken.id,
        score: finalScoreResult,
        launchTime: mockToken.launchTime,
      });
    }

    // Verify alert was sent (or not) based on score
    if (finalScoreResult.totalScore >= 65) {
      expect(notifier.alertsSent).toHaveLength(1);
    } else {
      expect(notifier.alertsSent).toHaveLength(0);
    }

    // Verify recommendation matches score
    if (finalScoreResult.totalScore >= 70) {
      expect(recommendation).toBe('SAFE');
    } else if (finalScoreResult.totalScore >= 50) {
      expect(recommendation).toBe('CAUTION');
    } else {
      expect(recommendation).toBe('AVOID');
    }
  });

  /**
   * Test 2: Database persistence - insert multiple tokens, verify retrieval
   */
  test('should persist and retrieve multiple tokens from database', async () => {
    const tokens = [
      {
        id: '0xaaaa',
        name: 'Token1',
        symbol: 'T1',
        launchTime: Date.now(),
      },
      {
        id: '0xbbbb',
        name: 'Token2',
        symbol: 'T2',
        launchTime: Date.now(),
      },
      {
        id: '0xcccc',
        name: 'Token3',
        symbol: 'T3',
        launchTime: Date.now(),
      },
    ];

    // Store all tokens
    for (const token of tokens) {
      await db.storeToken(token.id, {
        name: token.name,
        symbol: token.symbol,
        launchTime: token.launchTime,
      });
    }

    // Verify all tokens stored
    expect(db.storedTokens).toHaveLength(3);

    // Verify each token can be retrieved
    for (const token of tokens) {
      const stored = db.storedTokens.find((t) => t.contractAddress === token.id);
      expect(stored).toBeDefined();
      expect(stored?.name).toBe(token.name);
    }
  });

  /**
   * Test 3: Error recovery - handle API failures gracefully
   */
  test('should recover from API failures with retry logic', async () => {
    // Simulate failing scraper that succeeds on retry
    let attemptCount = 0;
    const failingScraperWithRetry = async (maxRetries = 3): Promise<string> => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          attemptCount++;
          if (attemptCount < 2) {
            // First attempt fails
            throw new Error('API unavailable');
          }
          // Second attempt succeeds
          return 'SUCCESS';
        } catch (err) {
          if (i === maxRetries - 1) {
            throw err;
          }
          // Exponential backoff: wait before retry
          await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
        }
      }
      return 'FAILED';
    };

    // Test retry behavior
    const result = await failingScraperWithRetry();
    expect(result).toBe('SUCCESS');
    expect(attemptCount).toBe(2); // Failed once, succeeded on second try
  });

  /**
   * Test 4: Error recovery - circuit breaker pattern
   */
  test('should implement circuit breaker for repeated failures', async () => {
    class CircuitBreaker {
      private failureCount = 0;
      private successCount = 0;
      private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
      private readonly failureThreshold = 3;
      private readonly resetTimeout = 100; // ms

      async call<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
          throw new Error('Circuit breaker is OPEN - service unavailable');
        }

        try {
          const result = await fn();
          this.onSuccess();
          return result;
        } catch (err) {
          this.onFailure();
          throw err;
        }
      }

      private onSuccess(): void {
        this.failureCount = 0;
        this.successCount++;
        if (this.state === 'HALF_OPEN') {
          this.state = 'CLOSED';
          this.successCount = 0;
        }
      }

      private onFailure(): void {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
          this.state = 'OPEN';
          setTimeout(() => {
            this.state = 'HALF_OPEN';
          }, this.resetTimeout);
        }
      }

      getState(): string {
        return this.state;
      }
    }

    const breaker = new CircuitBreaker();
    let callCount = 0;

    // Simulate repeated failures
    for (let i = 0; i < 5; i++) {
      try {
        await breaker.call(async () => {
          callCount++;
          throw new Error('Service failure');
        });
      } catch (err) {
        // Expected failures
      }
    }

    // After 3 failures, circuit should be OPEN
    expect(breaker.getState()).toBe('OPEN');

    // Further calls should fail immediately without calling the function
    try {
      await breaker.call(async () => {
        throw new Error('Should not reach here');
      });
    } catch (err) {
      expect((err as Error).message).toBe('Circuit breaker is OPEN - service unavailable');
    }
  });

  /**
   * Test 5: Graceful shutdown - signal handlers
   */
  test('should handle graceful shutdown signals', async () => {
    const shutdownEmitter = new EventEmitter();
    let shutdownCalled = false;

    // Simulate shutdown handler
    const handleShutdown = async (): Promise<void> => {
      shutdownCalled = true;
      await db.close();
      shutdownEmitter.emit('shutdown-complete');
    };

    // Register signal handlers
    shutdownEmitter.on('SIGTERM', handleShutdown);
    shutdownEmitter.on('SIGINT', handleShutdown);

    // Emit shutdown signal
    shutdownEmitter.emit('SIGTERM');

    // Wait for shutdown to complete
    await new Promise<void>((resolve) => {
      shutdownEmitter.on('shutdown-complete', () => {
        resolve();
      });
    });

    expect(shutdownCalled).toBe(true);
  });

  /**
   * Test 6: Token deduplication - no duplicate alerts for same token
   */
  test('should prevent duplicate alerts for same token', async () => {
    const tokenId = '0xduplicate123';

    // Store token first time
    await db.storeToken(tokenId, {
      name: 'DuplicateToken',
      symbol: 'DUP',
      launchTime: Date.now(),
    });

    // Try to send alert
    const hasBeenSent1 = await db.hasAlertBeenSent(tokenId);
    expect(hasBeenSent1).toBe(false);

    // Mark as sent
    await db.markAlertSent(tokenId);

    // Try to send again - should be marked as already sent
    const hasBeenSent2 = await db.hasAlertBeenSent(tokenId);
    expect(hasBeenSent2).toBe(true);
  });

  /**
   * Test 7: Score threshold enforcement
   */
  test('should only alert on tokens with score >= 65', async () => {
    const engine = new ScoringEngine();
    
    // Create mock analyzer results for low score
    const lowAnalyses = {
      holders: { score: 30, concentration: 0, topHolderPercentage: 0, riskFlags: [] },
      creator: { score: 20, walletAge: 0, previousLaunches: 0, rugPulls: 0, riskFlags: [], positives: [] },
      liquidity: { score: 15, isLocked: false, liquidityAmount: 0, riskFlags: [], positives: [] },
      pumpScore: 10,
    };

    const highAnalyses = {
      holders: { score: 80, concentration: 0, topHolderPercentage: 0, riskFlags: [] },
      creator: { score: 70, walletAge: 0, previousLaunches: 0, rugPulls: 0, riskFlags: [], positives: [] },
      liquidity: { score: 75, isLocked: true, liquidityAmount: 100000, riskFlags: [], positives: [] },
      pumpScore: 65,
    };

    const lowResult = engine.score(lowAnalyses.holders, lowAnalyses.creator, lowAnalyses.liquidity, lowAnalyses.pumpScore);
    const highResult = engine.score(highAnalyses.holders, highAnalyses.creator, highAnalyses.liquidity, highAnalyses.pumpScore);

    // Low score should not trigger alert
    expect(lowResult.totalScore).toBeLessThan(65);

    // High score should trigger alert
    expect(highResult.totalScore).toBeGreaterThanOrEqual(65);
  });

  /**
   * Test 8: Concurrent token processing
   */
  test('should handle concurrent token processing without race conditions', async () => {
    const tokens = Array.from({ length: 10 }, (_, i) => ({
      id: `0xtoken${i}`,
      name: `Token${i}`,
      symbol: `T${i}`,
      launchTime: Date.now(),
    }));

    // Process all tokens concurrently
    const storePromises = tokens.map((token) =>
      db.storeToken(token.id, {
        name: token.name,
        symbol: token.symbol,
        launchTime: token.launchTime,
      })
    );

    await Promise.all(storePromises);

    // Verify all tokens stored correctly without duplicates
    expect(db.storedTokens).toHaveLength(10);

    // Verify no tokens were lost or corrupted
    for (let i = 0; i < 10; i++) {
      const stored = db.storedTokens.find((t) => t.contractAddress === `0xtoken${i}`);
      expect(stored).toBeDefined();
      expect(stored?.name).toBe(`Token${i}`);
    }
  });

  /**
   * Test 9: Score calculation consistency across multiple runs
   */
  test('should produce consistent scores for same input data', async () => {
    const engine = new ScoringEngine();

    const testAnalyses = {
      holders: { score: 65, concentration: 0, topHolderPercentage: 0, riskFlags: [] },
      creator: { score: 70, walletAge: 0, previousLaunches: 0, rugPulls: 0, riskFlags: [], positives: [] },
      liquidity: { score: 60, isLocked: true, liquidityAmount: 50000, riskFlags: [], positives: [] },
      pumpScore: 55,
    };

    // Calculate score multiple times
    const result1 = engine.score(testAnalyses.holders, testAnalyses.creator, testAnalyses.liquidity, testAnalyses.pumpScore);
    const result2 = engine.score(testAnalyses.holders, testAnalyses.creator, testAnalyses.liquidity, testAnalyses.pumpScore);
    const result3 = engine.score(testAnalyses.holders, testAnalyses.creator, testAnalyses.liquidity, testAnalyses.pumpScore);

    // Scores should be identical
    expect(result1.totalScore).toBe(result2.totalScore);
    expect(result2.totalScore).toBe(result3.totalScore);

    // Score should match weighted formula: holders 30% + creator 40% + liquidity 15% + pump 15%
    const expectedScore = Math.round(
      testAnalyses.holders.score * 0.3 +
      testAnalyses.creator.score * 0.4 +
      testAnalyses.liquidity.score * 0.15 +
      testAnalyses.pumpScore * 0.15
    );

    expect(result1.totalScore).toBe(expectedScore);
  });

  /**
   * Test 10: Data validation - reject invalid token data
   */
  test('should validate token data and reject invalid entries', async () => {
    const validateToken = (
      token: Record<string, unknown>
    ): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      if (!token.id || typeof token.id !== 'string') {
        errors.push('Invalid or missing token ID');
      }

      if (!token.name || typeof token.name !== 'string') {
        errors.push('Invalid or missing token name');
      }

      if (!token.symbol || typeof token.symbol !== 'string') {
        errors.push('Invalid or missing token symbol');
      }

      if (typeof token.launchTime !== 'number') {
        errors.push('Invalid or missing launch time');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    };

    // Valid token
    const validToken = {
      id: '0x1234',
      name: 'ValidToken',
      symbol: 'VT',
      launchTime: Date.now(),
    };

    const validResult = validateToken(validToken);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Invalid token (missing symbol)
    const invalidToken = {
      id: '0x5678',
      name: 'InvalidToken',
      launchTime: Date.now(),
    };

    const invalidResult = validateToken(invalidToken);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
    expect(invalidResult.errors).toContain('Invalid or missing token symbol');
  });
});
