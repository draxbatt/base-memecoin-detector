# 🚨 PHASE 3 BLOCKER SCAN REPORT

**Date:** 2026-03-09 21:27 GMT+1  
**Scanned By:** improvement-bot (Subagent)  
**Project:** Base Chain Memecoin Detector Bot  
**Status:** ⚠️ 5 CRITICAL BLOCKERS IDENTIFIED

---

## Executive Summary

Scanned the entire `/home/drix/code/base-memecoin-detector` codebase and `/home/drix/.openclaw/workspace/memecoin-bot-project` documentation. **Phase 3 (Core Development) is BLOCKED by 5 critical missing implementations** that must be completed before any development can proceed.

**Current State:**
- ✅ **Configuration & Utils:** Ready (env.ts, constants.ts, logger.ts, errors.ts)
- ✅ **Scoring Algorithm:** Ready (score-engine.ts with weighted scoring)
- 🔴 **Everything else:** Stubs only (throw "Not implemented")

**Timeline Impact:** All 5 blockers must be fixed before starting Phase 3. Estimated **4-5 days with dedicated agent team**.

---

## BLOCKER #1: RPC Provider Manager ⚠️ PRIORITY 1

### Problem
No ethers.js RPC provider initialized. All analyzer modules depend on RPC data (holder distribution, creator history, liquidity, price data) and will fail immediately.

### Files Affected
- `src/utils/rpc-provider.ts` — **NOT CREATED**
- All 4 analyzer modules (`src/analyzers/*`)
- Main orchestrator (`src/index.ts`)

### Missing Implementation
```typescript
// Required functions in src/utils/rpc-provider.ts:
- createRpcProvider(primaryUrl, backupUrl): Promise<JsonRpcProvider>
- getRateLimiter(): RateLimiter (max 300 req/sec for Alchemy)
- fetchHolders(tokenCA): Promise<HolderData[]>
  * Query RPC via eth_getLogs() for Transfer events
  * Aggregate token balances
- fetchLiquidity(poolAddress): Promise<LiquidityData>
  * Query Uniswap V2/V3 pool reserves
- fetchContractMetadata(ca): Promise<{ name, symbol, decimals, supply }>
  * ERC-20 contract calls
- fetchCreatorHistory(creatorAddress): Promise<LaunchHistory[]>
  * Query for all tokens deployed by creator
```

### Impact
🔴 **BLOCKING:** All 4 analyzers, entire scoring pipeline

### Solution
Create `src/utils/rpc-provider.ts` with:
- Alchemy free tier as primary (300 req/sec, fast, reliable)
- Infura as backup (100 req/sec)
- Ankr public endpoint as fallback (100 req/sec, always available)
- ERC-20 ABI for contract calls
- Uniswap ABIs (V2 & V3) for liquidity queries
- Request batching to optimize latency
- Exponential backoff retry (3 attempts)

**Estimated Code:** 100-150 lines  
**Estimated Time:** 1-2 hours  
**Dependencies:** ethers.js (✅ already in package.json)

---

## BLOCKER #2: Clanker & Bankr API Scrapers ⚠️ PRIORITY 2

### Problem
Scrapers don't actually fetch any tokens. Both throw "Not implemented" errors.

### Files Affected
- `src/scrapers/clanker.ts` (41 lines) — fetchClankerTokens() returns error
- `src/scrapers/bankr.ts` (33 lines) — No API integration
- Main loop in `src/index.ts` — Depends on these

### Missing Implementation
```typescript
// src/scrapers/clanker.ts:
export async function fetchClankerTokens(limit = 50): Promise<ClankerToken[]> {
  // TODO: Implement axios HTTP call
  // TODO: Add retry logic (3 retries: 2s, 4s, 8s backoff)
  // TODO: Parse response schema
  // TODO: Handle rate limits (max 100/min)
  throw new Error('Not implemented');  // ← CURRENT STATE
}

// src/scrapers/bankr.ts:
export async function fetchBankrTokens(): Promise<BankrToken[]> {
  // TODO: Query RPC for Bankr factory contract events
  // TODO: Decode event logs
  // TODO: Fetch token metadata
  throw new Error('Not implemented');  // ← CURRENT STATE
}
```

### Impact
🔴 **BLOCKING:** No token discovery. Bot cannot run main loop.

### Solution
**For Clanker:**
- Use axios to fetch `https://clanker.world/api/tokens?limit=50&sort=launch_time_desc`
- Parse response: extract name, symbol, CA, creator, launch_time, liquidity_usd, market_cap_usd
- Implement retry with exponential backoff (2s, 4s, 8s)
- Rate limiter: max 100 requests/minute
- Validate schema (reject malformed tokens)

**For Bankr:**
- Query Base RPC for Bankr factory contract events (on-chain monitoring)
- Decode `TokenCreated(address indexed token, address indexed creator)` events
- Fetch token metadata from RPC
- Return same schema as Clanker (for deduplication)

**Estimated Code:** 150-200 lines (split between both)  
**Estimated Time:** 2-3 hours  
**Dependencies:** axios (✅), ethers.js (✅)

---

## BLOCKER #3: Database Layer ⚠️ PRIORITY 4

### Problem
Database module is a stub. `initDatabase()`, `upsertToken()`, `insertAnalysis()` all throw "Not implemented".

### Files Affected
- `src/database/db.ts` (118 lines) — No CRUD operations
- `src/database/schema.ts` — **NOT CREATED**
- Main loop (`src/index.ts`) — Depends on this

### Missing Implementation
```typescript
// Current state in src/database/db.ts:
export async function initDatabase(): Promise<void> {
  throw new Error('Not implemented');  // ← CURRENT STATE
}

export async function upsertToken(token: Token): Promise<number> {
  throw new Error('Not implemented');  // ← CURRENT STATE
}

export async function insertAnalysis(analysis: Analysis): Promise<number> {
  throw new Error('Not implemented');  // ← CURRENT STATE
}
```

### Impact
🔴 **BLOCKING:** No data persistence. Bot cannot track tokens or prevent duplicate alerts.

### Solution
Create `src/database/schema.ts` with SQLite DDL:
```sql
CREATE TABLE tokens (
  id INTEGER PRIMARY KEY,
  contract_address TEXT UNIQUE NOT NULL,
  name TEXT, symbol TEXT, launcher TEXT,
  launch_time DATETIME, creator_address TEXT,
  score REAL, analyzed BOOLEAN
);

CREATE TABLE analyses (
  id INTEGER PRIMARY KEY,
  token_id INTEGER NOT NULL,
  holder_score, creator_score, liquidity_score, pump_score,
  final_score REAL,
  FOREIGN KEY (token_id) REFERENCES tokens(id)
);

CREATE TABLE alerts_sent (
  id INTEGER PRIMARY KEY,
  token_id INTEGER NOT NULL,
  alert_time DATETIME,
  FOREIGN KEY (token_id) REFERENCES tokens(id)
);

CREATE TABLE creators (
  creator_address TEXT PRIMARY KEY,
  total_launches, successful_launches, rug_pulls INTEGER
);

CREATE INDEX idx_tokens_launch_time ON tokens(launch_time);
CREATE INDEX idx_tokens_score ON tokens(score DESC);
CREATE INDEX idx_analyses_token_id ON analyses(token_id);
```

Implement in `src/database/db.ts`:
- Connection pool (sqlite3 with proper initialization)
- Schema creation on startup
- CRUD operations: upsertToken, insertAnalysis, getTokenByCA, getAlertHistory
- Index creation for performance
- Transaction support for multi-step operations

**Estimated Code:** 200-300 lines  
**Estimated Time:** 3-4 hours  
**Dependencies:** sqlite3 (✅), zod for validation (✅)

---

## BLOCKER #4: Telegram Integration ⚠️ PRIORITY 3

### Problem
Telegram module is a stub. `sendTelegramAlert()` and `formatAlertMessage()` throw/return empty.

### Files Affected
- `src/alerts/telegram-notifier.ts` (48 lines) — Not implemented
- Main loop (`src/index.ts`) — Depends on this

### Missing Implementation
```typescript
// Current state:
export async function sendTelegramAlert(alert: TelegramAlert): Promise<boolean> {
  throw new Error('Not implemented');  // ← CURRENT STATE
}

export function formatAlertMessage(alert: TelegramAlert): string {
  return '';  // ← CURRENT STATE (returns empty string)
}
```

### Impact
🔴 **BLOCKING:** Alerts never reach Drix. Cannot validate scoring algorithm.

### Solution
Implement TelegramBot initialization and message sending:

```typescript
// In src/alerts/telegram-notifier.ts:
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

export async function sendTelegramAlert(alert: TelegramAlert): Promise<boolean> {
  // 1. Format message using formatAlertMessage()
  // 2. Send via bot.sendMessage(chatId, message, options)
  // 3. Implement retry logic (3 retries on failure)
  // 4. Handle rate limiting (max 1 alert per 2 minutes)
  // 5. Return success/failure
  // 6. Log errors gracefully
}

export function formatAlertMessage(alert: TelegramAlert): string {
  // Template per TELEGRAM_CONFIG.md:
  // 🚨 NEW INTERESTING TOKEN
  // Name: [name] ([symbol])
  // Contract: [CA]
  // 📊 SCORE: [score]/100
  // ✅ Positives: [list]
  // ⚠️ Risks: [list]
  // 🔗 Quick Links: [dexscreener, etherscan, creator]
  // 🎯 Recommendation: [safe/caution/risky]
}
```

Message template (from TELEGRAM_CONFIG.md):
```
🚨 NEW INTERESTING TOKEN

Name: [Token Name] ([Symbol])
Contract: [0x...]
Chain: Base
Launcher: [Clanker / Bankr]

📊 SCORE: 72/100

✅ Positives:
• Holders diversified (top 10: 45%)
• Creator has 2 successful launches
• Liquidity locked 6 months

⚠️ Risks:
• Pump: 8x in 20 min (could dump soon)
• Creator: 2-week-old account

🔗 Quick Links:
• Dexscreener: [link]
• Contract: [link]
• Creator: [link]

🎯 Recommendation: CAUTION (High risk, medium opportunity)
```

**Estimated Code:** 150-200 lines  
**Estimated Time:** 2-3 hours  
**Dependencies:** node-telegram-bot-api (✅)

---

## BLOCKER #5: Main Orchestrator Loop ⚠️ PRIORITY 5

### Problem
Main entry point is a skeleton with TODO placeholders. No actual bot logic implemented.

### Files Affected
- `src/index.ts` (skeleton with TODOs)

### Missing Implementation
```typescript
// Current state in src/index.ts:
async function main(): Promise<void> {
  logger.info('[BOT] Starting...');
  // TODO: Initialize database
  // TODO: Setup Telegram bot
  // TODO: Initialize RPC providers
  // TODO: Start scanning loop
  // TODO: Setup graceful shutdown
  logger.info('[BOT] Bot started successfully!');
}
```

### Impact
🔴 **BLOCKING:** Bot doesn't run. All other components are useless without orchestration.

### Solution
Implement main loop:

1. **Initialize all systems:**
   ```typescript
   const db = await initDatabase();
   const rpc = createRpcProvider(PRIMARY_RPC, BACKUP_RPC);
   const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
   ```

2. **Setup cron job (every 10 minutes):**
   ```typescript
   cron.schedule('0 */10 * * * *', async () => {
     await runScanCycle(db, rpc, bot);
   });
   ```

3. **Implement runScanCycle():**
   ```
   a. Fetch Clanker tokens
   b. Fetch Bankr tokens
   c. Deduplicate (check DB for existing CA)
   d. For each new token:
      - Fetch RPC data (holders, liquidity, creator)
      - Run 4 analyzers
      - Calculate score
      - Store in DB
      - If score >= 65: send Telegram alert
   e. Log results
   f. Error handling & recovery
   ```

4. **Graceful shutdown:**
   ```typescript
   process.on('SIGTERM', async () => {
     await db.close();
     bot.stopPolling();
     process.exit(0);
   });
   ```

**Estimated Code:** 150-200 lines  
**Estimated Time:** 2-3 hours  
**Dependencies:** node-cron (✅), all other modules

---

## Summary Table

| Blocker # | Component | Status | Priority | Estimated Time | Dependency |
|-----------|-----------|--------|----------|-----------------|------------|
| #1 | RPC Provider Manager | 🔴 NOT CREATED | P1 | 1-2h | None |
| #2 | Clanker/Bankr Scrapers | 🔴 STUB | P2 | 2-3h | #1 (partial) |
| #3 | Database Layer | 🔴 STUB | P4 | 3-4h | None |
| #4 | Telegram Integration | 🔴 STUB | P3 | 2-3h | None |
| #5 | Orchestrator Loop | 🔴 STUB | P5 | 2-3h | All #1-4 |

**Total Estimated Time:** 12-15 hours (with optimal parallelization, ~4-5 days)

---

## Architectural Gaps

Beyond the 5 blockers, several architectural gaps exist:

1. **No Type Definitions Module** (`src/types/index.ts`)
   - Shared interfaces for Token, Analysis, Alert, HolderData, etc.
   - Used by scrapers, analyzers, database

2. **No Error Recovery Middleware**
   - No unified retry logic with exponential backoff
   - Each module implements its own (code duplication)
   - Should be in `src/utils/retry.ts`

3. **No Contract ABIs**
   - No ERC-20, Uniswap V2/V3, or Bankr factory ABIs
   - Should be in `src/utils/contract-abi.ts`

4. **No Testing Infrastructure**
   - Only `score-engine.test.ts` exists
   - No mock fixtures for scrapers/RPC
   - No integration test setup

5. **No Operational Configuration**
   - No PM2 ecosystem file
   - No Docker/docker-compose setup (mentioned in DEPLOYMENT.md but not in code)
   - No health check endpoint

---

## Current Project State

### ✅ Ready Components
- `src/config/env.ts` — Environment variables (Zod validation)
- `src/config/constants.ts` — App constants (scoring weights, rate limits)
- `src/scoring/score-engine.ts` — Scoring algorithm (weighted 0-100 score)
- `src/scoring/score-engine.test.ts` — Scoring tests (Jest)
- `src/utils/logger.ts` — Winston logger
- `src/utils/errors.ts` — Custom error classes

### 🔴 Stub/Not Implemented
- All scrapers (Clanker, Bankr)
- All analyzers (Wallet, Creator, Liquidity, Pump)
- Database layer (no CRUD, no schema)
- Telegram notifier (no bot, no message sending)
- Main orchestrator (no loop, no cron)

### 📊 Statistics
- **Total lines of code (scaffold):** ~680
- **Lines of functional code:** ~250 (config + utils + scoring)
- **Lines of stub code:** ~430 (needs implementation)
- **Test coverage:** 0% (only score-engine tests exist)

---

## Recommendations for Drix

### Before Spawning Phase 3 Agents

1. **Confirm that you're ready for this complexity** — This is a **substantial engineering project** (1500+ lines of production code). Make sure you want to commit 5+ days to this.

2. **Lock in the specs** — All SCORING_ALGORITHM.md, DATA_SOURCES.md, and TELEGRAM_CONFIG.md specs are finalized. No more changes after Phase 3 starts, or risk delays.

3. **Verify API access** — Before agents start coding:
   - [ ] Test Clanker API directly: `curl https://clanker.world/api/tokens?limit=1`
   - [ ] Have Alchemy API key ready (free tier signup: alchemy.com)
   - [ ] Have Telegram bot token (BotFather: @BotFather on Telegram)
   - [ ] Have Base RPC backup (Infura account: infura.io)

4. **Plan for testing** — You'll need:
   - Test Telegram chat (for alert testing without spamming main group)
   - Sample memecoin contract addresses (for scoring validation)
   - 48-hour uptime test period (before production)

### Agent Spawn Strategy

**Recommended:** Spawn 3 agents in parallel (not sequential):

```
Day 1: 
├─ Agent-1: RPC Provider Manager (blocker #1)
├─ Agent-2: Scrapers (blocker #2) — can start after agent-1 finishes
└─ Agent-3: Database + Telegram (blockers #3, #4) — parallel with agents 1-2

Day 2-3:
├─ All agents finish their modules
├─ Code review + integration
└─ Orchestrator agent (blocker #5) — can start once all modules ready

Day 4-5:
├─ Integration testing + bug fixes
├─ Performance optimization
└─ Manual testing with Drix

Day 6+:
├─ Deployment to Railway
├─ 24/7 monitoring setup
└─ Go live
```

### Estimated Timeline with Agent Team
- **Blockers #1-5:** 4-5 days (agents work in parallel)
- **Integration + Testing:** 2-3 days
- **Deployment + Monitoring:** 1-2 days
- **Total:** **1-2 weeks** from now (Phase 3 completion)

---

## Next Actions

1. **Immediate:** Review this report. Confirm you want to proceed.
2. **If yes:** Spawn Phase 3 agent team using AGENT_TEAM.md
3. **Agents should prioritize blocker fixes in order:** #1 → #2 → #3, #4 (parallel) → #5
4. **Daily standups:** Review progress against blockers (prevent compounding delays)

---

**Report Generated:** 2026-03-09 21:27 GMT+1  
**Scanned By:** improvement-bot (subagent a7ace475...)  
**Status:** ✅ Scan complete. All findings documented in BOT_PROJECT_TODO.md

---

**Questions for Drix:**
- Are you ready to commit agents to Phase 3?
- Do you have all API credentials ready (Alchemy, Telegram, Clanker)?
- Should we proceed with agent spawning, or would you like more details on any blocker?
