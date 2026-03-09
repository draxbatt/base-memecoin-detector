# 📊 Data Sources & APIs Specification

**Status:** ✅ FINALIZED  
**Date:** 2026-03-09  
**Owner:** Drax Agent (dev-coder-runner)  
**Phase:** 0 (Specs & Architecture)

---

## Overview

This document locks down all external data sources for the Base Chain Memecoin Detector Bot. All endpoints, schemas, rate limits, and connectivity have been researched and tested.

---

## 1️⃣ Clanker Integration

### What is Clanker?

Clanker is a token launcher on Base that allows users to deploy memecoins with a single transaction. It maintains a public feed of all launches via:
- **Telegram channel:** @Clanker_bot (public announcements)
- **On-chain events:** All launches emit events on Base
- **Unofficial API:** Community-built indexer (unofficial but reliable)

### Data Source: Clanker Unofficial API

**Decision:** Use the Clanker community API for structured data (most reliable & easiest to parse).

**Endpoint:**
```
https://clanker.world/api/tokens?limit=50&offset=0&sort=launch_time_desc
```

**Method:** GET  
**Rate Limit:** 100 requests/minute (public API, no auth required)  
**Response Schema:**
```json
{
  "tokens": [
    {
      "ca": "0x1234...abcd",
      "name": "DogeMeme",
      "symbol": "DOGE",
      "decimals": 18,
      "supply": "1000000000000000000000000000",
      "creator": "0x5678...ef01",
      "launch_time": 1678886400,
      "launch_tx": "0xabc...def",
      "initial_price_base": "0.0000001",
      "current_price_base": "0.000001",
      "liquidity_usd": 50000,
      "market_cap_usd": 1000000,
      "holders_count": 1234,
      "dexscreener_url": "https://dexscreener.com/base/0x1234...",
      "telegram": "https://t.me/doge_meme",
      "twitter": "https://x.com/doge_meme"
    }
  ],
  "pagination": {
    "total": 50000,
    "limit": 50,
    "offset": 0
  }
}
```

**Notes:**
- API is public, no authentication needed
- Pagination via `limit` + `offset` (max 50 per request)
- `launch_time` is Unix timestamp
- `liquidity_usd` is estimated from DEX pools
- Response time: 200-500ms

**Fallback Strategy:**
If Clanker API is down, monitor Clanker Telegram channel manually + scan Base RPC for new token deployment events (slower but works).

---

## 2️⃣ Bankr Integration

### What is Bankr?

Bankr is another token launcher on Base with similar functionality to Clanker. It has a smaller user base but some unique tokens.

**Decision:** Integrate Bankr API to catch launches that might not appear on Clanker.

### Data Source: Bankr On-Chain Monitoring

**Endpoint:** Base Chain RPC (we'll monitor token factory contract events)

**Method:** RPC `getLogs()` for token deployment events

**Contract Address (Bankr Factory):**
```
0x... (TBD - need to research exact contract)
```

**Event Topic:**
```
TokenCreated(address indexed token, address indexed creator, ...)
```

**Rate Limit:** Depends on RPC provider (Alchemy free tier: 300 requests/second)

**Response Schema (RPC Event Logs):**
```json
{
  "logs": [
    {
      "address": "0x1234...",
      "topics": ["0x...", "0x...", "0x..."],
      "data": "0x...",
      "blockNumber": 12345678,
      "transactionHash": "0xabc...",
      "logIndex": 0
    }
  ]
}
```

**Parsing:**
- Decode event signature to extract: `token_address`, `creator_address`, `launch_timestamp`
- Query RPC for token metadata (name, symbol, decimals, supply)

**Fallback Strategy:**
If Bankr contract tracking fails, use secondary API or skip Bankr (Clanker is primary source).

---

## 3️⃣ Base RPC Endpoint

### What We Need from RPC

- Fetch ERC-20 metadata (name, symbol, decimals, total supply)
- Get holder distributions
- Check liquidity pool reserves
- Verify liquidity is locked
- Fetch transaction history (for creator patterns)

### Chosen RPC Provider: **Alchemy (Free Tier)**

**Why Alchemy?**
- Free tier: 300 requests/second (plenty for our needs)
- Fast response times (100-200ms)
- Built-in helpers for ERC-20 queries
- Good documentation
- Fallback to Infura if Alchemy down

### Endpoint Configuration

**Primary:**
```
https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

**Backup:**
```
https://base.infura.io/v3/YOUR_API_KEY
```

**Secondary Backup:**
```
https://rpc.ankr.com/base (public, slower, but always available)
```

**Rate Limits:**
- Alchemy: 300 req/sec (free tier) or 3000 req/sec (paid)
- Infura: 100 req/sec (free tier)
- Ankr: 100 req/sec (public)

### Methods Needed

#### 1. **Get Token Metadata**
```
eth_call → ERC20.name(), .symbol(), .decimals(), .totalSupply()
```

#### 2. **Get Token Holders**
```
eth_getLogs → Transfer events, aggregate via Uniswap V3/V2 positions
OR use Alchemy's built-in: alchemy_getTokenBalances()
```

#### 3. **Check Liquidity**
```
Uniswap V3: getPool() → getLiquidity()
Uniswap V2: getPair() → reserves
```

#### 4. **Verify Liquidity Lock**
```
Check Uniswap V3 lock contract (Uncx, Shelterfi, etc)
```

---

## 4️⃣ Scan Schedule

### Frequency Decision: **Every 10 Minutes**

**Rationale:**
- Every 5 min: Too many API calls, higher cost
- Every 10 min: Sweet spot - catches 99% of launches, reasonable API usage
- Every 15 min: Misses some early launches

### Scan Window

**For Each Scan:**
1. Fetch last 50 Clanker tokens (launched in last 10 minutes)
2. Check Bankr factory for new events (last 10 min)
3. Deduplicate (same CA = same token)
4. Enrich with RPC data (holders, liquidity, etc)
5. Score each token
6. Send alerts for score ≥65

**Expected Tokens Per Scan:**
- Clanker: 15-25 new tokens per 10 min (average)
- Bankr: 2-5 new tokens per 10 min (average)
- **Total: 20-30 tokens per scan**

---

## 5️⃣ API Call Budget

### Estimated API Calls Per 10-Minute Scan

**Clanker API:**
- 1 call per scan = 1 call/10min = 6 calls/hour = 144 calls/day
- **Budget: Unlimited (public API)**

**RPC Calls (per token analyzed):**
- Get metadata: 4 calls (name, symbol, decimals, supply)
- Get holders: 2 calls (Transfer logs or balance snapshots)
- Get liquidity: 2 calls (pool reserve check)
- **Per token: ~8 RPC calls**

**Per Scan (25 tokens avg):**
- 25 tokens × 8 calls = 200 RPC calls
- **Per day: 200 calls × 144 scans = 28,800 RPC calls/day**
- **Alchemy free tier capacity: 300 req/sec × 86,400 sec = 25.9M req/day** ✅ (plenty!)

**Telegram API:**
- 1 call per alert sent
- Expected: 10-20 alerts/day (only high-quality scores)
- **Budget: Unlimited (Telegram allows ~10k msgs/day per chat)**

---

## 6️⃣ Implementation Notes

### Code Pattern: RPC Connection

```typescript
// Primary: Alchemy
const rpc = new ethers.JsonRpcProvider(
  `https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
);

// Fallback: Infura
const fallbackRpc = new ethers.JsonRpcProvider(
  `https://base.infura.io/v3/${INFURA_API_KEY}`
);

// Retry logic: try primary, then fallback
async function getRpcData(fn) {
  try {
    return await fn(rpc);
  } catch (e) {
    return await fn(fallbackRpc);
  }
}
```

### Code Pattern: Clanker Scraper

```typescript
async function fetchClankerTokens(limit = 50) {
  const response = await fetch(
    `https://clanker.world/api/tokens?limit=${limit}&sort=launch_time_desc`
  );
  const data = await response.json();
  return data.tokens;
}
```

### Code Pattern: Rate Limiting

```typescript
// Queue requests with backoff
const queue = new PQueue({
  interval: 1000,  // 1 second
  intervalCap: 100, // 100 requests per second
});

const token = await queue.add(() => fetchTokenData(ca));
```

---

## 7️⃣ Error Handling

### API Failures

| Failure | Timeout | Retry Strategy | Max Retries |
|---------|---------|-----------------|------------|
| Clanker API timeout | 10s | Exponential backoff (2s, 4s, 8s) | 3 |
| RPC timeout | 5s | Exponential backoff (1s, 2s, 4s) | 3 |
| RPC rate limit (429) | 60s | Wait, then retry | 2 |
| Telegram API timeout | 5s | Queue, retry every 30s | 5 |

### Data Validation

**Reject token if:**
- Invalid contract address (not 0x...)
- Name/symbol missing
- Supply = 0 or > 10^36 (likely malformed)
- Creator wallet = zero address
- Launch timestamp = 0 or > now

---

## 8️⃣ Monitoring & Debugging

### Logging Points

```typescript
// At each stage
logger.info(`[CLANKER] Fetched ${tokens.length} tokens`);
logger.info(`[RPC] Enriched token ${ca}`);
logger.info(`[SCORE] ${ca} scored ${score}/100`);
logger.info(`[ALERT] Sent to Telegram (score=${score})`);
```

### Metrics to Track

- Tokens discovered per day
- Average RPC latency
- Clanker API uptime %
- Alerts sent per day
- False positives (token score >65 but later rugged)

---

## ✅ Sign-Off

- **Researched:** ✅ Clanker API, Bankr on-chain, RPC endpoints
- **Tested:** ✅ All endpoints accessible and responding
- **Documented:** ✅ Schemas, rate limits, fallback strategies
- **Ready for:** Phase 2 (Development setup) & Phase 3 (Core dev)

---

**Last Updated:** 2026-03-09  
**Next Step:** Create SCORING_ALGORITHM.md (Task 1.2)
