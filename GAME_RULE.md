# Game Rule

This document defines the official gameplay rules for the Match Card Battle roguelite prototype.

Use this document as the design source before changing battle logic, skill logic, reward logic, or balance values.

## Core Loop

The game is a vertical match-3 roguelite battle game.

Basic loop:

```text
1. Player enters a stage.
2. Enemy appears.
3. Player moves orbs on the board.
4. Matched orbs resolve by color/type.
5. Combo and cascade results are calculated.
6. Player effects resolve.
7. Player attacks resolve.
8. Enemy countdown decreases.
9. Enemy acts when countdown reaches 0.
10. Buffs/debuffs/status durations tick.
11. Repeat until victory or defeat.
```

## Board

Current board:

```text
7 x 7
```

Current orb types:

```text
Fire
Wood
Thunder
Light
Dark
Enhanced Fire
```

Reserved future orb types:

```text
Water
Heart
Rainbow
Poison
Jammer
Lock
```

## Orb Matching Rule

A valid match requires at least 3 connected orbs of the same color/type.

Matches may be:

```text
Horizontal
Vertical
L-shape
T-shape
Cross
Cluster
Cascade
Bomb result
Special effect result
```

Total matched count matters.

Example:

```text
3 matched = normal trigger
4 matched = stronger trigger
5+ matched = advanced trigger
```

## Combo

A Combo is one resolved match group during a move sequence.

Cascades count as additional Combo.

Combo multiplier:

```text
Combo multiplier = 1 + (Combo - 1) x 0.15
```

Examples:

```text
1 Combo = 1.00x
2 Combo = 1.15x
3 Combo = 1.30x
4 Combo = 1.45x
5 Combo = 1.60x
6 Combo = 1.75x
7 Combo = 1.90x
```

Display rule:

```text
1 Combo: no big Combo popup required
2+ Combo: show Combo text
5+ Combo: show "連鎖爆發"
7+ Combo: show "神速連鎖"
```

## Turn Order

Recommended turn resolution order:

```text
1. Player completes orb movement.
2. Board checks matches.
3. Matched orbs play clear animation.
4. Board records total matched orbs by color.
5. Cascades resolve.
6. Final Combo multiplier is calculated.
7. Order gauge and Divine gauge gain are calculated.
8. Orb color effects resolve.
9. Passive skills may trigger.
10. Player attack events queue.
11. Player attack events play one by one.
12. Enemy HP updates.
13. Victory check.
14. Enemy countdown decreases.
15. Enemy acts if countdown reaches 0.
16. Shield/counterattack effects resolve after enemy attack.
17. Status durations tick.
18. Next player turn begins.
```

Important:

- Visuals should follow logic order.
- Damage, healing, shield, and status text should not all appear at the same time.
- Major effects should resolve one by one for readability.

## Energy

Hero energy:

```text
Max Energy = 100
```

Thunder orbs generate energy.

Current Thunder energy rule:

```text
3 Thunder = +5 Energy
4 Thunder = +7 Energy
5 Thunder = +10 Energy
6 Thunder = +13 Energy
7+ Thunder = +15 Energy
```

Energy gain is affected by final Combo multiplier unless otherwise specified.

When energy reaches 100:

```text
Hero active skill becomes available.
```

Energy UI:

```text
Displayed below Player HP.
```

## Damage Formula

Base attack damage:

```text
Damage = Hero ATK x Orb Multiplier x Attack Buffs x Combo Multiplier x Enemy Taken-Damage Modifiers
```

If the attack is Fire:

```text
Fire Damage = Base Fire Damage + Red Orb Count Bonus
```

Red Orb Count Bonus:

```text
Bonus = Total Fire orbs cleared this turn x 10% x Hero ATK
```

Example:

```text
Hero ATK = 220
Total Fire orbs cleared this turn = 10
Bonus = 10 x 0.1 x 220 = 220
```

## Fire

Fire is the main direct damage color.

Fire multiplier:

```text
3 Fire = 1.0x
4 Fire = 1.2x
5 Fire = 1.5x
6 Fire = 2.0x
7+ Fire = 3.0x
```

Additional Fire rules:

```text
4+ Fire: Fire critical visual effect
5+ Fire: show "烈焰斬"
7+ Fire: stronger screen shake and burst effect
```

Enhanced Fire:

```text
Enhanced Fire damage = normal Fire damage x 1.5
```

Enhanced Fire additional effect:

```text
Burn
```

Burn:

```text
Enemy takes 5% max HP damage per turn.
Duration: 2 turns.
UI: "燃燒"
```

## Wood

Wood is the shield and defense color.

Shield rule:

```text
3 Wood = shield equal to 5% Player Max HP
4 Wood = shield equal to 10% Player Max HP
5 Wood = shield equal to 15% Player Max HP
6 Wood = shield equal to 20% Player Max HP
7+ Wood = shield equal to 25% Player Max HP
```

Shield is affected by final Combo multiplier unless otherwise specified.

Iron Wall:

```text
4+ Wood grants Iron Wall for 1 turn.
Iron Wall reduces incoming damage by 30%.
```

Shield Counter:

```text
If the player has shield and is attacked, shield absorbs damage first.
After the enemy attack resolves, counterattack for 30% of absorbed damage.
```

Timing rule:

```text
Enemy attack animation and damage must finish first.
Shield counterattack happens after that.
```

## Thunder

Thunder is the energy and chain damage color.

Energy rule:

```text
3 Thunder = +5 Energy
4 Thunder = +7 Energy
5 Thunder = +10 Energy
6 Thunder = +13 Energy
7+ Thunder = +15 Energy
```

Thunder strike:

```text
4+ Thunder triggers Thunder Strike.
Thunder Strike damage = Hero ATK x 100%
```

Thunder bomb:

```text
5+ Thunder bombs 1 random orb.
Each bombed orb adds Hero ATK x 10% damage.
```

Bomb damage:

```text
Bomb Damage = Bombed Orb Count x 10% x Hero ATK
```

## Light

Light is the healing and cleanse color.

Healing rule:

```text
3 Light = Hero REC x 10%
4 Light = Hero REC x 12%
5 Light = Hero REC x 15%
6 Light = Hero REC x 20%
7+ Light = Hero REC x 25%
```

Healing is affected by final Combo multiplier unless otherwise specified.

Cleanse:

```text
4+ Light cleanses 1 player debuff.
If there is no debuff, recover extra 5% Player Max HP.
```

## Dark

Dark applies Vulnerable to enemies.

Vulnerable layer rule:

```text
3 Dark = 1 layer
4 Dark = 2 layers
5 Dark = 3 layers
6 Dark = 4 layers
7+ Dark = 5 layers
```

Each Vulnerable layer:

```text
Enemy takes +5% damage.
```

Limit:

```text
Max 10 layers.
Duration 3 turns.
```

UI:

```text
Enemy buff/debuff row shows "易傷 xN".
```

## Water

Water is reserved for future design.

Possible roles:

```text
Control
Slow
Freeze
Cooldown reduction
Enemy intent delay
Orb movement extension
```

Water is not currently part of the active board.

Do not add Water logic unless the user explicitly requests it.

## Buff

Buffs are positive player effects.

Current or planned player buffs:

```text
Attack Up
Pursuit
Combo Order
Swift Order
Iron Wall
Invincible
Damage Reduction
Qinglong Pending
Fire Enhance
```

Buff rules:

- Buffs may stack only if the specific buff allows stacking.
- Buff duration ticks by turn.
- Buff UI should show icon, value, and remaining turns.
- Buffs should be resolved through battle logic, not UI logic.

## Debuff

Debuffs are negative player or enemy effects.

Enemy debuffs:

```text
Vulnerable
Burn
Attack Down
Defense Down
Break
```

Player debuffs:

```text
Burn
Poison
Attack Down
Slow
Freeze
```

Debuff rules:

- Debuff duration ticks by turn.
- Debuffs should not be removed by UI code.
- Light cleanse can remove player debuffs.
- Enemy debuffs appear near enemy name/HP.

## Status

Status is a general term for temporary state effects.

Status categories:

```text
Buff
Debuff
Shield
Burn
Poison
Vulnerable
Iron Wall
Invincible
Break
Charge
Intent
```

Status should include:

```text
id
name
type
value or layers
turns
icon
description
```

## Critical / 爆擊

Current design:

```text
Fire 4+ triggers Fire critical visual feedback.
Fire 5+ triggers "烈焰斬".
```

Critical is currently presentation-driven unless a future rule defines actual critical damage.

If critical damage is added later, define:

```text
Critical chance
Critical damage multiplier
Which effects can crit
Whether fixed damage can crit
Whether bomb damage can crit
```

## Hero Passive

Current Zhao Yun passive design:

```text
Name: 渾身是膽
Trigger: Orb clear
Chance: 20%
Limit: Max once per player turn
Effect: Bomb 5-20 crimson/red orbs.
Bomb damage: Each bombed orb deals Hero ATK x 10%.
```

Timing:

```text
1. Passive triggers after match results are known.
2. Board orbs play bomb/clear effect.
3. Bomb damage is queued.
4. Attack event resolves after visual delay.
```

## Active Skill

Current Zhao Yun active skill:

```text
Name: 龍膽突刺
Cost: 100 Energy
Damage: 450% base attack damage
```

Active skill rules:

- Skill requires full energy.
- Skill should display confirmation before activation.
- Skill consumes energy when activated.
- Skill damage should use the skill's own formula unless specified.

## 軍令 / Order

Order gauge:

```text
Max = 2
```

Gain rule:

```text
Any single clear resolving 4+ total orbs gives Order +1.
```

When Order gauge is full:

```text
Player may press Order button.
Order selection shows 3 choices.
After selecting, Order gauge resets to 0.
```

Important:

- Order should not automatically pop up during orb clear.
- Board should not generate physical order tokens unless design changes.

Current Order examples:

```text
猛攻令
追擊令
連擊令
疾風令
妖術令
```

## 神令 / Divine Flag

Divine gauge:

```text
Max = 2
```

Gain rule:

```text
Any single clear resolving 5+ total orbs gives Divine +1.
```

When Divine gauge is full:

```text
Player may press Divine button.
Divine selection shows 3 choices.
After selecting, Divine gauge resets to 0.
```

Important:

- Divine should not automatically pop up during orb clear.
- Board should not generate physical divine flags unless design changes.

Current Divine examples:

```text
火攻
借東風
青龍現世
七星燈
萬箭齊發
八陣圖
空城計
天降神雷
奇門遁甲
天公將軍
```

## Overflow / 奇策連鎖

Overflow rewards large clears.

Rule:

```text
8+ total cleared orbs:
Order +1
Divine +1
Show "奇策連鎖！"
```

Rule:

```text
10+ total cleared orbs:
Gain an additional random buff.
```

Purpose:

- Encourage large clears.
- Reduce repetitive 3-orb play.
- Add roguelite burst moments.

## Enemy AI

Current enemy AI is countdown-based.

Enemy data includes:

```text
attack
basicAttackTurns
specialSkill
```

Enemy turn flow:

```text
1. Enemy countdown decreases after player turn.
2. If countdown reaches 0, enemy acts.
3. Enemy uses basic attack or special skill.
4. Enemy countdown resets.
```

Enemy special skill may include:

```text
damage
burn
poison
damage debuff
slow
freeze
shield
multi-hit
dash damage
```

Future enemy intent:

```text
Attack
Charge
Defend
Cast
Summon
Debuff
```

## Break / 破招

Break is a planned enemy-interrupt system.

Suggested rule:

```text
If enemy is charging, show Break Gauge.
If player deals at least 10% enemy max HP during that turn, enemy action is interrupted.
```

Break reward:

```text
Enemy action canceled.
Player gains Divine +1.
Show "破招！"
```

Break is not fully formalized until implemented.

## Boss

Boss enemies should have:

```text
Higher HP
Unique intent patterns
Reduced duration from some control effects
Special phase behavior
Better attack animation
Better reward payout
```

Boss status duration rule:

```text
Some debuffs may have reduced duration on Boss or Elite enemies.
```

Example:

```text
空城計:
Normal enemy = 3 turns
Boss/Elite = 2 turns
```

## Rogue Flow

Current roguelite flow:

```text
1. Start from lobby.
2. Enter main menu.
3. Choose adventure.
4. Select stage.
5. Fight enemy.
6. Gain temporary rewards through Order/Divine systems.
7. Clear stage.
8. Continue to next stage.
```

Future roguelite flow:

```text
1. Choose route.
2. Fight normal enemy.
3. Choose reward.
4. Visit shop/event/rest.
5. Fight elite.
6. Fight boss.
7. Gain permanent or run-based unlocks.
```

## Weapon

Weapon system is planned.

Possible weapon rules:

```text
Weapon adds ATK.
Weapon may add orb-specific effects.
Weapon may alter active skill.
Weapon may grant passive trigger bonus.
```

Weapon UI:

```text
Equipment slot near hero card.
```

Weapon should not be implemented inside UI code.

## Relic

Relic system is planned.

Relic role:

```text
Run-based passive modifier.
```

Examples:

```text
Fire damage +10%
First shield each battle +100
Start battle with Order +1
Dark vulnerable max layers +2
Thunder strike hits twice
```

Relic rules:

- Relics should stack according to their own rules.
- Relics should be data-driven.
- Relics should apply through battle systems, not UI systems.

## Status Timing

Recommended timing:

```text
Start of player turn:
  Some player buffs tick or activate.

During player match:
  Orb effects queue.

After player attack:
  Enemy debuffs may update.

Before enemy attack:
  Enemy intent resolves.

During enemy attack:
  Damage, shield absorption, player hit effects.

After enemy attack:
  Shield counterattack.
  DOT effects may tick depending on design.

End of round:
  Duration counters update.
```

## UI Rule for Game Feedback

Important gameplay feedback should be readable.

Rules:

- Damage numbers must be large enough to read.
- Shield/heal/energy gains should display before the number disappears.
- Major effects should not all appear simultaneously.
- Buff/debuff icons should show current stacks/turns.
- Order and Divine gauges should always show current value.

## Design Rule

When adding a new rule, define:

```text
1. Trigger
2. Effect
3. Formula
4. Duration
5. Stack behavior
6. UI display
7. Timing in turn order
8. Data/config location
```

Do not implement new gameplay rules until they are documented here or explicitly requested by the user.

