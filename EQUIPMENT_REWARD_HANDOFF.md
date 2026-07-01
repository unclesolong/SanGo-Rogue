# Equipment Reward Handoff

This document is for the session that will build post-stage equipment rewards.

## Desired Flow

After clearing a stage:

1. Stage is marked cleared.
2. Next stage is unlocked.
3. Player sees a three-choice equipment reward.
4. Player chooses one equipment.
5. Equipment is added to the current chapter loadout.
6. Player returns to stage selection.

Do not auto-enter the next stage.

## Current State

Current implemented flow:

- Stage 1 starts unlocked.
- Stages 2-10 are locked.
- Clearing a stage unlocks the next stage.
- Victory button returns to stage selection.
- Selecting any unlocked stage starts a clean battle state.

Current equipment reward UI is not implemented yet.

## Important Rule

Equipment should persist across the first major chapter.

Starting the next stage should reset:

- HP to initial stage state
- player shield
- player temporary buffs
- player debuffs
- order gauge
- divine gauge
- temporary divine states
- board state

Starting the next stage should keep:

- chosen equipment
- chapter-level permanent equipment effects

## Suggested Files

Create when implementing equipment:

- `outputs/src/progression/equipmentProgress.js`
- `outputs/src/data/equipmentRewards.js`
- `outputs/src/ui/equipmentDialog.js`

## Suggested Public API

```js
createEquipmentProgress()
pickEquipmentRewards(equipmentPool, count)
chooseEquipment(progress, equipment)
getEquippedItems(progress)
applyEquipmentModifiers(baseStats, equipmentProgress)
```

## Suggested Main Wiring Point

Current victory flow is in:

- `outputs/src/main.js`
- `showVictory()`
- `nextStage()`

Recommended future flow:

```text
showVictory()
  -> completeStage(...)
  -> openEquipmentRewardDialog(...)
  -> chooseEquipment(...)
  -> returnToStageSelect()
```

## Forbidden

- Do not put equipment effect math directly in UI code.
- Do not reset equipment inside `startStage(true)`.
- Do not auto-start the next stage after choosing equipment.
- Do not edit monster skill logic for equipment UI work.
