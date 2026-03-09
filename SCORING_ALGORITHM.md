# 🎯 Scoring Algorithm Specification

**Status:** ✅ FINALIZED  
**Date:** 2026-03-09  
**Owner:** Drax Agent (dev-coder-runner)  
**Phase:** 0 (Specs & Architecture)  
**Depends On:** DATA_SOURCES.md ✅

---

## Overview

This document defines the complete scoring algorithm for the Base Chain Memecoin Detector Bot. The algorithm combines 4 major signals (Holder Distribution, Creator History, Liquidity, Pump Patterns) into a single 0-100 score that determines whether a token is "interesting" for the user.

**Alert Decision:**
- Score ≥ 65: Send normal alert
- Score ≥ 80: Send premium alert (high confidence)
- Score < 65: Silent (no alert)

---

## Component Weights

```
TOTAL SCORE = (
  holder_score      * 0.30 +
  creator_score     * 0.40 +
  liquidity_score   * 0.15 +
  pump_score        * 0.15
) / 1.00

Final Score Range: 0-100
```

### Justification for Weights

| Component | Weight | Reasoning |
|-----------|--------|-----------|
| **Creator History** | 40% | Most important. Creator rug pull = instant loss. Proven creators = reliability. |
| **Holder Distribution** | 30% | Second most important. Whale concentration = easy dump. Diverse = safer. |
| **Liquidity** | 15% | Important for exits. Locked LP = safer. Burnable = risk. |
| **Pump Patterns** | 15% | Context signal. Organic growth = safer. Instant 100x = pump & dump setup. |

---

## 1️⃣ HOLDER DISTRIBUTION SCORE (0-100)

### Purpose
Detect if token holders are diversified (good) or concentrated in whales (bad/risky).

### Inputs
- Top 10 holder addresses + percentages
- Creator wallet address
- Total token supply

### Scoring Rules

#### Rule 1.1: Top 10 Concentration (Base Score)

```
let concentration = sum(top_10_percentages)

if (concentration <= 30%):
  base_score = 100  // Excellent diversity
else if (concentration <= 50%):
  base_score = 85   // Good
else if (concentration <= 70%):
  base_score = 60   // Moderate (risky)
else if (concentration <= 85%):
  base_score = 30   // Very risky
else:
  base_score = 10   // Critical (likely rug)
```

**Example:**
- Top 10 holders own 20% → score 100
- Top 10 holders own 45% → score 85
- Top 10 holders own 72% → score 60
- Top 10 holders own 90% → score 10

---

#### Rule 1.2: Creator Concentration Penalty

```
let creator_percentage = creator_balance / total_supply

if (creator_percentage > 30%):
  penalty = 40  // Creator can dump 30%+ anytime
else if (creator_percentage > 15%):
  penalty = 25  // Creator has significant holdings
else if (creator_percentage > 5%):
  penalty = 10  // Creator has some holdings
else:
  penalty = 0   // Creator holdings minimal
```

**Applied as:**
```
rule_1_score = max(0, base_score - penalty)
```

**Example:**
- Base 100, creator owns 2% → score 100
- Base 100, creator owns 25% → score 75 (100 - 25)
- Base 85, creator owns 50% → score 60 (85 - 25)

---

#### Rule 1.3: Holder Distribution Stability

Check if distribution has changed drastically in last 1 hour (potential dump/accumulation).

```
let distribution_change = |holders_now - holders_1h_ago|

if (distribution_change < 5%):
  stability_bonus = 0     // Normal, no bonus/penalty
else if (distribution_change < 15%):
  stability_penalty = 10  // Moderate change, slight concern
else:
  stability_penalty = 25  // Large redistribution, risky
```

**Applied as:**
```
rule_2_score = max(0, rule_1_score - stability_penalty)
```

**Note:** For tokens <1h old, skip this rule (assume no 1h history).

---

#### Rule 1.4: Holder Count

More holders = generally safer.

```
let holder_count = ...

if (holder_count < 100):
  holder_penalty = 15  // Too few holders, illiquid
else if (holder_count < 500):
  holder_penalty = 5   // Small community
else if (holder_count >= 1000):
  holder_penalty = 0   // Healthy community
```

**Applied as:**
```
holder_distribution_score = max(0, rule_2_score - holder_penalty)
```

---

### Final Calculation

```typescript
function scoreHolderDistribution(holders, creatorAddr, totalSupply) {
  const top10Concentration = holders.slice(0, 10).reduce((sum, h) => sum + h.percentage, 0);
  
  let baseScore = baseScoreFromConcentration(top10Concentration);
  let creatorPenalty = getCreatorPenalty(creatorAddr, holders);
  let stabilityPenalty = getStabilityPenalty(holders);
  let holderCountPenalty = getHolderCountPenalty(holders.length);
  
  return Math.max(0, baseScore - creatorPenalty - stabilityPenalty - holderCountPenalty);
}
```

---

## 2️⃣ CREATOR HISTORY SCORE (0-100)

### Purpose
Assess if the creator is trustworthy (repeated success) or suspicious (new account, rugs).

### Inputs
- Creator wallet address
- Creator's previous launches (from on-chain data)
- Creator wallet age (Unix timestamp of first transaction)
- Creator's portfolio (other holdings)

### Scoring Rules

#### Rule 2.1: Previous Launch Success Rate

Query on-chain history of creator's previous token deployments.

```
let launches = getAllTokensCreatedByCreator(creator_address)
let successful = launches.filter(t => t.rugPull === false)
let success_rate = successful.length / launches.length

if (launches.length === 0):
  base_score = 50  // First time, neutral (no red flag, no proof)
else if (launches.length >= 5 && success_rate >= 0.8):
  base_score = 95  // Proven creator (5+ launches, 80%+ success)
else if (launches.length >= 3 && success_rate >= 0.7):
  base_score = 80  // Good track record (3+ launches, 70%+ success)
else if (launches.length >= 1 && success_rate >= 0.5):
  base_score = 60  // Mixed results (some successes, some failures)
else if (launches.length >= 1 && success_rate < 0.5):
  base_score = 20  // More failures than successes
else if (rugPullDetected(creator_address)):
  base_score = 5   // Confirmed rug puller
```

**Example:**
- First ever launch → 50
- 8 launches, 7 successful (87.5% success) → 95
- 3 launches, 2 successful (66% success) → 60
- History of rug pulls → 5

---

#### Rule 2.2: Wallet Age

Older wallets = less likely to be throwaway accounts.

```
let wallet_age_days = (now - first_transaction_timestamp) / (24 * 3600)

if (wallet_age_days >= 365):
  age_score = 100  // 1+ year old, established
else if (wallet_age_days >= 180):
  age_score = 85   // 6 months old, fairly established
else if (wallet_age_days >= 30):
  age_score = 60   // 1 month old, newish but not fresh
else if (wallet_age_days >= 7):
  age_score = 30   // 1 week old, very suspicious
else:
  age_score = 5    // <1 week old, likely throwaway
```

**Applied to final score as:**
```
adjusted_score = base_score * (age_score / 100)
```

**Example:**
- Base 80, wallet age 0.5 days → 80 * 0.05 = 4 (very sus)
- Base 80, wallet age 7 days → 80 * 0.30 = 24 (suspicious)
- Base 80, wallet age 2 years → 80 * 1.00 = 80 (normal)

---

#### Rule 2.3: Creator Portfolio Quality

Check what else the creator holds. All memecoins? Legitimate projects?

```
let total_holdings = getAllCreatorHoldings(creator_address)
let memecoin_pct = (total_holdings.filter(t => t.isMemecoin).length / total_holdings.length) * 100

if (memecoin_pct >= 90%):
  portfolio_score = 30   // Serial memecoin launcher (suspicious)
else if (memecoin_pct >= 70%):
  portfolio_score = 50   // Mostly memecoins
else if (memecoin_pct >= 40%):
  portfolio_score = 75   // Mixed portfolio (some legitimacy)
else:
  portfolio_score = 90   // Mostly legitimate projects (good sign)
```

**Applied as:**
```
adjusted_score = adjusted_score * (portfolio_score / 100)
```

---

#### Rule 2.4: Recent Activity

Check if creator has been active recently (builds confidence).

```
let days_since_last_action = (now - last_transaction_timestamp) / (24 * 3600)

if (days_since_last_action < 7):
  activity_bonus = 0     // Active, normal
else if (days_since_last_action < 30):
  activity_penalty = 5   // Somewhat inactive
else if (days_since_last_action < 90):
  activity_penalty = 10  // Inactive for a month
else:
  activity_penalty = 20  // Abandoned wallet (sus)
```

**Applied as:**
```
creator_history_score = max(0, adjusted_score - activity_penalty)
```

---

### Final Calculation

```typescript
function scoreCreatorHistory(creatorAddr, allTokenData) {
  const launches = getCreatorLaunches(creatorAddr);
  let baseScore = scoreFromLaunchHistory(launches);
  
  const walletAge = getWalletAge(creatorAddr);
  const ageMultiplier = getAgeMultiplier(walletAge);
  
  const portfolio = getCreatorPortfolio(creatorAddr);
  const portfolioMultiplier = getPortfolioMultiplier(portfolio);
  
  const daysSinceActivity = getDaysSinceLastActivity(creatorAddr);
  const activityPenalty = getActivityPenalty(daysSinceActivity);
  
  let finalScore = baseScore * ageMultiplier * portfolioMultiplier - activityPenalty;
  return Math.max(0, Math.min(100, finalScore));
}
```

---

## 3️⃣ LIQUIDITY SCORE (0-100)

### Purpose
Assess if there's enough liquidity to exit + check if dev can pull it.

### Inputs
- Liquidity pool size (USD)
- Is liquidity locked? (and for how long?)
- Token burn mechanism?
- Liquidity distribution (single pool vs multiple pools)

### Scoring Rules

#### Rule 3.1: Liquidity Size

```
let liquidity_usd = total_liquidity_in_all_pools

if (liquidity_usd >= 100000):
  size_score = 100  // Excellent, >$100k
else if (liquidity_usd >= 50000):
  size_score = 85   // Good, $50-100k
else if (liquidity_usd >= 20000):
  size_score = 70   // Moderate, $20-50k
else if (liquidity_usd >= 10000):
  size_score = 50   // Risky, $10-20k
else if (liquidity_usd >= 5000):
  size_score = 30   // Very risky, $5-10k
else if (liquidity_usd >= 1000):
  size_score = 10   // Critically risky, <$5k
else:
  size_score = 1    // Illiquid, <$1k
```

**Example:**
- $75k liquidity → 85
- $35k liquidity → 70
- $8k liquidity → 30
- $500 liquidity → 1

---

#### Rule 3.2: Liquidity Lock Status

```
let lock_info = checkLiquidityLock(token_ca)

if (lock_info.isLocked && lock_info.unlockDate > now + 365*days):
  lock_score = 100  // Locked 1+ year, excellent
else if (lock_info.isLocked && lock_info.unlockDate > now + 180*days):
  lock_score = 85   // Locked 6 months
else if (lock_info.isLocked && lock_info.unlockDate > now + 30*days):
  lock_score = 60   // Locked 1 month
else if (lock_info.isLocked && lock_info.unlockDate > now + 7*days):
  lock_score = 30   // Locked 1 week only
else if (lock_info.isLocked):
  lock_score = 10   // Locked but expiring soon (<1 week)
else if (!lock_info.isLocked && isLiquidityBurnable(token_ca)):
  lock_score = 5    // Not locked AND burnable (worst case)
else if (!lock_info.isLocked):
  lock_score = 20   // Not locked but not burnable
```

**Applied as:**
```
size_score = (size_score + lock_score) / 2  // Average of size + lock
```

**Example:**
- $50k liquidity (85) + Locked 6 months (85) → 85
- $15k liquidity (50) + Not locked (20) → 35
- $100k liquidity (100) + Locked 2 weeks (30) → 65

---

#### Rule 3.3: Burn Mechanism

Tokens with burn mechanisms are safer (supply shrinks).

```
let has_burn = token.hasBurnFunction()

if (has_burn):
  burn_bonus = 15  // Reduces supply over time, safer
else:
  burn_bonus = 0   // No burn
```

**Applied as:**
```
liquidity_score = min(100, size_and_lock_score + burn_bonus)
```

---

#### Rule 3.4: Liquidity Distribution

Multiple pools = safer (can't pull all liquidity at once).

```
let pool_count = countLiquidityPools(token_ca)

if (pool_count >= 3):
  distribution_bonus = 10  // Diversified across pools
else if (pool_count === 2):
  distribution_bonus = 5   // Some diversification
else if (pool_count === 1):
  distribution_bonus = 0   // Single pool (riskier)
else:
  distribution_bonus = -10 // No pools found
```

**Applied as:**
```
liquidity_score = max(0, liquidity_score + distribution_bonus)
```

---

### Final Calculation

```typescript
function scoreLiquidity(tokenCA) {
  let sizeScore = scoreLiquiditySize(tokenCA);
  let lockScore = scoreLiquidityLock(tokenCA);
  let avgScore = (sizeScore + lockScore) / 2;
  
  let burnBonus = hasTokenBurn(tokenCA) ? 15 : 0;
  let distributionBonus = countPools(tokenCA) > 1 ? 5 : 0;
  
  return Math.max(0, Math.min(100, avgScore + burnBonus + distributionBonus));
}
```

---

## 4️⃣ PUMP PATTERN SCORE (0-100)

### Purpose
Detect suspicious pump-and-dump patterns vs organic growth.

### Inputs
- Launch price (initial)
- Current price
- Time since launch
- Volume over time (5min, 1h, etc)
- Price volatility (std dev)

### Scoring Rules

#### Rule 4.1: Launch to Current Ratio

```
let price_ratio = current_price / launch_price

if (price_ratio <= 1.0):
  ratio_score = 50  // Token dumped (normal after hype)
else if (price_ratio <= 2.0):
  ratio_score = 85  // Modest growth (2x, healthy)
else if (price_ratio <= 5.0):
  ratio_score = 75  // Good growth (5x, still reasonable)
else if (price_ratio <= 10.0):
  ratio_score = 60  // Strong growth (10x, could be pump)
else if (price_ratio <= 50.0):
  ratio_score = 40  // Major pump (50x, likely dumping soon)
else if (price_ratio <= 100.0):
  ratio_score = 20  // Extreme pump (100x, classic P&D)
else:
  ratio_score = 5   // Insane pump (100x+, certain dump)
```

**Example:**
- Launched at $0.0001, now $0.0002 (2x) → 85
- Launched at $0.0001, now $0.001 (10x) → 60
- Launched at $0.0001, now $0.01 (100x) → 20

---

#### Rule 4.2: Time Since Launch Penalty

Newer tokens are riskier (creators might dump immediately).

```
let hours_since_launch = (now - launch_time) / 3600

if (hours_since_launch >= 24):
  age_penalty = 0    // 1+ day old, passed initial risk period
else if (hours_since_launch >= 6):
  age_penalty = 10   // 6 hours old, still risky
else if (hours_since_launch >= 1):
  age_penalty = 20   // 1-6 hours old, very risky
else if (hours_since_launch >= 0.25):  // 15 minutes
  age_penalty = 40   // <15 minutes old, critically risky
else:
  age_penalty = 60   // <5 minutes old, don't buy yet
```

**Applied as:**
```
adjusted_ratio_score = max(5, ratio_score - age_penalty)
```

**Example:**
- Ratio score 80, token 2 hours old → 80 - 20 = 60
- Ratio score 40, token 30 min old → max(5, 40 - 40) = 5
- Ratio score 85, token 30 hours old → 85 - 0 = 85

---

#### Rule 4.3: Volume Concentration

If all volume happened in first 5 minutes, it's a classic pump setup.

```
let total_volume_24h = ...
let volume_first_5min = ...
let volume_concentration = (volume_first_5min / total_volume_24h) * 100

if (volume_concentration <= 20%):
  volume_score = 100  // Spread out over time (healthy)
else if (volume_concentration <= 40%):
  volume_score = 80   // Some early volume, but ongoing
else if (volume_concentration <= 60%):
  volume_score = 50   // Significant early concentration
else if (volume_concentration <= 80%):
  volume_score = 30   // Mostly early volume (pump sign)
else:
  volume_score = 10   // Almost all volume at launch (dump incoming)
```

**Applied to average:**
```
pump_score_candidate = (adjusted_ratio_score + volume_score) / 2
```

---

#### Rule 4.4: Price Volatility

High volatility = risky (classic dump behavior is sudden crashes).

```
let volatility = standard_deviation(prices_last_1h)

if (volatility <= 5%):
  volatility_score = 90  // Stable (healthy)
else if (volatility <= 10%):
  volatility_score = 75  // Moderate volatility
else if (volatility <= 20%):
  volatility_score = 50  // High volatility
else if (volatility <= 50%):
  volatility_score = 20  // Extreme swings
else:
  volatility_score = 5   // Wild swings (P&D behavior)
```

**Applied as:**
```
pump_score = (pump_score_candidate + volatility_score) / 2
```

---

### Final Calculation

```typescript
function scorePumpPattern(tokenData) {
  const priceRatio = tokenData.currentPrice / tokenData.launchPrice;
  let ratioScore = scoreFromRatio(priceRatio);
  
  const hoursSinceLaunch = getHoursSinceLaunch(tokenData);
  const agePenalty = getAgePenalty(hoursSinceLaunch);
  
  let adjustedRatioScore = Math.max(5, ratioScore - agePenalty);
  
  const volumeScore = scoreVolumeConcentration(tokenData);
  const volatilityScore = scoreVolatility(tokenData);
  
  const pumpScore = (adjustedRatioScore + volumeScore + volatilityScore) / 3;
  return Math.max(0, Math.min(100, pumpScore));
}
```

---

## 📊 FINAL SCORE CALCULATION

```typescript
function getTokenScore(tokenData) {
  const holderScore = scoreHolderDistribution(tokenData.holders, tokenData.creator, tokenData.supply);
  const creatorScore = scoreCreatorHistory(tokenData.creator, allTokenHistory);
  const liquidityScore = scoreLiquidity(tokenData.ca);
  const pumpScore = scorePumpPattern(tokenData);
  
  const finalScore = (
    holderScore * 0.30 +
    creatorScore * 0.40 +
    liquidityScore * 0.15 +
    pumpScore * 0.15
  );
  
  return Math.round(finalScore);  // 0-100
}
```

---

## 🚨 ALERT THRESHOLDS

| Score Range | Decision | Urgency |
|-------------|----------|---------|
| ≥ 80 | 🟢 SEND PREMIUM ALERT | High interest opportunity |
| 65-79 | 🟡 SEND NORMAL ALERT | Worth investigating |
| 50-64 | 🔕 SILENT | Borderline, don't alert |
| < 50 | 🔴 REJECT | High risk, ignore |

---

## 📋 EDGE CASES

### Case 1: Brand New Token (<5 minutes old)

All scores penalized heavily due to uncertainty:
- Holder distribution: Likely concentrated → low score
- Creator history: Unknown → neutral (50)
- Liquidity: Minimum → low score
- Pump pattern: Age penalty (-40+) → very low score

**Expected final score: 20-40** (no alert)

### Case 2: Established Token (>1 week old)

All scores approach true values:
- Age penalties removed
- Creator history = proven
- Liquidity = established

**Expected range: Varies widely 10-95**

### Case 3: Creator with rug history

Creator score = 5 (or lower)
Even if other factors are good:
```
(85 * 0.30 + 5 * 0.40 + 80 * 0.15 + 75 * 0.15)
= 25.5 + 2 + 12 + 11.25
= 50.75 (SILENT, no alert)
```

### Case 4: Insane pump (100x in 5 minutes)

Pump score = 5-20 (extreme dump signal)
But other factors might be good:
```
(90 * 0.30 + 70 * 0.40 + 75 * 0.15 + 10 * 0.15)
= 27 + 28 + 11.25 + 1.5
= 67.75 (NORMAL ALERT, but cautionary)
```

**Alert message: "Huge pump detected, likely to dump soon"**

---

## ✅ Sign-Off

- **Weights justified:** ✅
- **All rules defined:** ✅
- **Edge cases covered:** ✅
- **Formulas testable:** ✅
- **Ready for implementation:** ✅

---

**Last Updated:** 2026-03-09  
**Next Steps:**
1. Code: Implement scoring algorithm in TypeScript
2. Spec: Create TELEGRAM_CONFIG.md (Task 1.3)
3. Testing: Unit tests for each scoring rule

---

## Appendix: Example Scoring Walkthrough

### Token: "BasedDoge" (Fictional Example)

**Input Data:**
```
CA: 0x1234...abcd
Launch time: 1 hour ago
Current price: $0.00001 (launched at $0.000001) = 10x
Creator: 0x5678...ef01
Holder distribution: [15%, 12%, 10%, 8%, 7%, 5%, 4%, 3%, 2%, 2%] (top 10 = 68%)
Creator owns: 3%
Liquidity: $35k (locked 6 months)
Volume first 5 min: 30% of 24h total
Volatility: 8%
```

**Scoring:**

1. **Holder Distribution (30%):**
   - Base: 68% concentration → 60
   - Creator penalty (3%) → 0
   - Holder count (500) → 0
   - Result: **60 / 100**

2. **Creator History (40%):**
   - 2 previous launches, 1 successful (50%) → 60 base
   - Wallet age: 45 days → 0.60 multiplier
   - Portfolio: 80% memecoin → 0.50 multiplier
   - Result: 60 * 0.60 * 0.50 = **18 / 100**

3. **Liquidity (15%):**
   - Size $35k → 70
   - Lock 6 months → 85
   - Avg: 77.5
   - Result: **77.5 / 100**

4. **Pump Pattern (15%):**
   - 10x in 1 hour → 60 ratio score
   - Age penalty (1 hour) → -10 = 50
   - Volume concentration 30% → 80
   - Volatility 8% → 75
   - Avg: (50 + 80 + 75) / 3 = **68.3 / 100**

**Final Score:**
```
= (60 * 0.30) + (18 * 0.40) + (77.5 * 0.15) + (68.3 * 0.15)
= 18 + 7.2 + 11.625 + 10.245
= 47.07 ≈ 47 / 100
```

**Decision:** 🔕 **SILENT** (below 65 threshold)

**Why?** Despite decent liquidity and pump, the creator is unreliable (50% success rate, young account, serial memecoin launcher). The risk outweighs the opportunity.
