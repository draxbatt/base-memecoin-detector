# 🤖 Memecoin Bot — DETAILED PHASES BREAKDOWN

---

## 📌 PHASE 0: Specs & Architecture (Days 1-2)

### Day 1: Specifications Finalization

#### Task 1.1: Data Sources & APIs
**Goal:** Lock exact data sources and API specifications

- [ ] **Clanker Integration**
  - [ ] Research Clanker API documentation
  - [ ] Confirm endpoint(s) for latest launches
  - [ ] Check rate limits (requests per minute)
  - [ ] Determine if need API key or public access
  - [ ] Test endpoint connectivity
  - [ ] Document: endpoint URL, response schema, rate limits
  - **Decision Required:** Should we monitor Clanker telegram channel + API, or just API?

- [ ] **Bankr Integration**
  - [ ] Research Bankr API/data source
  - [ ] Confirm launch detection method
  - [ ] Check rate limits
  - [ ] Test connectivity
  - [ ] Document: endpoint URL, response schema, rate limits
  - **Decision Required:** How to differentiate Bankr from Clanker launches?

- [ ] **Base RPC Endpoint**
  - [ ] Choose RPC provider (Alchemy free tier, Infura, QuickNode, or public endpoint like publicnode.com)
  - [ ] Test RPC connectivity
  - [ ] Verify we can fetch: token contract details, holder lists, liquidity
  - [ ] Document: RPC URL, rate limits, methods needed
  - [ ] Backup RPC plan (if primary fails)

**Output:** `/project/DATA_SOURCES.md` with all endpoints, schemas, rate limits

---

#### Task 1.2: Scoring Algorithm Definition
**Goal:** Define exact scoring weights and thresholds

- [ ] **Scoring Components** (define for each):
  
  **Holder Distribution (Weight: 30%)**
  - [ ] Rule 1: Calculate % of tokens in top 10 holders
    - Green: <50% (diversified)
    - Red: >80% (whale-concentrated)
  - [ ] Rule 2: Check if dev/owner wallet owns >30%
    - Red flag if yes
  - [ ] Rule 3: Detect suspicious distribution changes
    - Red if sudden dumps/accumulation
  
  **Creator History (Weight: 40%)**
  - [ ] Rule 1: Check if creator has previous launches
    - Green: 3+ successful launches without rug
    - Yellow: 1-2 launches, no clear outcome
    - Red: Previous rug pulls detected
  - [ ] Rule 2: Creator wallet age
    - Green: >6 months old
    - Red: <1 week old (fresh account = sus)
  - [ ] Rule 3: Creator's other holdings (legitimate projects or all memecoins?)
  
  **Liquidity Analysis (Weight: 15%)**
  - [ ] Rule 1: Is liquidity locked?
    - Green: Yes, locked for 12+ months
    - Red: No, dev can pull anytime
  - [ ] Rule 2: Minimum liquidity threshold
    - Green: >$10k (configurable)
    - Yellow: $5k-10k
    - Red: <$5k
  - [ ] Rule 3: Burn mechanism?
    - Green: Tokens burned = less supply inflation risk
  
  **Pump Patterns (Weight: 15%)**
  - [ ] Rule 1: Launch to current price ratio
    - Green: Gradual growth (2-5x in first hour)
    - Red: Instant 100x+ (classic pump & dump setup)
  - [ ] Rule 2: Volume analysis
    - Green: Consistent volume over time
    - Red: All volume in first 5 minutes
  - [ ] Rule 3: Time since launch
    - Green: >1 hour since launch (not new)
    - Red: <5 minutes (too risky)

- [ ] **Final Score Calculation**
  - [ ] Each component outputs 0-100 score
  - [ ] Apply weights: (component_score * weight) sum
  - [ ] Final score 0-100
  - [ ] Alert threshold: ≥65 score (configurable)
  - [ ] High-interest threshold: ≥80 score (premium alerts)

**Output:** `/project/SCORING_ALGORITHM.md` with formulas, weights, thresholds

---

#### Task 1.3: Alert Format & Telegram Config
**Goal:** Define exact Telegram alert structure and delivery method

- [ ] **Alert Message Format**
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

- [ ] **Telegram Bot Setup**
  - [ ] Create Telegram bot via BotFather
  - [ ] Get bot token (format: `1234567890:ABCDefGHIJKlmnoPQRstUVwxyZ`)
  - [ ] Create private Telegram group or use DM
  - [ ] Get chat ID (format: `-123456789` or `123456789`)
  - [ ] Document: bot token, chat ID, secure storage (1Password)
  - [ ] Test bot connectivity (send test message)

- [ ] **Alert Delivery Strategy**
  - [ ] Send all alerts to Drix's Telegram
  - [ ] Rate limit: max 1 alert per 2 minutes (avoid spam)
  - [ ] Deduplicate: don't alert for same token twice
  - [ ] Store sent alerts in database (prevent resends)
  - [ ] Error handling: if Telegram fails, log and retry (max 3 times)

**Output:** Alert message template, Telegram config doc

---

#### Task 1.4: Scan Frequency & Performance Targets
**Goal:** Define operational parameters

- [ ] **Scan Frequency Decision**
  - [ ] How often scan for new launches?
    - Option A: Every 5 minutes (more latency, more API calls)
    - Option B: Every 10 minutes (balanced)
    - Option C: Every 15 minutes (less calls, higher latency)
  - [ ] **Decision:** Every 10 minutes (balanced approach)

- [ ] **Performance Targets**
  - [ ] Max time per token analysis: 5 seconds
  - [ ] Max batch size: 50 tokens per scan
  - [ ] Uptime target: 99.5% (max 3.6 hours downtime/month)
  - [ ] DB query time: <100ms per query
  - [ ] Telegram API latency: <2 seconds

- [ ] **Operational Limits**
  - [ ] Max API calls per hour: [calculated based on Clanker/Bankr/RPC limits]
  - [ ] Database size: estimate tokens/week (e.g., 1000 tokens/week on Base)
  - [ ] Storage needed: ~1MB per 1000 tokens analyzed
  - [ ] Memory footprint: <512MB while running

**Output:** Operational parameters doc

---

#### Task 1.5: Error Handling & Fallback Strategy
**Goal:** Define robustness specifications

- [ ] **API Failure Handling**
  - [ ] If Clanker API fails: use Bankr as backup + manual TX monitoring
  - [ ] If RPC fails: retry with 2-second exponential backoff (max 3 tries)
  - [ ] If Telegram fails: queue alert, retry every 30 seconds (max 5 times)
  - [ ] If database fails: in-memory buffer, persist when DB recovers

- [ ] **Data Validation**
  - [ ] Validate all API responses (schema check, null checks)
  - [ ] Reject malformed tokens (invalid CA, missing data)
  - [ ] Sanitize data before storing (prevent injection)
  - [ ] Log all validation errors

- [ ] **Monitoring & Alerting**
  - [ ] Alert Drix if bot crashes
  - [ ] Alert Drix if no tokens detected for >30 minutes (might be broken)
  - [ ] Alert Drix if error rate >5% in any 1-hour window
  - [ ] Daily summary: how many tokens analyzed, alerts sent, false positives

**Output:** Error handling & resilience spec

---

### Day 2: Architecture Design

#### Task 2.1: System Architecture Diagram
**Goal:** Create high-level system overview

```
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL DATA SOURCES                   │
├──────────────┬──────────────────┬──────────────────────────┤
│ Clanker API  │  Bankr API       │  Base RPC Endpoint      │
└──────────────┴──────────────────┴──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SCRAPER LAYER                              │
├──────────────────────────────────────────────────────────────┤
│ • ClankerScraper (fetch every 10 min)                       │
│ • BankrScraper (fetch every 10 min)                         │
│ • TokenFetcher (enrich with on-chain data from RPC)         │
│ • Rate limiter & retry handler                              │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   ANALYZER LAYER                             │
├──────────────────────────────────────────────────────────────┤
│ • HolderAnalyzer (distribution, concentration)              │
│ • CreatorHistoryAnalyzer (track & score creator)            │
│ • LiquidityAnalyzer (locked?, burnable?)                    │
│ • PumpPatternAnalyzer (instant 100x = sus)                  │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SCORING ENGINE                             │
├──────────────────────────────────────────────────────────────┤
│ • Aggregate all signals (holder, creator, liquidity, pump)  │
│ • Apply weights (30%, 40%, 15%, 15%)                        │
│ • Final score: 0-100                                        │
│ • Decision: Alert if ≥65, Premium if ≥80                   │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   STORAGE LAYER                              │
├──────────────────────────────────────────────────────────────┤
│ • SQLite Database                                            │
│   - tokens (CA, name, symbol, launch_time, etc)            │
│   - analyses (token_id, score, components, timestamp)       │
│   - alerts_sent (prevent duplicate alerts)                  │
│   - creators (cache creator history)                        │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   ALERT LAYER                                │
├──────────────────────────────────────────────────────────────┤
│ • TelegramNotifier (send alerts to Drix)                    │
│ • Alert formatter (structure messages)                      │
│ • Rate limiter (max 1 alert/2 min)                          │
│ • Deduplication (don't re-alert same token)                │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
                    📱 Telegram (Drix)
```

- [ ] Create detailed architecture document with:
  - Data flow arrows (what data moves between layers)
  - Error handling connections (retry loops, fallbacks)
  - Database schema diagram
  - API rate limit strategies

**Output:** `/project/ARCHITECTURE.md` with diagrams

---

#### Task 2.2: Database Schema Design
**Goal:** Define exact database structure

- [ ] **Tokens Table**
  ```sql
  CREATE TABLE tokens (
    id INTEGER PRIMARY KEY,
    contract_address TEXT UNIQUE NOT NULL,
    name TEXT,
    symbol TEXT,
    launcher TEXT, -- 'clanker' or 'bankr'
    launch_time DATETIME,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    creator_address TEXT,
    initial_liquidity REAL,
    liquidity_locked BOOLEAN,
    lock_duration_days INTEGER,
    
    current_price REAL,
    current_holders INTEGER,
    market_cap REAL,
    
    analyzed BOOLEAN DEFAULT 0,
    score REAL,
    last_scored DATETIME,
    
    dex_screener_url TEXT,
    twitter_url TEXT
  );
  ```

- [ ] **Analyses Table**
  ```sql
  CREATE TABLE analyses (
    id INTEGER PRIMARY KEY,
    token_id INTEGER NOT NULL FOREIGN KEY,
    analysis_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    score REAL,
    
    holder_distribution_score REAL,
    holder_concentration REAL, -- % in top 10
    
    creator_history_score REAL,
    creator_launches_count INTEGER,
    creator_rug_count INTEGER,
    creator_wallet_age_days INTEGER,
    
    liquidity_score REAL,
    liquidity_locked BOOLEAN,
    
    pump_pattern_score REAL,
    price_multiplier REAL, -- 1h / launch price
    volume_spike BOOLEAN,
    
    risk_level TEXT, -- 'safe', 'caution', 'risky'
    recommendation TEXT,
    
    FOREIGN KEY (token_id) REFERENCES tokens(id)
  );
  ```

- [ ] **Alerts Sent Table**
  ```sql
  CREATE TABLE alerts_sent (
    id INTEGER PRIMARY KEY,
    token_id INTEGER NOT NULL FOREIGN KEY,
    alert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    alert_type TEXT, -- 'standard', 'premium'
    telegram_message_id INTEGER,
    FOREIGN KEY (token_id) REFERENCES tokens(id)
  );
  ```

- [ ] **Creators Cache Table**
  ```sql
  CREATE TABLE creators (
    creator_address TEXT PRIMARY KEY,
    total_launches INTEGER,
    successful_launches INTEGER,
    rug_pulls INTEGER,
    last_updated DATETIME,
    avg_score REAL
  );
  ```

- [ ] **Database Indexes** (for performance)
  ```sql
  CREATE INDEX IF NOT EXISTS idx_tokens_launch_time ON tokens(launch_time);
  CREATE INDEX IF NOT EXISTS idx_tokens_score ON tokens(score DESC);
  CREATE INDEX IF NOT EXISTS idx_analyses_token_id ON analyses(token_id);
  CREATE INDEX IF NOT EXISTS idx_alerts_sent_token_id ON alerts_sent(token_id);
  ```

**Output:** `/project/DATABASE_SCHEMA.md` with SQL scripts

---

#### Task 2.3: Data Flow & Sequence Diagrams
**Goal:** Define exact step-by-step process

- [ ] **Main Scan Loop Flow**
  ```
  START (triggered every 10 minutes)
    ↓
  1. Fetch new tokens from Clanker API
    ↓
  2. Fetch new tokens from Bankr API
    ↓
  3. Deduplicate (check if already in DB)
    ↓
  4. For each new token:
      a. Fetch on-chain data (holders, liquidity, creator)
      b. Store token in database
      c. Run analysis (holder, creator, liquidity, pump)
      d. Calculate score
      e. Store analysis in database
      f. If score ≥ 65: prepare alert
      g. Send alert to Telegram
      h. Log to alerts_sent table
    ↓
  5. Sleep 10 minutes, then repeat
  ```

- [ ] **Token Analysis Sequence**
  ```
  Token received
    ↓
  Validate contract address (valid CA format?)
    ↓
  Fetch contract details (from RPC)
    ↓
  Fetch holder distribution (top 100 holders)
    ↓
  Analyze holders (concentration %, whale detection)
    ↓
  Fetch creator info (contract owner)
    ↓
  Look up creator history in cache
    ↓
  Query RPC for creator's other launches
    ↓
  Analyze creator (track record, account age)
    ↓
  Fetch liquidity info (locked%, duration)
    ↓
  Analyze liquidity (safe?, burnable?)
    ↓
  Fetch price history (launch price vs current)
    ↓
  Analyze pump patterns (instant 100x?)
    ↓
  Calculate weighted scores
    ↓
  Combine into final score (0-100)
    ↓
  Determine risk level & recommendation
    ↓
  Store analysis in database
    ↓
  Decision: Alert? (if score ≥ 65)
  ```

**Output:** `/project/DATA_FLOW.md` with diagrams

---

#### Task 2.4: Error Handling & Recovery Plan
**Goal:** Define all failure scenarios and responses

- [ ] **Clanker API Failure**
  - Retry up to 3 times with exponential backoff (2s, 4s, 8s)
  - If still failing, use last known state (don't miss tokens)
  - Log error, alert Drix if >1 hour without data

- [ ] **Bankr API Failure**
  - Same as Clanker (retry 3x, exponential backoff)
  - Fall back to monitoring Twitter/Discord for launches

- [ ] **RPC Failure**
  - Switch to backup RPC endpoint
  - Queue token for later analysis (don't drop it)
  - Retry hourly

- [ ] **Database Failure**
  - Switch to in-memory buffer
  - Store all tokens/analyses in memory
  - When DB recovers, flush buffer to disk
  - Graceful degradation (bot keeps running)

- [ ] **Telegram Failure**
  - Queue alert in database
  - Retry every 30 seconds
  - After 5 failed retries, log and move on (don't hang)

- [ ] **Bot Crash**
  - Use process manager (PM2) to auto-restart
  - Log crash reason + stack trace
  - Send crash alert to Drix (in next alert)

**Output:** `/project/ERROR_HANDLING.md`

---

#### Task 2.5: Performance & Scalability Targets
**Goal:** Define resource constraints and growth plan

- [ ] **Single Scan Latency Budget**
  - Clanker scrape: <1s
  - Bankr scrape: <1s
  - RPC calls (per token): <2s
  - Analysis (per token): <1s
  - Database writes: <0.5s
  - Telegram send: <2s
  - **Total per token: <5s**
  - **Batch of 20 tokens: <2 minutes** ✓ (fits in 10-min window)

- [ ] **Storage & Memory**
  - SQLite DB: ~1MB per 500 tokens analyzed
  - Running memory: ~200-300MB
  - CPU: single-threaded Node.js, ~5-10% usage

- [ ] **Growth Plan (6 months)**
  - Month 1: 500 tokens analyzed
  - Month 2: 1500 tokens analyzed
  - Month 3: 3000 tokens analyzed
  - Plan to upgrade DB if >10k tokens (move to PostgreSQL)

**Output:** Performance spec document

---

**PHASE 0 DELIVERABLES:**
- ✅ DATA_SOURCES.md (endpoints, schemas, limits)
- ✅ SCORING_ALGORITHM.md (weights, formulas, thresholds)
- ✅ Alert template & Telegram config
- ✅ ARCHITECTURE.md (system diagram, data flow)
- ✅ DATABASE_SCHEMA.md (SQL scripts)
- ✅ ERROR_HANDLING.md (all failure scenarios)
- ✅ Performance specs

---

## 📌 PHASE 1: Repository & Infrastructure (Days 2-3)

### Day 2-3: Repository Setup

#### Task 1.1: Create GitHub Repository
**Goal:** Initialize code repository with structure

- [ ] **GitHub Repo Creation**
  - [ ] Log into GitHub as draxbatt
  - [ ] Create new repository: `base-memecoin-detector`
  - [ ] Description: "Automated memecoin detector for Base chain (Clanker + Bankr launches)"
  - [ ] Public or Private? **Private** (security: API keys)
  - [ ] Initialize with README
  - [ ] Add .gitignore (Node.js template)
  - [ ] License: MIT

- [ ] **Repository URL:** `https://github.com/draxbatt/base-memecoin-detector`
- [ ] **SSH Remote:** `git@github.com:draxbatt/base-memecoin-detector.git`

- [ ] **Clone locally**
  ```bash
  git clone git@github.com:draxbatt/base-memecoin-detector.git
  cd base-memecoin-detector
  ```

**Output:** Live GitHub repo, cloned locally

---

#### Task 1.2: Initialize Project Structure
**Goal:** Create directory layout + core config files

- [ ] **Create directories**
  ```bash
  mkdir -p src/{scrapers,analyzers,scoring,alerts,database,utils,config}
  mkdir -p tests/{unit,integration}
  mkdir -p config
  mkdir -p docs
  ```

- [ ] **Create core files**
  - [ ] `package.json` (see below)
  - [ ] `tsconfig.json` (TypeScript config)
  - [ ] `.env.example` (template for secrets)
  - [ ] `.gitignore` (already from GitHub)
  - [ ] `.prettierrc` (code formatting)
  - [ ] `.eslintrc.json` (linting rules)

- [ ] **package.json Template**
  ```json
  {
    "name": "base-memecoin-detector",
    "version": "1.0.0",
    "description": "Automated memecoin detector for Base chain",
    "main": "dist/index.js",
    "scripts": {
      "dev": "ts-node src/index.ts",
      "build": "tsc",
      "start": "node dist/index.js",
      "test": "jest",
      "test:watch": "jest --watch",
      "lint": "eslint src/**/*.ts",
      "format": "prettier --write src/**/*.ts"
    },
    "dependencies": {
      "ethers": "^6.x",
      "axios": "^1.x",
      "node-telegram-bot-api": "^0.x",
      "node-cron": "^3.x",
      "sqlite3": "^5.x",
      "dotenv": "^16.x"
    },
    "devDependencies": {
      "typescript": "^5.x",
      "@types/node": "^20.x",
      "ts-node": "^10.x",
      "jest": "^29.x",
      "@types/jest": "^29.x",
      "eslint": "^8.x",
      "@typescript-eslint/parser": "^6.x",
      "@typescript-eslint/eslint-plugin": "^6.x",
      "prettier": "^3.x"
    }
  }
  ```

- [ ] **tsconfig.json Template**
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "lib": ["ES2020"],
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "tests"]
  }
  ```

- [ ] **.env.example Template**
  ```
  # Clanker API
  CLANKER_API_URL=https://api.clanker.world/...
  CLANKER_API_KEY=your_key_here
  
  # Bankr API
  BANKR_API_URL=https://api.bankr.world/...
  BANKR_API_KEY=your_key_here
  
  # Base RPC
  BASE_RPC_URL=https://base.publicnode.com
  
  # Telegram
  TELEGRAM_BOT_TOKEN=your_bot_token_here
  TELEGRAM_CHAT_ID=your_chat_id_here
  
  # Scoring
  ALERT_THRESHOLD=65
  SCAN_FREQUENCY_MINUTES=10
  
  # Database
  DATABASE_URL=./data/bot.db
  
  # Environment
  NODE_ENV=production
  ```

- [ ] **Create stub files** (empty, for structure)
  ```bash
  touch src/scrapers/{clanker,bankr,rpc-fetcher}.ts
  touch src/analyzers/{wallet,creator-history,liquidity,pump-patterns}.ts
  touch src/scoring/{score-engine,rules}.ts
  touch src/alerts/telegram-notifier.ts
  touch src/database/{schema,db}.ts
  touch src/utils/{logger,errors,rate-limiter}.ts
  touch src/config/{env,constants}.ts
  touch src/index.ts
  ```

**Output:** Project structure initialized, core configs ready

---

#### Task 1.3: Git Workflow Setup
**Goal:** Configure branches and CI/CD

- [ ] **Create Branches**
  ```bash
  git checkout -b develop
  git push -u origin develop
  
  git checkout -b feature/scrapers
  git checkout -b feature/analyzers
  git checkout -b feature/scoring
  git checkout -b feature/alerts
  ```

- [ ] **Branch Protection Rules** (optional, for team)
  - Require PR review before merging to `main`
  - Require all checks pass (CI/CD)

- [ ] **GitHub Actions CI/CD** (create `.github/workflows/ci.yml`)
  ```yaml
  name: CI
  
  on: [push, pull_request]
  
  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: actions/setup-node@v3
          with:
            node-version: 18
        - run: npm install
        - run: npm run lint
        - run: npm test
        - run: npm run build
  ```

- [ ] **Initial Commit**
  ```bash
  git add .
  git commit -m "chore: initial project setup with structure"
  git push -u origin develop
  ```

**Output:** Branches created, CI/CD template in place

---

#### Task 1.4: DevOps & Deployment Planning
**Goal:** Plan production deployment infrastructure

- [ ] **Choose Deployment Platform**
  - Option A: Replit (easiest for beginners, free tier)
  - Option B: Railway (better stability, free tier)
  - Option C: VPS (DigitalOcean $5/month, more control)
  - **Decision:** Railway (better monitoring, auto-restart)

- [ ] **Docker Setup** (for consistency)
  - [ ] Create `Dockerfile`
    ```dockerfile
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY dist ./dist
    CMD ["node", "dist/index.js"]
    ```
  - [ ] Create `docker-compose.yml` (for local dev)
    ```yaml
    version: '3'
    services:
      app:
        build: .
        environment:
          - NODE_ENV=development
          - BASE_RPC_URL=https://base.publicnode.com
        volumes:
          - ./src:/app/src
          - ./data:/app/data
    ```

- [ ] **Secrets Management**
  - [ ] Create 1Password vault for prod secrets (CLANKER_API_KEY, BANKR_API_KEY, TELEGRAM_BOT_TOKEN)
  - [ ] Use Railway secrets (don't commit to git)
  - [ ] Document: how to load secrets in production

- [ ] **Monitoring Setup** (Plan)
  - [ ] Use Railway built-in logs
  - [ ] Setup error alerting (send crash alerts to Drix Telegram)
  - [ ] Setup uptime monitoring (if bot goes down >1 hour, alert)

- [ ] **Deployment Checklist** (for launch day)
  - [ ] Environment variables set in Railway
  - [ ] Database initialized
  - [ ] Secrets securely stored
  - [ ] Health check endpoint working
  - [ ] Logs accessible
  - [ ] Error alerts configured

**Output:** Dockerfile, docker-compose.yml, deployment plan docs

---

#### Task 1.5: Documentation Template Setup
**Goal:** Create docs structure for specs from Phase 0

- [ ] **Create docs directory structure**
  ```
  /docs
    /architecture
      SYSTEM_OVERVIEW.md
      DATA_FLOW.md
      DATABASE_SCHEMA.md
    /specs
      DATA_SOURCES.md
      SCORING_ALGORITHM.md
      PERFORMANCE.md
      ERROR_HANDLING.md
    /deployment
      DEPLOYMENT.md
      MONITORING.md
      TROUBLESHOOTING.md
    /development
      SETUP.md
      CODING_STANDARDS.md
      TESTING.md
  ```

- [ ] **Create main README.md**
  ```markdown
  # Base Memecoin Detector Bot
  
  Automated detection and alerting for interesting memecoin launches on Base chain (Clanker + Bankr).
  
  ## Quick Start
  
  1. Clone repo
  2. `npm install`
  3. Copy `.env.example` to `.env`
  4. Fill in API keys
  5. `npm run dev`
  
  ## Features
  - Real-time monitoring of Clanker + Bankr launches
  - Multi-factor scoring (holders, creator, liquidity, pump patterns)
  - Telegram alerts for opportunities
  - SQLite database for historical analysis
  
  ## Documentation
  See `/docs` for detailed specifications and architecture.
  ```

**Output:** Documentation directory + README

---

**PHASE 1 DELIVERABLES:**
- ✅ GitHub repo created & cloned
- ✅ Project directory structure initialized
- ✅ Core config files (package.json, tsconfig, .env.example)
- ✅ Stub files for all modules
- ✅ Git branches created (develop, feature/*)
- ✅ CI/CD GitHub Actions template
- ✅ Docker + docker-compose setup
- ✅ Documentation directory structure

---

## 📌 PHASE 2: Development Setup (Day 3-4)

### Day 3: Environment & Dependencies

#### Task 2.1: Install Dependencies & Setup
**Goal:** Get development environment ready

- [ ] **Install Node dependencies**
  ```bash
  npm install
  ```
  This installs all packages from package.json

- [ ] **Verify TypeScript setup**
  ```bash
  npm run build
  ```
  Should compile without errors

- [ ] **Setup environment file**
  ```bash
  cp .env.example .env
  # Edit .env with dummy values for now (real API keys later)
  ```

- [ ] **Test dev environment**
  ```bash
  npm run dev
  ```
  Should start without crashing

**Output:** All dependencies installed, dev environment ready

---

#### Task 2.2: Create Configuration Module
**Goal:** Centralized config management

- [ ] **Create `src/config/env.ts`**
  ```typescript
  import dotenv from 'dotenv';
  
  dotenv.config();
  
  export const config = {
    // APIs
    clanker: {
      apiUrl: process.env.CLANKER_API_URL || '',
      apiKey: process.env.CLANKER_API_KEY || '',
    },
    bankr: {
      apiUrl: process.env.BANKR_API_URL || '',
      apiKey: process.env.BANKR_API_KEY || '',
    },
    rpc: {
      baseUrl: process.env.BASE_RPC_URL || 'https://base.publicnode.com',
      backupUrl: process.env.BASE_RPC_BACKUP_URL || '',
    },
    
    // Telegram
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      chatId: process.env.TELEGRAM_CHAT_ID || '',
    },
    
    // Scoring
    scoring: {
      alertThreshold: parseInt(process.env.ALERT_THRESHOLD || '65'),
      premiumThreshold: parseInt(process.env.PREMIUM_THRESHOLD || '80'),
    },
    
    // Operations
    scan: {
      frequencyMinutes: parseInt(process.env.SCAN_FREQUENCY_MINUTES || '10'),
      rateLimitPerMinute: parseInt(process.env.RATE_LIMIT_PER_MIN || '30'),
    },
    
    // Database
    database: {
      url: process.env.DATABASE_URL || './data/bot.db',
    },
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
  
  export default config;
  ```

- [ ] **Create `src/config/constants.ts`**
  ```typescript
  // Scoring weights
  export const SCORING_WEIGHTS = {
    holderDistribution: 0.30,
    creatorHistory: 0.40,
    liquidity: 0.15,
    pumpPattern: 0.15,
  };
  
  // Risk thresholds
  export const RISK_LEVELS = {
    safe: { min: 75, max: 100 },
    caution: { min: 60, max: 74 },
    risky: { min: 0, max: 59 },
  };
  
  // API rate limits (estimated)
  export const RATE_LIMITS = {
    clanker: 100, // requests per minute
    bankr: 100,
    rpc: 150,
  };
  
  // Cache durations
  export const CACHE_DURATION = {
    creatorHistory: 3600, // 1 hour
    tokenAnalysis: 1800, // 30 minutes
  };
  ```

**Output:** Config and constants modules ready

---

#### Task 2.3: Create Logging & Error Handling Utils
**Goal:** Structured logging & error management

- [ ] **Create `src/utils/logger.ts`**
  ```typescript
  import fs from 'fs';
  import path from 'path';
  
  const logsDir = './logs';
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  
  const logFile = path.join(logsDir, `bot-${new Date().toISOString().split('T')[0]}.log`);
  
  export const logger = {
    info: (msg: string, data?: any) => {
      const log = `[${new Date().toISOString()}] INFO: ${msg}`;
      console.log(log, data || '');
      fs.appendFileSync(logFile, log + '\n');
    },
    
    error: (msg: string, err?: any) => {
      const log = `[${new Date().toISOString()}] ERROR: ${msg}`;
      console.error(log, err || '');
      fs.appendFileSync(logFile, log + '\n' + (err?.stack || '') + '\n');
    },
    
    warn: (msg: string, data?: any) => {
      const log = `[${new Date().toISOString()}] WARN: ${msg}`;
      console.warn(log, data || '');
      fs.appendFileSync(logFile, log + '\n');
    },
  };
  ```

- [ ] **Create `src/utils/errors.ts`**
  ```typescript
  export class BotError extends Error {
    constructor(public code: string, message: string, public context?: any) {
      super(message);
      this.name = 'BotError';
    }
  }
  
  export class APIError extends BotError {
    constructor(message: string, public statusCode: number, context?: any) {
      super('API_ERROR', message, context);
    }
  }
  
  export class ValidationError extends BotError {
    constructor(message: string, context?: any) {
      super('VALIDATION_ERROR', message, context);
    }
  }
  
  export class DatabaseError extends BotError {
    constructor(message: string, context?: any) {
      super('DATABASE_ERROR', message, context);
    }
  }
  ```

- [ ] **Create `src/utils/rate-limiter.ts`**
  ```typescript
  export class RateLimiter {
    private calls: number[] = [];
    
    constructor(private maxPerMinute: number) {}
    
    async wait() {
      const now = Date.now();
      this.calls = this.calls.filter(t => now - t < 60000); // Keep only recent
      
      if (this.calls.length >= this.maxPerMinute) {
        const oldestCall = this.calls[0];
        const waitTime = 60000 - (now - oldestCall);
        if (waitTime > 0) {
          await new Promise(r => setTimeout(r, waitTime));
        }
      }
      
      this.calls.push(Date.now());
    }
  }
  ```

**Output:** Logger, error classes, rate limiter ready

---

### Day 4: Database & Base Infrastructure

#### Task 2.4: Create Database Module
**Goal:** SQLite initialization & queries

- [ ] **Create `src/database/schema.ts`**
  ```typescript
  export const schema = `
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_address TEXT UNIQUE NOT NULL,
    name TEXT,
    symbol TEXT,
    launcher TEXT,
    launch_time DATETIME,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    creator_address TEXT,
    score REAL,
    analyzed BOOLEAN DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id INTEGER NOT NULL,
    analysis_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    score REAL,
    holder_distribution_score REAL,
    creator_history_score REAL,
    liquidity_score REAL,
    pump_pattern_score REAL,
    FOREIGN KEY (token_id) REFERENCES tokens(id)
  );
  
  CREATE TABLE IF NOT EXISTS alerts_sent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id INTEGER NOT NULL,
    alert_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_id) REFERENCES tokens(id)
  );
  
  CREATE TABLE IF NOT EXISTS creators (
    creator_address TEXT PRIMARY KEY,
    total_launches INTEGER DEFAULT 0,
    successful_launches INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_tokens_launch_time ON tokens(launch_time);
  CREATE INDEX IF NOT EXISTS idx_tokens_score ON tokens(score DESC);
  CREATE INDEX IF NOT EXISTS idx_analyses_token_id ON analyses(token_id);
  `;
  ```

- [ ] **Create `src/database/db.ts`**
  ```typescript
  import sqlite3 from 'sqlite3';
  import { schema } from './schema';
  import { logger } from '../utils/logger';
  
  export class Database {
    private db: sqlite3.Database;
    
    constructor(dbPath: string) {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          logger.error('Database connection error', err);
          throw err;
        }
        logger.info('Database connected');
      });
      
      this.initialize();
    }
    
    private initialize() {
      this.db.exec(schema, (err) => {
        if (err) {
          logger.error('Schema initialization error', err);
          throw err;
        }
        logger.info('Database schema initialized');
      });
    }
    
    run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID, changes: this.changes });
        });
      });
    }
    
    get(sql: string, params: any[] = []): Promise<any> {
      return new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
    
    all(sql: string, params: any[] = []): Promise<any[]> {
      return new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    }
    
    close(): Promise<void> {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }
  
  export default Database;
  ```

**Output:** Database module with schema and query methods

---

#### Task 2.5: Create Base Interfaces & Types
**Goal:** TypeScript type definitions

- [ ] **Create `src/types/index.ts`**
  ```typescript
  // Token data
  export interface Token {
    contractAddress: string;
    name: string;
    symbol: string;
    launcher: 'clanker' | 'bankr';
    launchTime: Date;
    creatorAddress: string;
    initialLiquidity?: number;
  }
  
  // Analysis results
  export interface TokenAnalysis {
    tokenId: number;
    score: number;
    components: {
      holderDistribution: {
        score: number;
        concentration: number; // % in top 10
        whaleDetected: boolean;
      };
      creatorHistory: {
        score: number;
        launches: number;
        rugPulls: number;
        accountAgeHours: number;
      };
      liquidity: {
        score: number;
        locked: boolean;
        lockDuration?: number;
      };
      pumpPattern: {
        score: number;
        priceMultiplier: number;
        volumeSpike: boolean;
      };
    };
    riskLevel: 'safe' | 'caution' | 'risky';
    recommendation: string;
  }
  
  // Alert message
  export interface Alert {
    tokenId: number;
    token: Token;
    analysis: TokenAnalysis;
    message: string;
    timestamp: Date;
  }
  
  // API response types
  export interface ClankerLaunch {
    contractAddress: string;
    name: string;
    symbol: string;
    launchTime: number;
    creator: string;
  }
  
  export interface BankrLaunch {
    contractAddress: string;
    name: string;
    symbol: string;
    launchTime: number;
    creator: string;
  }
  ```

**Output:** TypeScript type definitions ready

---

**PHASE 2 DELIVERABLES:**
- ✅ All dependencies installed
- ✅ Config module (env.ts, constants.ts)
- ✅ Logger & error handling
- ✅ Rate limiter utility
- ✅ Database module with schema
- ✅ TypeScript interfaces & types
- ✅ Dev environment fully operational

---

## 📌 PHASE 3: Core Development (Days 5-10)

*[This phase is the largest — I'll give you the structure for each component]*

### Overview: 6 major components to build

1. **Scrapers** (2 days) — Fetch tokens from APIs
2. **Analyzers** (2 days) — Analyze token properties
3. **Scoring Engine** (1 day) — Calculate final score
4. **Alerts** (1 day) — Telegram notifications
5. **Database** (1 day) — Persist data
6. **Orchestrator** (1 day) — Main loop

---

#### Task 3.1: Clanker & Bankr Scrapers (Day 5)

**File: `src/scrapers/clanker.ts`**
```typescript
import axios from 'axios';
import { ClankerLaunch } from '../types';
import { logger } from '../utils/logger';
import { RateLimiter } from '../utils/rate-limiter';
import config from '../config/env';

export class ClankerScraper {
  private rateLimiter = new RateLimiter(config.scan.rateLimit Per Minute);
  
  async fetchLatestLaunches(): Promise<ClankerLaunch[]> {
    try {
      await this.rateLimiter.wait();
      
      const response = await axios.get(config.clanker.apiUrl, {
        headers: { 'Authorization': `Bearer ${config.clanker.apiKey}` }
      });
      
      return response.data.launches || [];
    } catch (err) {
      logger.error('Clanker API error', err);
      throw err;
    }
  }
}

export default new ClankerScraper();
```

**File: `src/scrapers/bankr.ts`**
```typescript
// Similar structure to Clanker
```

**File: `src/scrapers/rpc-fetcher.ts`**
```typescript
// Fetch holder, liquidity, contract details from RPC
```

**Deliverable:** Three scraper modules functional

---

#### Task 3.2: Analyzers (Days 6-7)

**File: `src/analyzers/wallet-analyzer.ts`**
```typescript
// Analyze holder distribution, concentration, whale detection
```

**File: `src/analyzers/creator-history.ts`**
```typescript
// Track creator wallet, previous launches, rug history
```

**File: `src/analyzers/liquidity.ts`**
```typescript
// Check if liquidity locked, burnable, safe
```

**File: `src/analyzers/pump-patterns.ts`**
```typescript
// Detect instant 100x pumps, volume spikes, timing
```

**Deliverable:** Four analyzer modules complete

---

#### Task 3.3: Scoring Engine (Day 8)

**File: `src/scoring/score-engine.ts`**
```typescript
// Aggregate all signals, apply weights, calculate final score
```

**Deliverable:** Scoring module working with all weights

---

#### Task 3.4: Telegram Alerts (Day 9)

**File: `src/alerts/telegram-notifier.ts`**
```typescript
// Format alerts, send to Telegram, handle errors
```

**Deliverable:** Alert system operational

---

#### Task 3.5: Database Operations (Day 9)

**File: `src/database/queries.ts`**
```typescript
// CRUD operations for tokens, analyses, alerts
```

**Deliverable:** Database query layer ready

---

#### Task 3.6: Main Orchestrator (Day 10)

**File: `src/index.ts`**
```typescript
// Main loop: scrape → analyze → score → alert
```

**Deliverable:** Full bot operational

---

**PHASE 3 DELIVERABLES:**
- ✅ All 6 core modules implemented
- ✅ Full bot logic complete
- ✅ Database operations functional
- ✅ Telegram integration working
- ✅ Scoring algorithm operational

---

## 📌 PHASE 4: Testing & Optimization (Days 11-12)

### Day 11: Unit & Integration Tests

- [ ] **Unit Tests** (Jest)
  - [ ] Test scrapers (mock API responses)
  - [ ] Test analyzers (verify scoring calculations)
  - [ ] Test scoring engine (check weights applied correctly)
  - [ ] Target: >80% code coverage

- [ ] **Integration Tests**
  - [ ] Test full flow: scrape → analyze → score → alert
  - [ ] Use test data (no real API calls)
  - [ ] Verify database persistence

- [ ] **Manual Testing with Drix**
  - [ ] Run bot locally
  - [ ] Check Telegram alerts (real messages)
  - [ ] Verify scoring matches expectations
  - [ ] Test with recent real memecoin launches

**Output:** All tests passing, bot verified

---

### Day 12: Optimization & Deployment

- [ ] **Performance Tuning**
  - [ ] Profile latency per token
  - [ ] Optimize database queries
  - [ ] Cache creator history
  - [ ] Measure improvement

- [ ] **Deployment to Railway**
  - [ ] Setup Railway account (if needed)
  - [ ] Deploy from GitHub (Railway auto-deploys)
  - [ ] Set environment variables
  - [ ] Verify bot is running 24/7

- [ ] **Monitoring Setup**
  - [ ] Configure error alerts
  - [ ] Setup uptime checks
  - [ ] Verify logs are accessible

**Output:** Bot live and monitoring Base chain

---

**PHASE 4 DELIVERABLES:**
- ✅ All tests passing
- ✅ Bot optimized
- ✅ Deployed to production
- ✅ Monitoring active
- ✅ Drix receiving real alerts

---

## 🎯 TIMELINE SUMMARY

| Phase | Days | Owner | Status |
|-------|------|-------|--------|
| 0: Specs & Architecture | 1-2 | Drax | ⏳ TODO |
| 1: Repo & Infrastructure | 2-3 | Drax | ⏳ TODO |
| 2: Dev Setup | 3-4 | Drax | ⏳ TODO |
| 3: Core Development | 5-10 | Agents | ⏳ TODO |
| 4: Testing & Deploy | 11-12 | Test Bot + DevOps | ⏳ TODO |

**Total: 12 days (2 weeks) for full deployment**

---

## ✅ SUCCESS CHECKLIST

- [ ] Bot detects all new Clanker + Bankr launches
- [ ] Scoring algorithm working correctly
- [ ] Telegram alerts sending within 1 minute
- [ ] No false positives (score ≥65)
- [ ] Database growing (100+ tokens/week)
- [ ] Bot running 24/7 without crashes
- [ ] Drix finding profitable opportunities
- [ ] Revenue generation starting ($1-2k/mois from sniping)

---

**Next action:** Drix confirms if specs are locked → Drax starts Phase 0 → Agents spawn for Phase 3
