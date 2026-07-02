const monsterSkillCatalog = {
  monster_freeze_board_third: {
    effectType: 'freeze_board_orbs',
    params: {
      freezeCount: null,
      boardFraction: 0.3333,
      durationTurns: 3,
      canMoveFrozenOrbs: false,
      canMatchFrozenOrbs: true,
    },
  },
};

export function createEnemyIntent(monster, {
  actionCount = 0,
  attackMultiplier = 1,
} = {}) {
  const nextActionCount = actionCount + 1;
  const skill = getScheduledEnemySkill(monster, nextActionCount);
  const useSkill = Boolean(skill);
  const damage = getEnemyActionDamage(monster, skill, {
    useSkill,
    playerStatusCount: 0,
    attackMultiplier,
  });

  return {
    type: useSkill ? 'skill' : 'attack',
    name: useSkill ? skill.name : '普攻',
    damage,
    turns: monster.basicAttackTurns,
    skill: useSkill ? skill : null,
  };
}

export function advanceEnemyTurn(currentTurn) {
  return currentTurn - 1;
}

export function resolveEnemyAction(monster, {
  actionCount = 0,
  playerStatusCount = 0,
  attackMultiplier = 1,
  forcedSkill = null,
} = {}) {
  const nextActionCount = actionCount + 1;
  const skill = forcedSkill ?? getScheduledEnemySkill(monster, nextActionCount);
  const useSkill = Boolean(skill);
  const label = useSkill ? `${monster.name} 施放 ${skill.name}` : `${monster.name} 普攻`;
  const damage = getEnemyActionDamage(monster, skill, {
    useSkill,
    playerStatusCount,
    attackMultiplier,
  });

  return {
    actionCount: nextActionCount,
    useSkill,
    skill: useSkill ? skill : null,
    label,
    damage,
    shieldGain: useSkill && ['shield', 'aoe_shield'].includes(skill.effectType) ? skill.shield ?? 0 : 0,
    shieldTurns: useSkill && ['shield', 'aoe_shield'].includes(skill.effectType) ? skill.durationTurns ?? 0 : 0,
    damageReduction: useSkill && skill.effectType === 'shield' ? 0.2 : null,
    endsAfterShield: useSkill && skill.effectType === 'shield',
    playerStatuses: useSkill ? getPlayerStatusesFromSkill(skill) : [],
    boardEffects: useSkill ? getBoardEffectsFromSkill(skill) : [],
    hits: useSkill ? getEnemyActionHits(monster, skill, attackMultiplier) : null,
  };
}

export function createTurnEvent(payload) {
  return { type: 'turn', ...payload };
}

export function createEnemySkillCooldowns(monster) {
  return Object.fromEntries(getMonsterSkills(monster)
    .filter((skill) => skill.frequencyTurns)
    .map((skill) => [getSkillKey(skill), skill.frequencyTurns]));
}

export function tickEnemySkillCooldowns(cooldowns) {
  return Object.fromEntries(Object.entries(cooldowns).map(([key, turns]) => [key, Math.max(0, turns - 1)]));
}

export function getReadyEnemySkill(monster, cooldowns = {}) {
  const ready = getMonsterSkills(monster).filter((skill) => cooldowns[getSkillKey(skill)] <= 0);
  ready.sort((first, second) => (second.frequencyTurns ?? 0) - (first.frequencyTurns ?? 0));
  return ready[0] ?? null;
}

export function resetEnemySkillCooldown(cooldowns, skill) {
  if (!skill?.frequencyTurns) return cooldowns;
  return {
    ...cooldowns,
    [getSkillKey(skill)]: skill.frequencyTurns,
  };
}

export function getNextEnemySkillIntent(monster, {
  actionCount = 0,
  currentTurn = monster.basicAttackTurns,
  skillCooldowns = null,
} = {}) {
  const skills = getMonsterSkills(monster).filter((skill) => skill.frequencyTurns);
  if (!skills.length) return null;
  if (skillCooldowns) {
    const intents = skills.map((skill) => ({
      skill,
      actionsUntil: null,
      turnsRemaining: Math.max(0, skillCooldowns[getSkillKey(skill)] ?? skill.frequencyTurns),
    }));
    intents.sort((first, second) => first.turnsRemaining - second.turnsRemaining);
    const next = intents[0];
    return {
      name: next.skill.name,
      skill: next.skill,
      actionsUntil: next.actionsUntil,
      turnsRemaining: next.turnsRemaining,
    };
  }
  const intents = skills.map((skill) => {
    const actionsUntil = skill.frequencyTurns - (actionCount % skill.frequencyTurns);
    const turnsRemaining = currentTurn + Math.max(0, actionsUntil - 1) * monster.basicAttackTurns;
    return { skill, actionsUntil, turnsRemaining };
  });
  intents.sort((first, second) => first.turnsRemaining - second.turnsRemaining);
  const next = intents[0];
  return {
    name: next.skill.name,
    skill: next.skill,
    actionsUntil: next.actionsUntil,
    turnsRemaining: next.turnsRemaining,
  };
}

export function getEnemyAttackType(skill) {
  if (!skill) return 'slash';
  if (skill.effectType === 'poison') return 'poison';
  if (skill.effectType === 'burn') return 'fire';
  if (skill.effectType === 'bleed') return 'slash';
  if (skill.effectType === 'aoe_shield') return 'thunder';
  if (['freeze', 'damage_slow', 'damage_debuff', 'freeze_board_orbs'].includes(skill.effectType)) return 'dark';
  if (skill.effectType === 'shatter_board_orbs') return 'thunder';
  if (['dash_damage', 'multi_hit'].includes(skill.effectType)) return 'slash';
  if (skill.name?.includes('雷')) return 'thunder';
  return 'slash';
}

function getScheduledEnemySkill(monster, actionCount) {
  const dueSkills = getMonsterSkills(monster).filter((skill) => (
    skill.frequencyTurns && actionCount % skill.frequencyTurns === 0
  ));
  dueSkills.sort((first, second) => (second.frequencyTurns ?? 0) - (first.frequencyTurns ?? 0));
  return dueSkills[0] ?? null;
}

function getMonsterSkills(monster) {
  const skills = [];
  if (monster.specialSkill) skills.push(normalizeLegacySkill(monster.specialSkill));
  (monster.skills ?? []).forEach((skill) => skills.push(normalizeCatalogSkill(skill)));
  return skills;
}

function getSkillKey(skill) {
  return skill.skillId ?? skill.id ?? skill.name;
}

function normalizeLegacySkill(skill) {
  return { ...skill };
}

function normalizeCatalogSkill(skill) {
  const catalogSkill = monsterSkillCatalog[skill.skillId] ?? {};
  const params = {
    ...(catalogSkill.params ?? {}),
    ...(skill.paramsOverride ?? {}),
  };
  return {
    ...skill,
    effectType: skill.effectType ?? catalogSkill.effectType ?? skill.skillId,
    params,
  };
}

function getEnemyActionDamage(monster, skill, {
  useSkill,
  playerStatusCount,
  attackMultiplier,
}) {
  let damage = monster.attack;
  if (useSkill) {
    if (['freeze_board_orbs', 'shatter_board_orbs'].includes(skill.effectType)) damage = 0;
    else if (skill.power) damage = Math.round(monster.attack * skill.power);
    if (skill.effectType === 'damage_bonus' && playerStatusCount) damage += skill.bonusDamage ?? 0;
    if (skill.effectType === 'dash_damage') damage += skill.bonusDamage ?? 0;
    if (skill.effectType === 'multi_hit') {
      damage = Math.round(monster.attack * (skill.power ?? 0.75) * (skill.hitCount ?? 2));
    }
  }
  return Math.round(damage * attackMultiplier);
}

function getEnemyActionHits(monster, skill, attackMultiplier) {
  if (skill.effectType !== 'multi_hit') return null;
  const hitCount = skill.hitCount ?? 2;
  const power = skill.power ?? 0.7;
  return Array.from({ length: hitCount }, () => Math.round(monster.attack * power * attackMultiplier));
}

function getPlayerStatusesFromSkill(skill) {
  if (skill.effectType === 'burn') {
    return [{
      type: 'burn',
      name: '火傷',
      damage: skill.dotDamage ?? 80,
      turns: skill.durationTurns ?? 2,
      icon: skill.icon ?? 'assets/rogue/buffs/buff_attack_up_.png',
      description: skill.description ?? '每回合受到火傷。',
    }];
  }
  if (skill.effectType === 'poison') return [{ type: 'poison', damage: skill.dotDamage ?? 100, turns: skill.durationTurns ?? 3 }];
  if (skill.effectType === 'bleed') {
    return [{
      type: 'bleed',
      name: '流血',
      damage: skill.bleedDamage ?? skill.dotDamage ?? 75,
      turns: skill.durationTurns ?? 5,
      icon: skill.icon ?? 'assets/effects/bleed_blade_cast.png',
      description: skill.description ?? '每回合受到流血傷害。',
    }];
  }
  if (skill.effectType === 'damage_debuff') {
    return [{
      type: 'attackDown',
      name: '攻擊下降',
      amount: skill.attackDownPercent ?? 0.1,
      turns: skill.durationTurns ?? 1,
      icon: skill.icon ?? 'assets/rogue/buffs/buff_sorcery_.png',
      description: skill.description ?? '攻擊力下降。',
    }];
  }
  if (skill.effectType === 'damage_slow') return [{ type: 'slow', name: '遲緩', turns: skill.durationTurns ?? 1 }];
  if (skill.effectType === 'freeze' && Math.random() < (skill.chance ?? 0.35)) return [{ type: 'freeze', name: '冰結', turns: skill.durationTurns ?? 1 }];
  return [];
}

function getBoardEffectsFromSkill(skill) {
  const effects = [];
  if (skill.poisonOrbCount > 0) {
    effects.push({
      type: 'spawn_poison_orbs',
      count: skill.poisonOrbCount,
      minTurns: skill.poisonOrbMinTurns ?? 1,
      maxTurns: skill.poisonOrbMaxTurns ?? 3,
      explosionDamage: skill.poisonOrbDamage ?? 75,
      poisonDamage: skill.poisonDotDamage ?? 100,
      poisonTurns: skill.poisonDurationTurns ?? 2,
    });
  }
  if (skill.effectType === 'shatter_board_orbs') {
    effects.push({
      type: 'shatter_random_orbs',
      count: skill.shatterCount ?? skill.params?.shatterCount ?? 10,
    });
    return effects;
  }
  if (skill.effectType !== 'freeze_board_orbs') return effects;
  effects.push({
    type: 'freeze_random_orbs',
    count: skill.params.freezeCount,
    boardFraction: skill.params.boardFraction,
    durationTurns: skill.params.durationTurns ?? 3,
    canMoveFrozenOrbs: skill.params.canMoveFrozenOrbs ?? false,
    canMatchFrozenOrbs: skill.params.canMatchFrozenOrbs ?? true,
  });
  return effects;
}
