# 🚀 LAUNCH CHECKLIST & EXECUTION PLAN

**Status:** READY FOR LAUNCH
**Target:** All systems operational by 21:30 GMT+1
**Mission:** Agents working 24/7 by end of night

---

## ✅ PRE-LAUNCH CHECKLIST

### 1. Prerequisites (Must Have)

- [ ] **Notion API Key**
  - Location: Drix's 1Password or env var `NOTION_API_KEY`
  - Test: Able to create/update Notion databases
  - Status: ✓ EXISTS (verified earlier)

- [ ] **GitHub SSH Key**
  - Location: `~/.ssh/id_ed25519`
  - Test: Can push to `git@github.com:draxbatt/base-memecoin-detector.git`
  - Status: ✓ EXISTS (from ft_transcendence work)

- [ ] **Telegram Bot Token**
  - Location: `~/.openclaw/secrets/telegram_bot_token` or env var
  - Test: Can send messages to Drix's chat
  - Status: ⏳ NEED CONFIRMATION (or create new bot if needed)

- [ ] **Base RPC Endpoint**
  - Public: `https://base.publicnode.com` (free, works)
  - Status: ✓ NO AUTH NEEDED

- [ ] **GitHub Repository**
  - Name: `base-memecoin-detector`
  - Owner: draxbatt
  - Status: ⏳ NEED TO CREATE (or exists?)

### 2. System Readiness

- [ ] OpenClaw Gateway running
- [ ] Node.js available (for agents)
- [ ] Git configured with SSH
- [ ] Notion database schemas ready
- [ ] Cron system operational

---

## 🎯 LAUNCH SEQUENCE

### PHASE 1: Setup (5 minutes)

**Step 1.1: Create GitHub Repository**
```bash
# If not exists:
gh repo create base-memecoin-detector \
  --private \
  --source=. \
  --remote=origin \
  --push

# Verify:
git remote -v
# Should show: git@github.com:draxbatt/base-memecoin-detector.git
```

**Step 1.2: Initialize Notion Databases**
```
Create 7 databases in Drix's Notion workspace:
  1. TASKS (todo items)
  2. AUDIT_LOG (agent actions)
  3. CODE_QUALITY_METRICS (quality scores)
  4. BOT_HEALTH_METRICS (bot status)
  5. TEAM_ACTIVITY (agent status)
  6. GIT_ACTIVITY (commits)
  7. DAILY_REPORTS (summaries)

Status: ✓ Can be created auto by agents on first run
```

**Step 1.3: Set Environment Variables**
```bash
export NOTION_API_KEY="ntn_..." (Drix provides)
export TELEGRAM_BOT_TOKEN="..." (Drix provides)
export TELEGRAM_CHAT_ID="1801020320" (already known)
export BASE_RPC_URL="https://base.publicnode.com"
export NODE_ENV="production"
```

---

### PHASE 2: Spawn Agents (10 minutes)

**Step 2.1: Spawn improvement-bot (The Scout)**
```
Role: Find work to do
Task: Scan codebase, find issues, add to TODO
Output: New tasks in TODO list

Command: sessions_spawn(
  runtime="subagent",
  mode="session" (persistent),
  task="Run continuous code scanning & quality monitoring",
  agentId="improvement-bot-v1"
)

Expected: Agent runs, scans, reports findings
```

**Step 2.2: Wait 2 minutes for improvement-bot to find work**
```
improvement-bot will:
  1. Scan /memecoin-bot-project/
  2. Review code quality
  3. Add findings to BOT_PROJECT_TODO.md
  4. Report: "Found X tasks"
```

**Step 2.3: Spawn dev-coder (The Coder)**
```
Role: Implement tasks
Task: Pick from TODO, code, test, push, audit
Output: Working code in git

Command: sessions_spawn(
  runtime="subagent",
  mode="session" (persistent),
  task="Implement tasks from BOT_PROJECT_TODO.md in loop",
  agentId="dev-coder-v1"
)

Expected: Agent starts coding first task
```

**Step 2.4: Spawn code-auditor (The Critic)**
```
Role: Review code quality
Task: Audit every push, approve/reject, flag issues
Output: Feedback on PRs

Command: sessions_spawn(
  runtime="subagent",
  mode="session" (persistent),
  task="Monitor git pushes and audit all code changes",
  agentId="code-auditor-v1"
)

Expected: Agent waiting for PRs
```

**Step 2.5: Spawn devops-monitor (The Watchdog)**
```
Role: Monitor system health
Task: Check bot uptime, logs, errors, metrics
Output: Health reports, alerts

Command: sessions_spawn(
  runtime="subagent",
  mode="session" (persistent),
  task="Monitor bot health and system metrics continuously",
  agentId="devops-monitor-v1"
)

Expected: Agent running health checks
```

---

### PHASE 3: Setup Cron Jobs (5 minutes)

**Step 3.1: Create Cron Schedule**
```
Every 2 hours:
  → improvement-bot scan
  → Check if dev-coder idle + tasks exist → spawn

Every 30 minutes:
  → Health check dev-coder
  → If crashed → spawn recovery

Every 4 hours:
  → code-auditor deep dive (review all commits)
  → Flag issues, create tasks

Every 6 hours:
  → devops-monitor full health check
  → Generate metrics report

Daily @ 08:00:
  → Generate morning report for Drix
  → Send via Telegram + update Notion
```

**Step 3.2: Verify Cron Running**
```
Command: openclaw gateway status

Should show:
  ✓ Cron service: running
  ✓ Next jobs scheduled
  ✓ All agents monitored
```

---

### PHASE 4: Verify All Systems (5 minutes)

**Step 4.1: Test Each Agent**
```
✓ improvement-bot: Can it read files?
✓ dev-coder: Can it checkout git branch?
✓ code-auditor: Can it access GitHub?
✓ devops-monitor: Can it reach bot endpoints?
```

**Step 4.2: Test Notion Sync**
```
✓ Can agents write to Notion?
✓ Databases created?
✓ Updates reflecting in real-time?
```

**Step 4.3: Test Telegram Alerts**
```
✓ Can agents send messages?
✓ Drix receiving notifications?
✓ Format readable?
```

---

## 🎬 ACTUAL LAUNCH (Now)

Ready? Here's what I'll do:

### IMMEDIATE ACTIONS:

1. ✅ **Confirm Prerequisites:**
   - [ ] Notion API key available?
   - [ ] GitHub repo ready?
   - [ ] Telegram bot token working?

2. ✅ **Spawn All Agents** (simultaneously):
   - improvement-bot (finder)
   - dev-coder (coder)
   - code-auditor (auditor)
   - devops-monitor (watcher)

3. ✅ **Start Cron Schedule**:
   - Every 2h: improvement-bot scan
   - Every 30m: health check
   - Every 4h: code audit
   - Every 6h: devops check
   - Daily 08:00: morning report

4. ✅ **Verify Operation**:
   - Check agents are alive
   - Verify git activity
   - Confirm Notion updates
   - Test Telegram alerts

5. ✅ **Give Drix Final Status**:
   - All agents running ✓
   - Cron jobs active ✓
   - Ready for 24/7 work ✓

---

## ⚠️ CRITICAL QUESTIONS (Before Launch)

```
QUESTION 1: Do you have Notion API key?
  If YES: what's the key? (or location)
  If NO: I can guide you to create one in 2 min

QUESTION 2: Do you have GitHub repo created?
  If YES: git@github.com:draxbatt/base-memecoin-detector.git exists?
  If NO: I can create it via gh CLI

QUESTION 3: Do you have Telegram bot token?
  If YES: where stored? (1Password? env var?)
  If NO: I can guide you through BotFather in 3 min

QUESTION 4: Ready for agents to start coding NOW?
  If YES: I spawn them all immediately
  If NO: what needs to be done first?
```

---

## 🌙 WHAT HAPPENS AFTER LAUNCH

```
21:15 - All agents spawned, running
21:20 - improvement-bot finds first batch of tasks
21:25 - dev-coder picks first task, starts coding
21:30 - code-auditor waiting for PRs
21:35 - First commit pushed
21:40 - code-auditor reviews
21:45 - Merge approved, task complete
        dev-coder picks next task
        
Every 2 hours: improvement-bot scans, finds more work

Morning (08:00): Drix wakes up
                 12+ tasks done ✓
                 Report ready ✓
                 New commits ✓
```

---

## 🎯 READY?

Answer the 4 questions above, then:

**LAUNCH COMMAND:**
```
Drax: "All systems ready, spawning agents NOW"
```

Let's make it happen. 🚀
