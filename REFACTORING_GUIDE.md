# REFACTORING CHECKLIST & IMPLEMENTATION GUIDE

**Priority:** CRITICAL → HIGH → MEDIUM  
**Target Completion:** 2 sprints (next 2 weeks)

---

## 🔴 CRITICAL (Before Production) — 4-6 hours

### Task 1: RPC Provider Failover Tests ⏱️ 2-3h
**File:** `tests/rpc-provider.test.ts`  
**Current Coverage:** 8.33%  
**Target:** 70%+

**Add these test suites:**

```typescript
describe('RPCProvider Failover', () => {
  let provider: RPCProvider;

  beforeEach(() => {
    provider = new RPCProvider();
  });

  describe('switchActiveProvider', () => {
    it('should switch to next provider when current fails', async () => {
      // Mock getBlock() to fail on primary, succeed on secondary
      await expect(provider.getBlock('latest')).resolves.toBeDefined();
    });

    it('should throw when all providers are unhealthy', async () => {
      // Mock all providers to fail
      await expect(provider.getBlock('latest')).rejects.toThrow('No healthy provider');
    });

    it('should recover provider after temporary failure', async () => {
      // Fail, then succeed on retry
      let callCount = 0;
      jest.spyOn(provider, 'getBlock').mockImplementation(async () => {
        if (callCount++ === 0) throw new Error('Temporary failure');
        return { number: 123 };
      });
      await provider.getBlock('latest');
    });
  });

  describe('Health Check', () => {
    it('should mark provider unhealthy after 3 failures', () => {
      // Simulate 3 failed health checks
      // Verify provider is marked unhealthy
    });

    it('should reset health check after successful request', () => {
      // Fail 2 times, succeed 1 time
      // Verify health check counter resets
    });

    it('should skip recently-checked providers', async () => {
      // Provider checked <5min ago should be skipped in next check
    });
  });

  describe('Rate Limiter', () => {
    it('should queue requests when rate limit is hit', async () => {
      // Send 350 requests (>300/sec limit)
      // Verify requests are queued, not rejected
    });

    it('should reset rate limit counter per second', async () => {
      // Send 300 requests in first 500ms
      // Send 300 more in next 500ms
      // Should not be throttled since new second
    });
  });
});
```

---

### Task 2: Telegram Notifier Tests ⏱️ 2-3h
**File:** `tests/alerts.test.ts` (new)  
**Current Coverage:** 12.3%  
**Target:** 80%+

```typescript
describe('TelegramNotifier', () => {
  let notifier: TelegramNotifier;
  let mockBot: any;

  beforeEach(() => {
    mockBot = {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 123 }),
      getMe: jest.fn().mockResolvedValue({ id: 999, username: 'test_bot' }),
    };
    
    jest.mock('node-telegram-bot-api', () => mockBot);
    notifier = new TelegramNotifier('fake-token', '123456');
  });

  describe('sendAlert', () => {
    it('should send formatted alert message', async () => {
      const alert = {
        tokenName: 'TestToken',
        symbol: 'TEST',
        contractAddress: '0x123abc',
        score: { totalScore: 75, recommendation: 'SAFE', ... },
        launchTime: Date.now() - 3600000,
      };
      
      const messageId = await notifier.sendAlert(alert);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        '123456',
        expect.stringContaining('TestToken'),
        expect.objectContaining({ parse_mode: 'Markdown' })
      );
      expect(messageId).toBe('123');
    });

    it('should enforce rate limiting', async () => {
      const alert = { ... };
      await notifier.sendAlert(alert);  // First alert OK
      
      await expect(notifier.sendAlert(alert))
        .rejects.toThrow('Alert rate limited');
    });

    it('should escape special Markdown characters', async () => {
      const alert = {
        tokenName: 'Token_[Malicious]',
        symbol: '$$$EVIL',
        // ...
      };
      
      const messageId = await notifier.sendAlert(alert);
      const callArgs = mockBot.sendMessage.mock.calls[0][1];
      // Verify proper escaping
      expect(callArgs).not.toContain('_[');
    });

    it('should handle API timeout gracefully', async () => {
      mockBot.sendMessage.mockRejectedValue(new Error('timeout'));
      
      const alert = { ... };
      await expect(notifier.sendAlert(alert))
        .rejects.toThrow('Failed to send Telegram alert');
    });

    it('should handle invalid chatId', async () => {
      const badNotifier = new TelegramNotifier('token', 'invalid-id');
      const alert = { ... };
      
      await expect(badNotifier.sendAlert(alert))
        .rejects.toThrow();
    });
  });

  describe('formatAlert', () => {
    it('should format SAFE recommendation with green emoji', () => {
      const alert = {
        score: { totalScore: 75, recommendation: 'SAFE' },
        // ...
      };
      const message = notifier.formatAlert(alert);
      expect(message).toContain('🟢');
    });

    it('should format CAUTION recommendation with yellow emoji', () => {
      const alert = {
        score: { totalScore: 50, recommendation: 'CAUTION' },
        // ...
      };
      const message = notifier.formatAlert(alert);
      expect(message).toContain('🟡');
    });

    it('should include links to DexScreener and Basescan', () => {
      const alert = {
        contractAddress: '0xabc123',
        // ...
      };
      const message = notifier.formatAlert(alert);
      expect(message).toContain('dexscreener.com');
      expect(message).toContain('basescan.org');
    });

    it('should handle empty risk flags gracefully', () => {
      const alert = {
        score: { ... , riskFlags: [] },
        // ...
      };
      const message = notifier.formatAlert(alert);
      expect(message).not.toContain('🚩 Risks:');
    });
  });

  describe('testConnection', () => {
    it('should verify bot token is valid', async () => {
      mockBot.getMe.mockResolvedValue({ id: 999 });
      await expect(notifier.testConnection()).resolves.toBeUndefined();
    });

    it('should throw on invalid token', async () => {
      mockBot.getMe.mockRejectedValue(new Error('401 Unauthorized'));
      await expect(notifier.testConnection()).rejects.toThrow();
    });
  });
});
```

---

### Task 3: Fix Cron Expression Bug ⏱️ 30min
**File:** `src/index.ts` line ~67

**Current Code:**
```typescript
const cronExpression = `*/${Math.max(1, Math.floor(config.scanIntervalSeconds / 60))} * * * *`;
```

**Issue:** 119 second interval → "*/1" (every minute, not every 2 minutes)

**Fixed Code:**
```typescript
// Convert to minutes, rounding UP
const intervalMinutes = Math.ceil(config.scanIntervalSeconds / 60);
const cronExpression = `*/${intervalMinutes} * * * *`;

logger.info('Cron scheduled', { 
  intervalMinutes, 
  scanIntervalSeconds: config.scanIntervalSeconds,
  expression: cronExpression 
});
```

**Test:**
```typescript
it('should calculate cron expression correctly', () => {
  // 119 seconds → 2 minutes → "*/2 * * * *"
  expect(Math.ceil(119 / 60)).toBe(2);
  
  // 3600 seconds → 60 minutes → "*/60 * * * *"
  expect(Math.ceil(3600 / 60)).toBe(60);
});
```

---

### Task 4: Add Input Validation to Scrapers ⏱️ 1h
**File:** `src/scrapers/clanker.ts`

**Install zod:**
```bash
npm install zod
```

**Add validation:**
```typescript
import { z } from 'zod';

const ClankerTokenSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
  decimals: z.number().int().gte(0).lte(18),
  totalSupply: z.string().regex(/^\d+$/),
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  launchTime: z.number().int().positive(),
});

async fetchLatestLaunches(limit: number = 50): Promise<ClankerToken[]> {
  const response = await this.httpClient.get('/latest', { params: { limit } });
  
  // Validate before returning
  const tokens = response.data.tokens || [];
  return tokens.map(token => ClankerTokenSchema.parse(token));
}
```

---

## 🟡 HIGH PRIORITY (Next Sprint) — 10-12 hours

### Task 5: Refactor MemecoinBot.processLaunch() ⏱️ 4-5h
**File:** `src/index.ts`

**Current:**
```typescript
private async processLaunch(launch: any): Promise<void> {
  // 90+ lines: insert → fetch → analyze → score → alert
}
```

**Refactored:**
```typescript
private async processLaunch(launch: LauncherToken): Promise<void> {
  const token = await this.enrichTokenData(launch);
  const analysis = await this.analyzeToken(token);
  const score = this.scoringEngine.score(analysis);
  await this.scoreAndAlert(token, score);
}

private async enrichTokenData(launch: LauncherToken): Promise<TokenRecord> {
  const tokenId = await this.database.insertToken({
    contractAddress: launch.contractAddress,
    name: launch.name,
    symbol: launch.symbol,
    launchTime: launch.launchTime,
    firstSeenAt: Date.now(),
    lastAnalyzedAt: Date.now(),
  });

  const onChainData = await this.rpc.getTokenMetadata(launch.contractAddress);
  const isLocked = await this.rpc.checkLiquidityLock(launch.contractAddress);

  return {
    id: tokenId,
    ...launch,
    metadata: onChainData,
    isLiquidityLocked: isLocked,
  };
}

private async analyzeToken(token: TokenRecord): Promise<Analysis> {
  const holderAnalysis = this.walletAnalyzer.analyzeHolders(token.metadata);
  const creatorAnalysis = await this.creatorAnalyzer.analyzeCreator(
    token.creator,
    token.launchTime
  );
  const liquidityAnalysis = this.liquidityAnalyzer.analyzeLiquidity(
    token.contractAddress,
    token.isLiquidityLocked
  );

  return {
    tokenAddress: token.contractAddress,
    timestamp: Date.now(),
    holderAnalysis,
    creatorAnalysis,
    liquidityAnalysis,
  };
}

private async scoreAndAlert(token: TokenRecord, score: ScoringResult): Promise<void> {
  await this.database.insertAnalysis({
    tokenId: token.id,
    ...score,
    timestamp: Date.now(),
  });

  if (score.score >= config.alertThreshold) {
    const hasAlerted = await this.database.hasAlertBeenSent(token.id);
    if (!hasAlerted) {
      const messageId = await this.telegramNotifier.sendAlert({
        tokenName: token.name,
        symbol: token.symbol,
        contractAddress: token.contractAddress,
        score,
        launchTime: token.launchTime,
      });
      await this.database.recordAlertSent(token.id, messageId);
    }
  }
}
```

---

### Task 6: Split RPC Provider File ⏱️ 3-4h
**Current:** `src/utils/rpc-provider.ts` (511 LoC)  
**Split into:**

1. `src/utils/rpc-rate-limiter.ts` (~60 LoC)
```typescript
export class RateLimiter {
  private readonly maxRequestsPerSecond: number;
  private requestTimestamps: number[] = [];

  constructor(maxRequestsPerSecond: number = 300) {
    this.maxRequestsPerSecond = maxRequestsPerSecond;
  }

  async waitIfNeeded(): Promise<void> { ... }
}
```

2. `src/utils/rpc-health-check.ts` (~100 LoC)
```typescript
interface ProviderHealth {
  healthy: boolean;
  lastChecked: number;
  failureCount: number;
  lastError?: string;
}

export class ProviderHealthCheck {
  private healthMap: Map<string, ProviderHealth> = new Map();

  isHealthy(providerName: string): boolean { ... }
  recordSuccess(providerName: string): void { ... }
  recordFailure(providerName: string, error: Error): void { ... }
}
```

3. `src/utils/rpc-provider.ts` (~250 LoC, refactored)
```typescript
import { RateLimiter } from './rpc-rate-limiter';
import { ProviderHealthCheck } from './rpc-health-check';

export class RPCProvider {
  private providers: Map<string, ethers.Provider> = new Map();
  private activeProviderName: string | null = null;
  private rateLimiter: RateLimiter;
  private healthCheck: ProviderHealthCheck;

  // Orchestration only, delegates to helper classes
}
```

---

### Task 7: Extract Retry Logic ⏱️ 1-2h
**New file:** `src/utils/retry.ts`

```typescript
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  logger?: any
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (attempt < config.maxAttempts) {
        const jitter = Math.random() * 0.1 * delay;  // 10% jitter
        const waitTime = Math.min(delay + jitter, config.maxDelayMs);
        
        logger?.debug(`Retry attempt ${attempt}/${config.maxAttempts}`, {
          waitTimeMs: waitTime,
          error: error.message,
        });
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        delay *= config.backoffMultiplier;
      }
    }
  }

  throw lastError;
}
```

**Usage:**
```typescript
// Before: Duplicated in ClankerScraper + RPC
// After: Single source of truth
const tokens = await retryWithBackoff(
  () => this.httpClient.get('/latest'),
  { maxAttempts: 3, initialDelayMs: 1000, ... },
  logger
);
```

---

## 🟢 MEDIUM PRIORITY (Future) — 15+ hours

### Task 8: Add Database Indexes ⏱️ 30min
**File:** `src/database/db.ts`

```typescript
async initialize(): Promise<void> {
  // ... existing CREATE TABLE statements ...
  
  // Add indexes
  await this.run(`
    CREATE INDEX IF NOT EXISTS idx_tokens_address 
    ON tokens(contractAddress);
  `);
  
  await this.run(`
    CREATE INDEX IF NOT EXISTS idx_tokens_source_created 
    ON tokens(source, created_at DESC);
  `);
  
  await this.run(`
    CREATE INDEX IF NOT EXISTS idx_analyses_tokenId_timestamp 
    ON analyses(tokenId, timestamp DESC);
  `);
  
  logger.info('Database indexes created');
}
```

---

### Task 9: Complete Creator History Analyzer ⏱️ 8-10h
**File:** `src/analyzers/creator-history.ts`

Replace TODO with actual indexer integration:

```typescript
import axios from 'axios';

export class CreatorHistoryAnalyzer {
  private duneClient: AxiosInstance;

  async analyzeCreator(creatorAddress: string, launchTime: number): Promise<CreatorAnalysis> {
    // Query Dune Analytics or similar to fetch creator's token launches
    const launches = await this.fetchCreatorLaunches(creatorAddress);
    const rugPulls = await this.detectRugPulls(launches);

    // ... Score based on actual data, not placeholder
  }

  private async fetchCreatorLaunches(creator: string): Promise<any[]> {
    // Query Dune: SELECT * FROM tokens WHERE creator = ... ORDER BY launch_time DESC
  }

  private async detectRugPulls(tokens: any[]): Promise<number> {
    // Analyze each token: Did creator abandon? Is liquidity gone? Price crashed?
  }
}
```

---

### Task 10: Add Correlation IDs ⏱️ 2-3h
**Files:** Multiple (logger, index.ts, analyzers)

```typescript
// In src/utils/logger.ts
import crypto from 'crypto';

export interface LogContext {
  correlationId?: string;
  module: string;
  operation?: string;
}

// In src/index.ts
private async processLaunch(launch: LauncherToken): Promise<void> {
  const correlationId = crypto.randomUUID();
  
  try {
    const token = await this.enrichTokenData(launch, correlationId);
    const analysis = await this.analyzeToken(token, correlationId);
    // ...
  } catch (error) {
    logger.error('Process launch failed', {
      correlationId,
      tokenAddress: launch.contractAddress,
      error,
    });
  }
}
```

---

## 📊 Timeline Estimate

| Phase | Tasks | Hours | Week |
|-------|-------|-------|------|
| **Critical** | 1-4 | 4-6h | Week 1 |
| **High** | 5-7 | 10-12h | Week 1-2 |
| **Medium** | 8-10 | 15-20h | Week 2-3 |
| **Total** | | **30-40h** | |

---

## ✅ Validation Checklist

After implementing each task:

- [ ] All new tests pass (`npm test`)
- [ ] Coverage improved (run `npm test -- --coverage`)
- [ ] TypeScript compiles cleanly (`npm run build`)
- [ ] No lint errors (`npm run lint`)
- [ ] Code follows existing patterns
- [ ] Tests follow existing test patterns
- [ ] Updated relevant documentation

---

## 🚀 Deployment Readiness

**Requirements to deploy:**
- [ ] Task 1: RPC failover tests ✅
- [ ] Task 2: Telegram alert tests ✅
- [ ] Task 3: Cron bug fix ✅
- [ ] Task 4: Input validation ✅
- [ ] Overall test coverage ≥ 65%

**After these 4 tasks, bot is production-ready.**

---

## 📝 Notes

- Each task includes time estimate + implementation guide
- Tests show expected patterns (copy-paste friendly)
- All changes maintain backward compatibility
- No breaking changes to public APIs

