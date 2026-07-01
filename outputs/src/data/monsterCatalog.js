export function getStageMonster(stageData, stage) {
  return stageData[stage - 1];
}

export function createMonsterBattleState(monster) {
  return {
    maxHp: monster.hp,
    hp: monster.hp,
    turn: monster.basicAttackTurns,
    actionCount: 0,
    shield: 0,
    damageReduction: 0,
    vulnerability: 0,
    debuffs: [],
  };
}

export function getMonsterArt(monster, fallback = 'assets/monster-yellow-turban-clean.png') {
  return monster.art?.greenBg || monster.art?.transparent || fallback;
}

export function getMonsterPreviewDamage(monster, attackMultiplier = 1) {
  return Math.round(monster.attack * attackMultiplier);
}

export function getMonsterTurnCooldown(monster) {
  return monster.basicAttackTurns;
}
