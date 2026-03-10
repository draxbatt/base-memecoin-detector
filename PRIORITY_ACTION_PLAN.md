════════════════════════════════════════════════════════════════════════════════
                        MEMECOIN-BOT: PRIORITY ACTION PLAN
                      Immediate Tasks for Production Readiness
                              Date: 2026-03-10 06:56 UTC
════════════════════════════════════════════════════════════════════════════════

🔴 MUST DO BEFORE DEPLOYMENT (Next 3 Days)
────────────────────────────────────────────────────────────────────────────

TASK 1: Patch NPM Vulnerabilities
────────────────────────────────────────────────────────────────────────────
Severity:     🔴 CRITICAL (2 critical, 11 high vulnerabilities found)
Time Needed:  1-2 hours
Commands:
  $ npm audit
  $ npm audit fix --force
  $ npm test  # Verify nothing broke
  $ npm run build  # Verify compilation

What to watch for:
  - If npm audit fix fails, identify which package(s) conflict
  - Check CHANGELOG for any breaking changes in dependencies
  - Re-run manual test suite after patching

Success Criteria:
  ✅ npm audit shows 0 critical/high vulnerabilities
  ✅ All 77 tests still pass
  ✅ npm run build completes without errors

────────────────────────────────────────────────────────────────────────────
TASK 2: Add RPC Provider Failover Tests
────────────────────────────────────────────────────────────────────────────
Severity:     🔴 CRITICAL (8% coverage, failover untested)
Time Needed:  3-4 hours
File:         tests/rpc-provider.test.ts (expand existing)

What to Test:
  1. Provider switching on RPC error
     - Setup: 1 provider returns 500 error
     - Action: Call executeWithFallback()
     - Expect: Switches to secondary provider
     - Code:
       await provider.call(() => failingRpc.getBalance(...))
       should fallback and succeed with secondary

  2. Health check detects slow RPC
     - Setup: Primary RPC takes >5s to respond
     - Action: Health check runs
     - Expect: Marked unhealthy, skipped in next call
     - Code:
       await provider.checkHealth()
       expect(provider.healthStatus.get('alchemy')).toBe('unhealthy')

  3. Rate limiter enforces max requests/sec
     - Setup: Max 300 req/sec configured
     - Action: 300+ requests in 1000ms
     - Expect: Subsequent requests queued, no burst
     - Code:
       const start = Date.now()
       for (let i = 0; i < 350; i++) await limiter.waitIfNeeded()
       expect(Date.now() - start).toBeGreaterThan(1000)

  4. Timeout handling (30 second timeout)
     - Setup: RPC call takes 40 seconds
     - Action: executeWithFallback() with timeout
     - Expect: Rejects with timeout error after 30s
     - Code:
       await expect(
         provider.callWithTimeout(() => slowCall(), 30000)
       ).rejects.toThrow('timeout')

  5. Provider recovery (restore primary after failure)
     - Setup: Primary fails, fallback succeeds
     - Action: Primary starts working again
     - Expect: Next call prefers primary
     - Code:
       health check should re-enable primary after N successful calls

Add these to tests/rpc-provider.test.ts:

```typescript
describe('RPCProvider Failover', () => {
  it('should switch to secondary on primary error', async () => {
    const provider = new RPCProvider();
    // Mock primary to fail, secondary to succeed
    const result = await provider.executeWithFallback(
      () => primaryRpc.call(...),
      () => secondaryRpc.call(...)
    );
    expect(result).toBeDefined();
  });

  it('should enforce rate limit at boundary', async () => {
    const limiter = new RateLimiter(300);
    const start = Date.now();
    for (let i = 0; i < 350; i++) await limiter.waitIfNeeded();
    expect(Date.now() - start).toBeGreaterThan(1000);
  });

  it('should timeout RPC calls after 30s', async () => {
    const slowCall = () => new Promise(r => 
      setTimeout(r, 40000)
    );
    await expect(
      Promise.race([
        slowCall(),
        new Promise((_, r) => 
          setTimeout(() => r(new Error('timeout')), 30000)
        )
      ])
    ).rejects.toThrow('timeout');
  });

  it('should mark provider unhealthy on failure', async () => {
    // Test health check detects 5s+ latency
    // Test unhealthy provider skipped in next call
  });

  it('should recover primary provider after failure', async () => {
    // Test that primary is re-enabled after N successes
  });
});
```

Success Criteria:
  ✅ 30+ new test cases added
  ✅ RPC provider coverage: 8% → 80%
  ✅ All tests pass (77 → 110+)

────────────────────────────────────────────────────────────────────────────
TASK 3: Add Telegram Notifier Tests
────────────────────────────────────────────────────────────────────────────
Severity:     🔴 CRITICAL (12% coverage, rate limiting untested)
Time Needed:  3-4 hours
File:         tests/telegram-notifier.test.ts (new file)

What to Test:
  1. Rate limiting enforcement (prevent spam)
     - Setup: Send alert at T=0
     - Action: Try to send another alert at T=0.5s (within rate limit)
     - Expect: 2nd alert rejected/queued
     - Code:
       await notifier.sendAlert(token1)
       await expect(notifier.sendAlert(token2))
         .rejects.toThrow('rate limited')

  2. Retry logic with exponential backoff
     - Setup: Telegram API fails 3 times
     - Action: sendAlert() with retry
     - Expect: Waits 1s, 2s, 4s, 8s between retries
     - Code:
       const spy = jest.spyOn(setTimeout)
       await notifier.sendAlert(token)
       expect(spy).toHaveBeenCalledWith(expect.anything(), 1000)
       expect(spy).toHaveBeenCalledWith(expect.anything(), 2000)
       expect(spy).toHaveBeenCalledWith(expect.anything(), 4000)

  3. Deduplication (same token alerts only once)
     - Setup: Database has alert_sent record for token
     - Action: Try to send alert for same token again
     - Expect: Skipped (already sent)
     - Code:
       db.insertAlert(tokenId, ...)
       await expect(notifier.shouldAlert(tokenId)).resolves.toBe(false)

  4. Message formatting
     - Setup: Token with special chars: 🤡, ", <, >
     - Action: formatAlert()
     - Expect: Properly escaped for Markdown
     - Code:
       const msg = notifier.formatAlert(token)
       expect(msg).not.toContain('"<script>')  // should be escaped

  5. Telegram API failure handling
     - Setup: Telegram API returns 429 (rate limited)
     - Action: sendAlert()
     - Expect: Exponential backoff + eventual give up
     - Code:
       // Mock telegram API to fail N times
       await notifier.sendAlert(token)
       // Should not throw, should log warning

Add these to tests/telegram-notifier.test.ts:

```typescript
describe('TelegramNotifier', () => {
  it('should enforce rate limiting', async () => {
    const notifier = new TelegramNotifier(token, chatId);
    notifier.setRateLimitSec(5);
    
    await notifier.sendAlert(token1);
    await expect(notifier.sendAlert(token2)).rejects.toThrow('rate limited');
  });

  it('should retry with exponential backoff', async () => {
    const notifier = new TelegramNotifier(token, chatId);
    const delaySpy = jest.spyOn(global, 'setTimeout');
    
    // Mock Telegram to fail 3 times
    mockTelegramApi.failCount = 3;
    
    await notifier.sendAlert(token);
    
    expect(delaySpy).toHaveBeenCalledWith(expect.anything(), 1000);
    expect(delaySpy).toHaveBeenCalledWith(expect.anything(), 2000);
    expect(delaySpy).toHaveBeenCalledWith(expect.anything(), 4000);
  });

  it('should skip duplicate alerts', async () => {
    const notifier = new TelegramNotifier(token, chatId);
    
    // First alert
    await db.insertAlert(token.contractAddress, { alertTime: Date.now() });
    
    // Should not alert again
    const shouldAlert = await notifier.shouldAlert(token.contractAddress);
    expect(shouldAlert).toBe(false);
  });

  it('should format markdown correctly', () => {
    const notifier = new TelegramNotifier(token, chatId);
    const msg = notifier.formatAlert({
      name: 'Test<Script>',
      symbol: 'TST"',
      score: 45
    });
    
    expect(msg).toContain('Test&lt;Script&gt;');
    expect(msg).toContain('TST\\"');
  });

  it('should handle Telegram API failures gracefully', async () => {
    const notifier = new TelegramNotifier(token, chatId);
    mockTelegramApi.shouldFail = true;
    
    // Should not throw
    await notifier.sendAlert(token);
    
    // Should log warning
    expect(logger.warn).toHaveBeenCalled();
  });
});
```

Success Criteria:
  ✅ 25+ new test cases in telegram-notifier.test.ts
  ✅ Telegram notifier coverage: 12% → 80%
  ✅ All tests pass (110+ → 135+)

────────────────────────────────────────────────────────────────────────────
TASK 4: Add Timeout Wrapper to RPC Calls
────────────────────────────────────────────────────────────────────────────
Severity:     🔴 CRITICAL (No timeout = potential hanging requests)
Time Needed:  30 minutes
File:         src/utils/rpc-provider.ts

Change:
  Add this method to RPCProvider class:

```typescript
/**
 * Executes an async function with timeout protection.
 * If function takes longer than timeoutMs, rejects with timeout error.
 * 
 * @param fn - Async function to execute
 * @param timeoutMs - Timeout in milliseconds (default: 30000)
 * @returns Promise that resolves with result or rejects on timeout
 */
private async withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30_000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`RPC call timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    )
  ]);
}
```

Then wrap all ethers.js calls:

```typescript
// Before:
const balance = await contract.balanceOf(address);

// After:
const balance = await this.withTimeout(() => 
  contract.balanceOf(address)
);
```

Locations to update:
  - RPCProvider.call() (line 320+)
  - RPCProvider.getTokenInfo() (line ~340)
  - RPCProvider.getHolders() (line ~400)
  - Any other contract.* calls

Success Criteria:
  ✅ All RPC calls wrapped with 30s timeout
  ✅ Timeout error thrown if call exceeds 30s
  ✅ Existing tests still pass
  ✅ npm run build succeeds

════════════════════════════════════════════════════════════════════════════════

SHOULD DO WITHIN WEEK 1 (Production Hardening)
────────────────────────────────────────────────────────────────────────────

TASK 5: Add Database Transaction Support
────────────────────────────────────────────────────────────────────────────
Severity:     🟡 MEDIUM (Concurrent insert race condition risk)
Time Needed:  1-2 hours
File:         src/database/db.ts

Problem:
  Multiple tokens processed in parallel → concurrent inserts → SQLite locks
  Solution: Wrap insertToken + insertAnalysis in transaction

Add this method:

```typescript
async insertTokenWithAnalysisTransaction(
  token: TokenRecord,
  analysis: AnalysisRecord
): Promise<number> {
  return new Promise((resolve, reject) => {
    this.db.serialize(() => {
      this.db.run('BEGIN TRANSACTION');
      
      this.db.run(
        'INSERT INTO tokens (...) VALUES (...)',
        function(err) {
          if (err) {
            this.db.run('ROLLBACK');
            reject(err);
          }
          const tokenId = this.lastID;
          
          this.db.run(
            'INSERT INTO analyses (...) VALUES (...)',
            (err) => {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
              } else {
                this.db.run('COMMIT', (err) => {
                  if (err) reject(err);
                  resolve(tokenId);
                });
              }
            }
          );
        }
      );
    });
  });
}
```

Success Criteria:
  ✅ Related inserts happen atomically
  ✅ No partial writes on error
  ✅ All tests still pass

────────────────────────────────────────────────────────────────────────────
TASK 6: Fix TypeScript Type Safety Issue
────────────────────────────────────────────────────────────────────────────
Severity:     🟡 MEDIUM (Type safety, low impact)
Time Needed:  15 minutes
File:         src/index.ts (line 102)

Change:
  From:
    const launches: any[] = [...clankerLaunches, ...bankrLaunches];
  
  To:
    const launches: Array<ClankerToken | BankrToken> = [
      ...clankerLaunches,
      ...bankrLaunches
    ];

Then verify:
  $ npm run build  # Should have no type errors

────────────────────────────────────────────────────────────────────────────
TASK 7: Add Config Validation with Zod
────────────────────────────────────────────────────────────────────────────
Severity:     🟡 MEDIUM (Silent misconfiguration risk)
Time Needed:  45 minutes
Files:        src/config/env.ts

First, install Zod:
  $ npm install zod

Then replace src/config/env.ts with:

```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  TELEGRAM_BOT_TOKEN: z.string().min(20, 'TELEGRAM_BOT_TOKEN must be at least 20 chars'),
  TELEGRAM_CHAT_ID: z.string().min(1),
  RPC_URL: z.string().url('RPC_URL must be valid URL'),
  DATABASE_PATH: z.string().default('./bot.db'),
  SCAN_INTERVAL_MS: z.coerce.number().int().positive().default(600000),
  ALERT_THRESHOLD: z.coerce.number().int().min(0).max(100).default(65),
  TELEGRAM_RATE_LIMIT_SEC: z.coerce.number().int().positive().default(60),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const config = envSchema.parse(process.env);
```

This will:
  ✅ Fail immediately on startup if required env vars missing
  ✅ Validate numeric values (prevent SCAN_INTERVAL_MS="abc")
  ✅ Provide clear error messages for misconfiguration

────────────────────────────────────────────────────────────────────────────
TASK 8: Implement Graceful Shutdown
────────────────────────────────────────────────────────────────────────────
Severity:     🟡 MEDIUM (Data loss on forced kill)
Time Needed:  1 hour
File:         src/index.ts

Add to MemecoinBot class:

```typescript
private currentScanPromise: Promise<void> | null = null;

async stop(): Promise<void> {
  logger.info('Bot shutdown initiated');
  this.isRunning = false;

  // Stop scheduling new scans
  if (this.cronJob) {
    this.cronJob.stop();
    logger.info('Cron job stopped');
  }

  // Wait for in-flight scan to complete (max 10s)
  if (this.currentScanPromise) {
    try {
      await Promise.race([
        this.currentScanPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Scan timeout')), 10_000)
        )
      ]);
      logger.info('In-flight scan completed');
    } catch (err) {
      logger.warn('In-flight scan timeout, forcing shutdown', { error: err });
    }
  }

  // Drain message queue
  await this.telegramNotifier.drain();
  logger.info('Telegram queue drained');

  // Close database
  await this.database.close();
  logger.info('Database closed');

  logger.info('Bot shutdown complete');
}
```

Then add signal handlers in start():

```typescript
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  this.stop().catch(err => logger.error('Shutdown error', { error: err }));
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  this.stop().catch(err => logger.error('Shutdown error', { error: err }));
});
```

Success Criteria:
  ✅ On SIGTERM, bot waits for in-flight scan
  ✅ Message queue drained before exit
  ✅ Database properly closed

════════════════════════════════════════════════════════════════════════════════

NICE TO HAVE (Week 2)
────────────────────────────────────────────────────────────────────────────

TASK 9: Extract Analyzer Scoring to Base Class
  - Time: 45 min
  - Refactor: src/analyzers/base-analyzer.ts (new)
  - Eliminates: Scoring logic duplication

TASK 10: Add Memory Monitoring
  - Time: 30 min
  - Benefit: Early detection of memory leaks

TASK 11: Improve Pump Pattern Detection
  - Time: 2-3 hours
  - Enhancement: Volume spike detection, whale accumulation

TASK 12: Add E2E Integration Test
  - Time: 2 hours
  - Benefit: Full bot flow validation

════════════════════════════════════════════════════════════════════════════════

✅ VERIFICATION CHECKLIST (After Each Task)
────────────────────────────────────────────────────────────────────────────

After TASK 1 (npm audit):
  ☐ npm audit shows 0 critical/high
  ☐ npm test passes (77/77)
  ☐ npm run build succeeds

After TASK 2 (RPC tests):
  ☐ tests/rpc-provider.test.ts has 30+ new tests
  ☐ npm test passes (110+/110+)
  ☐ RPC coverage: 8% → 80%

After TASK 3 (Telegram tests):
  ☐ tests/telegram-notifier.test.ts has 25+ new tests
  ☐ npm test passes (135+/135+)
  ☐ Telegram coverage: 12% → 80%

After TASK 4 (Timeouts):
  ☐ All RPC calls wrapped with 30s timeout
  ☐ npm test passes
  ☐ npm run build succeeds

After TASK 5-8 (Hardening):
  ☐ All tests pass
  ☐ Manual test suite still passes (8/8 phases)
  ☐ npm run build succeeds
  ☐ Code compiles without warnings

═══════════════════════════════════════════════════════════════════════════════

ESTIMATED TIMELINE
────────────────────────────────────────────────────────────────────────────

Day 1:
  ✓ TASK 1 (npm audit): 1-2h → CRITICAL fix
  ✓ TASK 4 (Timeouts): 0.5h → Quick safety win
  Remaining: 1-2h buffer

Day 2-3:
  ✓ TASK 2 (RPC tests): 3-4h → Biggest gap
  ✓ TASK 3 (Telegram tests): 3-4h → 2nd biggest gap
  Remaining: 2-3h for TASK 5-8

Day 4:
  ✓ TASK 5 (Transactions): 1-2h
  ✓ TASK 6 (Type fix): 0.25h
  ✓ TASK 7 (Config validation): 0.75h
  ✓ TASK 8 (Graceful shutdown): 1h
  Total: 3-4h

TOTAL TIME: 15-20 hours → PRODUCTION READY by end of Week 1

════════════════════════════════════════════════════════════════════════════════
Generated: 2026-03-10 06:56 UTC (Europe/Paris)
For: Drix (memecoin-bot-project development)
Status: Ready for immediate execution
════════════════════════════════════════════════════════════════════════════════
