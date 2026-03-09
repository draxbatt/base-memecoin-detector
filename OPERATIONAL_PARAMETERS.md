# ⚙️ Operational Parameters & Error Handling Specification

**Status:** ✅ FINALIZED  
**Date:** 2026-03-09  
**Owner:** Drax Agent (dev-coder-runner)  
**Phase:** 0 (Specs & Architecture)  
**Depends On:** DATA_SOURCES.md, SCORING_ALGORITHM.md, TELEGRAM_CONFIG.md ✅

---

## Overview

This document defines the operational parameters, performance targets, and error handling strategies for the Base Chain Memecoin Detector Bot.

---

## 1️⃣ SCAN FREQUENCY & OPERATIONAL LIMITS

### Scan Schedule Decision

**Primary Scan Interval:** Every 10 minutes

**Rationale:**
- 5-minute scans: Excessive API usage, diminishing returns (99.5% of tokens already caught by 10min)
- 10-minute scans: Sweet spot (99% coverage, reasonable API usage, cost-effective)
- 15-minute scans: Too much latency, misses early opportunities

### Scan Window Timeline

**For Each 10-Minute Scan:**

```
T=0s   : Check Clanker API (last 50 tokens)
T=1s   : Check Bankr factory events (last 10 min)
T=2s   : Deduplicate & enrich with RPC (batch size: 30 tokens)
T=5s   : Score each token
T=8s   : Query/rate-limit checks
T=9s   : Send alerts to Telegram
T=10s  : Complete, wait for next scan

Total: ~10 seconds per scan cycle
```

### Expected Token Volume

**Clanker Launches per 10 Minutes:**
- Average: 15-25 tokens/10min
- Peak: 40+ tokens/10min
- Low: 5-10 tokens/10min
- **Estimate for calculations: 20 tokens/scan**

**Bankr Launches per 10 Minutes:**
- Average: 2-5 tokens/10min
- Peak: 10+ tokens/10min
- Low: 1-2 tokens/10min
- **Estimate for calculations: 3 tokens/scan**

**After Deduplication:**
- **Final: ~20-25 unique tokens per scan**

### Daily/Weekly/Monthly Projections

```
Tokens per scan:    23
Scans per hour:     6
Tokens per hour:    138

Tokens per day:     3,312
Tokens per week:    23,184
Tokens per month:   99,360 (rough estimate)

Database growth:
  ~1 KB per token analyzed (metadata + score + metadata)
  Per month: ~100 MB
```

---

## 2️⃣ PERFORMANCE TARGETS

### Latency Targets

| Component | Target | Notes |
|-----------|--------|-------|
| **Clanker API response** | <1s | Public API, usually fast |
| **RPC call (single)** | <200ms | Alchemy fast, with fallback |
| **Score calculation** | <100ms | Pure computation |
| **Token analysis (per token)** | <3s | Parallel RPC calls |
| **Batch analysis (25 tokens)** | <10s | Parallel processing |
| **Telegram send** | <2s | With retry logic |
| **Complete scan cycle** | <15s | 10s processing + 5s margin |

**Success Criteria:**
- 95% of scans complete within 15 seconds
- 99% of scans complete within 30 seconds
- <0.1% of scans exceed 60 seconds (indicates failure)

### Resource Targets

| Resource | Target | Justification |
|----------|--------|----------------|
| **Memory** | <256 MB | Running on cheap VPS/Replit |
| **CPU** | <30% average | Single-threaded Node.js OK |
| **Disk I/O** | <100 MB/month | SQLite is efficient |
| **Network** | <10 Mbps peak | Batch requests, efficient |

### Uptime Target

**Target:** 99.5% uptime (max 3.6 hours downtime/month)

```
Availability   Days/Month  Downtime/Month
99.5%          29.99       ~10.8 hours
99.9%          29.997      ~2.2 hours
99.99%         29.9997     ~13 minutes
```

**For initial launch:** 99.5% acceptable. Move to 99.9% in v2.

---

## 3️⃣ API CALL BUDGET

### Clanker API Budget

```
Calls per scan:     1
Scans per hour:     6
Calls per hour:     6
Calls per day:      144

Rate limit:         100 req/min = 6,000 req/hour
Daily budget:       6,000 × 24 = 144,000 req/day

Utilization:        144 / 144,000 = 0.1%  ✅ (plenty of room)
```

### RPC API Budget (Alchemy)

**Per token analysis:**
- Get metadata (name, symbol, decimals, supply): 4 calls
- Get holders (Transfer logs): 2 calls
- Get liquidity (pool reserves): 2 calls
- **Subtotal per token: 8 calls**

**Per scan (25 tokens):**
```
25 tokens × 8 calls = 200 RPC calls per scan
```

**Daily budget:**
```
200 calls/scan × 6 scans/hour × 24 hours = 28,800 calls/day
```

**Alchemy rate limits:**
```
Free tier:  300 req/sec = 25,920,000 req/day
Paid tier:  3,000 req/sec = 259,200,000 req/day
```

**Utilization:**
```
28,800 / 25,920,000 = 0.11% ✅ (extremely low)
```

**Conclusion:** Even free tier Alchemy handles this easily.

### Telegram API Budget

**Alerts per day:**
- Normal alerts (score 65-79): ~10-15 per day
- Premium alerts (score 80+): ~2-3 per day
- **Total: ~15-18 alerts per day**

**Telegram limits:**
```
Per chat: ~10,000 messages/day
Per account: No hard limit for bots
```

**Utilization:**
```
18 messages / 10,000 limit = 0.18% ✅ (well within limits)
```

---

## 4️⃣ DATABASE SPECIFICATIONS

### Schema Overview

```sql
-- Tokens table
CREATE TABLE tokens (
  id INTEGER PRIMARY KEY,
  ca TEXT UNIQUE NOT NULL,           -- Contract address
  name TEXT,
  symbol TEXT,
  decimals INTEGER,
  total_supply TEXT,
  creator TEXT,
  launch_time DATETIME,
  discovered_at DATETIME DEFAULT NOW,
  launch_price REAL,
  current_price REAL,
  liquidity_usd REAL,
  holder_count INTEGER,
  is_burned BOOLEAN,
  is_liquidity_locked BOOLEAN,
  lock_expiry DATETIME,
  created_at DATETIME DEFAULT NOW,
  updated_at DATETIME DEFAULT NOW
);

-- Analysis results
CREATE TABLE analyses (
  id INTEGER PRIMARY KEY,
  token_id INTEGER,
  holder_score REAL,
  creator_score REAL,
  liquidity_score REAL,
  pump_score REAL,
  final_score REAL,
  recommendation TEXT,
  analyzed_at DATETIME DEFAULT NOW,
  FOREIGN KEY(token_id) REFERENCES tokens(id)
);

-- Alerts sent
CREATE TABLE alerts_sent (
  id INTEGER PRIMARY KEY,
  token_id INTEGER,
  score REAL,
  alert_type TEXT,  -- 'normal' or 'premium'
  sent_at DATETIME DEFAULT NOW,
  message_id INTEGER,  -- Telegram message ID
  FOREIGN KEY(token_id) REFERENCES tokens(id)
);

-- Creator cache
CREATE TABLE creators (
  id INTEGER PRIMARY KEY,
  address TEXT UNIQUE NOT NULL,
  wallet_age INTEGER,  -- days
  previous_launches INTEGER,
  successful_launches INTEGER,
  rug_pulls INTEGER,
  portfolio_memecoin_pct REAL,
  last_activity DATETIME,
  cached_at DATETIME DEFAULT NOW
);

-- Muted tokens (user mutes)
CREATE TABLE muted_tokens (
  id INTEGER PRIMARY KEY,
  token_id INTEGER,
  muted_until DATETIME,
  reason TEXT,
  FOREIGN KEY(token_id) REFERENCES tokens(id)
);

-- Failed alerts (for retry)
CREATE TABLE failed_alerts (
  id INTEGER PRIMARY KEY,
  token_id INTEGER,
  message TEXT,
  failed_at DATETIME DEFAULT NOW,
  retry_count INTEGER DEFAULT 0,
  permanently_failed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY(token_id) REFERENCES tokens(id)
);
```

### Query Performance

**Key indexes:**
```sql
CREATE INDEX idx_tokens_ca ON tokens(ca);
CREATE INDEX idx_tokens_launch_time ON tokens(launch_time);
CREATE INDEX idx_analyses_token_id ON analyses(token_id);
CREATE INDEX idx_alerts_sent_token_id ON alerts_sent(token_id);
CREATE INDEX idx_analyses_score ON analyses(final_score);
```

**Query targets:**
- `SELECT token WHERE ca = ?`: <5ms
- `SELECT tokens WHERE launch_time > ?`: <50ms
- `SELECT analyses WHERE score > 65 ORDER BY score DESC LIMIT 10`: <100ms

### Storage Capacity

```
Per token record:     ~1 KB
Per analysis record:  ~0.5 KB
Total per token:      ~1.5 KB

Monthly growth:       25 tokens/scan × 6 scans/hour × 24 hours × 30 days
                    = 108,000 tokens/month × 1.5 KB
                    = ~162 MB/month

Yearly growth:        ~1.9 GB/year

Retention policy:     Keep 1 year of data (need ~2 GB storage)
```

**Action:** Archive data older than 1 year to separate file (if needed).

---

## 5️⃣ ERROR HANDLING STRATEGY

### Error Categories

#### Category 1: Transient Errors (Retry)

| Error | Cause | Strategy |
|-------|-------|----------|
| Network timeout | RPC/API slow | Exponential backoff: 1s, 2s, 4s, 8s |
| Rate limit (429) | Too many requests | Wait + retry: 60s (from Retry-After header) |
| Service unavailable (503) | Temporary outage | Exponential backoff: 10s, 30s, 60s |
| Telegram timeout | Slow API | Retry queue, max 5 attempts |

**Max retries:** 3-5 per request
**Total delay:** Up to 15 seconds (then fail and log)

#### Category 2: Permanent Errors (Skip & Log)

| Error | Cause | Strategy |
|-------|-------|----------|
| Invalid contract address | Malformed token | Reject, log, continue |
| RPC bad data | Corrupted response | Validate schema, reject, log |
| Telegram chat not found | Invalid chat ID | Log critical, require reconfiguration |
| Database corruption | Disk error | Alert admin, pause bot, manual recovery |

**Action:** Log error, skip token, continue scanning

#### Category 3: Critical Errors (Alert & Pause)

| Error | Cause | Strategy |
|-------|-------|----------|
| All RPC endpoints down | Infrastructure failure | Alert admin, retry every 30s |
| Clanker API permanently broken | API deprecated | Alert admin, switch to backup (manual TX monitoring) |
| Database inaccessible | Disk/permission issue | Stop bot, alert admin |

**Action:** Alert admin via Telegram, attempt auto-recovery, pause if critical

---

## 6️⃣ ERROR HANDLING IMPLEMENTATION

### RPC Fallback Strategy

```typescript
async function getRpcData(fn) {
  const providers = [
    'https://base-mainnet.g.alchemy.com/v2/KEY1',      // Primary
    'https://base.infura.io/v3/KEY2',                  // Secondary
    'https://rpc.ankr.com/base',                        // Fallback
  ];
  
  for (const provider of providers) {
    try {
      const rpc = new ethers.JsonRpcProvider(provider);
      return await fn(rpc);
    } catch (e) {
      logger.warn(`RPC ${provider} failed: ${e.message}`);
      // Continue to next provider
    }
  }
  
  throw new Error('All RPC providers failed');
}
```

### Clanker API Fallback

```typescript
async function getClankerTokens() {
  try {
    // Primary: Clanker API
    return await fetch('https://clanker.world/api/tokens?limit=50').json();
  } catch (e) {
    logger.warn(`Clanker API failed: ${e.message}`);
    // Fallback: Bankr RPC monitoring (slower)
    return await getClankerTokensFromRPC();
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
async function retryWithBackoff(fn, maxRetries = 3) {
  const backoffs = [1000, 2000, 4000, 8000];  // ms
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (e.code === 429) {
        // Rate limited, use Retry-After header
        const retryAfter = parseInt(e.response.headers['retry-after']) || 60;
        await sleep(retryAfter * 1000);
      } else if (isTransient(e)) {
        await sleep(backoffs[i]);
      } else {
        throw e;  // Permanent error, don't retry
      }
    }
  }
  
  throw lastError;
}
```

### Data Validation

```typescript
function validateToken(token) {
  if (!token.ca || !token.ca.startsWith('0x')) {
    throw new Error('Invalid contract address');
  }
  if (!token.name || !token.symbol) {
    throw new Error('Missing token metadata');
  }
  if (token.supply <= 0 || token.supply > 10**36) {
    throw new Error('Invalid supply');
  }
  if (!token.creator || token.creator === '0x0000...') {
    throw new Error('Invalid creator');
  }
  if (token.launch_time > Date.now()) {
    throw new Error('Future launch timestamp');
  }
  return true;
}
```

### Logging Strategy

```typescript
logger.debug(`[SCAN] Starting scan cycle ${scanId}`);
logger.info(`[CLANKER] Fetched 23 tokens from Clanker`);
logger.info(`[DEDUPE] 3 tokens already in database, 20 new`);
logger.info(`[SCORE] Scored 20 tokens, 3 alerts triggered`);
logger.info(`[TELEGRAM] Sent alert for BASEDOGE (score 87)`);
logger.warn(`[RPC] Alchemy timeout on call #5, retrying with Infura`);
logger.error(`[DB] Failed to insert token: ${error.message}`);
logger.debug(`[SCAN] Scan completed in 8.3s`);
```

**Log levels:**
- `DEBUG`: Detailed execution flow (disabled in production)
- `INFO`: Important events (scan completed, alerts sent)
- `WARN`: Recoverable errors (retry happened)
- `ERROR`: Serious issues (failed insertion, API unreachable)

---

## 7️⃣ MONITORING & ALERTING

### Metrics to Track

```typescript
interface BotMetrics {
  tokensAnalyzedToday: number;
  alertsSentToday: number;
  premiumAlerts: number;
  normalAlerts: number;
  failedAlerts: number;
  averageScanTime: number;  // ms
  rpcCallsTotal: number;
  rpcErrorRate: number;  // percentage
  uptimePercentage: number;
  lastScanTime: Date;
  lastErrorTime: Date;
}
```

### Health Checks

**Every scan:**
```
✓ Can reach Clanker API
✓ Can reach RPC endpoint
✓ Can reach Telegram API
✓ Database is writable
✓ No error rate spike (>5% in last hour)
```

**If any check fails:**
```
→ Log warning
→ Try fallback provider
→ If still failed after retries:
  → Alert admin: "HEALTH CHECK FAILED: RPC unreachable"
  → Pause bot and wait for recovery
```

### Admin Alerts

**Send to Drix's Telegram if:**

1. **Bot crash:** "🚨 Bot crashed at 14:32, restarting..."
2. **No tokens detected for 30+ min:** "⚠️ No tokens detected for 30 min, check if Clanker API is down"
3. **Error rate spike:** "⚠️ Error rate 15% in last hour, investigate RPC issues"
4. **Database full:** "🚨 Database approaching size limit, archive data"
5. **Telegram delivery failure:** "🚨 Failed to send alert 5 times, Telegram may be blocked"

---

## 8️⃣ RATE LIMITING IMPLEMENTATION

### Global Rate Limiter

```typescript
class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private minGapMs = 2000;  // 2 seconds between alerts
  private lastAlertTime = 0;
  
  async sendAlert(message: string) {
    // Queue alert instead of sending immediately
    this.queue.push(async () => {
      const now = Date.now();
      const timeSinceLastAlert = now - this.lastAlertTime;
      
      if (timeSinceLastAlert < this.minGapMs) {
        await sleep(this.minGapMs - timeSinceLastAlert);
      }
      
      await telegram.sendMessage(message);
      this.lastAlertTime = Date.now();
    });
    
    this.processQueue();
  }
  
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      await fn();
    }
    
    this.processing = false;
  }
}
```

### Token-Specific Rate Limiting

```typescript
// Don't alert for same token twice in 24 hours
const TokenAlertCache = new Map<string, Date>();

function shouldAlert(tokenCA: string): boolean {
  const lastAlert = TokenAlertCache.get(tokenCA);
  if (!lastAlert) return true;
  
  const hoursSinceLastAlert = (Date.now() - lastAlert.getTime()) / (3600 * 1000);
  return hoursSinceLastAlert >= 24;  // Wait 24 hours for re-alert
}
```

---

## 9️⃣ GRACEFUL SHUTDOWN

### SIGTERM Handling

```typescript
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  
  // Stop accepting new scans
  scanInterval.unref();
  
  // Wait for current scan to finish (max 30s)
  await Promise.race([
    currentScan,
    sleep(30 * 1000),
  ]);
  
  // Close database
  await database.close();
  
  // Send final alert
  await telegram.sendMessage('Bot shutting down');
  
  process.exit(0);
});
```

---

## 🔟 CONFIGURATION CONSTANTS

### `.env.example`

```bash
# API Keys
TELEGRAM_BOT_TOKEN=1234567890:ABCDefGHIJKlmnoPQRstUVwxyZ
TELEGRAM_CHAT_ID=123456789
ALCHEMY_API_KEY=your-alchemy-key
INFURA_API_KEY=your-infura-key

# Scanning
SCAN_INTERVAL_MINUTES=10
ALERT_THRESHOLD_SCORE=65
PREMIUM_THRESHOLD_SCORE=80

# Rate Limiting
MIN_ALERT_GAP_SECONDS=120
MAX_ALERTS_PER_HOUR=30
MAX_RETRIES=3

# Database
DATABASE_PATH=./bot.db
DATABASE_BACKUP_INTERVAL_HOURS=6

# Monitoring
LOG_LEVEL=info
SEND_DAILY_SUMMARY=true
SUMMARY_TIME_CET=09:00

# Features (toggle)
FEATURE_BANKR_ENABLED=true
FEATURE_HOLD_ANALYSIS=true
FEATURE_CREATOR_HISTORY=true
FEATURE_WATCHLIST=true
```

---

## ✅ Sign-Off

- **Performance targets set:** ✅
- **API budgets calculated:** ✅
- **Error handling strategy defined:** ✅
- **Monitoring plan created:** ✅
- **Rate limiting specified:** ✅
- **Ready for development:** ✅

---

## 📋 PHASE 0 SUMMARY

All Phase 0 specs are now complete:

1. ✅ **DATA_SOURCES.md** - All APIs, endpoints, schemas
2. ✅ **SCORING_ALGORITHM.md** - Complete scoring formula
3. ✅ **TELEGRAM_CONFIG.md** - Alert templates, bot setup
4. ✅ **OPERATIONAL_PARAMETERS.md** - This document

**Next Phase:** Phase 1 (Repository & Infrastructure)
- Create GitHub repo
- Setup CI/CD pipeline
- Create deployment documentation

---

**Last Updated:** 2026-03-09  
**Status:** ✅ PHASE 0 COMPLETE - READY FOR PHASE 1
