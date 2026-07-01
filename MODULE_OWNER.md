# Module Owner

This document defines module ownership for future Codex sessions.

Use this file before editing the project. Each session should work inside its assigned module whenever possible.

## Game Shell

Module Name: Game Shell

Owner:
Shell / Integration Session

Responsibility:
- `outputs/match-card-battle-prototype.html`
- Static HTML structure
- Screen containers
- Script and stylesheet loading
- Audio element declarations

Allowed modifications:
- Add or remove static containers when requested
- Add IDs needed by UI modules
- Update script or stylesheet references
- Add non-gameplay accessibility attributes

Forbidden modifications:
- Damage calculation
- Enemy AI
- Board rules
- Skill rules
- Buff rules
- Asset deletion
- Large layout redesign without UI owner coordination

Dependencies:
- `outputs/styles/battle.css`
- `outputs/src/main.js`
- `outputs/assets/`

Public API:
- DOM IDs and classes used by JavaScript and CSS
- Audio element IDs

Internal implementation:
- HTML only
- Should not contain inline gameplay code

## Main Runtime

Module Name: Main Runtime

Owner:
Integration Session

Responsibility:
- `outputs/src/main.js`
- Game initialization
- Flow orchestration
- Temporary owner of systems not yet extracted
- Event listener binding
- Connecting data, state, board, battle, and UI modules

Allowed modifications:
- Wire modules together
- Move code out into focused modules
- Keep initialization stable
- Add imports for new modules
- Remove code only after equivalent module extraction

Forbidden modifications:
- Unrequested gameplay behavior changes
- Large UI redesign
- Rewriting data tables
- Adding unrelated features
- Hiding errors instead of fixing them

Dependencies:
- `src/config/*`
- `src/data/*`
- `src/ui/dom.js`
- Future `src/state/*`
- Future `src/board/*`
- Future `src/battle/*`
- Future `src/ui/*`

Public API:
- None currently

Internal implementation:
- Top-level runtime state
- Internal gameplay functions
- Internal render functions
- Internal event handlers

## Config

Module Name: Config

Owner:
Balance / Systems Session

Responsibility:
- `outputs/src/config/constants.js`
- `outputs/src/config/balance.js`
- Board dimensions
- Global numeric tuning
- Balance constants

Allowed modifications:
- Tune numeric values
- Add new balance parameters
- Add new global constants
- Rename config keys only with all imports updated

Forbidden modifications:
- DOM access
- Rendering
- Runtime state mutation
- Combat execution logic
- Audio playback
- Asset manipulation

Dependencies:
- None

Public API:
- `width`
- `height`
- `characterRoster`
- `battleBalance`

Internal implementation:
- Plain exported constants and objects
- No side effects

## Trait Data

Module Name: Trait Data

Owner:
Combat Data Session

Responsibility:
- `outputs/src/data/traits.js`
- Element list
- Orb trait rules
- Per-match-count values

Allowed modifications:
- Add or tune trait values
- Add new trait metadata
- Adjust labels and descriptions

Forbidden modifications:
- Damage application
- DOM rendering
- Animation
- Audio
- Runtime state
- Board mutation

Dependencies:
- None

Public API:
- `teamElements`
- `traitRules`

Internal implementation:
- Static data only

## Hero Data

Module Name: Hero Data

Owner:
Character Data Session

Responsibility:
- `outputs/src/data/heroes.js`
- Hero database
- Hero stats
- Active skill data
- Passive skill data
- Hero art paths

Allowed modifications:
- Add heroes
- Tune hero stats
- Update hero skill text
- Update hero art paths
- Add metadata needed by battle modules

Forbidden modifications:
- Skill execution code
- Passive trigger code
- DOM rendering
- Direct asset editing
- Combat loop changes

Dependencies:
- None

Public API:
- `heroDatabase`

Internal implementation:
- Static data only

## Monster Data

Module Name: Monster Data

Owner:
Stage / Monster Data Session

Responsibility:
- `outputs/src/data/monsters.js`
- `outputs/src/data/monsterCatalog.js`
- Stage monster list
- Monster stats
- Monster special skill metadata
- Monster art paths
- Monster lookup helpers
- Monster battle-state initialization

Allowed modifications:
- Add monsters
- Tune monster stats
- Update monster skill metadata
- Update monster art path references

Forbidden modifications:
- Enemy AI execution
- Turn logic
- Damage application
- DOM rendering
- Asset deletion or rename

Dependencies:
- None

Public API:
- `stageData`
- `getStageMonster`
- `createMonsterBattleState`
- `getMonsterArt`
- `getMonsterPreviewDamage`
- `getMonsterTurnCooldown`

Internal implementation:
- Static data and pure monster lookup/init helpers only

## Rogue Reward Data

Module Name: Rogue Reward Data

Owner:
Roguelite Data Session

Responsibility:
- `outputs/src/data/rogueRewards.js`
- Command/order reward definitions
- Reward descriptions
- Reward icons and SFX paths
- Reward effect metadata

Allowed modifications:
- Add rewards
- Tune reward values
- Update reward text
- Update reward icon/audio references

Forbidden modifications:
- Reward execution logic
- Battle damage calculation
- UI dialog implementation
- Board mutation

Dependencies:
- None

Public API:
- `rogueRewards`

Internal implementation:
- Static data only

## Divine Flag Data

Module Name: Divine Flag Data

Owner:
Roguelite Data Session

Responsibility:
- `outputs/src/data/divineFlags.js`
- Divine flag pack metadata
- Divine flag trigger data
- Divine flag effect metadata
- Divine flag icons

Allowed modifications:
- Add divine flags
- Tune divine flag effect params
- Update descriptions
- Update icon paths

Forbidden modifications:
- Divine flag execution logic
- Board destruction logic
- Damage application
- UI dialog implementation

Dependencies:
- None

Public API:
- `divineFlagsPack`

Internal implementation:
- Static data only

## Attack Art Data

Module Name: Attack Art Data

Owner:
Presentation Data Session

Responsibility:
- `outputs/src/data/attackArts.js`
- Attack name thresholds
- Attack icon paths
- Attack voice paths

Allowed modifications:
- Add attack entries
- Update attack names
- Update icon paths
- Update voice paths
- Adjust match-count thresholds

Forbidden modifications:
- Damage calculation
- Voice playback implementation
- Animation implementation
- Skill execution logic

Dependencies:
- None

Public API:
- `attackArts`

Internal implementation:
- Static data only

## DOM References

Module Name: DOM References

Owner:
UI Infrastructure Session

Responsibility:
- `outputs/src/ui/dom.js`
- Central DOM lookup
- Screen references
- Battle UI references
- Dialog references
- Audio element references

Allowed modifications:
- Add new DOM references
- Rename returned reference keys only with all imports updated
- Remove unused references after verification

Forbidden modifications:
- Rendering logic
- Damage calculation
- Gameplay rules
- Event listener behavior
- State mutation

Dependencies:
- Browser `document`

Public API:
- `getDomRefs`

Internal implementation:
- Returns a plain object of DOM references
- No game state mutation

## UI

Module Name: UI

Owner:
UI Session

Responsibility:
- `outputs/src/ui/renderBoard.js`
- `outputs/src/ui/renderBattle.js`
- `outputs/src/ui/dialogs.js`
- `outputs/src/ui/screens.js`
- Visual rendering
- Buttons
- Layout
- Dialog display
- Icons
- Player-visible text placement

Allowed modifications:
- Buttons
- Animations
- Layout
- Icons
- Text placement
- Dialog sizing
- HP bar display
- Energy bar display
- Buff icon placement

Forbidden modifications:
- Damage calculation
- Enemy AI
- Game rules
- Match detection
- Reward effect math
- Skill effect math
- Save data format

Dependencies:
- `src/ui/dom.js`
- Runtime state passed from `main.js` or future `state`
- CSS classes in `styles/`

Public API:
- `renderBoardView`
- `renderBoardSelection`
- `renderBattleState`
- `renderHeroCard`
- `renderHeroRow`
- `renderEnemyDebuffs`
- `renderPlayerBuffs`
- `openSkillDialogView`
- `openRewardDialogView`
- `closeDialogView`
- `showScreenView`
- `bindScreenNavigation`

Internal implementation:
- API boundary exists.
- `renderHeroRow` is wired into `outputs/src/main.js` and affects the running hero row after reload.
- `renderEnemyDebuffs` is wired into `outputs/src/main.js` and affects enemy debuff display after reload.
- Most implementation still lives in `outputs/src/main.js`.
- DOM writes.
- Template rendering.
- Class toggles.
- UI event surfaces.

## UI Effects

Module Name: UI Effects

Owner:
Effects / Animation Session

Responsibility:
- `outputs/src/ui/effects.js`
- Damage floating text
- Attack visual effects
- Screen shake
- Combo pop text
- Enemy hit flash
- Board burst effects

Allowed modifications:
- Animation timing
- CSS class application
- Effect element creation/removal
- Damage text size and timing
- Visual-only shake and flash behavior

Forbidden modifications:
- Actual damage values
- HP mutation
- Buff duration
- Enemy turn logic
- Board match rules

Dependencies:
- DOM references
- CSS animation classes
- Event data from battle modules

Public API:
- `showFloatingDamage`
- `showAttackEffect`
- `showComboPop`
- `shakeBattleStage`

Internal implementation:
- API boundary exists.
- Wired into `outputs/src/main.js`.
- Changes here affect the running game after reload.
- Creates temporary DOM nodes.
- Applies animation classes.
- Removes effect nodes after animation.

## Audio

Module Name: Audio

Owner:
Audio Session

Responsibility:
- `outputs/src/ui/audio.js`
- BGM playback
- Orb clear SFX
- Enemy attack SFX
- Hero voice playback
- Reward SFX

Allowed modifications:
- Audio playback helpers
- Volume controls
- Audio unlock handling
- Audio file path usage when requested

Forbidden modifications:
- Damage timing
- Combat math
- Buff rules
- Board logic
- Asset generation

Dependencies:
- Audio DOM elements
- Asset paths from data modules or HTML

Public API:
- `startLoopingBgm`
- `playAudioCue`
- `unlockAudioOnce`

Internal implementation:
- Wired into `outputs/src/main.js`.
- Changes here affect the running game after reload.
- Browser audio API calls.
- Safe replay/reset of audio elements.

## Board

Module Name: Board

Owner:
Board Session

Responsibility:
- `outputs/src/board/board.js`
- `outputs/src/board/match.js`
- `outputs/src/board/specialOrbs.js`
- `outputs/src/board/index.js`
- Board creation
- Cell helpers
- Swapping
- Collapse/drop
- Board mutation primitives

Allowed modifications:
- Board creation rules
- Swap helpers
- Collapse helpers
- Cell helper functions
- Board-safe utility functions

Forbidden modifications:
- DOM rendering
- Damage calculation
- Skill damage
- Enemy AI
- Audio playback
- UI animation

Dependencies:
- `src/config/constants.js`
- `src/data/traits.js` if color metadata is needed

Public API:
- `createBoardModel`
- `getCellColor`
- `swapCells`
- `collapseBoardModel`
- `cloneBoardModel`
- `findBoardMatches`
- `groupMatchedCells`
- `summarizeMatchGroups`
- `getSpecialCreates`
- `activateSpecialOrb`
- `destroyRandomOrb`
- `destroyBoardColor`

Internal implementation:
- API boundary exists.
- Most implementation still lives in `outputs/src/main.js`.
- Move logic into this module gradually.

## Match Detection

Module Name: Match Detection

Owner:
Board Session

Responsibility:
- Future `outputs/src/board/match.js`
- Detecting connected matches
- Grouping matched cells
- Reporting match counts

Allowed modifications:
- Match algorithm
- Group merge rules
- Rainbow/wildcard match handling
- Match result shape

Forbidden modifications:
- Damage calculation
- Reward application
- UI rendering
- Audio playback
- Enemy turn logic

Dependencies:
- Board cell helpers

Public API:
- Not implemented yet
- Future examples:
  - `findMatches`
  - `groupMatches`

Internal implementation:
- Pure functions preferred

## Special Orbs

Module Name: Special Orbs

Owner:
Board / Roguelite Session

Responsibility:
- Future `outputs/src/board/specialOrbs.js`
- Special orb creation
- Special orb activation
- Board destruction helpers

Allowed modifications:
- Special orb activation rules
- Special orb effect result generation
- Board target selection

Forbidden modifications:
- Reward dialog UI
- Final damage application
- Enemy AI
- Audio playback

Dependencies:
- Board helpers
- Config/balance when needed

Public API:
- Not implemented yet
- Future examples:
  - `activateSpecialOrb`
  - `destroyBoardColor`
  - `destroyRandomOrb`

Internal implementation:
- Board mutation and effect result generation

## Battle Damage

Module Name: Battle Damage

Owner:
Combat Session

Responsibility:
- `outputs/src/battle/damage.js`
- Player damage
- Enemy damage
- Shield absorption
- Shield counterattack
- Vulnerability damage multiplier
- Damage event creation

Allowed modifications:
- Damage formulas when requested
- Shield logic
- Counterattack timing data
- Damage event shape

Forbidden modifications:
- Visual floating text
- CSS animation
- Board matching
- Dialog UI
- Asset paths

Dependencies:
- `src/config/balance.js`
- Runtime state
- Buff/debuff state

Public API:
- `calculateEnemyDamageTaken`
- `applyEnemyDamage`
- `applyPlayerDamage`
- `calculateBombDamage`
- `createDamageEvent`

Internal implementation:
- Partially wired into `outputs/src/main.js`.
- `calculateBombDamage` affects the running game after reload.
- Most implementation still lives in `outputs/src/main.js`.
- Should not directly touch DOM.

## Battle Turns

Module Name: Battle Turns

Owner:
Combat Session

Responsibility:
- `outputs/src/battle/turns.js`
- Enemy countdown
- Enemy action selection
- Turn-end ticking
- Victory/defeat state transitions

Allowed modifications:
- Enemy turn sequencing
- Turn-end effect order
- Enemy intent calculation

Forbidden modifications:
- UI animation implementation
- Board rendering
- Static monster data editing
- Audio playback implementation

Dependencies:
- Monster data
- Battle damage module
- Buff/debuff module
- Runtime state

Public API:
- `createEnemyIntent`
- `advanceEnemyTurn`
- `resolveEnemyAction`
- `createTurnEvent`
- `getEnemyAttackType`

Internal implementation:
- Partially wired into `outputs/src/main.js`.
- `resolveEnemyAction` affects enemy attack/skill behavior after reload.
- `getEnemyAttackType` affects enemy attack animation type after reload.
- Turn flow only.
- Should return events for UI/audio.

## Buffs and Debuffs

Module Name: Buffs and Debuffs

Owner:
Combat Systems Session

Responsibility:
- `outputs/src/battle/buffs.js`
- Player buffs
- Enemy debuffs
- Duration ticking
- Buff stacking
- Buff display metadata

Allowed modifications:
- Buff duration logic
- Stacking rules
- Buff/debuff metadata
- Cleanse behavior

Forbidden modifications:
- UI icon rendering
- Damage text rendering
- Board matching
- Asset editing

Dependencies:
- `src/config/balance.js`
- Runtime state

Public API:
- `addBuff`
- `tickBuffs`
- `addDebuff`
- `tickDebuffs`
- `createStatusEvent`

Internal implementation:
- API boundary exists.
- Buff data mutation.
- No direct DOM writes.

## Skills

Module Name: Skills

Owner:
Skill Session

Responsibility:
- `outputs/src/battle/skills.js`
- Hero active skill execution
- Hero passive skill triggering
- Skill event creation
- Skill cooldown/energy rules

Allowed modifications:
- Skill formulas when requested
- Passive trigger conditions
- Skill event output
- Energy cost rules

Forbidden modifications:
- Skill dialog UI layout
- Damage floating text rendering
- CSS effects
- Static hero art editing

Dependencies:
- Hero data
- Battle damage module
- Board module if skill modifies board
- Runtime state

Public API:
- `canActivateHeroSkill`
- `createHeroSkillDialogModel`
- `createHeroSkillEvent`
- `tryHeroPassive`
- `spendHeroEnergy`

Internal implementation:
- Partially wired into `outputs/src/main.js`.
- `createHeroSkillSystem().tryHeroPassive` affects the running game after reload.
- `createHeroSkillDialogModel` affects the running skill dialog text/image after reload.
- Skill rule execution.
- Should return events for UI/effects/audio.

## Rewards

Module Name: Rewards

Owner:
Roguelite Systems Session

Responsibility:
- `outputs/src/battle/rewards.js`
- `outputs/src/battle/orders.js`
- `outputs/src/battle/divine.js`
- Order reward execution
- Divine flag execution
- Reward gauge spending
- Reward effect events

Allowed modifications:
- Reward execution rules
- Gauge spending rules
- Reward effect event output

Forbidden modifications:
- Reward dialog layout
- Static reward table editing unless also assigned data ownership
- Damage text rendering
- CSS effects

Dependencies:
- `src/data/rogueRewards.js`
- `src/data/divineFlags.js`
- Board module
- Battle damage module
- Buff module
- Runtime state

Public API:
- `canUseOrder`
- `calculateOrderGaugeGain`
- `pickOrderRewards`
- `canUseDivine`
- `calculateDivineGaugeGain`
- `pickDivineRewards`
- `applyOrderReward`
- `applyDivineFlag`

Internal implementation:
- Wired into `outputs/src/main.js`.
- `orders.js` owns military order gauge readiness, reward picking, and order application.
- `divine.js` owns divine gauge readiness, flag picking, and divine flag application.
- `rewards.js` re-exports both APIs for integration.
- No direct DOM writes.

## State

Module Name: State

Owner:
State Session

Responsibility:
- `outputs/src/state/gameState.js`
- Runtime state shape
- Initial state creation
- Battle reset
- Stage reset
- Save-safe state structure

Allowed modifications:
- Add state fields
- Create reset helpers
- Create selectors
- Normalize state shape

Forbidden modifications:
- Rendering
- Audio playback
- Damage formulas
- Asset editing

Dependencies:
- Config defaults
- Data defaults

Public API:
- `createInitialGameState`
- `resetBattleRuntimeState`
- `createGameStateSnapshot`

Internal implementation:
- Plain data objects
- Controlled mutation helpers

## Stage Progression

Module Name: Stage Progression

Owner:
Progression Session

Responsibility:
- `outputs/src/progression/stageProgress.js`
- Stage unlock rules
- Stage clear tracking
- Stage select view model
- Chapter-local progression state

Allowed modifications:
- Stage unlock rules
- Stage clear state helpers
- Stage select model fields
- Chapter progression helpers

Forbidden modifications:
- Monster stats
- Enemy AI
- Battle damage
- Board matching
- UI layout CSS

Dependencies:
- Stage data passed in from runtime

Public API:
- `createStageProgress`
- `isStageUnlocked`
- `isStageCleared`
- `completeStage`
- `getStageNodeState`
- `createStageSelectModel`

Internal implementation:
- Wired into `outputs/src/main.js`.
- Changes affect stage locking and unlock progression after reload.
- No direct DOM writes.

## Storage

Module Name: Storage

Owner:
Storage Session

Responsibility:
- `outputs/src/storage/save.js`
- Save/load
- Save migration
- Local storage keys

Allowed modifications:
- Save format
- Load behavior
- Migration helpers
- Export/import save data if requested

Forbidden modifications:
- Combat formulas
- UI layout
- Board matching
- Asset paths

Dependencies:
- State module
- Browser storage APIs

Public API:
- `saveGame`
- `loadGame`
- `clearSave`

Internal implementation:
- Serialization
- Versioned save data

## Styles

Module Name: Styles

Owner:
UI Session

Responsibility:
- `outputs/styles/battle.css`
- Current full game styling
- Layout
- Visual theme
- Animations

Allowed modifications:
- Colors
- Sizes
- Spacing
- Layout
- Keyframe animations
- Responsive adjustments

Forbidden modifications:
- Gameplay rules
- JavaScript logic
- Asset deletion
- Damage formulas

Dependencies:
- HTML class names
- UI-generated class names
- Asset URLs

Public API:
- CSS class names
- CSS custom properties where present

Internal implementation:
- CSS only

## Assets

Module Name: Assets

Owner:
Asset Session

Responsibility:
- `outputs/assets/`
- Images
- Audio
- Generated art packs
- Monster assets
- Hero assets
- Orb assets

Allowed modifications:
- Add new assets
- Replace assets only when requested
- Add new folders for organized packs

Forbidden modifications:
- Delete existing assets without request
- Rename assets without updating all references
- Compress or overwrite source art unexpectedly
- Change game logic

Dependencies:
- Referenced by HTML, CSS, and data modules

Public API:
- Stable file paths

Internal implementation:
- Binary/static files

## ACT Subtitle Tools

Module Name: ACT Subtitle Tools

Owner:
ACT Tooling Session

Responsibility:
- `outputs/cactbot-tts-subtitle-bridge.js`
- `outputs/cactbot-tts-subtitle-overlay.html`
- `outputs/triggernometry-tts-subtitle.cmd`
- `outputs/triggernometry-tts-subtitle.ps1`
- `outputs/triggernometry-tts-subtitle-position.json`
- Cactbot/Triggernometry subtitle bridge utilities

Allowed modifications:
- Subtitle display behavior
- Overlay positioning
- Triggernometry wrapper behavior
- TTS text bridge fixes

Forbidden modifications:
- Match-3 game source
- Game assets
- Game battle logic
- Game UI CSS

Dependencies:
- ACT
- OverlayPlugin
- Cactbot globals
- Triggernometry
- PowerShell

Public API:
- Overlay URL
- Bridge script behavior
- Position JSON shape

Internal implementation:
- Independent from the game

## Documentation

Module Name: Documentation

Owner:
Documentation Session

Responsibility:
- `ARCHITECTURE.md`
- `AI_DEVELOPMENT.md`
- `MODULE_OWNER.md`

Allowed modifications:
- Clarify ownership
- Update module lists
- Update rules after architecture changes
- Add safe workflow notes

Forbidden modifications:
- Source code changes during documentation-only tasks
- Unverified architecture claims
- Removing important collaboration rules without request

Dependencies:
- Current project structure
- Current module exports/imports

Public API:
- Development rules for future sessions

Internal implementation:
- Markdown only
