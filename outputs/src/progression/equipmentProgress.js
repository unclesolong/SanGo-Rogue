export const equipmentSlots = {
  weapon: '武器',
  armor: '甲冑',
  commandSeal: '兵符',
  treasure: '寶石',
};

export const equipmentRarityRates = [
  { rarity: 'R', rate: 0.5 },
  { rarity: 'SR', rate: 0.3 },
  { rarity: 'SSR', rate: 0.2 },
];

export function createEquipmentProgress() {
  return {
    slots: {
      weapon: null,
      armor: null,
      commandSeal: null,
      treasure: null,
    },
    inventory: [],
  };
}

function pickRarity(rarityRates = equipmentRarityRates) {
  const totalRate = rarityRates.reduce((sum, item) => sum + item.rate, 0);
  let roll = Math.random() * totalRate;

  for (const item of rarityRates) {
    roll -= item.rate;
    if (roll <= 0) return item.rarity;
  }

  return rarityRates[rarityRates.length - 1]?.rarity ?? 'R';
}

function drawCandidate(candidates, rarity) {
  const rarityCandidates = candidates.filter((item) => item.rarity === rarity);
  const source = rarityCandidates.length ? rarityCandidates : candidates;
  if (!source.length) return null;

  const selected = source[Math.floor(Math.random() * source.length)];
  const index = candidates.findIndex((item) => item.id === selected.id);
  return candidates.splice(index, 1)[0];
}

export function pickEquipmentRewards(equipmentPool, count = 3, progress = null, rarityRates = equipmentRarityRates) {
  const ownedIds = new Set(progress?.inventory?.map((item) => item.id) ?? []);
  const pool = equipmentPool.filter((item) => !ownedIds.has(item.id));
  const source = pool.length >= count ? pool : [...equipmentPool];
  const candidates = [...source];
  const picked = [];

  while (picked.length < count && candidates.length) {
    const rarity = pickRarity(rarityRates);
    const equipment = drawCandidate(candidates, rarity);
    if (equipment) picked.push(equipment);
  }

  return picked;
}

export function chooseEquipment(progress, equipment) {
  if (!progress || !equipment) return { equipped: false, reason: 'missing_equipment' };
  if (!Object.prototype.hasOwnProperty.call(progress.slots, equipment.slot)) {
    return { equipped: false, reason: 'invalid_slot' };
  }

  if (!progress.inventory.some((item) => item.id === equipment.id)) {
    progress.inventory.push(equipment);
  }
  progress.slots[equipment.slot] = equipment;
  return { equipped: true, slot: equipment.slot, equipment };
}

export function getEquippedItems(progress) {
  return Object.entries(progress?.slots ?? {})
    .filter(([, item]) => Boolean(item))
    .map(([slot, item]) => ({ slot, ...item }));
}

export function getEquipmentSlotLabels(progress) {
  return Object.entries(equipmentSlots).map(([slot, label]) => {
    const item = progress?.slots?.[slot];
    return item ? `${label}\n${item.rarity} ${item.name}` : label;
  });
}

export function applyEquipmentModifiers(baseStats, equipmentProgress) {
  const equippedItems = getEquippedItems(equipmentProgress);
  return equippedItems.reduce((stats, item) => {
    const statEffects = item.skill?.effects?.filter((effect) => effect.type === 'stat_bonus') ?? [];
    statEffects.forEach((effect) => {
      stats[effect.stat] = Math.round((stats[effect.stat] ?? 0) + effect.value);
    });
    return stats;
  }, { ...baseStats });
}
