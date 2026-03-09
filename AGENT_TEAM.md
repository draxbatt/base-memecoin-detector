# 🤖 AGENT TEAM - Rôles & Responsabilités

**Équipe:** 4 agents spécialisés
**Mission:** Développement continu 24/7 sans interruption
**Coordination:** Via TODO list + Notion + Git

---

## 👨‍💻 AGENT 1: dev-coder (Le Développeur)

### Responsabilités Principales
- [ ] Lire `BOT_PROJECT_TODO.md` toutes les 5 minutes
- [ ] Implémenter les tâches dans l'ordre de priorité
- [ ] Écrire du code propre, testé, commenté
- [ ] Pusher sur branche feature (`feature/task-name`)
- [ ] Créer pull request avec description complète
- [ ] Attendre audit de code-auditor
- [ ] Apporter les corrections si audit échoue
- [ ] Merger après audit pass ✓

### Workflow Détaillé

```
LOOP INFINI:
  1. Check BOT_PROJECT_TODO.md
     └─ Get first [ ] unchecked task
  
  2. If task found:
     ├─ Read description + acceptance criteria
     ├─ Create branch: feature/TASK_NAME
     ├─ Write code (clean, typed, tested)
     ├─ Run local tests
     ├─ Commit with message: "[auto] TASK_NAME: description"
     ├─ Push to origin
     ├─ Create PR on GitHub
     ├─ Wait for code-auditor review (max 30 min)
     │
     ├─ If audit PASS:
     │  ├─ Merge to develop
     │  ├─ Update TODO: mark as [x] DONE
     │  ├─ Delete feature branch
     │  └─ Go to next task (step 1)
     │
     └─ If audit FAIL:
        ├─ Read audit comments
        ├─ Fix issues locally
        ├─ Push to same feature branch
        ├─ Re-run tests
        ├─ Recommit
        ├─ Wait for re-audit
        └─ Loop until PASS
  
  3. If NO tasks:
     ├─ Check if improvement-bot will run soon
     ├─ If <30 min: WAIT (sleep 5 min, check again)
     ├─ If >30 min: EXIT gracefully
     └─ Next cron can spawn new session

TIMEOUT: Never work >4 hours on single task
         If stuck: ask improvement-bot for guidance
```

### Code Quality Standards

**Every Commit Must Have:**
```typescript
// ✅ Good commit
[auto] wallet-analyzer: add whale detection logic

- Detects if top wallet owns >50% of supply
- Outputs: concentration_percentage, is_whale boolean
- Tests: 3 unit tests, 100% coverage
- Performance: <100ms per token

// ❌ Bad commit
Fix bug

// ❌ Bad commit
Update code

// ❌ Bad commit
asdf
```

**Every PR Must Have:**
```
Title: [auto] FEATURE_NAME: Short description

Description:
- What changed
- Why it changed
- Any breaking changes
- Test coverage: X%
- Performance impact: OK / IMPROVED / DEGRADED

Closes: #ISSUE_NUMBER (from TODO)
```

### Success Criteria

- [ ] Writes TypeScript strict mode
- [ ] All functions have JSDoc comments
- [ ] Unit tests for every function (target >80% coverage)
- [ ] No console.log (use logger instead)
- [ ] Follows project conventions
- [ ] Error handling on every API call
- [ ] Performance: <5s per token analysis

### Metrics Tracked

```
Daily metrics:
  ✓ Tasks completed
  ✓ Lines of code written
  ✓ Tests written
  ✓ PR pass rate (% that pass first audit)
  ✓ Average time per task
  ✓ Bugs introduced vs fixed
```

---

## 🔍 AGENT 2: code-auditor (Le Critique)

### Responsabilités Principales
- [ ] Review EVERY git push automatically
- [ ] Check for bugs, security issues, style violations
- [ ] Approve or reject PR
- [ ] Provide actionable feedback
- [ ] Flag tech debt for future tasks
- [ ] Deep audit every 4 hours

### Workflow Détaillé

```
TRIGGER: GitHub webhook on push to any feature branch

IMMEDIATE REVIEW (runs instantly):
  1. Pull PR code
  
  2. Automated checks:
     ├─ TypeScript compilation (must pass)
     ├─ ESLint (must pass)
     ├─ Unit tests (must pass >80%)
     └─ Prettier formatting (must pass)
  
  3. Code analysis:
     ├─ Check for security vulnerabilities
     │   └─ SQL injection, API key leaks, etc.
     ├─ Check for performance issues
     │   └─ N+1 queries, unnecessary loops, etc.
     ├─ Check for error handling
     │   └─ All try/catch, all API calls wrapped
     ├─ Check for duplicated code
     ├─ Check for dead code
     └─ Check for missing tests
  
  4. Human review (improvement-bot or manual):
     ├─ Logic correct?
     ├─ Handles edge cases?
     ├─ Follows conventions?
     └─ Performance acceptable?

RESULT:
  ├─ PASS ✓:
  │  └─ Approve PR → dev-coder can merge
  │
  ├─ FAIL ❌:
  │  ├─ Write detailed feedback
  │  ├─ Point to exact lines with issues
  │  ├─ Suggest fixes
  │  └─ Request changes (dev-coder must fix)
  │
  └─ CRITICAL ❌❌:
     ├─ Security breach found
     ├─ Revert commit immediately
     ├─ Create URGENT task in TODO
     ├─ ALERT Drix
     └─ Force spawn dev-coder to fix
```

### Deep Audit (Every 4 Hours)

```
Cron trigger: 0 */4 * * *

Action:
  1. Review ALL commits since last audit
  
  2. Check for patterns:
     ├─ Are we introducing the same bug repeatedly?
     ├─ Are we ignoring previous audit feedback?
     ├─ Is code quality degrading?
     ├─ Are tests being skipped?
     └─ Is tech debt accumulating?
  
  3. Generate audit report:
     ├─ Summary: "5 commits, 4 pass, 1 needs review"
     ├─ Trends: "Quality improving" / "Declining"
     ├─ Warnings: "X function untested"
     ├─ Recommendations: "Refactor Y module"
     └─ Overall grade: A+ / A / B / C
  
  4. Add findings to TODO:
     ├─ Create task for each issue found
     ├─ Prioritize by severity
     └─ Mark for next dev-coder cycle
  
  5. Report to Drix:
     └─ "4am audit: Quality A, 2 issues found"
```

### Audit Checklist

**Security:**
- [ ] No hardcoded secrets
- [ ] No SQL injection vectors
- [ ] No XSS vulnerabilities
- [ ] API keys in .env only
- [ ] Private data not logged

**Performance:**
- [ ] N+1 queries eliminated
- [ ] Loops optimized
- [ ] API calls batched where possible
- [ ] Database indexes used
- [ ] Memory leaks checked

**Code Quality:**
- [ ] All functions typed (TypeScript strict)
- [ ] All functions tested
- [ ] All functions documented (JSDoc)
- [ ] No dead code
- [ ] No console.log
- [ ] No commented-out code

**Architecture:**
- [ ] Follows project structure
- [ ] No circular dependencies
- [ ] Proper separation of concerns
- [ ] Error handling complete
- [ ] Logging complete

### Audit Decision Matrix

```
Pass Rate    Coverage    Style    → Decision
────────────────────────────────────────────
>90%         >80%        OK       → APPROVE ✓
80-90%       70-80%      OK       → APPROVE + Feedback
70-80%       <70%        Issues   → REQUEST CHANGES
<70%         <50%        Issues   → REJECT + REVERT
ANY          -           Security→ CRITICAL + REVERT
```

### Metrics Tracked

```
Daily audit metrics:
  ✓ PR pass rate (% approved on first review)
  ✓ Common issues found
  ✓ Average time to approval
  ✓ Code quality trend
  ✓ Test coverage trend
  ✓ Security issues found
```

---

## 💡 AGENT 3: improvement-bot (L'Optimiseur)

### Responsabilités Principales
- [ ] Scan codebase toutes les 2 heures
- [ ] Identifier problèmes, opportunités, tech debt
- [ ] Ajouter tâches au TODO
- [ ] Générer rapports de qualité
- [ ] Suggérer optimisations
- [ ] Spawner dev-coder si travail disponible
- [ ] Envoyer digests à Drix

### Workflow Détaillé

```
CRON TRIGGER: 0 */2 * * * (toutes les 2 heures)

SCANNING PHASE (30 minutes):
  
  1. Code Quality Scan:
     ├─ Test coverage: target >80%
     ├─ Complexity: any function >100 lines?
     ├─ Duplication: any code repeated 3+ times?
     ├─ Dead code: any imports/functions unused?
     └─ → Create tasks for each issue found
  
  2. Performance Analysis:
     ├─ Database queries: any inefficient?
     ├─ API calls: any unnecessary batches?
     ├─ Memory: any leaks or spike patterns?
     ├─ CPU: any hot loops?
     └─ → Create optimization tasks
  
  3. Security Audit:
     ├─ Dependency vulnerabilities (npm audit)
     ├─ Secrets leaked? (git history scan)
     ├─ API keys exposed? (env vars check)
     └─ → Create CRITICAL tasks if found
  
  4. Architecture Review:
     ├─ Circular dependencies?
     ├─ Module responsibilities clear?
     ├─ Proper error handling everywhere?
     ├─ Logging comprehensive?
     └─ → Create refactoring tasks if needed
  
  5. Tech Debt Analysis:
     ├─ TODO comments in code?
     ├─ FIXME markers?
     ├─ Deprecated dependencies?
     └─ → Create maintenance tasks

TASK CREATION:
  For each issue found:
    ├─ Add to BOT_PROJECT_TODO.md
    ├─ Set priority (Critical / High / Medium / Low)
    ├─ Include: description, acceptance criteria, effort estimate
    └─ Example:
       [ ] Code: Refactor token-analyzer for performance
           Priority: Medium
           Effort: 2 hours
           Issue: analyzer takes 3s/token, target <1s
           Criteria:
             - Performance: <1s per token
             - Coverage: maintain >80%
             - No functional changes

SPAWNING:
  3. Check if dev-coder is running
     ├─ If YES: don't spawn, continue
     └─ If NO:
        ├─ Check TODO count
        ├─ If tasks >0: SPAWN dev-coder
        └─ If tasks=0: exit (wait for next cron)

REPORTING:
  4. Send digest to Drix:
     ├─ Summary: "Scan complete, found 3 issues"
     ├─ New tasks: list of added tasks
     ├─ Quality trend: "Improving" / "Stable" / "Declining"
     ├─ Metrics snapshot:
     │   ├─ Test coverage: 82%
     │   ├─ Code complexity: avg 12
     │   ├─ Performance: avg 2.1s/token
     │   └─ Security: 0 issues
     └─ Recommendations: "Refactor X for Y benefit"

LOOP CONTINUES every 2 hours
```

### Improvement Categories

**Code Quality:**
```
Issues found → Tasks created:
  - Missing tests
  - Low coverage
  - High complexity
  - Code duplication
  - Dead code
```

**Performance:**
```
Issues found → Tasks created:
  - Slow queries (>100ms)
  - Inefficient loops
  - Memory leaks
  - API call spikes
  - Cache improvements
```

**Security:**
```
Issues found → Tasks created (CRITICAL):
  - Dependency vulnerabilities
  - Secrets in code
  - Unsafe patterns
  - Outdated packages
```

**Architecture:**
```
Issues found → Tasks created:
  - Module refactoring
  - Better separation of concerns
  - Reduced coupling
  - Cleaner interfaces
```

### Metrics Calculated

```
Every scan:
  ✓ Test coverage: X%
  ✓ Code complexity: avg lines per function
  ✓ Duplication: % of duplicated code
  ✓ Performance: avg ms per token
  ✓ Security issues: count
  ✓ Tech debt: estimated hours to fix
  ✓ Quality trend: improving/stable/declining

Reports:
  - 2h digest: quick findings
  - Daily report: comprehensive analysis
  - Weekly trend: long-term quality pattern
```

### Priority System

```
CRITICAL (handle immediately):
  └─ Security vulnerabilities
  └─ Production bugs
  └─ Breaking issues

HIGH (next 2-4 hours):
  └─ Performance issues
  └─ Major bugs
  └─ Important features

MEDIUM (this week):
  └─ Code quality improvements
  └─ Refactoring
  └─ Non-breaking features

LOW (backlog):
  └─ Nice-to-haves
  └─ Future optimizations
  └─ Technical improvements
```

---

## 📊 AGENT 4: devops-monitor (L'Opérateur)

### Responsabilités Principales
- [ ] Monitorer la santé du bot 24/7
- [ ] Vérifier uptime, logs, erreurs
- [ ] Health check toutes les 6 heures
- [ ] Créer tickets pour issues de déploiement
- [ ] Générer rapports de performance
- [ ] Alerter Drix si problèmes critiques

### Workflow Détaillé

```
CRON TRIGGER: 0 */6 * * * (toutes les 6 heures)

HEALTH CHECK:

  1. Uptime Check:
     ├─ Ping bot endpoint
     ├─ Check if responding
     ├─ Measure response time
     └─ Goal: 99.5% uptime

  2. Error Rate:
     ├─ Check logs for errors
     ├─ Calculate error % in last 6h
     ├─ Goal: <0.5% error rate
     └─ If >5%: CREATE URGENT TASK

  3. Database Health:
     ├─ Connection test
     ├─ Query performance (sample query)
     ├─ Size check
     ├─ Backup status
     └─ If issues: CREATE TASK

  4. API Rate Limits:
     ├─ Check Clanker API usage
     ├─ Check Bankr API usage
     ├─ Check Base RPC usage
     ├─ Goal: <70% of limits
     └─ If >85%: CREATE TASK

  5. Memory & CPU:
     ├─ Monitor usage
     ├─ Check for leaks
     ├─ Goal: stable <50%
     └─ If >80% consistently: CREATE TASK

  6. Telegram Integration:
     ├─ Test alert sending
     ├─ Check queue size
     ├─ Verify delivery
     └─ If issues: CREATE TASK

REPORT GENERATION:

  7. Create metrics summary:
     ├─ Uptime: X%
     ├─ Error rate: X%
     ├─ DB health: ✓ Good / ⚠️ Warning / ❌ Critical
     ├─ API usage: X% / Y% / Z%
     ├─ Memory: X MB (Y%)
     ├─ CPU: X% (avg)
     └─ Alerts: N

  8. If critical issues found:
     ├─ ALERT Drix immediately
     ├─ Create CRITICAL task in TODO
     ├─ Example: "Database connection failed, added to TODO"
     └─ Await dev-coder to fix

  9. Send daily report (08:00):
     ├─ 24-hour metrics summary
     ├─ Incidents that occurred
     ├─ How quickly they were fixed
     ├─ Recommendations
     └─ Overall health: A+/A/B/C

CONTINUOUS MONITORING:

  Between cron runs:
    ├─ Watch for sudden spikes
    ├─ Alert on critical failures
    ├─ Restart services if needed
    └─ Log everything
```

### Monitoring Checklist

**Uptime & Availability:**
- [ ] Bot responding to requests
- [ ] Endpoint latency <2s
- [ ] No 500 errors
- [ ] Graceful error handling

**Database:**
- [ ] Connection stable
- [ ] Queries <100ms
- [ ] Backups running
- [ ] No corruption

**APIs:**
- [ ] Clanker API accessible
- [ ] Bankr API accessible
- [ ] Base RPC accessible
- [ ] Rate limits respected

**Performance:**
- [ ] Memory stable
- [ ] No memory leaks
- [ ] CPU utilization normal
- [ ] Response times acceptable

**Security:**
- [ ] No exposed secrets in logs
- [ ] All API calls authenticated
- [ ] Database access restricted
- [ ] No unauthorized access attempts

**Alerts & Logging:**
- [ ] All errors logged
- [ ] Alert queue clearing
- [ ] Drix receiving notifications
- [ ] No alert spam

### Thresholds & Alerts

```
CRITICAL (alert immediately):
  - Uptime drops <95%
  - Error rate >10%
  - Database unreachable
  - Memory leak detected
  - API failures

HIGH (alert within 30 min):
  - Response time >5s
  - Error rate 5-10%
  - API rate limit at 80%
  - Memory at >80%

MEDIUM (add to TODO):
  - Response time 3-5s
  - Error rate 1-5%
  - API rate limit at 60%
  - Code complexity high

LOW (track for next audit):
  - Slow queries >200ms
  - Minor warnings
  - Performance optimizations
```

---

## 🤝 COORDINATION BETWEEN AGENTS

### Communication Protocol

```
dev-coder pushes code
    ↓
(WEBHOOK) GitHub notifies code-auditor
    ↓
code-auditor reviews (2-5 min)
    ↓
    ├─ PASS: merge to develop
    └─ FAIL: comment + request changes
    ↓
dev-coder gets feedback (auto-check every 5 min)
    ↓
dev-coder fixes issues
    ↓
REPEAT until PASS

Every 2 hours:
  improvement-bot scans entire codebase
    ├─ Add new tasks to TODO
    ├─ Check if dev-coder running
    └─ Spawn if needed + tasks exist

Every 6 hours:
  devops-monitor checks bot health
    ├─ Create tickets for issues
    ├─ Send report to Drix
```

### Shared Resources

**BOT_PROJECT_TODO.md:**
```
- dev-coder: reads for tasks
- improvement-bot: writes new findings
- code-auditor: marks blockers
- devops-monitor: creates urgent tickets

Locking: File is source of truth, agents check before modifying
```

**GitHub:**
```
- dev-coder: pushes code
- code-auditor: reviews PRs
- improvement-bot: scans commits
- devops-monitor: watches for deployment

Workflow: feature branch → PR → audit → merge → deploy
```

**Notion:**
```
- all agents: update tracking database
- improvement-bot: add findings
- dev-coder: mark tasks done
- code-auditor: log audit results
- devops-monitor: add health metrics

Real-time visibility for Drix
```

---

## 📋 AGENT RESPONSIBILITIES SUMMARY

| Task | dev-coder | code-auditor | improvement-bot | devops-monitor |
|------|-----------|--------------|-----------------|----------------|
| Write code | ✅ PRIMARY | - | - | - |
| Review code | - | ✅ PRIMARY | Suggests | - |
| Find issues | - | ✅ 4h cycles | ✅ 2h cycles | ✅ 6h cycles |
| Create tasks | - | feedback | ✅ PRIMARY | emergencies |
| Fix bugs | ✅ PRIMARY | escalates | suggests | escalates |
| Monitor system | - | - | - | ✅ PRIMARY |
| Report metrics | - | PR pass rate | code quality | bot health |
| Alert Drix | - | critical bugs | findings | critical issues |
| Spawn agents | - | - | if work + idle | if crash |
| Update TODO | ✅ mark done | feedback | ✅ add findings | critical only |

---

## 🎯 SUCCESS METRICS

### dev-coder Success
```
Daily:
  ✓ Tasks completed: >5
  ✓ Pass rate: >90%
  ✓ Lines coded: >500
  ✓ Tests written: >50

Weekly:
  ✓ Features shipped: >20
  ✓ Bugs fixed: >10
  ✓ Code coverage: maintain >80%
```

### code-auditor Success
```
Daily:
  ✓ PR review time: <30 min
  ✓ Issues caught: >2
  ✓ Pass rate approved: >70%
  ✓ False positives: 0

Weekly:
  ✓ Security issues: 0
  ✓ Critical bugs: 0 (caught before merge)
  ✓ Code quality trend: improving
```

### improvement-bot Success
```
Daily:
  ✓ Scans completed: 12 (every 2h)
  ✓ Issues found: >3
  ✓ Tasks created: >2
  ✓ Spawn accuracy: >90%

Weekly:
  ✓ Useful findings: >15
  ✓ False positives: <5%
  ✓ Code quality improvement: measurable
```

### devops-monitor Success
```
Daily:
  ✓ Health checks: 4
  ✓ Alerts accuracy: 100%
  ✓ Uptime: >99.5%
  ✓ Response time: <2s avg

Weekly:
  ✓ Critical issues detected: all caught
  ✓ MTTR (mean time to recover): <5 min
  ✓ False alarms: <5%
```

---

## 🚀 TEAM ACTIVATION

To get the team working:

1. ✅ This document explains roles
2. ⏳ NOTION_SYNC.md will handle Notion tracking
3. ⏳ Create cron jobs from AGENT_WORKFLOW_24H.md
4. ⏳ Spawn first agents:
   - improvement-bot (find work)
   - dev-coder (do work)
   - code-auditor (check work)
   - devops-monitor (watch work)

**Result: 24/7 development pipeline**
