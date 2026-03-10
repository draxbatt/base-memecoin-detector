# 🔧 AUDIT FIXES TODO — Professional Coder Sprint

**Generated:** 2026-03-10 08:25 GMT+1  
**Source:** CODE_AUDIT_PROFESSIONAL_2026-03-10.md  
**Assigned to:** professional-coder-fixer (subagent)  
**Deadline:** 10-11 hours total  
**Status:** 🟢 READY TO START

---

## 🔴 CRITICAL ISSUES (BLOCKING DEPLOYMENT)

### ISSUE #1: Analyzer Stubs Non-Functional
**File:** `src/analyzers/liquidity.ts`, `src/analyzers/creator-history.ts`  
**Problem:** Both files contain stub classes named `Service` instead of proper analyzer implementations  
**Impact:** Bot crashes on startup with `TypeError: this.creatorAnalyzer is not a function`  
**Requirement:** Must match exports in `src/analyzers/index.ts`

**Checklist:**
- [ ] Read `src/analyzers/index.ts` to understand expected interfaces (CreatorAnalysis, HolderAnalysis)
- [ ] Fix `src/analyzers/creator-history.ts`:
  - [ ] Rename class from `Service` to `CreatorHistoryAnalyzer`
  - [ ] Implement `analyze(creatorAddress: string): Promise<CreatorAnalysis>`
  - [ ] Add wallet age calculation logic
  - [ ] Add previous launch detection
  - [ ] Add rug pull history tracking
  - [ ] Return proper CreatorAnalysis interface with score, riskFlags, positives
  - [ ] Add unit tests (5-10 test cases)
- [ ] Fix `src/analyzers/liquidity.ts`:
  - [ ] Rename class from `Service` to `LiquidityAnalyzer`
  - [ ] Implement `analyze(liquidityData: any): Promise<LiquidityAnalysis>`
  - [ ] Add lock status verification
  - [ ] Add liquidity amount thresholds
  - [ ] Return proper LiquidityAnalysis interface
  - [ ] Add unit tests (5-10 test cases)
- [ ] Run `npm test` — all tests must pass
- [ ] Verify bot instantiation works: `const bot = new MemecoinBot()`

**Time Estimate:** 2-3 hours  
**Priority:** 🔴 CRITICAL

---

### ISSUE #2: BankrScraper Missing Implementation
**File:** `src/scrapers/bankr.ts`  
**Problem:** Missing `fetchLatestLaunches()` method, bot calls it and crashes  
**Current Issues:**
- Uses `console.error` instead of logger
- No retry logic or rate limiting
- Incomplete implementation

**Checklist:**
- [ ] Review `src/scrapers/clanker.ts` for reference implementation
- [ ] Implement `BankrScraper` class with:
  - [ ] `constructor(apiUrl: string)` 
  - [ ] `fetchLatestLaunches(): Promise<BankrToken[]>` method
  - [ ] Retry logic (3 retries, exponential backoff: 1s, 2s, 4s)
  - [ ] Rate limiting (100 req/min)
  - [ ] Error handling with logger (not console.error)
  - [ ] Proper TypeScript typing
  - [ ] JSDoc comments on all public methods
- [ ] Add unit tests for:
  - [ ] Successful fetch
  - [ ] API failure + retry
  - [ ] Rate limit handling
  - [ ] Response parsing
- [ ] Run `npm test` — ensure integration tests pass

**Time Estimate:** 1.5 hours  
**Priority:** 🔴 CRITICAL

---

### ISSUE #3: Zero Test Coverage for Error Paths
**Problem:** Critical paths have NO test coverage
- [ ] RPC failover logic (never tested)
- [ ] Telegram alert failures (never tested)
- [ ] Database concurrency (never tested)

**Checklist:**
- [ ] Create `tests/error-handling.test.ts` with 20+ tests:
  - [ ] RPC failover: primary fails → fallback works
  - [ ] RPC timeout: request times out → handled gracefully
  - [ ] Telegram send failure: API error → queued or logged
  - [ ] Database lock: concurrent writes handled
  - [ ] Analyzer error: scoring continues despite failure
  - [ ] BankrScraper failure: bot continues with Clanker data
  - [ ] Invalid token data: bot validates and rejects
  - [ ] Missing env vars: bot fails with clear message
- [ ] Create `tests/integration-error.test.ts` with 15+ integration tests:
  - [ ] Full pipeline with RPC failure mid-stream
  - [ ] Telegram down during alert
  - [ ] Database locked during analysis save
  - [ ] Rate limit hit on Clanker API
  - [ ] Partial token data from multiple sources
- [ ] Run `npm run test:coverage` — ensure error path coverage >80%
- [ ] Document all error scenarios in ARCHITECTURE.md

**Time Estimate:** 4 hours  
**Priority:** 🔴 CRITICAL

---

## 🟡 HIGH PRIORITY ISSUES

### ISSUE #4: RPC Holder Data Missing
**File:** `src/scrapers/rpc.ts`  
**Problem:** `getTopHolders()` always returns `[]` (empty array)  
**Impact:** All tokens score 50 (neutral) on holder analysis — no discrimination

**Checklist:**
- [ ] Implement real holder data fetching:
  - [ ] Option A: Use Basescan/Etherscan API (free tier available)
  - [ ] Option B: Query RPC directly with `eth_getLogs()` for Transfer events
  - [ ] Option C: Use Covalent API (if API key available)
- [ ] Add to config: `ETHERSCAN_API_KEY` (environment variable)
- [ ] Update `src/config/env.ts` to load ETHERSCAN_API_KEY
- [ ] Implement with caching (1-hour TTL) to avoid rate limits
- [ ] Add error handling (if API fails, return empty array + log)
- [ ] Add unit tests (5 test cases)
- [ ] Update .env.example with ETHERSCAN_API_KEY

**Time Estimate:** 2 hours  
**Priority:** 🟡 HIGH

---

### ISSUE #5: WalletAnalyzer Constructor Mismatch
**File:** `src/analyzers/index.ts` (line ~50)  
**Problem:** WalletAnalyzer constructor requires `provider` but bot doesn't pass it  
**Quick Fix:** 5 minutes

**Checklist:**
- [ ] Review WalletAnalyzer constructor signature
- [ ] Fix `src/index.ts` line where WalletAnalyzer is instantiated
- [ ] Pass provider if needed, or remove provider dependency
- [ ] Run `npm test` to verify

**Time Estimate:** 5 minutes  
**Priority:** 🟡 HIGH

---

### ISSUE #6: ESLint Configuration Missing
**File:** `.eslintrc.json` (missing or incomplete)  
**Problem:** `npm run lint` fails

**Checklist:**
- [ ] Verify `.eslintrc.json` exists
- [ ] If missing, create with standard TypeScript/ESLint rules:
  - [ ] No `console.log` (use logger)
  - [ ] No `any` types
  - [ ] No unused variables
  - [ ] Enforce camelCase naming
  - [ ] Enforce const > let > var
- [ ] Update `package.json` scripts:
  - [ ] `"lint": "eslint src tests --ext .ts"`
  - [ ] `"lint:fix": "eslint src tests --ext .ts --fix"`
- [ ] Run `npm run lint` — ensure it passes
- [ ] Fix any violations (convert `console.*` to logger, etc)

**Time Estimate:** 10 minutes  
**Priority:** 🟡 HIGH

---

### ISSUE #7: Environment Validation Incomplete
**File:** `src/config/env.ts`  
**Problem:** Missing required env var checks (BASESCAN_API_KEY)

**Checklist:**
- [ ] Review all env vars needed:
  - [ ] CLANKER_API_URL
  - [ ] BANKR_API_URL
  - [ ] BASE_RPC_URL
  - [ ] TELEGRAM_BOT_TOKEN
  - [ ] TELEGRAM_CHAT_ID
  - [ ] ETHERSCAN_API_KEY (newly added)
  - [ ] DATABASE_PATH
- [ ] Add validation in `src/config/env.ts`:
  ```typescript
  if (!process.env.ETHERSCAN_API_KEY) {
    throw new Error('ETHERSCAN_API_KEY is required');
  }
  ```
- [ ] Update `.env.example` with all required vars
- [ ] Update README.md with complete env var list
- [ ] Test startup without env vars — should fail with clear message

**Time Estimate:** 10 minutes  
**Priority:** 🟡 HIGH

---

## 🟢 MEDIUM PRIORITY ISSUES

### ISSUE #8: Add Health Check Endpoint
**New Feature:** Internal health check for monitoring  
**Benefit:** Enables uptime monitoring, circuit breaker

**Checklist:**
- [ ] Create `src/utils/health.ts`:
  - [ ] `getHealthStatus(): HealthStatus`
  - [ ] Check RPC connectivity
  - [ ] Check Telegram connectivity
  - [ ] Check Database connectivity
  - [ ] Return { status: 'ok'|'degraded'|'down', checks: {...} }
- [ ] Add tests (3 test cases)

**Time Estimate:** 45 minutes  
**Priority:** 🟢 MEDIUM

---

### ISSUE #9: Circuit Breaker for Failed APIs
**New Feature:** Prevent cascading failures when APIs are down  
**Benefit:** Graceful degradation

**Checklist:**
- [ ] Implement circuit breaker pattern
- [ ] Config: 5 failures → trip, 30 sec → half-open, 10 success → reset
- [ ] Apply to: Clanker API, Bankr API, RPC, Telegram, Etherscan

**Time Estimate:** 1.5 hours  
**Priority:** 🟢 MEDIUM

---

### ISSUE #10: Add Metrics Collection
**New Feature:** Track performance metrics  
**Benefit:** Identify bottlenecks

**Checklist:**
- [ ] Track: token analyses/min, avg scoring time, RPC latency, alert delivery time
- [ ] Output to logs every 30 min
- [ ] Add unit tests (3 test cases)

**Time Estimate:** 1 hour  
**Priority:** 🟢 MEDIUM

---

## 📋 COMPLETION CHECKLIST

- [ ] All CRITICAL issues fixed (3 items)
- [ ] All HIGH issues fixed (4 items)
- [ ] All MEDIUM issues fixed (3 items)
- [ ] `npm test` passes (all tests)
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes (0 warnings)
- [ ] Code coverage >80%
- [ ] README.md updated with new config
- [ ] ARCHITECTURE.md updated with changes
- [ ] All commits pushed to feature/phase3-core-dev
- [ ] Bot starts without errors: `node dist/index.js`

---

## 📊 TIME BREAKDOWN

| Issue | Time |
|-------|------|
| CRITICAL #1: Analyzer stubs | 2-3h |
| CRITICAL #2: BankrScraper | 1.5h |
| CRITICAL #3: Error tests | 4h |
| HIGH #4: RPC holders | 2h |
| HIGH #5: WalletAnalyzer fix | 5m |
| HIGH #6: ESLint | 10m |
| HIGH #7: Env validation | 10m |
| MEDIUM: Health check | 45m |
| MEDIUM: Circuit breaker | 1.5h |
| MEDIUM: Metrics | 1h |
| **TOTAL** | **~14 hours** |

**Recommended Approach:** Start with CRITICAL issues (7.5h), then HIGH (4.5h), then MEDIUM if time permits (3h).

---

**Status:** Ready for professional-coder-fixer to begin. Take your time. Quality > Speed.
