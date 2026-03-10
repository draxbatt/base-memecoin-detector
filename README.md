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
- Node.js 18+ ([Download](https://nodejs.org))
- npm or yarn
- Git
- Telegram account

### Step 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/draxbatt/memecoin-bot-project.git
cd memecoin-bot-project

# Install dependencies
npm install

# Install TypeScript and tools
npm install -D
```

### Step 2: Get API Credentials

#### Alchemy RPC (Base Chain)
1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com)
2. Create new app: **Settings** → **Create App**
3. Select **Base** as chain
4. Copy the HTTP endpoint (starts with `https://base-mainnet.g.alchemy.com/v2/...`)

#### Telegram Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` and follow prompts
3. Copy the **bot token** (format: `123456:ABC-DEF...`)
4. Find your chat ID:
   - Create a private group or use a test chat
   - Invite bot to chat
   - Send any message
   - Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
   - Find `chat.id` in the JSON response
   - Use **negative group IDs** for groups (e.g., `-123456789`)

### Step 3: Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Example `.env` file:**
```env
# Base Chain RPC
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
BASE_RPC_FALLBACK=https://rpc.ankr.com/base

# Telegram Configuration
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234567890
TELEGRAM_CHAT_ID=-123456789

# Database
DATABASE_PATH=./data/memecoin.db

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/bot.log

# Scanner Settings
SCAN_INTERVAL_MS=600000  # 10 minutes (600000 ms)
ALERT_SCORE_THRESHOLD=65  # Minimum score for alert

# Feature Toggles
ENABLE_CLANKER=true
ENABLE_BANKR=true
ENABLE_PUMP_DETECTION=true
```

### Step 4: Run the Bot

**Development (with hot reload):**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

**Watch Tests:**
```bash
npm test -- --watch
```

**Manual Testing Harness:**
```bash
npm run test:manual
```

### Step 5: Verify Bot is Running

1. Check console for initialization messages:
   ```
   ✅ Database initialized
   ✅ RPC provider connected
   ✅ Telegram bot connected
   ✅ Scan loop started (interval: 10 minutes)
   ```

2. Manually trigger a test alert (for development):
   ```typescript
   // In src/index.ts, add temporary test:
   bot.testTelegramAlert();
   ```

3. Check bot logs:
   ```bash
   tail -f logs/bot.log
   ```

## 🔐 Environment Variables Guide

Complete reference for all configuration options:

### RPC Configuration
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `BASE_RPC_URL` | ✅ Yes | `https://base-mainnet.g.alchemy.com/v2/...` | Primary Ethereum RPC endpoint for Base chain |
| `BASE_RPC_FALLBACK` | ❌ No | `https://rpc.ankr.com/base` | Fallback RPC if primary fails |
| `RPC_TIMEOUT_MS` | ❌ No | `8000` | RPC request timeout in milliseconds |
| `RPC_MAX_RETRIES` | ❌ No | `3` | Max retry attempts for RPC calls |

### Telegram Configuration
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | ✅ Yes | `123456:ABC-DEF...` | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | ✅ Yes | `-123456789` | Telegram chat/group ID (use negative for groups) |
| `TELEGRAM_RETRY_DELAY_MS` | ❌ No | `2000` | Delay between Telegram send retries |
| `TELEGRAM_ALERT_COOLDOWN_MS` | ❌ No | `120000` | Cooldown between alerts (2 minutes default) |

### Database Configuration
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_PATH` | ❌ No | `./data/memecoin.db` | SQLite database file path |
| `DATABASE_BACKUP_INTERVAL_MS` | ❌ No | `3600000` | Backup interval (1 hour) |

### Logging Configuration
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `LOG_LEVEL` | ❌ No | `info` | Log level: `error`, `warn`, `info`, `debug` |
| `LOG_FILE` | ❌ No | `./logs/bot.log` | Log file path |
| `LOG_MAX_FILES` | ❌ No | `7` | Rotate logs after N days |

### Scanner Settings
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `SCAN_INTERVAL_MS` | ❌ No | `600000` | Scan interval in milliseconds (10 min) |
| `ALERT_SCORE_THRESHOLD` | ❌ No | `65` | Minimum score to send alert (0-100) |
| `PREMIUM_ALERT_THRESHOLD` | ❌ No | `80` | Score for premium/safe alerts |

### Feature Toggles
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `ENABLE_CLANKER` | ❌ No | `true` | Enable Clanker API scraping |
| `ENABLE_BANKR` | ❌ No | `true` | Enable Bankr API scraping |
| `ENABLE_PUMP_DETECTION` | ❌ No | `true` | Enable pump pattern analysis |
| `DRY_RUN_MODE` | ❌ No | `false` | Analyze but don't send alerts |

### API Configuration
| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `CLANKER_API_RATE_LIMIT` | ❌ No | `100` | Clanker rate limit (requests per minute) |
| `CLANKER_API_TIMEOUT_MS` | ❌ No | `8000` | Clanker API timeout |

### Example Production `.env`
```env
# Base RPC
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
BASE_RPC_FALLBACK=https://rpc.ankr.com/base
RPC_TIMEOUT_MS=10000
RPC_MAX_RETRIES=3

# Telegram
TELEGRAM_BOT_TOKEN=123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_ALERT_COOLDOWN_MS=120000

# Database
DATABASE_PATH=./data/memecoin.db
DATABASE_BACKUP_INTERVAL_MS=3600000

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/bot.log
LOG_MAX_FILES=7

# Scanner
SCAN_INTERVAL_MS=600000
ALERT_SCORE_THRESHOLD=65
PREMIUM_ALERT_THRESHOLD=80

# Features
ENABLE_CLANKER=true
ENABLE_BANKR=true
ENABLE_PUMP_DETECTION=true
DRY_RUN_MODE=false

# API
CLANKER_API_RATE_LIMIT=100
CLANKER_API_TIMEOUT_MS=8000
```

### 🚨 Security Best Practices
- **Never commit `.env`** — it's in `.gitignore`
- **Use `.env.local`** for local development secrets
- **Rotate bot tokens** every 90 days
- **Use strong Telegram passwords** (2FA recommended)
- **Limit RPC API key permissions** in Alchemy dashboard
- **Monitor API usage** to catch unauthorized access

## 📱 Telegram Setup Instructions

### Creating a Telegram Bot

**Step 1: Open Telegram BotFather**
```
Search for: @BotFather
Click: Open or Start
```

**Step 2: Create New Bot**
```
Message: /newbot
Response: Alright, a new bot. How are we going to call it?
Your message: MyMemecoinBot
Response: Good. Now let's choose a username for your bot...
Your message: memecoin_detector_bot (must be unique)
```

**Step 3: Save Your Token**
```
Response includes: "Done! Congratulations on your new bot. 
You will find it at t.me/memecoin_detector_bot. 
You can now add a description, about section and profile picture 
for your bot, see /help for a list of commands."

TOKEN: 123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
```

**Step 4: Configure Commands (Optional)**
```
Message: /setcommands
Select your bot: memecoin_detector_bot
Then paste:
status - Show bot status
logs - View recent logs
history - Show alert history
help - Show help menu
```

### Finding Your Chat ID

**For Personal Chats:**
1. Send a message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
3. Replace `<YOUR_TOKEN>` with your actual token
4. Find the `message.from.id` field
5. This is your `TELEGRAM_CHAT_ID`

**For Groups:**
1. Add bot to a group or channel
2. Send any message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
4. Find the `message.chat.id` field
5. **Use the negative ID** (e.g., if ID is `123456789`, use `-123456789`)
6. Set this as `TELEGRAM_CHAT_ID` in `.env`

### Testing Your Setup

```bash
# Install curl if needed
# Then test the connection:
curl -X POST \
  https://api.telegram.org/bot<YOUR_TOKEN>/sendMessage \
  -H 'Content-Type: application/json' \
  -d '{
    "chat_id": "<YOUR_CHAT_ID>",
    "text": "🤖 Memecoin Bot is online!",
    "parse_mode": "Markdown"
  }'
```

Expected response:
```json
{"ok": true, "result": {"message_id": 123, ...}}
```

### Receiving Alerts

Once running, you'll receive alerts like:

```
🎯 Memecoin Alert — Score: 72/100 (CAUTION)

📊 Token: DexMeme (DXM)
📍 CA: 0x1234...5678
⏰ Launched: 2 minutes ago

📈 Scores:
  • Holders: 68/100 (distributed)
  • Creator: 75/100 (established wallet)
  • Liquidity: 65/100 (partially locked)
  • Pump: 78/100 (moderate growth)

⚠️ Risks:
  • 35% in top 10 holders
  • 2-year-old creator wallet

✅ Positives:
  • >$50k locked liquidity
  • 250+ holders

🔗 [Dexscreener](https://dexscreener.com/base/0x1234...5678) | [Basescan](https://basescan.org/token/0x1234...5678)
```

### Troubleshooting Telegram

| Issue | Solution |
|-------|----------|
| "Invalid token" | Check token format: `123456:ABC-DEF...` |
| "Chat not found" | Verify chat ID is correct (try `/getUpdates`) |
| "Message blocked" | Check Telegram privacy settings, remove restrictions |
| "Timeout" | Ensure internet connection, check firewall |
| "Unauthorized" | Verify bot token is correct, hasn't expired |

## 🐛 Troubleshooting Guide

### Bot Won't Start

**Error:** `Cannot find module 'ethers'`
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3000`
```bash
# Solution: Check RPC URL in .env
# Make sure BASE_RPC_URL is correct:
echo $BASE_RPC_URL
# Should output: https://base-mainnet.g.alchemy.com/v2/...
```

### Database Errors

**Error:** `SQLITE_CANTOPEN: unable to open database`
```bash
# Solution: Create data directory
mkdir -p data
# Then restart bot
npm start
```

**Error:** `database is locked`
```bash
# Solution: Only one bot instance can run at a time
# Stop any other instances:
pkill -f "npm start"
# Or restart:
npm run dev
```

### Telegram Not Receiving Alerts

**Check 1: Verify bot is running**
```bash
# Check logs
tail -f logs/bot.log
# Should show: "✅ Telegram bot connected"
```

**Check 2: Verify chat ID**
```bash
# Test message manually
curl -X POST https://api.telegram.org/bot<TOKEN>/sendMessage \
  -d chat_id=<CHAT_ID> \
  -d text="Test message"
```

**Check 3: Check firewall/blocking**
```bash
# Verify Telegram API is accessible
curl https://api.telegram.org/bot<TOKEN>/getMe
# Should return bot info
```

**Check 4: Verify score threshold**
```bash
# Check .env setting
grep ALERT_SCORE_THRESHOLD .env
# Default is 65
```

### Performance Issues

**High Memory Usage:**
```bash
# Check memory
ps aux | grep node
# If >500MB, likely memory leak
# Solution: Restart bot daily with cron:
# 0 0 * * * cd /path/to/bot && npm start
```

**Slow RPC Queries:**
```bash
# Check RPC latency
time curl https://base-mainnet.g.alchemy.com/v2/YOUR_KEY \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
# Should respond in <2 seconds
```

**Database Slow:**
```bash
# Rebuild database
rm data/memecoin.db
npm start
# This recreates schema
```

### Tests Failing

**`npm test` fails:**
```bash
# Clear cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- --testPathPattern=scoring
```

**TypeScript Errors:**
```bash
# Recompile
npm run build

# Check for syntax errors
npx tsc --noEmit
```

### API Rate Limiting

**Error:** `429 Too Many Requests`
```bash
# Solution: Increase scan interval
# In .env:
SCAN_INTERVAL_MS=900000  # 15 minutes instead of 10
```

**Solution 2: Reduce batch size**
```bash
# In src/index.ts, reduce tokens per scan:
const TOKENS_PER_SCAN = 20  // instead of 50
```

### Network Issues

**Bot keeps disconnecting:**
```bash
# Check internet
ping google.com

# Restart with auto-reconnect
npm start -- --auto-restart

# Or use pm2
npm install -g pm2
pm2 start src/index.ts --name "memecoin-bot"
pm2 startup
pm2 save
```

### Getting Help

1. **Check logs first:**
   ```bash
   cat logs/bot.log | grep -i error
   ```

2. **Enable debug logging:**
   ```bash
   LOG_LEVEL=debug npm start
   ```

3. **Test individual components:**
   ```bash
   npm run test:manual
   ```

4. **Report issues with:**
   - Full error message (from logs)
   - Your `.env` settings (without secrets)
   - Recent transactions/tokens that caused issue
   - Node.js version: `node --version`

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
