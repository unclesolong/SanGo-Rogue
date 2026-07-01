# Multi Agent Rule

This document defines collaboration rules for multiple Codex sessions working on this game at the same time.

The goal is to prevent conflicting edits, duplicated logic, hidden coupling, and accidental rewrites.

## Core Rule

Each Codex session must own exactly one module or one clearly scoped task area.

A session should not modify files outside its assigned module unless the user explicitly approves the cross-module change.

## Module Ownership

Before making changes, each session must identify its assigned module.

Examples:

```text
UI Session
Board Session
Battle Session
Skill Session
Buff Session
Data Session
Audio Session
Documentation Session
```

The session should then work only inside that module's files.

If module ownership is unclear, check:

```text
MODULE_OWNER.md
ARCHITECTURE.md
AI_DEVELOPMENT.md
```

## File Boundary Rule

A session must never modify files outside its assigned module.

Allowed:

```text
UI Session -> outputs/src/ui/*
Board Session -> outputs/src/board/*
Battle Session -> outputs/src/battle/*
Data Session -> outputs/src/data/*
Config Session -> outputs/src/config/*
Documentation Session -> *.md
```

Forbidden:

```text
UI Session editing battle damage logic
Battle Session editing CSS layout
Board Session editing hero data
Data Session editing runtime combat code
Documentation Session editing source code
```

## Shared Files Rule

Shared files should only expose APIs.

Shared files must not become dumping grounds for unrelated logic.

Examples of shared files:

```text
outputs/src/main.js
outputs/src/state/gameState.js
outputs/src/ui/dom.js
outputs/src/config/balance.js
```

Rules for shared files:

1. Keep public API small.
2. Export only necessary functions or data.
3. Do not place module-specific implementation in shared files.
4. Do not add hidden side effects.
5. Do not mutate another module's internal state.

## Public API Communication Rule

If another module is required, communicate only through exported functions or exported data.

Allowed:

```js
import { applyPlayerDamage } from '../battle/damage.js';
import { renderBattleState } from '../ui/renderBattle.js';
```

Forbidden:

```js
import { internalEnemyHp } from '../battle/damage.js';
internalEnemyHp = 0;
```

Modules should expose clear functions instead of requiring other modules to access internal variables.

## No Internal Variable Editing

Do not directly edit another module's internal variables.

Forbidden:

```js
// From UI module
battleState.enemyHp -= 500;
```

Preferred:

```js
// From UI module
emitPlayerAction({ type: 'attack', element: 'fire' });
```

or:

```js
applyEnemyDamage(state, damageEvent);
```

The owner module decides how its state changes.

## No Duplicate Logic

Never duplicate logic across modules.

If logic already exists, reuse it through an exported function.

Bad:

```js
// UI module recalculates fire damage again.
const damage = hero.attack * fireMultiplier * comboMultiplier;
```

Good:

```js
const damagePreview = calculateFireDamagePreview(state, matchInfo);
```

If no exported function exists, propose an API addition first.

## No Rewriting Another Module

A session must never rewrite another module.

Forbidden:

```text
Battle Session rewrites UI renderer.
UI Session rewrites board match detection.
Data Session rewrites main orchestration.
```

If another module has a bug, report:

1. Which module owns the bug.
2. Which public API is missing or incorrect.
3. What change is needed.

Then wait for approval or create a separate session/task for that module.

## Architecture Change Rule

If architecture changes are required, propose them before implementation.

Architecture changes include:

- Moving functions between modules.
- Renaming modules.
- Renaming exported functions.
- Changing public API shape.
- Introducing a new shared state module.
- Introducing new dependency direction.
- Adding a build step.
- Adding external dependencies.

Proposal should include:

```text
1. Problem
2. Proposed module change
3. Files affected
4. Public API changes
5. Risk
6. Verification plan
```

Do not implement architecture changes until approved.

## Import Direction Rule

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

Allowed:

```text
battle/* -> config/*
battle/* -> data/*
board/* -> config/*
ui/* -> ui/dom.js
main.js -> all public modules
```

Forbidden unless explicitly approved:

```text
data/* -> battle/*
data/* -> ui/*
config/* -> battle/*
config/* -> ui/*
board/* -> ui/*
battle/* -> ui/*
ui/* -> battle internals
```

## Session Startup Checklist

Every session should begin by checking:

```text
1. What module am I assigned?
2. Which files belong to that module?
3. Which public APIs do I need?
4. Do I need another module changed?
5. Can I complete this without touching shared files?
```

If the answer to item 4 is yes, propose the required API or architecture change first.

## Session Completion Checklist

Before finishing, each session should confirm:

```text
1. Only assigned module files were changed.
2. No duplicated logic was added.
3. No other module's internals were edited.
4. Public APIs are documented if changed.
5. JavaScript syntax passes if code changed.
6. Game launch was verified if runtime code changed.
```

## High Conflict Files

These files require extra care:

```text
outputs/src/main.js
outputs/styles/battle.css
outputs/match-card-battle-prototype.html
ARCHITECTURE.md
AI_DEVELOPMENT.md
MODULE_OWNER.md
MULTI_AGENT_RULE.md
```

Do not edit these files casually.

If a high-conflict file must be changed, keep the change minimal and explain why.

## Communication Between Sessions

Sessions communicate through:

1. Public exports.
2. Markdown architecture documents.
3. User-approved API changes.

Sessions do not communicate through:

1. Copy-pasted duplicate logic.
2. Editing another module's private variables.
3. Rewriting another module's files.
4. Hidden global variables.

## Rule Summary

1. Own one module.
2. Do not modify files outside your module.
3. Shared files expose APIs only.
4. Never duplicate logic.
5. Never rewrite another module.
6. Use exported functions to communicate.
7. Do not edit another module's internal variables.
8. Propose architecture changes before implementation.

