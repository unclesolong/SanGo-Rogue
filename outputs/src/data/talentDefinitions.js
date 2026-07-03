export const TALENT_STORAGE_KEY = 'sangoTalentProgressV1';

export const defaultTalentLevels = {
  thunder_small_1: 1,
  thunder_small_2: 1,
  thunder_small_3: 1,
};

export const thunderTalentConfig = {
  attackTalentId: 'thunder_small_1',
  skyfall10TalentId: 'thunder_small_2',
  energyDoubleTalentId: 'thunder_small_3',
  paralysisTalentId: 'thunder_small_3',
  chargeTalentId: 'thunder_small_4',
  skyfall15TalentIds: ['thunder_small_5', 'thunder_small_7'],
  thunderGodTalentId: 'thunder_small_6',
  baseAttackRate: 0.2,
  baseRecoveryRate: 0.2,
  chargeDamageBonus: 0.2,
  thunderGodDamageBonus: 0.1,
  paralysisChance: 0.2,
  skyfall10Bonus: 0.1,
  skyfall15Bonus: 0.15,
  labels: {
    punishment: '天罰',
    thunderGod: '雷神轟鳴',
    charge: '聚雷',
  },
};

export const thunderSmallTalentText = {
  thunder_small_1: {
    name: '雷攻',
    effect: '雷珠可發動天罰，造成趙雲攻擊 20% + 回復力 20% 的雷傷。',
    next: '已啟動。',
  },
  thunder_small_2: {
    name: '雷脈',
    effect: '雷珠出現率提升 10%。',
    next: '已啟動。',
  },
  thunder_small_3: {
    name: '疾勢',
    effect: '雷珠獲取能量加倍；天罰命中時有 20% 機率使怪物麻痺。',
    next: '已啟動。',
  },
  thunder_small_4: {
    name: '聚電',
    effect: '天罰傷害 +20%；本回合消除雷珠的位置會再生雷珠。',
    next: '解鎖聚雷再生。',
  },
  thunder_small_5: {
    name: '疾雷',
    effect: '雷珠出現率提升至 15%。',
    next: '已啟動。',
  },
  thunder_small_6: {
    name: '天擊',
    effect: '天罰轉變成雷神轟鳴，三道閃電打擊，傷害再 +10%。',
    next: '解鎖雷神轟鳴。',
  },
  thunder_small_7: {
    name: '雷印',
    effect: '雷珠出現率提升至 15%。',
    next: '已啟動。',
  },
};

export function applyTalentTextOverrides(nodes, overrides) {
  nodes.forEach((node) => {
    const text = overrides[node.id];
    if (text) Object.assign(node, text);
  });
}
