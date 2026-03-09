# 📱 Telegram Configuration & Alert Format Specification

**Status:** ✅ FINALIZED  
**Date:** 2026-03-09  
**Owner:** Drax Agent (dev-coder-runner)  
**Phase:** 0 (Specs & Architecture)  
**Depends On:** SCORING_ALGORITHM.md ✅

---

## Overview

This document defines the complete Telegram integration for the Base Chain Memecoin Detector Bot, including:
- Alert message templates
- Telegram bot setup instructions
- Delivery strategy and rate limiting
- Error handling

---

## 1️⃣ TELEGRAM BOT SETUP

### Creating the Bot

**Step 1: Create Bot via BotFather**

1. Open Telegram
2. Search for `@BotFather`
3. Send: `/start`
4. Send: `/newbot`
5. Follow prompts:
   - Bot name: "BaseDogeSniperBot" (or similar)
   - Bot username: "base_doge_sniper_bot" (must be unique, 5+ chars, end with `_bot`)
6. BotFather will respond with:
   ```
   Congratulations! Your bot was created.
   
   Bot token: 1234567890:ABCDefGHIJKlmnoPQRstUVwxyZ_1a2b3c4d
   ```

**Store this token securely in 1Password or `.env.local`**

### Getting Chat ID

**Step 2: Create Private Group or DM**

Option A: Use personal Telegram DM
- Send a message to your bot: `@base_doge_sniper_bot /start`
- Then query bot to get your user ID (see below)

Option B: Create private group
1. Create new group in Telegram
2. Add your bot to the group
3. Send a message: `/chatid` (if bot has this command)
4. Or send: `@base_doge_sniper_bot /start`

**Step 3: Get Chat ID**

Run in code or curl:
```bash
# Send a test message first
curl -X POST "https://api.telegram.org/bot1234567890:ABCDefGHIJKlmnoPQRstUVwxyZ/sendMessage" \
  -d "chat_id=YOUR_USER_ID" \
  -d "text=Test message"

# Or use this to discover chat ID from webhook updates
# Once bot receives a message, extract chat_id from the update JSON
```

**Chat ID formats:**
- Personal DM: Positive number (e.g., `123456789`)
- Group: Negative number (e.g., `-123456789`)
- Supergroup: Negative number with `100` prefix (e.g., `-1001234567890`)

**Recommended:** Use personal DM for testing, move to private group for production.

---

## 2️⃣ ALERT MESSAGE FORMATS

### Template 1: Normal Alert (Score 65-79)

```
🟡 NEW TOKEN DETECTED

💎 Name: BasedDoge [BDOGE]
📍 Chain: Base
📝 Contract: 0x1234abcd5678ef012345...
🚀 Launcher: Clanker
⏰ Launched: 2 hours ago

═══════════════════════════════

📊 SCORE: 72/100 [INVESTIGATE]

✅ POSITIVE SIGNALS:
  • Holders diversified (top 10: 45%)
  • Liquidity locked 6+ months ($45k)
  • Consistent volume

⚠️ RISK SIGNALS:
  • Creator: Young account (2 weeks)
  • Pump speed: 12x in 30 min

═══════════════════════════════

🔗 QUICK LINKS:
  • Dexscreener: https://dexscreener.com/base/0x1234abcd
  • Etherscan: https://basescan.org/token/0x1234abcd
  • Creator: https://basescan.org/address/0x5678ef01

═══════════════════════════════

💡 RECOMMENDATION: CAUTION
  Medium-risk opportunity. Do your own research.

/mute  /info  /snipe
```

**Key Elements:**
- Token name, symbol, contract
- Score + interpretation
- Positive signals (green flags)
- Risk signals (red flags)
- Links for quick research
- Action buttons (mute, more info, etc)

---

### Template 2: Premium Alert (Score 80-100)

```
🟢 PRIME OPPORTUNITY DETECTED 🟢

💎 Name: RocketBase [ROCKET]
📍 Chain: Base
📝 Contract: 0x9999aaaa8888bbbb7777cccc...
🚀 Launcher: Clanker
⏰ Launched: 4 hours ago

═══════════════════════════════

📊 SCORE: 87/100 [EXCELLENT]

✅ STRONG POSITIVE SIGNALS:
  • Holders well-distributed (top 10: 32%)
  • Creator: Proven launcher (4 successful, 0 rugs)
  • Liquidity locked 12 months ($125k)
  • Gradual organic growth (3.2x in 4h)
  • High holder count (2,847)

⚠️ MINOR CONCERNS:
  • Volume spike possible (normal for growth)

═══════════════════════════════

🔗 QUICK LINKS:
  • Dexscreener: https://dexscreener.com/base/0x9999aaaa
  • Etherscan: https://basescan.org/token/0x9999aaaa
  • Creator: https://basescan.org/address/0x1111dddd
  • Chart: https://www.dextools.io/app/en/base/pair-explorer/0x9999aaaa

═══════════════════════════════

💡 RECOMMENDATION: HIGH INTEREST
  Strong fundamentals, proven creator. Manageable risk.

/add_to_watchlist  /info  /snipe  /share
```

**Differences from Normal Alert:**
- 🟢 instead of 🟡 emoji
- "EXCELLENT" instead of "INVESTIGATE"
- More positive signals listed
- Fewer (or minor) risk signals
- More action buttons (add to watchlist, share)

---

### Template 3: Low Score Alert (Silent by Default, Debug Only)

```
🔴 TOKEN FLAGGED (Score: 35/100) [LIKELY RUG]

💎 Name: SuspiciousMeme [SUS]
📍 Chain: Base
📝 Contract: 0x3333ffff4444eeee5555dddd...
🚀 Launcher: Clanker
⏰ Launched: 15 minutes ago

═══════════════════════════════

📊 SCORE: 35/100 [DO NOT BUY]

❌ CRITICAL RED FLAGS:
  • Whales concentrated (top 10 own 87%)
  • Creator new account (1 day old)
  • Creator has rug pull history
  • Instant 250x pump (classic P&D)
  • Liquidity NOT locked (pullable)

═══════════════════════════════

⚠️ LIKELY OUTCOME: RUG PULL

Not sending as alert (score <65), but logged for analysis.

[Debug info available for analysis]
```

**When sent:** Never to user (score <65), only to debug logs/database.

---

## 3️⃣ DYNAMIC ALERT CUSTOMIZATION

### Scoring Interpretation Text

Map scores to human-readable interpretations:

```typescript
const interpretations = {
  90-100: "EXCELLENT - Strong opportunity, minimal risk",
  80-89:  "VERY GOOD - High interest, manageable risk",
  70-79:  "GOOD - Worth investigating further",
  65-69:  "BORDERLINE - Need to do your own research",
  50-64:  "RISKY - Not recommended, silent (no alert sent)",
  0-49:   "CRITICAL - Likely rug, silent (debug only)",
};
```

### Component Breakdown in Alert

Include breakdown of what contributed to the score:

```
SCORE BREAKDOWN:
  • Holder Distribution: 72/100 (good diversity)
  • Creator History: 85/100 (proven creator)
  • Liquidity: 68/100 (locked 4 months)
  • Pump Pattern: 65/100 (moderate growth)
```

**Used in:** `/info` command reply, not in base alert.

---

## 4️⃣ ALERT DELIVERY STRATEGY

### Rate Limiting

**Global rate limit:** Max 1 alert per 2 minutes to prevent spam

```typescript
const rateLimiter = {
  maxAlertsPerMinute: 0.5,  // 1 alert per 2 minutes
  minGapBetweenAlerts: 120,  // 120 seconds between alerts
};
```

**Rationale:**
- If bot finds 10 good tokens, don't send 10 alerts in 10 seconds
- Spread them out over 20 minutes
- Gives user time to read each alert
- Prevents Telegram spam ban

### Deduplication

**Problem:** Same token could be detected from multiple sources (Clanker + Bankr).

**Solution:**
```typescript
if (databaseHasRecord(tokenCA)) {
  const lastAlertTime = databaseQuery(tokenCA).lastAlertTime;
  const timeSinceLastAlert = now - lastAlertTime;
  
  if (timeSinceLastAlert < 24 * 3600) {  // 24 hours
    return; // Don't send duplicate alert
  }
}
```

**Duplicate check:**
- 1. Check if token CA exists in database
- 2. Check if alert was sent in last 24 hours
- 3. If yes, skip sending again
- 4. Update database with new scan result (for scoring trend)

### Resend Strategy

**Case 1:** Token appeared good yesterday, score changed today

```
If (oldScore < 65 && newScore >= 65) {
  sendAlert = true;  // Recovered, send new alert
}

If (oldScore >= 65 && newScore < 65) {
  sendAlert = false; // Score dropped, no new alert
  logWarning(tokenCA, "Quality degraded, user should know");
}
```

**Case 2:** Token was already alerted, score improved

```
If (alertAlreadySent && newScore > oldScore + 10) {
  sendFollowUpAlert = true;  // Significant improvement
}
```

**Case 3:** Token score stable, don't re-alert

```
If (abs(newScore - oldScore) < 5) {
  sendAlert = false;  // Minor fluctuation, skip
}
```

---

## 5️⃣ ERROR HANDLING

### API Failures

#### Scenario: Telegram API Timeout

```typescript
async function sendTelegramAlert(message) {
  let retries = 0;
  const maxRetries = 5;
  const retryDelaySeconds = [30, 60, 120, 300, 600];
  
  while (retries < maxRetries) {
    try {
      await telegram.sendMessage(chatId, message);
      logger.info(`Alert sent successfully`);
      return true;
    } catch (e) {
      if (e.code === 'TIMEOUT') {
        await sleep(retryDelaySeconds[retries] * 1000);
        retries++;
      } else if (e.code === 429) {
        // Rate limited by Telegram
        await sleep(30 * 1000);  // Wait 30s
        retries++;
      } else {
        // Permanent error (invalid chat ID, bot blocked, etc)
        logger.error(`Failed to send alert: ${e.message}`);
        return false;
      }
    }
  }
  
  // If all retries failed, log and queue for manual review
  logger.error(`Alert delivery failed after ${maxRetries} attempts`);
  database.insertFailedAlert(message);
  return false;
}
```

#### Scenario: Bot Blocked by User

```
Error: "Forbidden: bot was blocked by the user"
→ Silent skip (no error log spam)
→ Mark in database (don't retry forever)
```

#### Scenario: Invalid Chat ID

```
Error: "Bad Request: chat not found"
→ Log critical error
→ Alert admin/developer
→ Require reconfiguration
```

### Message Queue for Failures

If Telegram is down but bot is running:

```typescript
interface FailedAlert {
  id: string;
  tokenCA: string;
  message: string;
  score: number;
  failedAt: Date;
  retryCount: number;
}

async function handleTelegramDown() {
  // Queue alert in SQLite
  database.insertFailedAlert({
    tokenCA: token.ca,
    message: alertMessage,
    score: score,
    failedAt: new Date(),
  });
  
  // Retry queued alerts every 5 minutes
  setInterval(async () => {
    const failed = database.getFailedAlerts();
    for (const alert of failed) {
      const success = await sendTelegramAlert(alert.message);
      if (success) {
        database.deleteFailedAlert(alert.id);
      } else if (alert.retryCount > 10) {
        database.markAlertPermanentlyFailed(alert.id);
      }
    }
  }, 5 * 60 * 1000);  // 5 minute interval
}
```

---

## 6️⃣ INLINE BUTTONS & COMMANDS

### Inline Buttons in Alert

Telegram supports interactive buttons in messages:

```typescript
const alertMessage = {
  chat_id: chatId,
  text: alertText,
  reply_markup: {
    inline_keyboard: [
      [
        { text: "📊 Dexscreener", url: "https://dexscreener.com/base/..." },
        { text: "📈 Chart", url: "https://www.dextools.io/..." },
      ],
      [
        { text: "❤️ Watchlist", callback_data: "add_watchlist_" + tokenCA },
        { text: "🔇 Mute 1h", callback_data: "mute_1h_" + tokenCA },
      ],
      [
        { text: "ℹ️ More Info", callback_data: "info_" + tokenCA },
      ],
    ]
  }
};
```

**Buttons Implemented:**

| Button | Action | Backend |
|--------|--------|---------|
| **Dexscreener** | Open chart link | URL only |
| **Chart** | Open trading view | URL only |
| **Watchlist** | Save token to watchlist | Database update |
| **Mute 1h** | Hide alerts for 1 hour | Cache key (user + token) |
| **More Info** | Show score breakdown | Callback → send /info reply |

### Commands

Users can also send these commands:

```
/start               - Bot introduction
/info <token_ca>    - Show detailed score breakdown for token
/watchlist          - Show saved watchlist
/stats              - Show bot statistics (alerts sent, uptime, etc)
/settings           - User preferences (alert frequency, score threshold, etc)
/mute <token_ca>    - Mute alerts for specific token
/unmute <token_ca>  - Unmute token
/help               - Show available commands
```

---

## 7️⃣ TELEGRAM BOT CONFIGURATION

### Environment Variables

```bash
# Required
TELEGRAM_BOT_TOKEN=1234567890:ABCDefGHIJKlmnoPQRstUVwxyZ_1a2b3c4d
TELEGRAM_CHAT_ID=123456789  # or -1001234567890 for group

# Optional
TELEGRAM_ADMIN_ID=123456789  # For error notifications
TELEGRAM_MAX_ALERTS_PER_HOUR=30  # Rate limiting
TELEGRAM_MIN_SCORE_TO_ALERT=65  # Alert threshold
```

### Bot Webhook vs Polling

**Decision:** Use **Polling** for simplicity (bot pulls updates every few seconds)

```typescript
async function startPollingBot() {
  const telegramAPI = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
  
  telegramAPI.onMessage(async (message) => {
    const chatId = message.chat.id;
    const text = message.text;
    
    if (text === '/start') {
      await telegramAPI.sendMessage(chatId, "Bot started!");
    } else if (text.startsWith('/info')) {
      await handleInfoCommand(chatId, text);
    }
  });
  
  // Keep polling for updates
  telegramAPI.startPolling();
}
```

**Polling interval:** 2-3 seconds (fast enough, low resource usage)

**Alternative (Webhook):** Would require public HTTPS endpoint (add complexity for local dev)

---

## 8️⃣ PRODUCTION ALERTS

### Daily Summary

Send Drix a daily summary at 9 AM:

```
📊 DAILY REPORT (2026-03-10)

Tokens Analyzed: 4,250
Alerts Sent: 23
Premium Alerts: 3
False Positives: 0
Bot Uptime: 99.8%
Errors: 0

Top Opportunities:
1. RocketBase (ROCKET) - Score 89
2. LunaV2 (LUNA) - Score 84
3. BasedAI (AI) - Score 81

/view_details
```

**When:** 9:00 AM CET daily  
**Format:** Telegram message  
**Implementation:** Scheduled cron job

### Error Alerts

If bot crashes or encounters critical error:

```
🚨 CRITICAL ERROR

Bot offline since: 2026-03-10 14:32 CET
Error: "RPC endpoint connection timeout"

Status: Attempting auto-recovery...
Last successful scan: 2026-03-10 14:30

/restart_bot  /check_status  /manual_fix
```

**Send to:** Admin Telegram chat  
**Retry attempts:** 3, with 30s backoff

---

## 9️⃣ SECURITY & PRIVACY

### Token Security

```
❌ NEVER log bot token in logs
❌ NEVER commit bot token to git
❌ NEVER display bot token in error messages
```

**Safe storage:**
```
✅ 1Password (recommended for production)
✅ Environment variables (.env.local, git-ignored)
✅ Docker secrets (if containerized)
```

### Chat ID Privacy

```
✅ Can log chat IDs (user identifiers are OK to log)
❌ Don't share chat ID in error messages to other users
```

### Message Content

Alerts contain public blockchain data (contract addresses, links). This is OK to send to Telegram (already public on-chain).

---

## 🔟 TESTING

### Test Checklist

- [ ] Bot token valid and bot can send messages
- [ ] Chat ID correct (message arrives)
- [ ] Alert format displays correctly
- [ ] Buttons clickable and responsive
- [ ] Commands (/start, /info, /help) working
- [ ] Rate limiting prevents spam
- [ ] Deduplication prevents double alerts
- [ ] Error handling graceful (no crashes)
- [ ] Daily summary sends on time
- [ ] Errors trigger admin alert

### Test Commands

```bash
# Send test message
curl -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  -d "chat_id=${CHAT_ID}" \
  -d "text=Test message from bot"

# Get updates (to verify chat ID)
curl "https://api.telegram.org/bot${TOKEN}/getUpdates"

# Set webhook (if using webhook instead of polling)
curl -X POST "https://api.telegram.org/bot${TOKEN}/setWebhook" \
  -d "url=https://yourdomain.com/webhook"
```

---

## ✅ Sign-Off

- **Bot setup documented:** ✅
- **Alert templates created:** ✅
- **Delivery strategy defined:** ✅
- **Error handling planned:** ✅
- **Commands specified:** ✅
- **Ready for implementation:** ✅

---

**Last Updated:** 2026-03-09  
**Next Step:** Create OPERATIONAL_PARAMETERS.md (Task 1.4)
