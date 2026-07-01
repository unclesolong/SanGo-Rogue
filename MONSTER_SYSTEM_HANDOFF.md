# Monster System Handoff

This document is for the Codex session that will edit monster values, monster skills, and enemy behavior.

## Current Status

Monster modules are now exported and partially wired into the running game.

The current runtime still lives in `outputs/src/main.js`, but monster lookup, monster initialization, preview damage, turn cooldown, and enemy action resolution now go through monster modules.

## Files

Monster data:

- `outputs/src/data/monsters.js`

Monster lookup/init helpers:

- `outputs/src/data/monsterCatalog.js`

Monster behavior / enemy action rules:

- `outputs/src/battle/turns.js`

Integration point:

- `outputs/src/main.js`

## What To Edit For Monster Numbers

Edit:

- `outputs/src/data/monsters.js`

Safe fields:

- `name`
- `stageNo`
- `element`
- `rank`
- `attack`
- `hp`
- `basicAttackTurns`
- `specialSkill`
- `art.greenBg`
- `art.transparent`

Do not change object field names unless all consumers are updated.

## What To Edit For Monster Skills

Edit:

- `outputs/src/battle/turns.js`

Current supported `specialSkill.effectType` values:

- `damage_debuff`
- `burn`
- `shield`
- `poison`
- `damage_bonus`
- `damage_slow`
- `multi_hit`
- `dash_damage`
- `freeze`
- `aoe_shield`

Current public API:

- `createEnemyIntent(monster, options)`
- `advanceEnemyTurn(currentTurn)`
- `resolveEnemyAction(monster, options)`
- `createTurnEvent(payload)`
- `getEnemyAttackType(skill)`

`resolveEnemyAction()` returns the enemy action model used by `main.js`.

Important returned fields:

- `actionCount`
- `useSkill`
- `skill`
- `label`
- `damage`
- `shieldGain`
- `damageReduction`
- `endsAfterShield`
- `playerStatuses`

## What Is Already Wired

`main.js` now uses:

- `getStageMonster(stageData, stage)` for current monster lookup.
- `createMonsterBattleState(currentStage)` when entering a stage.
- `getMonsterArt(currentStage)` for monster image source.
- `getMonsterPreviewDamage(currentStage, multiplier)` for next attack preview.
- `getMonsterTurnCooldown(currentStage)` when enemy turn resets.
- `resolveEnemyAction(monster, options)` when enemy attacks.
- `getEnemyAttackType(skill)` for enemy attack animation type.

## Allowed Modifications

- Tune monster HP and attack.
- Tune monster turn cooldown.
- Add or adjust `specialSkill` data.
- Add new `effectType` handling in `turns.js`.
- Add pure helper functions to `monsterCatalog.js`.
- Return richer action events from `resolveEnemyAction`.

## Forbidden Modifications

- Do not edit board matching logic.
- Do not edit player damage formulas unless specifically assigned.
- Do not edit battle UI layout.
- Do not edit visual effects implementation.
- Do not directly mutate DOM inside `turns.js`.
- Do not play audio inside `turns.js`.

## Dependency Rule

Monster modules should output data/events.

They should not directly:

- render HTML
- create animation nodes
- play sound
- mutate unrelated player state

`main.js` or future integration modules should consume monster events and then call UI/audio/state modules.

## Suggested Next Refactor

Move remaining enemy runtime state out of `main.js` later:

- `enemyHp`
- `enemyShield`
- `enemyDamageReduction`
- `enemyDebuffs`
- `enemyVulnerability`
- `enemyTurn`
- `enemyActionCount`

Do this only after current wiring is stable.
