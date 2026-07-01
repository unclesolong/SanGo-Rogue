# Architecture

This document describes the current architecture of the Match Card Battle prototype after the first modularization pass.

The current goal of the architecture is conservative modularization:

- Keep the existing game behavior unchanged.
- Move static configuration and data out of the original large HTML file.
- Keep initialization and orchestration in `src/main.js`.
- Prepare the codebase for later extraction of board, battle, skill, buff, UI, and save systems.

## Project Structure

```text
outputs/
  match-card-battle-prototype.html
  match-card-battle-prototype.before-modularize.html
  cactbot-tts-subtitle-bridge.js
  cactbot-tts-subtitle-overlay.html
  triggernometry-tts-subtitle.cmd
  triggernometry-tts-subtitle.ps1
  triggernometry-tts-subtitle-position.json

  styles/
    battle.css

  src/
    main.js

    config/
      balance.js
      constants.js

    data/
      attackArts.js
      divineFlags.js
      heroes.js
      monsters.js
      rogueRewards.js
      traits.js

    ui/
      dom.js

  assets/
    ...

  data/
    ...
```

## Entry Points

### `outputs/match-card-battle-prototype.html`

The browser entry point for the game.

Responsibilities:

- Defines the static HTML structure for all screens.
- Loads global audio elements.
- Loads `styles/battle.css`.
- Loads `src/main.js` as an ES module.

Ownership:

- Owns static DOM layout.
- Does not own gameplay logic.
- Does not own game data.

Dependencies:

- `styles/battle.css`
- `src/main.js`
- image/audio assets under `assets/`

### `outputs/styles/battle.css`

The global visual stylesheet for the game.

Responsibilities:

- All current visual styling.
- Screen layout.
- Battle UI styling.
- Board styling.
- Gem/orb visuals.
- Dialog styling.
- Damage text styling.
- Animation keyframes.

Ownership:

- Owns presentation only.
- Does not own gameplay state or rules.

Current coupling notes:

- This file still contains all visual concerns in one large stylesheet.
- Later it should be split into `screens.css`, `battle.css`, `board.css`, `effects.css`, and `dialogs.css`.

## JavaScript Files

### `outputs/src/main.js`

The main game runtime and orchestration module.

Responsibilities:

- Initializes game state.
- Initializes the active hero.
- Binds UI event listeners.
- Controls screen transitions.
- Creates and renders the board.
- Handles match detection and board collapse.
- Handles player moves.
- Handles battle turns.
- Applies damage, healing, shield, energy, buffs, debuffs, divine flags, and command orders.
- Plays audio.
- Plays battle animations and floating text.
- Renders battle UI state.

Exports:

- None.

Imports:

- `width`, `height`, `characterRoster` from `./config/constants.js`
- `battleBalance` from `./config/balance.js`
- `teamElements`, `traitRules` from `./data/traits.js`
- `heroDatabase` from `./data/heroes.js`
- `rogueRewards` from `./data/rogueRewards.js`
- `divineFlagsPack` from `./data/divineFlags.js`
- `attackArts` from `./data/attackArts.js`
- `stageData` from `./data/monsters.js`
- `getDomRefs` from `./ui/dom.js`

Main internal responsibility groups:

- State:
  `board`, selected orb, stage, enemy HP, player HP, shield, buffs, debuffs, gauges, divine states, animation state.

- Board:
  `randomColor`, `makeOrb`, `cellColor`, `rawCellColor`, `matchColor`, `createBoard`, `renderBoard`, `clickOrb`, `handleMove`, `swap`, `findMatches`, `clearCells`, `collapseBoard`.

- Battle:
  `applyPlayerDamage`, `damageEnemy`, `performEnemyAction`, `startStage`, `nextStage`, `restart`, `showVictory`.

- Traits and rewards:
  `getTraitValue`, `addOrderGauge`, `addDivineGauge`, `addOverflowRewards`, `applyDivineFlag`, `chooseReward`, `chooseDivineFlag`.

- Buffs and debuffs:
  `addOrRefreshBuff`, `renderBuffs`, `tickBuffs`, `addEnemyVulnerability`, `addEnemyBurn`, `renderEnemyDebuffs`, `tickEnemyDebuffs`, `addPlayerStatus`, `tickPlayerStatuses`.

- Hero and skills:
  `tryHeroPassiveOnTrait`, `openSkillDialog`, `activateHeroSkill`, `showAttackName`, `getAttackArt`.

- UI and effects:
  `showScreen`, `renderStageMap`, `renderTeam`, `renderRoster`, `updateStats`, `showBuffFlash`, `showBattleMessage`, `playBattleStep`, `animateAttack`, `showComboPop`, `showAttackEffect`, `playEnemyAttackAnimation`, `showPlayerDamage`, `shootBeam`.

- Audio:
  `startBattleBgm`, `unlockBattleAudioOnce`, `playOrbClearSfx`, `playEnemyAttackSfx`, `playHeroVoice`, `playPassiveSfx`, `playRewardSfx`.

Ownership:

- Currently owns too many systems.
- It is the primary high-coupling module.
- Later passes should extract board, battle, buffs, skills, effects, audio, and render logic from this file.

### `outputs/src/config/constants.js`

Static global constants.

Exports:

- `width`
- `height`
- `characterRoster`

Responsibilities:

- Board dimensions.
- Current static character roster data used by roster/team-related UI.

Ownership:

- Owns global constants that are not battle-balance formulas.

Dependencies:

- None.

Dependents:

- `src/main.js`

### `outputs/src/config/balance.js`

Battle tuning and numeric balance configuration.

Exports:

- `battleBalance`

Responsibilities:

- Combo multiplier step.
- Enhanced fire multipliers.
- Burn values.
- Vulnerability limits and values.
- Thunder/bomb damage tuning.
- Order and divine gauge maximums.
- Shield counter values.
- Iron wall reduction.
- Light cleanse recovery.
- Zhao Yun passive tuning values.

Ownership:

- Owns balance numbers.
- Should be the preferred place for future numeric tuning.

Dependencies:

- None.

Dependents:

- `src/main.js`

### `outputs/src/data/traits.js`

Orb element and trait rules.

Exports:

- `teamElements`
- `traitRules`

Responsibilities:

- Defines active orb/trait colors.
- Defines each color's gameplay type.
- Defines per-count values for attack, shield, energy, heal, and vulnerability.

Ownership:

- Owns color/trait rule data.

Dependencies:

- None.

Dependents:

- `src/main.js`

### `outputs/src/data/heroes.js`

Hero database.

Exports:

- `heroDatabase`

Responsibilities:

- Single-hero data pack.
- Current hero stats.
- Active skill data.
- Passive skill data.
- Hero art paths.
- Hero defaults such as max energy.

Ownership:

- Owns hero source data.
- Does not own runtime hero state.

Dependencies:

- None.

Dependents:

- `src/main.js`

### `outputs/src/data/monsters.js`

Monster and stage data.

Exports:

- `stageData`

Responsibilities:

- First chapter monster list.
- Monster HP, attack, rank, element, stage number.
- Monster special skill data.
- Monster art paths.

Ownership:

- Owns stage monster source data.
- Does not own runtime enemy HP or turn state.

Dependencies:

- None.

Dependents:

- `src/main.js`

### `outputs/src/data/rogueRewards.js`

Roguelite order reward data.

Exports:

- `rogueRewards`

Responsibilities:

- Command/order reward definitions.
- Reward descriptions.
- Reward effect types and values.
- Reward icon and sound paths.

Ownership:

- Owns order reward source data.
- Runtime application is still owned by `src/main.js`.

Dependencies:

- None.

Dependents:

- `src/main.js`

### `outputs/src/data/divineFlags.js`

Divine flag data pack.

Exports:

- `divineFlagsPack`

Responsibilities:

- Divine flag trigger metadata.
- Divine flag list.
- Effect type and params for each flag.
- Divine flag icon paths.

Ownership:

- Owns divine flag source data.
- Runtime application is still owned by `src/main.js`.

Dependencies:

- None.

Dependents:

- `src/main.js`

### `outputs/src/data/attackArts.js`

Hero attack art data.

Exports:

- `attackArts`

Responsibilities:

- Maps match count thresholds to attack names.
- Provides skill icons.
- Provides voice audio paths.

Ownership:

- Owns attack presentation metadata.

Dependencies:

- None.

Dependents:

- `src/main.js`

### `outputs/src/ui/dom.js`

DOM reference module.

Exports:

- `getDomRefs`

Responsibilities:

- Centralizes DOM lookups.
- Returns named references for game screens, battle UI, board UI, dialogs, audio nodes, command buttons, and roster/stage containers.

Ownership:

- Owns DOM reference gathering only.
- Does not own rendering behavior.
- Does not mutate game state.

Dependencies:

- Browser `document`.

Dependents:

- `src/main.js`

### `outputs/cactbot-tts-subtitle-bridge.js`

Standalone ACT/cactbot subtitle bridge utility.

Responsibilities:

- Hooks cactbot TTS transform behavior.
- Broadcasts TTS text to OverlayPlugin so a separate subtitle overlay can display it.

Exports:

- None.

Imports:

- None.

Ownership:

- Not part of the Match Card Battle game.
- Belongs to the ACT subtitle tooling created earlier.

Dependencies:

- cactbot global `Options`
- OverlayPlugin global `callOverlayHandler`
- Browser `window`

## Module Dependency Tree

```text
match-card-battle-prototype.html
├─ styles/battle.css
└─ src/main.js
   ├─ src/config/constants.js
   ├─ src/config/balance.js
   ├─ src/data/traits.js
   ├─ src/data/heroes.js
   ├─ src/data/monsters.js
   ├─ src/data/rogueRewards.js
   ├─ src/data/divineFlags.js
   ├─ src/data/attackArts.js
   └─ src/ui/dom.js
```

Standalone utility:

```text
cactbot-tts-subtitle-bridge.js
└─ OverlayPlugin / cactbot globals
```

## Dependency Direction

Current dependency direction is mostly one-way:

```text
HTML -> main.js -> config/data/ui
```

The data modules do not import anything.

`ui/dom.js` does not import anything.

`main.js` imports all modules and coordinates all behavior.

This is acceptable for the first modularization pass, but it leaves `main.js` as a central hub.

## Ownership Map

| Responsibility | Current Owner | Target Future Owner |
| --- | --- | --- |
| Static HTML layout | `match-card-battle-prototype.html` | Same |
| Visual style | `styles/battle.css` | Split CSS files |
| Initialization | `src/main.js` | `src/main.js` |
| Screen flow | `src/main.js` | `src/ui/screens.js` |
| DOM references | `src/ui/dom.js` | Same |
| Board state | `src/main.js` | `src/board/board.js` |
| Match detection | `src/main.js` | `src/board/match.js` |
| Board rendering | `src/main.js` | `src/ui/renderBoard.js` |
| Battle damage | `src/main.js` | `src/battle/damage.js` |
| Enemy turns | `src/main.js` | `src/battle/turns.js` |
| Buffs/debuffs | `src/main.js` | `src/battle/buffs.js` |
| Hero skills | `src/main.js` | `src/battle/skills.js` |
| Rogue rewards | `src/main.js` + `src/data/rogueRewards.js` | `src/battle/orders.js` + data |
| Divine flags | `src/main.js` + `src/data/divineFlags.js` | `src/battle/divine.js` + data |
| Balance numbers | `src/config/balance.js` | Same |
| Hero source data | `src/data/heroes.js` | Same |
| Monster source data | `src/data/monsters.js` | Same |
| Audio playback | `src/main.js` | `src/ui/audio.js` |
| Visual effects | `src/main.js` | `src/ui/effects.js` |
| Save/load | Not implemented | `src/storage/save.js` |

## High Coupling Areas

### 1. `src/main.js`

`main.js` currently owns almost all runtime systems.

Symptoms:

- Board logic directly mutates battle state.
- Battle logic directly calls UI effects.
- Buff logic directly updates DOM.
- Skill logic directly modifies board and enemy HP.
- Audio calls are mixed into battle flow.
- Reward selection directly manipulates battle state and UI dialogs.

Risk:

- Small changes can affect unrelated systems.
- Debugging combat bugs is harder because damage, animation, state, and rendering are interleaved.
- Testing isolated rules is difficult.

### 2. Runtime State

Current runtime state exists as many top-level variables in `main.js`.

Examples:

- `board`
- `enemyHp`
- `playerHp`
- `playerShield`
- `enemyDebuffs`
- `activeBuffs`
- `orderGauge`
- `divineGauge`
- `divineStates`
- `busy`
- `dropKeys`

Risk:

- Any function in `main.js` can read or mutate almost any state.
- Future modules may accidentally create circular dependencies if state is not centralized.

### 3. UI Effects and Battle Logic

Examples:

- `damageEnemy` affects combat state and may trigger UI updates.
- `performEnemyAction` handles enemy logic, sound, animation, damage, and logs.
- `handleMove` handles board matching, trait resolution, gauges, passive skill triggering, and attack event sequencing.

Risk:

- Animation timing changes can accidentally change combat timing.
- Combat fixes can accidentally change visual behavior.

### 4. CSS

`styles/battle.css` is currently one large stylesheet.

Risk:

- Later UI changes may override unrelated selectors.
- Component ownership is unclear.

## Suggested Coupling Reduction Plan

### Phase 1: Extract Shared State

Create:

```text
src/state/gameState.js
```

Suggested exports:

- `createInitialGameState`
- `resetBattleState`
- `state`

Move runtime state out of `main.js`.

Rules:

- Modules should receive `state` explicitly.
- Avoid hidden global mutation where possible.

### Phase 2: Extract Board Logic

Create:

```text
src/board/board.js
src/board/match.js
src/board/specialOrbs.js
```

Suggested ownership:

- `board.js`: board creation, swapping, collapse, raw cell helpers.
- `match.js`: match detection and match grouping.
- `specialOrbs.js`: special orb activation and generation.

Goal:

- Board modules should not know about DOM.
- Board modules should not directly deal damage.

### Phase 3: Extract Battle Logic

Create:

```text
src/battle/damage.js
src/battle/turns.js
src/battle/buffs.js
src/battle/skills.js
src/battle/rewards.js
```

Suggested ownership:

- `damage.js`: enemy damage, player damage, shield, counterattack.
- `turns.js`: enemy turn countdown and enemy action.
- `buffs.js`: buffs, debuffs, duration ticking.
- `skills.js`: hero active/passive skills.
- `rewards.js`: order and divine flag application.

Goal:

- Battle modules should return events, not directly create DOM effects.
- Example event shape:

```js
{
  type: 'damage',
  target: 'enemy',
  amount: 286,
  element: 'fire',
}
```

### Phase 4: Extract UI Rendering

Create:

```text
src/ui/renderBoard.js
src/ui/renderBattle.js
src/ui/dialogs.js
src/ui/effects.js
src/ui/audio.js
src/ui/screens.js
```

Suggested ownership:

- `renderBoard.js`: board DOM only.
- `renderBattle.js`: HP bars, enemy UI, player UI, command gauges.
- `dialogs.js`: skill, reward, divine flag dialogs.
- `effects.js`: damage text, attack effects, shake, burst, combo pop.
- `audio.js`: BGM and SFX playback.
- `screens.js`: screen transitions.

Goal:

- UI modules should consume state/events.
- UI modules should not decide combat math.

### Phase 5: Split CSS

Create:

```text
styles/base.css
styles/screens.css
styles/battle.css
styles/board.css
styles/dialogs.css
styles/effects.css
```

Goal:

- Reduce style override risk.
- Make UI ownership easier to understand.

## Current Export Summary

| File | Exports |
| --- | --- |
| `src/main.js` | None |
| `src/config/constants.js` | `width`, `height`, `characterRoster` |
| `src/config/balance.js` | `battleBalance` |
| `src/data/traits.js` | `teamElements`, `traitRules` |
| `src/data/heroes.js` | `heroDatabase` |
| `src/data/monsters.js` | `stageData` |
| `src/data/rogueRewards.js` | `rogueRewards` |
| `src/data/divineFlags.js` | `divineFlagsPack` |
| `src/data/attackArts.js` | `attackArts` |
| `src/data/monsterCatalog.js` | `getStageMonster`, `createMonsterBattleState`, `getMonsterArt`, `getMonsterPreviewDamage`, `getMonsterTurnCooldown` |
| `src/progression/stageProgress.js` | `createStageProgress`, `isStageUnlocked`, `isStageCleared`, `completeStage`, `getStageNodeState`, `createStageSelectModel` |
| `src/ui/dom.js` | `getDomRefs` |
| `cactbot-tts-subtitle-bridge.js` | None |

## Current Import Summary

| File | Imports |
| --- | --- |
| `src/main.js` | config, data, and DOM modules |
| `src/config/constants.js` | None |
| `src/config/balance.js` | None |
| `src/data/traits.js` | None |
| `src/data/heroes.js` | None |
| `src/data/monsters.js` | None |
| `src/data/rogueRewards.js` | None |
| `src/data/divineFlags.js` | None |
| `src/data/attackArts.js` | None |
| `src/ui/dom.js` | None |
| `cactbot-tts-subtitle-bridge.js` | None |

## Architectural Rules Going Forward

1. `main.js` should initialize and connect modules only.
2. Data modules should export data only.
3. Board modules should not touch DOM.
4. Battle modules should not create visual effects directly.
5. UI modules should not calculate combat damage.
6. Audio should be isolated from combat math.
7. New feature data should go into data/config modules when possible.
8. Runtime state should be centralized before deeper extraction.
9. Avoid circular imports.
10. Prefer passing state/events explicitly instead of reading globals.

## API Boundary Skeleton Status

The following module files now exist as API boundaries.

Important:

- Most implementation still lives in `src/main.js`.
- Boundary modules are not yet wired into runtime flow.
- Boundary modules intentionally throw a clear "implementation still lives in main.js" error if called before implementation is moved.
- Future sessions should implement only their assigned module and then wire through public exports.

Wired exceptions:

- `src/ui/effects.js` is wired into `src/main.js`.
- `src/ui/audio.js` is wired into `src/main.js`.
- `src/battle/damage.js` is partially wired into `src/main.js` for bomb damage calculation.
- `src/battle/skills.js` is partially wired into `src/main.js` for hero passive skill triggering.
- `src/ui/renderBattle.js` is partially wired into `src/main.js` for hero row/card rendering.
- Changes to wired or partially wired APIs affect the running game immediately after page reload.

### Board Boundary

| File | Public API |
| --- | --- |
| `src/board/board.js` | `createBoardModel`, `getCellColor`, `swapCells`, `collapseBoardModel`, `cloneBoardModel` |
| `src/board/match.js` | `findBoardMatches`, `groupMatchedCells`, `summarizeMatchGroups` |
| `src/board/specialOrbs.js` | `getSpecialCreates`, `activateSpecialOrb`, `destroyRandomOrb`, `destroyBoardColor` |
| `src/board/index.js` | Re-exports board APIs |

### Battle Boundary

| File | Public API |
| --- | --- |
| `src/battle/damage.js` | `calculateEnemyDamageTaken`, `applyEnemyDamage`, `applyPlayerDamage`, `calculateBombDamage`, `createDamageEvent` |
| `src/battle/turns.js` | `createEnemyIntent`, `advanceEnemyTurn`, `resolveEnemyAction`, `createTurnEvent`, `getEnemyAttackType` |
| `src/battle/buffs.js` | `addBuff`, `tickBuffs`, `addDebuff`, `tickDebuffs`, `createStatusEvent` |
| `src/battle/skills.js` | `canActivateHeroSkill`, `createHeroSkillDialogModel`, `createHeroSkillEvent`, `createHeroSkillSystem`, `tryHeroPassive`, `spendHeroEnergy` |
| `src/battle/orders.js` | `canUseOrder`, `calculateOrderGaugeGain`, `pickOrderRewards`, `applyOrderReward` |
| `src/battle/divine.js` | `canUseDivine`, `calculateDivineGaugeGain`, `pickDivineRewards`, `applyDivineFlag` |
| `src/battle/rewards.js` | Re-exports order and divine reward APIs |
| `src/battle/index.js` | Re-exports battle APIs |

### UI Boundary

| File | Public API |
| --- | --- |
| `src/ui/dom.js` | `getDomRefs` |
| `src/ui/renderBoard.js` | `renderBoardView`, `renderBoardSelection` |
| `src/ui/renderBattle.js` | `renderBattleState`, `renderHeroCard`, `renderHeroRow`, `renderEnemyDebuffs`, `renderPlayerBuffs` |
| `src/ui/dialogs.js` | `openSkillDialogView`, `openRewardDialogView`, `closeDialogView` |
| `src/ui/effects.js` | `showFloatingDamage`, `showAttackEffect`, `showComboPop`, `shakeBattleStage` |
| `src/ui/audio.js` | `startLoopingBgm`, `playAudioCue`, `unlockAudioOnce` |
| `src/ui/screens.js` | `showScreenView`, `bindScreenNavigation` |
| `src/ui/index.js` | Re-exports UI APIs |

### State Boundary

| File | Public API |
| --- | --- |
| `src/state/gameState.js` | `createInitialGameState`, `resetBattleRuntimeState`, `createGameStateSnapshot` |
| `src/state/index.js` | Re-exports state APIs |

### Storage Boundary

| File | Public API |
| --- | --- |
| `src/storage/save.js` | `saveGame`, `loadGame`, `clearSave` |
| `src/storage/index.js` | Re-exports storage APIs |

### Wired Runtime APIs

These modules are currently imported and used by `src/main.js`:

| File | Runtime status |
| --- | --- |
| `src/ui/effects.js` | Wired. Owns battle visual effects, floating damage, attack beams, combo pop, shake, and hit flashes. |
| `src/ui/audio.js` | Wired. Owns BGM, orb clear SFX, enemy attack SFX, hero voice, passive SFX, and reward SFX playback. |
| `src/battle/damage.js` | Partially wired. Owns `calculateBombDamage`; HP mutation still lives in `src/main.js`. |
| `src/battle/skills.js` | Partially wired. Owns Zhao Yun passive trigger logic and hero skill dialog model; active skill execution still lives in `src/main.js`. |
| `src/ui/renderBattle.js` | Partially wired. Owns hero row/card HTML output and enemy debuff HTML output; full battle rendering still lives in `src/main.js`. |

These modules exist as boundaries but are not yet wired:

| Folder | Runtime status |
| --- | --- |
| `src/board/` | Boundary only. Current board logic still lives in `src/main.js`. |
| `src/battle/buffs.js` | Boundary only. Current buff/debuff logic still lives in `src/main.js`. |
| `src/battle/orders.js` | Wired. Owns order gauge readiness, order picking, and order reward application. |
| `src/battle/divine.js` | Wired. Owns divine gauge readiness, divine flag picking, and divine flag application. |
| `src/battle/rewards.js` | Wired. Re-exports order and divine APIs for integration. |
| `src/battle/turns.js` | Partially wired. Owns enemy action resolution, skill damage calculation, skill status output, and attack type selection. |
| `src/data/monsterCatalog.js` | Wired. Owns monster lookup, monster battle-state initialization, art selection, preview damage, and turn cooldown access. |
| `src/state/` | Boundary only. Current runtime state still lives in `src/main.js`. |
| `src/storage/` | Boundary only. Not used by current runtime. |
