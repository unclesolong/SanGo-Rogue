export const equipmentRewards = [
  {
    id: 'flame_battle_saber_r',
    name: '烈焰戰刀',
    rarity: 'R',
    slot: 'weapon',
    school: '火珠流',
    skill: {
      id: 'burning_fire_slash',
      name: '焚火斬',
      description: '主動技能額外產生 +3 火珠。火珠傷害 +10%。',
      effects: [
        { type: 'active_skill_extra_orbs', color: 'red', value: 3 },
        { type: 'fire_damage_bonus', value: 0.1 },
      ],
    },
  },
  {
    id: 'army_breaking_halberd_r',
    name: '破軍短戟',
    rarity: 'R',
    slot: 'weapon',
    school: '四消流',
    skill: {
      id: 'break_formation',
      name: '破陣',
      description: '每次 4 消，本回合攻擊力 +10%。最多疊 3 層。',
      effects: [
        { type: 'four_match_turn_attack_stack', value: 0.1, maxStacks: 3 },
      ],
    },
  },
  {
    id: 'red_wolf_longbow_r',
    name: '赤狼長弓',
    rarity: 'R',
    slot: 'weapon',
    school: '爆擊流',
    skill: {
      id: 'hunt',
      name: '獵殺',
      description: '每次引爆火珠，有 20% 機率造成一次 50% 英雄攻擊追擊。',
      effects: [
        { type: 'fire_bomb_follow_up_chance', chance: 0.2, value: 0.5 },
      ],
    },
  },
  {
    id: 'black_iron_armor_r',
    name: '黑鐵戰甲',
    rarity: 'R',
    slot: 'armor',
    school: '基礎防禦流',
    skill: {
      id: 'iron_wall',
      name: '鐵壁',
      description: '受到敵人傷害降低 10%。',
      effects: [
        { type: 'enemy_damage_reduction', value: 0.1 },
      ],
    },
  },
  {
    id: 'red_flame_leather_armor_r',
    name: '赤焰皮甲',
    rarity: 'R',
    slot: 'armor',
    school: '火珠反擊流',
    skill: {
      id: 'ember_backlash',
      name: '餘燼反噬',
      description: '受到攻擊時，20% 機率引爆 1 顆火珠。引爆造成英雄攻擊 50% 傷害。',
      effects: [
        { type: 'on_hit_fire_bomb_chance', chance: 0.2, bombCount: 1, value: 0.5 },
      ],
    },
  },
  {
    id: 'army_breaking_light_armor_r',
    name: '破軍輕甲',
    rarity: 'R',
    slot: 'armor',
    school: '低血狂戰流',
    skill: {
      id: 'last_stand',
      name: '背水',
      description: '生命低於 40% 時，攻擊力 +15%。',
      effects: [
        { type: 'low_hp_attack_bonus', hpBelow: 0.4, value: 0.15 },
      ],
    },
  },
  {
    id: 'asura_sky_halberd_sr',
    name: '修羅方天戟',
    rarity: 'SR',
    slot: 'weapon',
    school: '引爆流',
    skill: {
      id: 'asura_war_will',
      name: '修羅戰意',
      description: '主動技能額外產生 +5 火珠。引爆火珠時，30% 機率再次引爆 1 顆火珠。',
      effects: [
        { type: 'active_skill_extra_orbs', color: 'red', value: 5 },
        { type: 'fire_bomb_chain_chance', chance: 0.3, value: 1 },
      ],
    },
  },
  {
    id: 'dragon_soul_saber_sr',
    name: '龍鳴斬魂刀',
    rarity: 'SR',
    slot: 'weapon',
    school: 'Combo 流',
    skill: {
      id: 'dragon_soul_awaken',
      name: '龍魂覺醒',
      description: '每次 5 消，Combo 傷害 +8%，最多 5 層。達到 5 層時，每次 5 Combo 以上額外造成 150% 英雄攻擊。',
      effects: [
        { type: 'five_match_combo_stack', value: 0.08, maxStacks: 5 },
        { type: 'combo_threshold_follow_up', requiredStacks: 5, minCombo: 5, value: 1.5 },
      ],
    },
  },
  {
    id: 'hulao_heavy_crossbow_sr',
    name: '虎牢重弩',
    rarity: 'SR',
    slot: 'weapon',
    school: '追擊流',
    skill: {
      id: 'ten_thousand_arrows',
      name: '萬箭追魂',
      description: '每次火珠攻擊追加 40% 英雄攻擊。若一次消除 6 顆以上火珠，追擊改為 80%。',
      effects: [
        { type: 'fire_attack_follow_up', value: 0.4 },
        { type: 'large_fire_match_follow_up', minCount: 6, value: 0.8 },
      ],
    },
  },
  {
    id: 'hulao_heavy_armor_sr',
    name: '虎牢重甲',
    rarity: 'SR',
    slot: 'armor',
    school: '護盾反擊流',
    skill: {
      id: 'hulao_guard_stance',
      name: '虎牢守勢',
      description: '護盾存在時，每次火珠攻擊追加 15% 傷害。護盾破裂時，立即引爆 5 顆隨機珠。',
      effects: [
        { type: 'shielded_fire_damage_bonus', value: 0.15 },
        { type: 'shield_break_random_bomb', count: 5 },
      ],
    },
  },
  {
    id: 'flame_dragon_scale_armor_sr',
    name: '炎龍鱗甲',
    rarity: 'SR',
    slot: 'armor',
    school: '引爆續航流',
    skill: {
      id: 'dragon_scale_ember',
      name: '龍鱗餘火',
      description: '每引爆 5 顆火珠，恢復最大生命 5%。若生命低於 50%，恢復量提升為 8%。',
      effects: [
        { type: 'fire_bomb_heal_per_count', count: 5, value: 0.05 },
        { type: 'low_hp_fire_bomb_heal_bonus', hpBelow: 0.5, value: 0.08 },
      ],
    },
  },
];
