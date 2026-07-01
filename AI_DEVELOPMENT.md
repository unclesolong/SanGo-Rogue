# AI Development Rules

This document defines the development rules for future Codex sessions working on this project.

The main goal is to let multiple Codex sessions work safely at the same time without breaking each other's changes.

These rules are mandatory unless the user explicitly asks to override them.

## Core Principles

1. Preserve current game behavior unless the user explicitly asks for behavior changes.
2. Prefer small, focused changes over large rewrites.
3. Keep modules responsible for one clear area.
4. Avoid hidden coupling between gameplay logic and UI effects.
5. Do not move files or rename APIs without checking current imports.
6. Do not delete or overwrite user-created assets.
7. Before changing shared files, inspect the current file state.
8. After changing JavaScript modules, run a syntax check.
9. After UI/gameplay changes, verify the game can still launch.
10. Document architecture changes when module ownership changes.

## Coding Style

- Use plain JavaScript ES modules.
- Keep code readable and direct.
- Prefer named functions for gameplay logic.
- Prefer early returns for guard conditions.
- Avoid deeply nested logic when a helper function would make intent clearer.
- Use `const` by default.
- Use `let` only for values that are reassigned.
- Avoid `var`.
- Keep comments short and useful.
- Do not add comments that merely repeat the code.
- Keep data tables as data modules, not embedded inside gameplay functions.
- Keep UI strings close to the UI module unless they are gameplay data.

## Naming Convention

### Files

- Use lower camel case or descriptive lower-case folder names.
- JavaScript modules should use clear nouns or system names.

Examples:

```text
src/board/board.js
src/board/match.js
src/battle/damage.js
src/ui/renderBattle.js
```

### Variables

- Use `camelCase`.
- Runtime state should use clear nouns:

```js
playerHp
enemyHp
activeBuffs
enemyDebuffs
divineGauge
orderGauge
```

### Functions

- Use `camelCase`.
- Function names should start with a verb when they perform work:

```js
renderBoard()
applyPlayerDamage()
addEnemyVulnerability()
playEnemyAttackAnimation()
```

- Pure query helpers may start with `get`, `is`, or `has`:

```js
getCurrentStage()
isBoardLocked()
hasActiveBuff()
```

### Constants

- Exported config objects use `camelCase`:

```js
battleBalance
traitRules
heroDatabase
stageData
```

- Avoid all-caps constants unless the value is truly static and primitive.

## Folder Responsibility

### `outputs/`

Browser-delivered prototype output.

Owns:

- Main HTML file.
- Built/playable source modules.
- Stylesheets.
- Game assets.
- Legacy subtitle helper files.

### `outputs/src/`

All game JavaScript modules.

Owns:

- Runtime game code.
- Game data modules.
- UI modules.
- Future board, battle, storage, and system modules.

### `outputs/src/config/`

Configuration and numeric balance.

Owns:

- Board dimensions.
- Global tuning values.
- Balance tables.

Must not own:

- Runtime state.
- DOM references.
- Rendering code.

### `outputs/src/data/`

Static source data.

Owns:

- Heroes.
- Monsters.
- Trait rules.
- Rogue rewards.
- Divine flags.
- Attack art metadata.

Must not own:

- Runtime HP.
- Runtime gauges.
- Current selected stage.
- DOM behavior.

### `outputs/src/ui/`

UI, DOM, visual effects, dialogs, and audio helpers.

Owns:

- DOM references.
- Screen rendering.
- Board rendering.
- Battle UI rendering.
- Floating text.
- Attack effects.
- Dialogs.
- Audio playback.

Must not own:

- Combat math.
- Match calculation.
- Buff duration rules.
- Reward selection rules.

### `outputs/src/board/`

Future folder for board mechanics.

Should own:

- Board creation.
- Cell helpers.
- Swap logic.
- Match detection.
- Collapse/drop logic.
- Special orb activation.

Must not own:

- DOM rendering.
- Damage calculation.
- Audio playback.

### `outputs/src/battle/`

Future folder for combat mechanics.

Should own:

- Damage calculation.
- Enemy turns.
- Player damage.
- Shield and counterattack rules.
- Buff/debuff rules.
- Skill effects.
- Rogue reward effects.
- Divine flag effects.

Must not own:

- DOM rendering.
- CSS effects.
- Asset drawing.

### `outputs/src/state/`

Future folder for shared runtime state.

Should own:

- Initial state creation.
- Battle state reset.
- Save-safe runtime state shape.

Must not own:

- DOM references.
- Rendering.
- Hard-coded stage data.

### `outputs/src/storage/`

Future folder for save/load behavior.

Should own:

- Local storage.
- Save serialization.
- Save migration.

Must not own:

- Combat logic.
- UI rendering beyond save/load status callbacks.

### `outputs/styles/`

CSS stylesheets.

Owns:

- Visual appearance.
- Layout.
- Animation keyframes.

Must not own:

- Gameplay state.
- Behavior rules.

## Module Responsibility

Each module should have one primary responsibility.

Bad:

```js
// Calculates damage, updates HP bar, plays sound, and opens a dialog.
function applyFireMatch() {}
```

Better:

```js
const damageEvent = calculateFireDamage(...);
applyDamage(state, damageEvent);
renderDamageEvent(dom, damageEvent);
playDamageSound(audio, damageEvent);
```

Current exception:

- `src/main.js` still owns many responsibilities because the project is mid-refactor.
- Future sessions should reduce `main.js` responsibility gradually.

## Public API Rules

Public API means any exported value from a module.

Rules:

1. Export only what another module needs.
2. Do not export internal helper functions just because they exist.
3. Keep exported names stable.
4. If an export must be renamed, update all imports in the same change.
5. Prefer object parameters for functions with many arguments.
6. Avoid exported functions that mutate hidden module-level state.
7. Prefer explicit `state` parameters for gameplay systems.

Example:

```js
export function applyPlayerDamage(state, amount) {
  // ...
}
```

Avoid:

```js
export function applyPlayerDamage(amount) {
  // Mutates hidden globals.
}
```

## Import Rules

1. Use relative ES module imports.
2. Include `.js` extension in browser module imports.
3. Import from the closest owner module, not from unrelated modules.
4. Avoid circular imports.
5. Data modules should not import runtime modules.
6. Config modules should not import UI or battle modules.
7. UI modules may import DOM helpers and render helpers.
8. Battle modules may import config/data, but should not import UI modules.
9. Board modules may import config constants, but should not import battle or UI modules.
10. `main.js` may import all high-level modules for orchestration.

Preferred dependency direction:

```text
main.js
├─ config/*
├─ data/*
├─ state/*
├─ board/*
├─ battle/*
└─ ui/*
```

Avoid:

```text
battle/* -> ui/*
ui/* -> battle/*
data/* -> main.js
```

## Export Rules

1. Prefer named exports.
2. Do not use default exports unless there is a strong reason.
3. Data files should export a single clear data object or table when possible.
4. Utility modules may export several related helpers.
5. Do not export mutable state directly unless the module is explicitly a state module.
6. If exporting state, provide controlled functions for mutation.

Examples:

```js
export const battleBalance = { ... };
export function getDomRefs() { ... }
```

Avoid:

```js
export default { ... };
```

## Forbidden Modifications

Do not do these unless the user explicitly asks:

1. Do not delete asset files.
2. Do not rename asset files.
3. Do not rewrite generated image/audio assets.
4. Do not remove existing gameplay features.
5. Do not change combat math during a pure refactor.
6. Do not change UI layout during a pure logic task.
7. Do not change logic during a pure UI task.
8. Do not overwrite backup files.
9. Do not edit ACT/cactbot subtitle helper files while working on the game.
10. Do not edit game files while working on ACT/cactbot subtitle helpers.
11. Do not introduce build tools unless requested.
12. Do not add external dependencies unless requested.
13. Do not move `assets/` unless requested.
14. Do not change public exports without updating every import.
15. Do not leave the game unable to launch.

## Safe Refactoring Rules

When refactoring:

1. Make one small extraction at a time.
2. Prefer extracting pure data first.
3. Prefer extracting pure helpers before stateful systems.
4. Keep behavior identical.
5. Keep function names stable when possible.
6. Run syntax checks after each meaningful step.
7. Load the game after major extractions.
8. Verify at least:
   - Home screen loads.
   - Main menu opens.
   - Stage list opens.
   - Battle screen opens.
   - Board shows 49 orbs.
   - No console errors.
9. If a refactor breaks behavior, stop and fix before continuing.
10. Do not mix refactor and feature work in the same change unless requested.

Recommended extraction order:

```text
1. Data/config
2. DOM references
3. Pure board helpers
4. Board rendering
5. Damage helpers
6. Buff/debuff helpers
7. Skill helpers
8. Battle turn orchestration
9. UI effects
10. Audio
```

## Multi-Session Collaboration Rules

Multiple Codex sessions may work at the same time.

To avoid conflicts:

1. Each session should state which files it intends to modify.
2. Prefer working in separate folders/modules.
3. Avoid multiple sessions editing `src/main.js` at the same time.
4. Avoid multiple sessions editing `styles/battle.css` at the same time.
5. If a session must edit a high-conflict file, keep the change small.
6. Before editing, inspect the latest file content.
7. Never revert changes you did not make.
8. Never use destructive git commands.
9. Do not format unrelated sections.
10. Do not reorder large data tables unless necessary.
11. Do not rename shared IDs or CSS classes without coordination.
12. Do not move public functions between modules without updating documentation.
13. After adding/removing modules, update `ARCHITECTURE.md`.
14. After changing development rules, update this file.

High-conflict files:

```text
outputs/src/main.js
outputs/styles/battle.css
outputs/match-card-battle-prototype.html
ARCHITECTURE.md
AI_DEVELOPMENT.md
```

Lower-conflict files:

```text
outputs/src/data/*.js
outputs/src/config/*.js
outputs/src/ui/dom.js
future focused modules under outputs/src/board/
future focused modules under outputs/src/battle/
future focused modules under outputs/src/ui/
```

## Verification Checklist

After source changes, verify as appropriate:

```text
1. JavaScript syntax check passes.
2. Browser loads the game page.
3. Home screen appears.
4. Battle screen can be reached.
5. Board renders.
6. No console errors.
7. Changed behavior matches the user request.
8. Unrelated behavior is unchanged.
```

For pure documentation changes:

```text
1. Do not run game modification steps.
2. Confirm only the intended Markdown file changed.
```

## Documentation Rules

Update documentation when:

- A module is added.
- A module is removed.
- Ownership changes.
- Public exports change.
- Dependency direction changes.
- A new collaboration rule is needed.

Documentation files:

```text
ARCHITECTURE.md
AI_DEVELOPMENT.md
```

## Current Refactor Status

Current state:

- Data/config modules have been extracted.
- DOM lookup has been extracted.
- CSS has been extracted.
- `src/main.js` still owns board, battle, UI rendering, effects, audio, and flow orchestration.

Next recommended refactor:

```text
1. Extract board pure helpers.
2. Extract match detection.
3. Extract board rendering.
4. Extract damage and buff helpers.
```

