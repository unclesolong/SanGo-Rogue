# UI Style Guide: Dark Three Kingdoms Roguelite

## Visual Direction
- The battle UI should feel like a premium dark fantasy Three Kingdoms roguelite, not a web demo.
- Use cinematic staging, heavy atmosphere, carved metal framing, ember light, smoke, and dark red/gold accents.
- Avoid Bootstrap-like gray panels, plain rectangles, generic card layouts, and bright flat UI.

## Palette
- Page background: `#050505`, `#0b0b0b`
- Main panel: `rgba(10, 8, 6, 0.88)`
- Deep panel: `rgba(6, 6, 7, 0.94)`
- Border bronze: `#8a6a2a`
- Highlight gold: `#d6a84a`
- Title text: gold / warm ivory
- Body text: warm ivory / muted parchment
- HP: deep red to bright red gradient
- Heal: jade green
- Energy: cool blue
- Shadow: heavy black vignette and inner shadows

## Layout
- Battle view is a vertical mobile-first shell.
- Top 45% is the cinematic enemy stage.
- Enemy sprite is large, centered, and grounded by black fog/shadow.
- Boss HP bar sits under the enemy inside the stage area, with a metal frame and centered HP text.
- Hero row sits between boss HP and board.
- Board sits centered below hero row inside a black-gold carved frame.
- Bottom navigation is always visually game-like: circular or engraved buttons, not plain tabs.

## Enemy Stage
- Use layered visuals: background image, dark overlay, vignette, smoke, ember particles.
- Enemy idle: slow float and subtle breathing.
- Enemy hurt: flash white and recoil.
- Enemy attack: scale up, lunge downward toward player, trigger screen shake, then return.
- Attack effect layer supports:
  - `slash`: red diagonal slash light
  - `poison`: green poison mist
  - `fire`: fire burst
  - `dark`: purple talisman seal
  - `thunder`: lightning strike

## Hero Row
- Use five horizontal card slots.
- Current mode uses one active hero centered, with equipment/empty slots around it.
- Each card has a portrait, small element badge, HP number, and small HP bar.
- Keep text minimal. Do not place long descriptions in battle cards.
- Ready skill state uses a gold glow frame.

## Match Board
- Board frame uses black-gold carved styling.
- Grid cells are dark stone slabs, not pure black.
- Gems have drop shadow and inner glow.
- Hover/active gems scale subtly.
- Selected gem uses a gold ring.
- Combo uses large red/gold arcade text and board shake.

## Components
- `.game-shell`: outer battle frame.
- `.battle-stage`: cinematic enemy stage.
- `.enemy-layer`: background and atmosphere layers.
- `.enemy-sprite`: enemy image.
- `.boss-hp-bar`: boss HP frame and fill.
- `.hero-row`: horizontal hero/equipment card strip.
- `.hero-card`: battle card.
- `.hero-portrait`: hero image.
- `.hero-element-badge`: small element icon/badge.
- `.hero-hp-text`: compact HP text.
- `.hero-hp-bar`: small HP bar.
- `.command-orb`: side command button style.
- `.board-frame`: board container.
- `.match-grid`: match-3 grid.
- `.gem-cell`: individual cell slab.
- `.gem`: gem visual.
- `.bottom-nav`: engraved bottom navigation.

## Rules
- Do not change gameplay data structures for visual changes.
- Keep mobile portrait usable.
- Favor CSS classes and presentational JS only.
- Any future battle UI edits must follow this file.
