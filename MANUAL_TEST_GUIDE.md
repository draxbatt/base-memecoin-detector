# Manual Testing Guide (Phase 4)

**Purpose:** Validate bot functionality with Drix in control, testing real memecoin launches and scoring accuracy.

**Time Required:** 30-60 minutes

**Prerequisites:**
- Bot source cloned locally
- `.env` configured with Alchemy/Infura RPC and Telegram test bot
- Telegram test group ready (for receiving alerts)
- `npm test` passes (77/77 tests) ✅
- `npm run build` succeeds ✅

---

## Pre-Test Checklist

- [ ] Node.js 18+ installed: `node --version`
- [ ] Dependencies installed: `npm install`
- [ ] `.env` file populated with:
  - `BASE_RPC_URL` (Alchemy or Infura)
  - `TELEGRAM_BOT_TOKEN` (from BotFather)
  - `TELEGRAM_CHAT_ID` (test group ID)
  - `SCORING_THRESHOLD` (set to 50 for more alerts during testing)
- [ ] All tests passing: `npm test`
- [ ] TypeScript builds: `npm run build`
- [ ] Git status clean: `git status` (only coverage files is OK)

---

## Test Phases

### Phase 1: Bot Initialization (2 min)

**Objective:** Verify all components initialize without errors.

**Steps:**

1. **Start dev server:**
   ```bash
   npm run dev
   ```
   
   **Expected output:**
   ```
   [INFO] Initializing RPC Provider Manager...
   [INFO] Testing Alchemy endpoint...
   [INFO] RPC Provider initialized successfully
   [INFO] Initializing Database...
   [INFO] Database connection established
   [INFO] Initializing Telegram Bot...
   [INFO] Telegram bot connected
   [INFO] Bot started. Scanning for tokens...
   ```

2. **Check logs for errors:**
   - No "ERROR" or "FATAL" messages
   - All 3 components initialized (RPC, DB, Telegram)
   - Cron scheduler running

3. **Record:** ✅ or ❌ with any errors

---

### Phase 2: Token Detection Pipeline (5-10 min)

**Objective:** Verify scrapers fetch tokens from Clanker and Bankr.

**Steps:**

1. **Wait for first scan (0-10 minutes):**
   - Bot runs scans every 10 minutes
   - Monitor logs for token detection

2. **Expected log output:**
   ```
   [INFO] Starting scan cycle...
   [DEBUG] Fetching Clanker launchers...
   [DEBUG] Found 12 Clanker tokens
   [DEBUG] Fetching Bankr tokens...
   [DEBUG] Found 8 Bankr tokens
   [DEBUG] Processing: MyMeme (0x123abc...) - score: 45/100
   [DEBUG] Processing: GigaCoin (0x456def...) - score: 72/100
   ```

3. **Verify:**
   - [ ] Clanker scraper returns tokens
   - [ ] Bankr scraper returns tokens
   - [ ] Tokens have contract addresses
   - [ ] Scoring happens for each token

4. **Record:** # tokens detected, # with scores >50

---

### Phase 3: Telegram Alert Verification (5 min)

**Objective:** Verify alerts are sent correctly and match expected format.

**Steps:**

1. **Check test Telegram group:**
   - Alerts should appear as tokens are scored
   - Look for messages with format:
     ```
     🚨 NEW TOKEN ALERT
     
     MyMeme (MEME)
     Contract: 0x...
     Launched: 2m ago
     
     🟢 SCORE: 72/100
     Recommendation: SAFE
     
     ✅ Positives:
     • Diversified holder distribution
     • Established creator (42 days old)
     ...
     ```

2. **Verify message components:**
   - [ ] Token name and symbol present
   - [ ] Contract address correct (clickable on Basescan)
   - [ ] Score visible (0-100)
   - [ ] Recommendation present (SAFE/CAUTION/AVOID)
   - [ ] Risk flags listed (max 3)
   - [ ] Positive indicators listed (max 3)
   - [ ] Component scores visible (Holders, Creator, Liquidity, Pump)
   - [ ] Links to Dexscreener and Basescan work

3. **Check rate limiting:**
   - Wait 2 minutes
   - Verify no more than 1 alert per 2 minutes
   - If multiple alerts, verify cooldown respected

4. **Record:** Alert count, format accuracy

---

### Phase 4: Scoring Accuracy Validation (10-15 min)

**Objective:** Verify scoring matches Drix expectations with real memecoin data.

**Steps:**

1. **Identify a token to analyze manually:**
   - Pick from Dexscreener: tokens launched in last hour on Base
   - Get: contract address, symbol, name
   - Example: https://dexscreener.com/base

2. **Create test data file `test-tokens.json`:**
   ```json
   [
     {
       "name": "MyMeme",
       "symbol": "MEME",
       "contractAddress": "0x...",
       "launchers": ["clanker"],
       "launchTime": 1678900000000
     }
   ]
   ```

3. **Run bot with this token (test mode):**
   - Add test file to `src/test-data.ts`
   - Or manually verify a detected token from logs

4. **Check scores against Drix's expectations:**
   - [ ] Does holder distribution scoring match reality?
   - [ ] Is creator history accurate?
   - [ ] Are liquidity risks properly detected?
   - [ ] Do pump patterns reflect chart activity?

5. **If scoring seems off:**
   - [ ] Document the token contract
   - [ ] Note what score was given vs expected
   - [ ] File issue: "Scoring mismatch for token X"

6. **Record:** # tokens checked, accuracy %, any mismatches

---

### Phase 5: False Positive Rate (10 min)

**Objective:** Verify bot doesn't over-alert (avoid spam).

**Steps:**

1. **During 10-minute scan cycle:**
   - Count total tokens processed
   - Count total alerts sent
   - Calculate: alert_rate = alerts / total_tokens

2. **Target:** <15% false positive rate (85% of scores should be <50 or >80)

3. **If rate too high:**
   - [ ] Increase `SCORING_THRESHOLD` in `.env`
   - [ ] Or review weighting in SCORING_ALGORITHM.md

4. **Record:** Total processed, total alerts, false positive rate %

---

### Phase 6: Error Recovery (5 min)

**Objective:** Verify bot handles API failures gracefully.

**Steps:**

1. **Simulate RPC failure:**
   - Edit `.env` temporarily: set `BASE_RPC_URL` to invalid endpoint
   - Restart bot: `npm run dev`
   - Expected: Bot retries 3x, falls back to backup RPC, continues

2. **Simulate Telegram failure:**
   - Set invalid `TELEGRAM_BOT_TOKEN`
   - Expected: Bot logs error, continues processing (alerts queued)

3. **Verify:**
   - [ ] Bot doesn't crash
   - [ ] Errors logged with context
   - [ ] Recovery happens within 30 seconds
   - [ ] Later alerts still send when service recovers

4. **Record:** Recovery time, error messages clear?

---

### Phase 7: Database Persistence (5 min)

**Objective:** Verify data is saved and not duplicated.

**Steps:**

1. **Check database after scan:**
   ```bash
   sqlite3 ./data/bot.db "SELECT COUNT(*) FROM tokens;"
   ```
   - Should show # of tokens analyzed

2. **Restart bot:**
   ```bash
   npm run dev
   ```
   - Should not re-alert on same tokens
   - Database should persist

3. **Verify deduplication:**
   - [ ] Same token not alerted twice
   - [ ] Alert table tracks sent status
   - [ ] No duplicate analysis records

4. **Record:** Token count, alert deduplication working?

---

### Phase 8: Performance Benchmarks (5 min)

**Objective:** Verify bot meets latency targets.

**Steps:**

1. **Monitor logs during a scan cycle:**
   ```
   [DEBUG] Processing: MyMeme - took 2.3s (RPC: 1.2s, Analysis: 0.8s, Telegram: 0.3s)
   ```

2. **Verify:**
   - [ ] Per-token latency <3 seconds
   - [ ] RPC calls <1.5s per token
   - [ ] Full scan cycle <15 seconds (10 tokens × 1.5s)

3. **Monitor memory:**
   ```bash
   # In another terminal
   watch -n 1 'ps aux | grep node'
   ```
   - Should stay <256MB

4. **Record:** Min/max/avg latencies

---

## Final Validation

After completing all phases, verify:

- [ ] **Functionality:** All components working (RPC, Scrapers, Analysis, Telegram, DB)
- [ ] **Reliability:** No crashes, proper error recovery
- [ ] **Performance:** Meets latency targets (<3s per token)
- [ ] **Accuracy:** Scoring matches expectations
- [ ] **Usability:** Telegram alerts clear and actionable
- [ ] **Data Quality:** No false positives, proper deduplication

---

## Approval Checklist

**Drix to review:**

- [ ] All 8 test phases completed
- [ ] No critical errors found
- [ ] Scoring feels accurate for known tokens
- [ ] Alert format is clear and useful
- [ ] False positive rate acceptable (<15%)
- [ ] Bot is ready for 24/7 deployment

**If approved:**
- [ ] Mark Phase 4 complete
- [ ] Move to Phase 5 (Deployment)

**If issues found:**
- [ ] Document in GitHub issues
- [ ] Fix and re-test

---

## Command Reference

```bash
# Development
npm run dev              # Start with hot reload

# Testing
npm test                # Run all 77 tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:manual    # Manual test harness

# Build
npm run build          # TypeScript compilation
npm run lint           # ESLint check
npm run format         # Prettier format

# Database
sqlite3 ./data/bot.db  # Query database
npm run db:reset       # Clear all data (dev only)

# Logs
npm run dev 2>&1 | tee test-run.log  # Save logs to file
grep ERROR test-run.log               # Find errors
```

---

## Troubleshooting

### "Bot doesn't find any tokens"
- Check RPC endpoint is valid
- Verify Clanker API is accessible: `curl https://api.clanker.world/api/launches`
- Check database has correct schema: `npm run db:reset && npm run dev`

### "Telegram alerts not sending"
- Verify bot token is valid
- Check chat ID is correct (should be negative for groups)
- Test: `npm run test` includes Telegram formatter tests

### "High false positive rate"
- Reduce weighting for risky components
- Increase `SCORING_THRESHOLD` in `.env`
- Review analyzer weights in `src/scoring/score-engine.ts`

### "Bot crashes after X minutes"
- Check logs for unhandled errors
- Run `npm run test:coverage` to find untested code paths
- File bug report with error stack trace

---

## Success Criteria

✅ **Bot is production-ready when:**

1. All 8 test phases pass
2. No crashes in 30+ minute run
3. Scoring accuracy >85% (Drix approved)
4. False positive rate <15%
5. Error recovery working
6. Latency targets met
7. Database persistence verified
8. Telegram alerts clear and timely

---

**Next Steps:**
- [ ] Complete manual testing
- [ ] Approve for Phase 5 (Deployment)
- [ ] Deploy to Railway/Replit
- [ ] Monitor for 48 hours
- [ ] Launch as public service

---

**Last Updated:** 2026-03-10 02:30  
**Status:** Ready for manual testing
