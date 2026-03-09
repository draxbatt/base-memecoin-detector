# 🤖 AGENT WORKFLOW CONTINU 24/7 - Garantie Complète

**Objectif:** Drix dors, les agents bossent toute la nuit sans interruption.

**Garantie:** ✅ Quelqu'un code toujours. Si quelqu'un crash, quelqu'un d'autre prend le relais.

---

## 🎯 ARCHITECTURE GUARANTIE 24/7

### **Règle d'Or**

```
✅ dev-coder DOIT toujours travailler si TODO n'est pas vide
✅ Si dev-coder crash → spawn instant d'un nouveau
✅ Si improvement-bot trouve du travail → trigger dev-coder immédiatement
✅ Si personne ne bosse → ALERT DRIX (mais ne doit pas arriver)
```

---

## 📅 CRON SCHEDULE DÉTAILLÉ (24/7 Coverage)

### **Every 2 Hours** (Improvement Bot)
```
Cron: 0 */2 * * * (toutes les 2 heures)

Action:
  1. improvement-bot scan codebase (30 min)
     ├─ Code quality checks
     ├─ Performance analysis
     ├─ Security audit
     └─ Tech debt detection
  
  2. Find issues & add to TODO
  
  3. Check if dev-coder is running
     ├─ If running: wait, don't spawn
     └─ If NOT running:
        ├─ Check TODO list
        ├─ If tasks exist: SPAWN dev-coder with task list
        └─ If no tasks: just exit
  
  4. Send digest to Drix (summary of findings)
     └─ Email: "2am: Found 3 new issues"

Timing:
  00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00
```

### **Every 30 Minutes** (Dev-Coder Health Check)
```
Cron: */30 * * * * (toutes les 30 min)

Action:
  1. Check if dev-coder is alive
     ├─ If YES: continue (don't interrupt)
     └─ If NO:
        ├─ Check TODO list
        ├─ If tasks exist: SPAWN new dev-coder immediately
        ├─ Log recovery: "22:45 - dev-coder crashed, spawned new"
        └─ ALERT Drix: "dev-coder crashed, recovered"
  
  2. Verify git activity
     ├─ If no commits in last 30 min BUT tasks in TODO:
     │  └─ dev-coder might be stuck → force spawn new
     └─ If commits exist: OK, all good

Note: CRITICAL FALLBACK - ensures no dead time
```

### **Every 4 Hours** (Code Auditor Deep Dive)
```
Cron: 0 */4 * * * (toutes les 4 heures)

Action:
  1. code-auditor review ALL recent commits (since last run)
  
  2. If bugs found:
     ├─ Create issue in TODO
     └─ ALERT: "4am - Bug found in scraper.ts, added to TODO"
  
  3. If major issues:
     ├─ Revert problematic commit
     └─ CRITICAL ALERT Drix: "Code quality issue detected, reverted"

Timing: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
```

### **Every 6 Hours** (DevOps Monitor)
```
Cron: 0 */6 * * * (toutes les 6 heures)

Action:
  1. Check bot health (if bot is live)
     ├─ Uptime check
     ├─ Error rates
     ├─ Database integrity
     ├─ API rate limits
     └─ Memory/CPU usage
  
  2. If issues found:
     ├─ Create ticket in TODO
     └─ ALERT: "6am - Bot error rate 2%, added to TODO"
  
  3. Generate metrics report
     ├─ Lines of code
     ├─ Test coverage
     ├─ Commits today
     └─ Issues fixed today

Timing: 00:00, 06:00, 12:00, 18:00
```

### **Daily at 08:00 AM** (Morning Report)
```
Cron: 0 8 * * * (Chaque matin 8h)

Action:
  1. improvement-bot generates full night report:
     ├─ How many issues found
     ├─ How many fixed
     ├─ Code quality trend
     ├─ Performance improvements
     ├─ Bugs fixed
     └─ Recommendations for today
  
  2. Send to Drix (Telegram + Notion)
     └─ "Night report: 12 tasks completed, 8 new issues found"

Purpose: Drix wakes up knowing exactly what happened
```

---

## 🚀 AUTO-SPAWN LOGIC (Garantie Zéro Downtime)

### **Dev-Coder Auto-Spawn Flow**

```
TRIGGER 1: Cron found new tasks in TODO
  ├─ improvement-bot runs at 02:00
  ├─ Finds 3 new issues
  ├─ Checks if dev-coder is running
  │   └─ NOT running?
  │   └─ SPAWN: sessions_spawn(
  │         task="Work on BOT_PROJECT_TODO.md",
  │         runtime="subagent",
  │         mode="session" (persistent)
  │       )
  ├─ dev-coder gets task list
  └─ Starts working immediately

TRIGGER 2: Dev-Coder Health Check fails (*/30)
  ├─ System checks if dev-coder process still alive
  ├─ If crashed:
  │   ├─ Log: "22:45 - dev-coder crashed, spawning recovery"
  │   ├─ SPAWN recovery session with same TODO
  │   └─ ALERT Drix: "dev-coder recovered from crash"
  └─ Continue work without interruption

TRIGGER 3: Code-Auditor finds critical bug
  ├─ code-auditor @ 04:00 finds security issue
  ├─ Creates URGENT task in TODO
  ├─ Force spawns dev-coder if not running
  └─ Task gets priority

TRIGGER 4: Manual (Drix sends message)
  ├─ Drix: "start work now"
  ├─ SPAWN dev-coder immediately regardless of schedule
  └─ Override all waiting
```

### **Dev-Coder Execution Loop (Persistent Session)**

```
SESSION STARTS (spawned by improvement-bot or cron)

LOOP FOREVER:
  1. Read BOT_PROJECT_TODO.md
     └─ Get all [ ] unchecked tasks (highest priority first)
  
  2. If tasks exist:
     ├─ Pick next task
     ├─ Implement feature/fix
     ├─ Test locally
     ├─ Push to feature branch
     ├─ Commit message: "[auto] task: description"
     └─ Go to step 1 (next task)
  
  3. If NO tasks exist:
     ├─ Check if improvement-bot will run soon
     ├─ If YES (within 30 min): WAIT
     ├─ If NO: EXIT gracefully
     └─ Next cron will spawn new session if needed

EXIT CONDITION:
  - TODO is empty AND no urgent tasks
  - Session sleeps, cron can spawn it again
```

---

## 🛡️ FALLBACK & RECOVERY (Garantie Zéro Interruption)

### **Scenario 1: Dev-Coder Crashes**
```
00:15 - dev-coder is coding
00:20 - CRASH (out of memory, connection lost, etc.)
00:30 - Health check cron runs
        ├─ Detects: no commit in 30 min + tasks in TODO
        ├─ Conclusion: dev-coder crashed
        ├─ ACTION: spawn new dev-coder with same tasks
        ├─ Log: "00:30 - Recovery: dev-coder #2 spawned"
        └─ ALERT Drix: "dev-coder crashed, recovered"
        
00:35 - New dev-coder continues work
        └─ Same task or next one from TODO
```

### **Scenario 2: Improvement-Bot Hangs**
```
02:00 - improvement-bot should run
02:30 - Still scanning (hung on large file)
03:00 - Another cron fires health check
        ├─ Detects: improvement-bot still running
        ├─ Conclusion: might be stuck
        ├─ ACTION: timeout mechanism kicks in
        ├─ Kill hung process after 2 hours
        └─ ALERT Drix: "improvement-bot timeout, killed gracefully"
        
Next cron (04:00) will spawn new improvement-bot
```

### **Scenario 3: Code-Auditor Finds Critical Bug**
```
04:00 - code-auditor reviews commits
        ├─ Finds: SQL injection vulnerability in db.ts
        ├─ ACTION: revert commit
        ├─ Create CRITICAL task in TODO
        └─ FORCE spawn dev-coder to fix immediately
        
05:00 - dev-coder working on critical fix
        ├─ Fix merged after audit passes
        └─ ALERT Drix: "Critical bug found & fixed overnight"
```

### **Scenario 4: GitHub API Rate Limited**
```
11:30 - dev-coder tries to push
        ├─ GitHub API returns 429 (rate limited)
        ├─ ACTION: exponential backoff
        │   ├─ Wait 5 min
        │   ├─ Retry
        │   ├─ If fails: wait 10 min
        │   ├─ If fails: wait 20 min
        └─ Eventually succeeds
        
Next push succeeds without developer intervention
```

---

## 📊 MONITORING & ALERTS (Drix Knows Everything)

### **What Drix Gets (Telegram Alerts)**

```
Every 2 hours (improvement-bot digest):
  "02:00 - Improvement bot: Found 2 code issues, 1 perf optimization"

Every crash/recovery (immediate):
  "00:30 - Alert: dev-coder crashed, recovery spawned ✓"

Daily morning (08:00):
  "Morning report: Completed 12 tasks, 3 bugs fixed, 8 new issues found"

Critical issues (immediate):
  "🚨 Critical: SQL injection found in db.ts, reverted & fixed"

Health check (every 6h):
  "06:00 - Bot health: ✓ Uptime 100%, Errors 0.1%, DB ok"
```

### **Notion Tracking (Automatic)**

```
Every session, agents update Notion:
  ├─ New tasks added by improvement-bot
  ├─ Tasks completed by dev-coder
  ├─ Bugs found by code-auditor
  ├─ Performance metrics by devops-monitor
  └─ Timeline of all events (audit log)

Drix can see in real-time:
  - What agents are working on
  - What's been completed
  - What issues were found
  - System health metrics
```

---

## ✅ GUARANTIES (Noir sur Blanc)

### **1. Someone is Always Coding**
```
IF dev-coder is NOT running AND tasks exist in TODO:
  └─ Spawn new dev-coder within 30 minutes (max)
  └─ Usually within 2 minutes (improvement-bot triggers it)

DOWNTIME: 0 minutes (in practice) to 30 minutes (worst case)
```

### **2. If Anyone Crashes, They're Replaced**
```
Health check runs every 30 minutes.
If process died:
  └─ Spawn replacement immediately
  └─ Same session, same tasks, zero loss

Crash-to-recovery time: 2-5 minutes
```

### **3. New Work is Found Automatically**
```
improvement-bot runs every 2 hours.
If new issues found:
  └─ Automatically triggers dev-coder if idle
  └─ New tasks added to TODO instantly

Response time: 2-5 minutes after scan completes
```

### **4. Code Quality is Maintained**
```
code-auditor reviews EVERY push.
If bug found:
  ├─ Critical: revert + alert + force fix
  └─ Minor: add to TODO, next dev will fix

Audit turnaround: immediate to 4 hours (next audit cycle)
```

### **5. Drix Knows Everything That Happens**
```
Alerts sent for:
  ✓ Tasks completed
  ✓ Bugs found
  ✓ Crashes (+ recovery)
  ✓ Health issues
  ✓ Daily summary

No surprises. Full visibility 24/7.
```

---

## 🌙 NIGHT CYCLE EXAMPLE (Drix Sleeps 22:00 - 08:00)

```
22:00 - Drix goes to sleep
        └─ improvement-bot finds 5 tasks
        └─ Spawns dev-coder with task list
        
22:15 - dev-coder starts coding Issue #1
        
00:00 - Cron 1: improvement-bot scans
        └─ dev-coder still working
        └─ Finds 2 more issues → adds to TODO
        └─ Sends digest to Drix (he won't see until morning)
        
00:30 - Cron: health check runs
        ├─ dev-coder alive ✓
        ├─ Commits found ✓
        └─ All good, continue
        
01:30 - dev-coder completes Issue #1
        ├─ Pushes commit
        ├─ code-auditor reviews → pass ✓
        └─ Moves to Issue #2
        
02:00 - Cron 2: improvement-bot scans
        └─ Finds 1 more issue
        └─ dev-coder will handle it next
        
02:30 - Health check: all systems operational
        
03:45 - dev-coder completes Issue #2
        
04:00 - Cron 3: code-auditor deep dive
        ├─ Reviews all 2 commits
        ├─ Both pass ✓
        └─ Writes audit report
        
04:30 - Health check: dev-coder still working
        
05:20 - dev-coder finishes Issue #3
        
06:00 - Cron 4: devops-monitor checks bot health
        ├─ All metrics green
        └─ Generates stats
        
06:30 - dev-coder finishes all 8 issues
        ├─ TODO is empty
        └─ Exits gracefully (waits for next cron)
        
07:00 - Cron: improvement-bot runs
        ├─ Scans entire codebase
        ├─ Finds 3 more optimization opportunities
        ├─ dev-coder not running
        └─ Spawns new session with fresh tasks
        
07:30 - dev-coder #2 starts working
        
08:00 - Cron: Morning report generated
        ├─ 8 initial tasks completed
        ├─ 3 new issues found overnight
        ├─ 12 commits pushed
        ├─ Zero downtime
        └─ Report sent to Drix
        
08:15 - Drix wakes up, reads morning report
        ├─ "12 tasks done, 3 bugs fixed"
        ├─ 10+ commits waiting
        └─ Everything perfect ✓
```

---

## 🔧 CONFIGURATION FILES NEEDED

### **1. `.openclaw/cron-schedule.json`**
```json
{
  "cron_jobs": [
    {
      "name": "improvement-bot-scan",
      "schedule": "0 */2 * * *",
      "timeout_minutes": 60,
      "action": "spawn_improvement_bot",
      "notify_on_timeout": true
    },
    {
      "name": "dev-coder-health-check",
      "schedule": "*/30 * * * *",
      "timeout_minutes": 5,
      "action": "check_and_recover_dev_coder",
      "respawn_if_dead": true
    },
    {
      "name": "code-auditor-deep-dive",
      "schedule": "0 */4 * * *",
      "timeout_minutes": 120,
      "action": "audit_all_recent_commits",
      "alert_on_critical_bugs": true
    },
    {
      "name": "devops-monitor-check",
      "schedule": "0 */6 * * *",
      "timeout_minutes": 30,
      "action": "check_bot_health",
      "create_ticket_on_issues": true
    },
    {
      "name": "daily-report",
      "schedule": "0 8 * * *",
      "timeout_minutes": 30,
      "action": "generate_night_report",
      "send_to_drix": true
    }
  ]
}
```

### **2. `./memecoin-bot-project/AGENT_WORKFLOW.md`**
This file (the guarantees + architecture)

### **3. `./memecoin-bot-project/AGENT_TEAM.md`**
Responsibilities of each agent + expectations

### **4. `./memecoin-bot-project/NOTION_SYNC.md`**
How agents update Notion in real-time

---

## 🎯 DRIX SLEEPS GUARANTEED

```
✅ dev-coder always coding if work exists
✅ Crashes auto-recovered within 2-5 minutes
✅ New work found every 2 hours automatically
✅ Code audited after every push
✅ Health monitored every 30 minutes
✅ Drix alerted immediately if critical issue
✅ Morning report ready when he wakes up

Result: 8 hours of uninterrupted coding
         12+ commits pushed
         5-10 bugs fixed
         Code quality maintained
         Everything tracked in Notion
```

**Drix can sleep. The machine never stops.** 🤖💤

---

## 🚀 NEXT STEPS

1. ✅ This file explains the architecture
2. ⏳ Create AGENT_TEAM.md (roles + responsibilities)
3. ⏳ Create NOTION_SYNC.md (real-time updates)
4. ⏳ Deploy cron jobs (OpenClaw gateway)
5. ⏳ Spawn first improvement-bot manually
6. ⏳ Drix sleeps, agents work 🌙

**Ready?**
