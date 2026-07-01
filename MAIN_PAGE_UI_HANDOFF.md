# Main Page UI Handoff

This document is for the Codex session that will edit the non-battle pages: lobby, main menu, team page, and stage selection.

## Goal

Rebuild the non-battle UI into the same dark Three Kingdoms roguelite style as the battle screen.

Do not modify battle logic.

## Current Entry Points

HTML shell:

- `outputs/match-card-battle-prototype.html`

Current screens:

- `lobbyScreen`
- `mainMenuScreen`
- `teamScreen`
- `stageScreen`
- `battleScreen`

Current JS owner:

- `outputs/src/main.js`

Current functions:

- `showScreen(name)` controls screen switching.
- `renderStageMap()` builds stage selection buttons.
- `startGame` click handler enters the main menu.
- `goAdventure` click handler enters stage selection.
- `goTeam` click handler enters team page.
- `backMenu` and `backMenuFromTeam` return to the main menu.

Current CSS:

- `outputs/styles/battle.css`

## Recommended Module Target

Move non-battle screen rendering gradually into:

- `outputs/src/ui/screens.js`

Optional future split:

- `outputs/src/ui/renderMainMenu.js`
- `outputs/src/ui/renderStageSelect.js`
- `outputs/src/ui/renderTeamPage.js`

Only create these files if the UI becomes too large for `screens.js`.

## Allowed Modifications

- Lobby layout.
- Main menu layout.
- Adventure/stage selection layout.
- Team page layout.
- Buttons, icons, animation, background, visual effects.
- CSS classes for non-battle screens.
- HTML structure of non-battle screen sections.
- `showScreen(name)` wiring if needed.
- `renderStageMap()` visual output only.

## Forbidden Modifications

- Damage calculation.
- Match-3 board logic.
- Enemy AI.
- Turn order.
- Hero skill formulas.
- Order/divine reward formulas.
- Save data structure.
- Monster data values.
- Hero data values.
- Battle screen gameplay flow.

## Safe Rules

- Keep existing screen IDs unless you update all references.
- Do not remove `battleScreen`.
- Do not rename existing buttons unless you update their JS handlers.
- Avoid adding gameplay state inside UI rendering.
- UI functions should receive data and return HTML or update DOM.
- Do not directly mutate battle variables from UI modules.

## Current Screen IDs

```html
lobbyScreen
mainMenuScreen
teamScreen
stageScreen
battleScreen
```

## Current Button IDs

```html
startGame
goAdventure
goTeam
backMenu
backMenuFromTeam
```

## Suggested Visual Direction

- Dark Three Kingdoms roguelite.
- Black/gold/bronze/red palette.
- Large readable text, minimum 16px Chinese.
- Main menu should feel like a mobile/PC game home screen, not a web demo.
- Stage selection can look like a campaign map.
- Team page can show the large Zhao Yun card and locked future slots.

## Coordination

Before changing shared architecture, update:

- `ARCHITECTURE.md`
- `MODULE_OWNER.md`
- `MULTI_AGENT_RULE.md` only if collaboration rules change.

If this session needs battle information, communicate through exported functions. Do not read or edit battle internals directly.
