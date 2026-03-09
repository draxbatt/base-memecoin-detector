# 🤖 AGENT WORKFLOW CONTINU 24/7 - Garantie Complète

**Objectif:** Drix dors, les agents bossent toute la nuit sans interruption.

**Garantie:** ✅ Quelqu'un code toujours. Si quelqu'un crash, quelqu'un d'autre prend le relais.

---

## 🎯 ARCHITECTURE GUARANTIE 24/7

### **Règle d'Or**

```
✅ ORCHESTRATOR-MASTER agent TOUJOURS actif (persistent session)
✅ orchestrator respawn improvement-bot chaque 2h auto
✅ orchestrator respawn dev-coder chaque fois TODO non-empty
✅ orchestrator respawn code-auditor chaque 4h auto
✅ orchestrator respawn devops-monitor chaque 6h auto
✅ orchestrator gère crashes + recovery auto
✅ Si personne ne bosse → ALERT DRIX (orchestrator le détecte)
```

### **Implémentation Réelle (CORRECTION)**

Mode "run" = **one-shot, agents terminent après**. Pour 24/7 vrai:

```
SOLUTION: Orchestrator-Master Agent (persistent)

spawned ONCE en mode "session" (persistent):
  ├─ Tourne 24/7 indéfiniment
  ├─ Gère tous les respawning auto
  ├─ Respawn improvement-bot: 0 */2 * * * (cron inside agent)
  ├─ Respawn dev-coder: si TODO non-empty
  ├─ Respawn code-auditor: 0 */4 * * * (cron inside agent)
  ├─ Respawn devops-monitor: 0 */6 * * * (cron inside agent)
  ├─ Monitor crashes: respawn instant si agent mort
  ├─ Report status: Telegram every 2h
  └─ Loop forever jusqu'à manual kill
```

---

## 📅 CRON SCHEDULE DÉTAILLÉ (Inside Orchestrator)

### **Orchestrator-Master Persistent Session**

Spawned ONCE:
```
sessions_spawn(
  runtime="subagent",
  mode="session",  ← PERSISTENT (never exits)
  task="Run 24/7 orchestrator loop"
)
```

**Inside orchestrator, every 2 hours:**
```
00:00 → Spawn improvement-bot
02:00 → Spawn improvement-bot
04:00 → Spawn code-auditor
06:00 → Spawn devops-monitor
etc...
```

### **Orchestrator Responsibilities**

```
LOOP FOREVER:
  1. Every 2 hours:
     └─ Spawn improvement-bot (scan code)
     └─ improvement-bot exits when done
  
  2. After improvement-bot exits:
     └─ Check if dev-coder running
     └─ If NOT running + TODO has tasks:
        └─ Spawn dev-coder
  
  3. Every 30 minutes:
     └─ Health check all subagents
     └─ If any dead + should be running:
        └─ Respawn immediately
  
  4. Every 4 hours:
     └─ Spawn code-auditor (deep audit)
  
  5. Every 6 hours:
     └─ Spawn devops-monitor (health check)
  
  6. Every 2 hours:
     └─ Send Telegram digest to Drix
  
  7. At 08:00:
     └─ Generate morning report
```

---

## 🚀 AUTO-SPAWN LOGIC (Inside Orchestrator)

### **Orchestrator Spawn Strategy**

```
ORCHESTRATOR SPAWNS SUBAGENTS (one-shot, they exit when done):

improvement-bot-runner (every 2h):
  └─ Spawn: sessions_spawn(
       mode="run",  ← ONE-SHOT (exits when done)
       task="Scan code, find issues, add to TODO"
     )
  └─ Exit: After scan complete (1-2 min)

dev-coder-runner (when TODO non-empty):
  └─ Orchestrator checks: TODO has [ ] tasks?
  └─ If YES:
     └─ Spawn: sessions_spawn(
          mode="run",  ← ONE-SHOT (exits when TODO empty)
          task="Implement all [ ] tasks until empty"
        )
  └─ Exit: When all [ ] tasks completed or TODO empty

code-auditor-runner (every 4h):
  └─ Spawn: sessions_spawn(
       mode="run",
       task="Review commits, find bugs, add to TODO"
     )
  └─ Exit: After audit complete

devops-monitor-runner (every 6h):
  └─ Spawn: sessions_spawn(
       mode="run",
       task="Check bot health, update metrics"
     )
  └─ Exit: After health check complete
```

### **How Orchestrator Ensures 24/7**

```
ORCHESTRATOR (persistent session, never exits):

While True:
  1. Every 2 hours:
     ├─ Spawn improvement-bot (one-shot)
     ├─ Wait for it to exit
     ├─ Check TODO
     ├─ If TODO has tasks: Spawn dev-coder
     └─ dev-coder runs until TODO empty
  
  2. Every 30 minutes:
     ├─ Health check: is dev-coder running?
     ├─ If running: all good, continue
     └─ If NOT running + TODO has tasks: spawn new dev-coder
  
  3. Every 4 hours:
     ├─ Spawn code-auditor
     ├─ Wait for exit
  
  4. Every 6 hours:
     ├─ Spawn devops-monitor
     ├─ Wait for exit
  
  5. Every 2 hours:
     ├─ Send Telegram status to Drix
  
  6. At 08:00:
     ├─ Generate morning report
  
  7. REPEAT FOREVER (until manual kill)
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

## ✅ GUARANTIES (Noir sur Blanc) - PATCHED

### **1. Orchestrator NEVER Exits**
```
Orchestrator spawned ONCE in mode="session" (persistent)
  └─ Runs 24/7 until manual kill
  └─ Respawns all subagents automatically
  └─ Zero downtime guaranteed

How it works:
  - Orchestrator is the "main loop"
  - All other agents are one-shot (spawned on demand)
  - Orchestrator manages respawning logic
```

### **2. Dev-Coder Always Works When Needed**
```
Dev-coder spawned by orchestrator when:
  ├─ improvement-bot finds new tasks
  └─ Every 2 hours (check if TODO has work)

Dev-coder exits when:
  └─ All [ ] TODO tasks completed OR timeout reached

Orchestrator checks: if TODO non-empty + dev-coder not running
  └─ Respawn immediately
  
GUARANTEE: If there's work, someone codes it within 5 min
```

### **3. If Any Agent Crashes, Orchestrator Respawns It**
```
Orchestrator health check (every 30 min):
  ├─ Is dev-coder running? (if it should be)
  ├─ Any subagent stuck? (timeout check)
  └─ If yes to either: respawn immediately

Crash-to-recovery: <2 minutes
```

### **4. Code Quality Always Checked**
```
code-auditor spawned every 4 hours
  └─ Reviews all commits since last run
  └─ Flags bugs → added to TODO
  └─ Critical bugs: revert + force fix

Audit turnaround: complete within 4h window
```

### **5. Drix Knows Everything**
```
Orchestrator sends Telegram updates:
  ✓ Every 2 hours: scan results
  ✓ On crashes: immediate recovery alert
  ✓ Every 6 hours: health report
  ✓ At 08:00: morning full report

No surprises. Full visibility.
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

## 🔧 IMPLEMENTATION ARCHITECTURE (CORRECTED)

### **How It Actually Works**

**Step 1: Spawn Orchestrator ONCE (manual, at launch)**
```bash
sessions_spawn(
  label="orchestrator-master",
  runtime="subagent",
  mode="session",  ← PERSISTENT (never exits)
  task="Manage all agent spawning 24/7"
)
```

**Step 2: Orchestrator Runs Forever**
```
ORCHESTRATOR MAIN LOOP (inside persistent session):

While True:
  1. Check time
  2. If 2h interval: spawn improvement-bot (one-shot)
  3. If improvement-bot done + TODO has tasks: spawn dev-coder (one-shot)
  4. If 30m interval: health-check all subagents
  5. If 4h interval: spawn code-auditor (one-shot)
  6. If 6h interval: spawn devops-monitor (one-shot)
  7. At 08:00: spawn morning-report (one-shot)
  8. Every 2h: send Telegram status
  9. Sleep 5 minutes
  10. Go to step 1
```

**Step 3: All Other Agents Spawned On Demand**
```
improvement-bot
  ├─ Spawned: every 2h by orchestrator
  ├─ Mode: run (one-shot)
  ├─ Exit: when scan done (1-2 min)

dev-coder
  ├─ Spawned: when TODO has [ ] tasks
  ├─ Mode: run (one-shot)
  ├─ Exit: when TODO empty or 4h timeout

code-auditor
  ├─ Spawned: every 4h by orchestrator
  ├─ Mode: run (one-shot)
  ├─ Exit: when audit done

devops-monitor
  ├─ Spawned: every 6h by orchestrator
  ├─ Mode: run (one-shot)
  ├─ Exit: when health check done
```

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

## 🎯 NEXT STEPS (CORRECTED)

1. ✅ AGENT_WORKFLOW_24H.md patched (orchestrator pattern)
2. ⏳ Spawn orchestrator-master (ONE TIME, persistent)
3. ⏳ Orchestrator takes over all scheduling
4. ⏳ Drix sleeps, orchestrator manages everything
5. ⏳ All agents spawned on-demand by orchestrator

**Result: TRUE 24/7 continuous operation**

---

## 🌙 WHAT REALLY HAPPENS (Corrected)

```
21:25 - Spawn orchestrator-master (persistent, never exits)
        └─ Inside: main loop starts

21:25 - Orchestrator spawns improvement-bot (one-shot)
        └─ Scans code, finds 27 issues, exits

21:30 - Orchestrator sees TODO has tasks
        └─ Spawns dev-coder (one-shot)

21:35 - dev-coder working on Phase 3
        
23:00 - dev-coder still working

23:15 - Orchestrator 2h timer fires
        └─ dev-coder still running? YES, don't interrupt
        └─ Next iteration

00:00 - dev-coder still working

02:00 - Orchestrator 2h timer fires
        └─ dev-coder still running? YES, don't interrupt
        
04:00 - Orchestrator 4h timer fires
        └─ Spawn code-auditor (one-shot)
        └─ dev-coder still running in parallel

06:00 - Orchestrator 6h timer fires
        └─ Spawn devops-monitor (one-shot)

08:00 - Orchestrator morning report
        └─ dev-coder still working (TODO not empty)

Entire night: ZERO DOWNTIME
             Orchestrator never stopped
             Subagents spawned on schedule
             Work never paused
```
