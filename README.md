# Base Memecoin Detector Bot

Automated detection and scoring of memecoin launches on the Base chain using data from Clanker and Bankr.

## 📦 Features

✅ **Multi-Source Scraping**
- Clanker launcher API integration
- Bankr new token detection
- Base RPC integration for on-chain data

✅ **Comprehensive Analysis**
- Holder distribution analysis (concentration, diversification)
- Creator history analysis (wallet age, previous launches, rug pulls)
- Liquidity analysis (lock status, amounts)
- Pump pattern detection

✅ **Intelligent Scoring**
- Weighted scoring algorithm (Holders 30%, Creator 40%, Liquidity 15%, Pump 15%)
- Customizable thresholds
- Risk flags and positive indicators
- Recommendation system (SAFE/CAUTION/AVOID)

✅ **Telegram Alerts**
- Real-time alerts for qualifying tokens
- Rate-limited to prevent spam (1 alert per 2 minutes)
- Formatted with component scores, risks, and positives
- Quick links to Dexscreener and Basescan

✅ **Database Storage**
- SQLite for reliable persistence
- Token records with metadata
- Analysis history tracking
- Alert status tracking (prevent duplicates)

✅ **Production Ready**
- Comprehensive logging (Winston)
- Error handling and retry logic
- Type-safe TypeScript codebase
- Full test coverage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your credentials:
```bash
# Get these from:
# - Alchemy (BASE_RPC_URL): https://dashboard.alchemy.com
# - Telegram BotFather (TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID)
```

### Running the Bot

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**Testing:**
```bash
npm test
npm run test:watch
```

## 📊 Scoring Algorithm

### Component Scores (0-100 each)

#### Holder Distribution (30%)
- Green: <50% in top 10 (diversified)
- Yellow: 50-80% concentration
- Red: >80% concentration or single holder >50%

#### Creator History (40%)
- Green: 3+ successful launches, wallet >6 months old
- Yellow: 1-2 launches, wallet 1-6 months old
- Red: Previous rug pulls, brand new wallet (<7 days)

#### Liquidity Analysis (15%)
- Green: Locked liquidity, >$50k
- Yellow: Partial lock, $5-50k
- Red: Unlocked liquidity, <$5k

#### Pump Patterns (15%)
- Green: Gradual growth (2-5x first hour), consistent volume
- Yellow: Moderate pump (5-20x)
- Red: Instant 100x+, all volume first 5 minutes

### Final Score
```
Final Score = (Holder×0.30) + (Creator×0.40) + (Liquidity×0.15) + (Pump×0.15)
```

**Alert Thresholds:**
- ≥65 = CAUTION (Alert sent)
- ≥80 = SAFE (Premium alert)
- <50 = AVOID

## 📁 Project Structure

```
.
├── src/
│   ├── config/          # Configuration management
│   ├── scrapers/        # Data source integrations
│   │   ├── launchers.ts # Clanker & Bankr
│   │   └── rpc.ts       # Ethereum RPC
│   ├── analyzers/       # Token analysis modules
│   ├── scoring/         # Scoring engine
│   ├── database/        # SQLite persistence
│   ├── alerts/          # Telegram notification system
│   ├── utils/           # Helpers (logger, errors, HTTP client)
│   ├── main.ts          # Entry point
│   └── index.ts         # Main bot orchestrator
├── tests/               # Jest test suites
├── dist/                # Compiled JavaScript
└── package.json         # Dependencies
```

## 🧪 Test Coverage

- **Scoring Engine**: 4 test cases
  - Weighted score calculation
  - Recommendation logic
  - Risk/positive flag aggregation

- **Analyzers**: 11 test cases
  - Holder concentration analysis
  - Creator wallet age penalties/rewards
  - Liquidity lock and amount scoring

Run tests with:
```bash
npm test                 # Run once
npm run test:watch      # Watch mode
```

## 🔧 Database Schema

### tokens
```sql
id, contractAddress (UNIQUE), name, symbol, launchTime, 
firstSeen, lastUpdated, source, created_at
```

### analyses
```sql
id, tokenId, score, holderScore, creatorScore, liquidityScore, pumpScore,
risks (JSON), positives (JSON), timestamp, created_at
```

### alerts_sent
```sql
id, tokenId (UNIQUE), alertTime, messageId, created_at
```

## 📡 Integration Points

### Clanker
- **Endpoint:** `/launches` (configurable)
- **Method:** GET
- **Rate Limit:** Configurable

### Bankr
- **Endpoint:** `/new-tokens` (configurable)
- **Method:** GET
- **Rate Limit:** Configurable

### Base RPC
- **Methods Used:**
  - `eth_call` for token contract functions
  - `eth_blockNumber` for verification
- **Provider Options:**
  - Alchemy (recommended)
  - Infura
  - QuickNode
  - Public endpoints (slower)

### Telegram
- **Bot API:** `sendMessage`
- **Rate Limit:** 1 message per 2 minutes (configurable)
- **Format:** Markdown with inline buttons

## 🚨 Error Handling

- **Retry Logic:** Exponential backoff (max 3 attempts)
- **Rate Limiting:** Automatic cooldown detection (429 handling)
- **Connection Failures:** Graceful degradation with logging
- **Database Errors:** Wrapped with context for debugging

## 🔐 Security

- **Environment Variables:** Use `.env.local` for sensitive data
- **Database:** SQLite (can upgrade to PostgreSQL for production)
- **API Keys:** Never commit to version control
- **Logging:** No sensitive data logged

## 📈 Monitoring

Logs are written to:
- **Console:** Colored output (development)
- **error.log:** All errors
- **combined.log:** All log levels

Set `LOG_LEVEL` in `.env`:
```
error, warn, info, http, debug
```

## 🔗 Quick Links

- **Dexscreener:** https://dexscreener.com/base/{token}
- **Basescan:** https://basescan.org/token/{token}
- **Base RPC Docs:** https://docs.alchemy.com/reference/base-api
- **Telegram Bot API:** https://core.telegram.org/bots/api

## 📝 Phase Development

- ✅ Phase 3: Core Development (THIS)
  - Data scrapers (Clanker, Bankr, RPC)
  - Analysis modules (Wallet, Creator, Liquidity)
  - Scoring engine with weights
  - Telegram alert system
  - SQLite database
  - Jest tests

- ⏳ Phase 4: Hardening
  - Edge case testing
  - Performance optimization
  - Error recovery patterns
  - Rate limit tuning

- ⏳ Phase 5: Deployment
  - Docker containerization
  - Kubernetes manifests (optional)
  - CI/CD pipeline
  - Monitoring setup

## 📄 License

MIT

## 🤝 Contributing

PRs welcome. Please include tests for new features.

---

**Built with ❤️ for the Base ecosystem**
