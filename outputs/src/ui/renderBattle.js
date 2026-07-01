function notImplemented(name) {
  throw new Error(`${name} API boundary exists, but implementation still lives in main.js.`);
}

export function renderBattleState() {
  notImplemented('renderBattleState');
}

export function renderHeroCard({ hero, ready = false } = {}) {
  return `
    <button class="card hero-card ${ready ? 'ready' : ''}" data-color="red" type="button">
      <div class="portrait red hero-portrait">
        <img src="${hero.art.battleIcon || hero.art.portrait || hero.art.card}" alt="${hero.name}">
      </div>
    </button>
  `;
}

function renderEquipmentSlot(label, slot) {
  const [slotName, itemName] = String(label).split('\n');
  return `
    <button class="card equipment-card ${itemName ? 'equipped-slot' : 'locked-slot'}" data-equipment-slot="${slot}" type="button">
      <small>${slotName}</small>
      <span>${itemName ?? ''}</span>
    </button>
  `;
}

export function renderHeroRow({
  hero,
  ready = false,
  equipmentLabels = ['武器', '甲冑', '兵符', '寶物'],
} = {}) {
  const [weapon, armor, commandSeal, treasure] = equipmentLabels;
  return `
    ${renderEquipmentSlot(weapon, 'weapon')}
    ${renderEquipmentSlot(armor, 'armor')}
    ${renderHeroCard({ hero, ready })}
    ${renderEquipmentSlot(commandSeal, 'commandSeal')}
    ${renderEquipmentSlot(treasure, 'treasure')}
  `;
}

export function renderEnemyDebuffs({ debuffs = [] } = {}) {
  return debuffs.map((debuff) => {
    const label = debuff.type === 'vulnerability'
      ? `易傷 x${debuff.layers}`
      : debuff.type === 'burn'
        ? `燃燒 ${debuff.turns}`
        : `${Math.round((debuff.amount || 0) * 100)}% ${debuff.turns}`;
    return `
      <div class="enemy-debuff" title="${debuff.description || debuff.name}">
        <img src="${debuff.icon}" alt="${debuff.name}">
        <span>${label}</span>
      </div>
    `;
  }).join('');
}

export function renderPlayerBuffs() {
  notImplemented('renderPlayerBuffs');
}
