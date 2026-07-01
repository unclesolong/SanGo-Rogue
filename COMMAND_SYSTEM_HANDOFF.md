# Command System Handoff

This document is for sessions working on military orders and divine flags.

## Current Goal

Military orders and divine flags are now separated.

- Military orders live in `outputs/src/battle/orders.js`
- Divine flags live in `outputs/src/battle/divine.js`
- Shared re-export lives in `outputs/src/battle/rewards.js`
- `outputs/src/main.js` is wired to call these modules

## Military Orders

Owner file:

- `outputs/src/battle/orders.js`

Data file:

- `outputs/src/data/rogueRewards.js`

Public API:

- `canUseOrder(gauge, max)`
- `calculateOrderGaugeGain(clearedCount)`
- `pickOrderRewards(rewards, count)`
- `applyOrderReward(reward, callbacks)`

Allowed:

- Change order gauge rules.
- Change order application logic.
- Add new order effect types.
- Return richer events for UI/audio later.

Forbidden:

- Edit divine flag logic.
- Edit board matching.
- Edit visual dialog layout.
- Edit static reward data unless assigned data ownership.

## Divine Flags

Owner file:

- `outputs/src/battle/divine.js`

Data file:

- `outputs/src/data/divineFlags.js`

Public API:

- `canUseDivine(gauge, max)`
- `calculateDivineGaugeGain(clearedCount)`
- `pickDivineRewards(flags, count)`
- `applyDivineFlag(flag, callbacks)`

Allowed:

- Change divine gauge rules.
- Change divine flag effect execution.
- Add new divine effect types.
- Convert current callback-based effects into event output later.

Forbidden:

- Edit military order logic.
- Edit reward dialog layout.
- Edit board rendering.
- Edit damage text animation.
- Edit static divine data unless assigned data ownership.

## Main Wiring

`outputs/src/main.js` currently imports from:

```js
./battle/rewards.js
```

Main owns:

- Current gauge state values.
- Dialog open/close.
- Passing board/state callbacks into order/divine modules.
- Calling render/update functions after effects.

Order/divine modules own:

- Whether a gauge is ready.
- How much gauge is gained.
- Randomly picking three options.
- Applying selected effect behavior.

## Collaboration Rules

- A military-order session should only edit `orders.js` and order data when assigned.
- A divine-flag session should only edit `divine.js` and divine data when assigned.
- Shared behavior should be exposed through `rewards.js`.
- Do not duplicate order/divine logic in `main.js`.
- If UI changes are required, hand off to the UI session.
- If board helpers are required, request exported board APIs instead of editing board internals.
