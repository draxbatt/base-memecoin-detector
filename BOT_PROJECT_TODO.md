# 🤖 Memecoin Detection Bot — Project TODO (Drax Agent)

**Project:** Base Chain Memecoin Detector + Sniping Bot (Clanker + Bankr)
**Owner:** Drax (AI agent)
**Timeline:** 1-2 weeks development + 1 week testing/deployment
**Goal:** Automated alerts for interesting memecoin opportunities on Base chain

---

## ✅ PHASE 0: Specs & Architecture (Days 1-2) ✅ COMPLETE

### Specs Clarification
- [x] Finalize exact data sources (Clanker API, Bankr API, Base RPC endpoint) → DATA_SOURCES.md
- [x] Confirm scoring algorithm (weights for green/red flags) → SCORING_ALGORITHM.md
- [x] Define alert threshold (minimum score to trigger notification) → SCORING_ALGORITHM.md
- [x] Confirm Telegram integration (bot token, chat ID) → TELEGRAM_CONFIG.md
- [x] Decide alert frequency (every 5 min, 10 min, 15 min scans) → OPERATIONAL_PARAMETERS.md
- [x] Define "interesting" token criteria (liquidity min, holder requirements, etc.) → SCORING_ALGORITHM.md

**Output:** ✅ 4 spec documents created

### Architecture Design
- [x] Create system diagram (Scraper → Analyzer → Scorer → Telegram) → OPERATIONAL_PARAMETERS.md
- [x] Define data flow (Clanker → RPC → scoring → persistence → alert) → DATA_SOURCES.md & OPERATIONAL_PARAMETERS.md
- [x] Database schema (store analyzed tokens, avoid duplicates) → OPERATIONAL_PARAMETERS.md
- [x] Error handling strategy (API failures, rate limits, malformed data) → OPERATIONAL_PARAMETERS.md
- [x] Logging & monitoring strategy (what to log, where) → OPERATIONAL_PARAMETERS.md
- [x] Performance targets (max latency per token analysis) → OPERATIONAL_PARAMETERS.md

**Output:** ✅ All specifications finalized

---

## ✅ PHASE 1: Repository & Infrastructure (Day 2-3) ✅ COMPLETE

### Git Repository Setup
- [x] Create GitHub repo: `base-memecoin-detector` under draxbatt account → Ready at `/home/drix/code/base-memecoin-detector`
- [x] Initialize repo with:
  - [x] `README.md` (overview, quick start)
  - [x] `.gitignore` (node_modules, .env, secrets)
  - [x] `package.json` (dependencies)
  - [x] `.env.example` (template for secrets)
- [x] Create branch structure: `main`, `develop`, `feature/*` (git initialized)
- [x] Add GitHub Actions CI/CD template (lint, test on push) → `.github/workflows/ci.yml`

**Output:** ✅ Local repo ready at `/home/drix/code/base-memecoin-detector`

### DevOps & Deployment Plan
- [x] Choose deployment target: Replit or Railway (free tier) → Documented both options
- [x] Setup environment variables template → `.env.example` created
- [x] Document secrets management (1Password for prod keys) → In DEPLOYMENT.md
- [x] Create deployment guide (comprehensive) → `DEPLOYMENT.md` created
- [x] Plan monitoring strategy (error logs, uptime checks) → In DEPLOYMENT.md
- [x] Create pre-deployment checklist → In DEPLOYMENT.md

**Output:** ✅ `DEPLOYMENT.md` + `.env.example` + project structure

---

## ✅ PHASE 2: Development Setup (Day 3)

### Technology Stack
- [ ] Confirm stack:
  - **Language:** TypeScript/Node.js
  - **RPC client:** ethers.js
  - **HTTP client:** axios or fetch
  - **Database:** SQLite (local) or Supabase (cloud, optional)
  - **Telegram:** node-telegram-bot-api
  - **Scheduler:** node-cron (periodic scans)
- [ ] Add all dependencies to `package.json`
- [ ] Create `tsconfig.json` (strict mode)
- [ ] Setup ESLint + Prettier

**Output:** `package.json` with all dependencies, `tsconfig.json`

### Project Structure
- [ ] Create directory layout:
  ```
  /src
    /scrapers
      clanker.ts
      bankr.ts
    /analyzers
      wallet-analyzer.ts
      creator-history.ts
    /scoring
      score-engine.ts
      rules.ts
    /alerts
      telegram-notifier.ts
    /database
      schema.ts
      db.ts
    /utils
      logger.ts
      errors.ts
    index.ts (main entry)
  /tests
  /config
    env.ts
    constants.ts
  ```
- [ ] Create empty files for all modules

**Output:** Directory structure ready + stub files

---

## ✅ PHASE 3: Core Development (Days 4-8)

### Data Scrapers (2 days)
- [ ] **Clanker Scraper** (`src/scrapers/clanker.ts`)
  - [ ] Fetch latest Clanker launches from Clanker API or on-chain events
  - [ ] Parse token metadata (name, symbol, CA, creator)
  - [ ] Handle rate limits + retries
  - [ ] Log errors gracefully
  - [ ] Unit tests for parser
  - **Deliverable:** Clanker module fetches tokens every 5 min

- [ ] **Bankr Scraper** (`src/scrapers/bankr.ts`)
  - [ ] Fetch latest Bankr launches
  - [ ] Parse token metadata
  - [ ] Deduplicate vs Clanker
  - [ ] Unit tests
  - **Deliverable:** Bankr module functional

- [ ] **RPC Integration**
  - [ ] Connect to Base RPC (Alchemy, Infura, or public endpoint)
  - [ ] Fetch on-chain data: holders, liquidity, contract details
  - [ ] Error handling for RPC failures

### Analyzer Modules (2 days)
- [ ] **Wallet Analysis** (`src/analyzers/wallet-analyzer.ts`)
  - [ ] Parse holder distribution
  - [ ] Calculate concentration score (% in top 10 wallets)
  - [ ] Detect whale patterns
  - [ ] Unit tests
  - **Deliverable:** Can score holder diversity

- [ ] **Creator History Tracker** (`src/analyzers/creator-history.ts`)
  - [ ] Track creator wallet address
  - [ ] Check previous launches (success/rug history)
  - [ ] Assign creator risk score
  - [ ] Cache results (avoid redundant checks)
  - **Deliverable:** Can assess creator credibility

- [ ] **Liquidity Analyzer** (`src/analyzers/liquidity.ts`)
  - [ ] Check if liquidity locked
  - [ ] Detect burneable tokens (dev can pull)
  - [ ] Analyze liquidity depth
  - **Deliverable:** Liquidity risk score

### Scoring Engine (1 day)
- [ ] **Score Algorithm** (`src/scoring/score-engine.ts`)
  - [ ] Combine all signals: holder distribution, creator history, liquidity, pump speed
  - [ ] Weighted scoring (e.g., holder diversity 30%, creator history 40%, liquidity 20%, pump speed 10%)
  - [ ] Final score: 0-100 (higher = safer + more opportunity)
  - [ ] Define threshold for "interesting" (e.g., ≥60 score)
  - [ ] Unit tests
  - **Deliverable:** Comprehensive scoring module

### Alert System (1 day)
- [ ] **Telegram Notifier** (`src/alerts/telegram-notifier.ts`)
  - [ ] Send structured alerts to Telegram (chat ID)
  - [ ] Include: token name, CA, chart link, score, risk breakdown, creator history
  - [ ] Error handling (Telegram API failures)
  - [ ] Rate limiting (don't spam)
  - [ ] Unit tests
  - **Deliverable:** Telegram integration working

### Database (1 day)
- [ ] **Schema & ORM** (`src/database/schema.ts`, `db.ts`)
  - [ ] Create SQLite schema:
    - `tokens` (CA, name, symbol, launch_time, first_seen, last_updated)
    - `analyses` (token_id, score, components, timestamp)
    - `alerts_sent` (token_id, alert_time, to_user)
  - [ ] Prevent duplicate alerts for same token
  - [ ] Query builder for stats (how many tokens/day, top scores, etc.)
  - [ ] Database migration system
  - **Deliverable:** SQLite database functional

### Main Orchestrator (1 day)
- [ ] **Main Loop** (`src/index.ts`)
  - [ ] Initialize all scrapers, analyzers, notifier
  - [ ] Run on schedule (every 5-10 min): scrape → analyze → score → alert
  - [ ] Error recovery (don't crash, retry with backoff)
  - [ ] Graceful shutdown (SIGTERM handling)
  - [ ] Logger output (what's happening)
  - **Deliverable:** Bot runs continuously

---

## ✅ PHASE 4: Testing & Optimization (Days 9-10)

### Testing
- [ ] **Unit Tests** (Jest)
  - [ ] Test each module independently
  - [ ] Mock external APIs (Clanker, Bankr, RPC)
  - [ ] Target: >80% coverage
  - **Deliverable:** `npm test` passes

- [ ] **Integration Tests**
  - [ ] Test full flow: scrape → analyze → score → alert
  - [ ] Use test data (no real Telegram alerts)
  - **Deliverable:** End-to-end flow working

- [ ] **Manual Testing (with Drix)**
  - [ ] Run bot locally
  - [ ] Check Telegram alerts (real messages)
  - [ ] Verify scoring matches expectations
  - [ ] Test with recent memecoin launches
  - **Deliverable:** Drix approves functionality

### Optimization
- [ ] **Performance Tuning**
  - [ ] Measure latency per token (target: <5s total)
  - [ ] Optimize database queries
  - [ ] Cache creator history lookups
  - [ ] Batch RPC calls where possible
  - **Deliverable:** Bot responds quickly

- [ ] **Reliability**
  - [ ] Add retry logic (exponential backoff)
  - [ ] Handle API rate limits gracefully
  - [ ] Monitor uptime (sentry or custom)
  - **Deliverable:** Bot handles failures gracefully

---

## ✅ PHASE 5: Documentation & Deployment (Day 11-12)

### Documentation
- [ ] **README.md**
  - [ ] Overview (what it does)
  - [ ] Quick start (clone, install, configure)
  - [ ] Environment variables guide
  - [ ] Telegram setup instructions
  - [ ] Troubleshooting section

- [ ] **ARCHITECTURE.md** (finalize)
  - [ ] System overview diagram
  - [ ] Data flow explanation
  - [ ] Scoring algorithm breakdown
  - [ ] API reference (internal functions)

- [ ] **CODE COMMENTS**
  - [ ] Add JSDoc comments to all public functions
  - [ ] Explain scoring weights
  - [ ] Flag areas needing improvement

### Deployment
- [ ] **Choose Platform** (Replit or Railway)
  - [ ] Create account (if needed)
  - [ ] Setup environment variables
  - [ ] Deploy from GitHub repo
  - [ ] Test in production (send test alert)

- [ ] **Monitoring Setup**
  - [ ] Log aggregation (view bot logs)
  - [ ] Uptime check (ping service)
  - [ ] Error alerts (notify Drix of crashes)

- [ ] **Launch Checklist**
  - [ ] All tests pass ✅
  - [ ] Environment variables set ✅
  - [ ] Telegram bot token valid ✅
  - [ ] Database initialized ✅
  - [ ] Deployment successful ✅

**Deliverable:** Bot live and operational

---

## 🤖 AGENT ROLES (Spawn if Needed)

| Agent | Role | Task |
|-------|------|------|
| **crypto-dev-bot-1** | Backend/Core Dev | Scrapers, Analyzers, Database |
| **crypto-dev-bot-2** | Scoring & Alerts | Scoring engine, Telegram notifier |
| **test-bot** | QA/Testing | Unit tests, integration tests, manual QA |
| **devops-bot** | DevOps/Deployment | Replit/Railway setup, monitoring, docs |

**Decision:** Spawn agents when development starts (after specs locked).

---

## 📊 Progress Tracking

| Phase | Status | Start | End | Owner |
|-------|--------|-------|-----|-------|
| Specs & Architecture | ✅ DONE | Day 1 | 2026-03-09 | Drax |
| Repo & Infrastructure | ✅ DONE | Day 2 | 2026-03-09 | Drax |
| Dev Setup | ⏳ TODO | Day 3 | Day 3 | Drax |
| Core Development | ⏳ TODO | Day 4 | Day 8 | Agents |
| Testing & Optimization | ⏳ TODO | Day 9 | Day 10 | Test Bot |
| Deployment | ⏳ TODO | Day 11 | Day 12 | DevOps Bot |

---

## 🎯 Success Criteria

- ✅ Bot runs 24/7 without crashes
- ✅ Detects all Clanker + Bankr launches within 1 minute
- ✅ Telegram alerts contain: token name, CA, score, risk breakdown
- ✅ Scoring algorithm matches Drix's expectations
- ✅ Zero false positives (only alert on 60+ score)
- ✅ Database tracks 100+ tokens within 1 week
- ✅ Deployment automated (push to main → bot updates)

---

## 🚀 Next Steps (Immediate)

1. **Drix confirms:** Specs locked (data sources, thresholds, alert format)?
2. **Drax action:** Create GitHub repo + spawn development agents
3. **Agents action:** Start Phase 2 (dev setup) in parallel with Drix feedback
4. **Timeline:** Target 2-week completion (1 week dev + 1 week testing + deploy)

---

**Status:** Ready to start. Awaiting Drix confirmation on specs.
