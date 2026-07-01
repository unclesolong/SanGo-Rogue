export function canUseDivine(gauge, max) {
  return gauge >= max;
}

export function calculateDivineGaugeGain(clearedCount) {
  return clearedCount >= 5 ? 1 : 0;
}

export function pickDivineRewards(flags, count = 3) {
  const pool = [...flags];
  const picked = [];
  while (picked.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

export function applyDivineFlag(flag, {
  traitRules,
  battleBalance,
  playerHero,
  divineStates,
  getCurrentStage,
  getRandomBoardColor,
  convertBoardColor,
  spawnRandomOrbs,
  damageEnemy,
  animateAttack,
  showAttackEffect,
  showBuffFlash,
  destroyBoardColor,
  swapBoardColors,
  resultEl,
} = {}) {
  if (!flag) return { applied: false };

  const { type, params } = flag.effect;
  if (type === 'convert_random_color_to_color') {
    const target = params.targetColor;
    const source = params.sourceColor === 'random' ? getRandomBoardColor(target) : params.sourceColor;
    convertBoardColor(source, target);
    resultEl.textContent = `${flag.name}：${traitRules[source]?.label ?? source} 轉為 ${traitRules[target]?.label ?? target}`;
  } else if (type === 'enhance_color_orbs') {
    convertBoardColor(params.targetColor, params.enhancedColor);
    divineStates.enhancedColorMultiplier[params.enhancedColor] = battleBalance.enhancedFireMultiplier;
    showAttackEffect('fire');
    resultEl.textContent = `${flag.name}：火珠強化`;
  } else if (type === 'next_color_match_damage_multiplier') {
    divineStates.nextColorDamage = { ...params };
    resultEl.textContent = `${flag.name}：下一次紅珠傷害 x${params.damageMultiplier}`;
  } else if (type === 'spawn_orbs') {
    spawnRandomOrbs(params.orbColor, params.count);
    resultEl.textContent = `${flag.name}：生成 ${params.count} 顆彩虹珠`;
  } else if (type === 'fixed_damage_all_enemies') {
    const dealt = damageEnemy(playerHero.attack * 2.5);
    animateAttack(dealt, true, 'light', '神令');
    resultEl.textContent = `${flag.name}：造成 ${dealt} 傷害`;
  } else if (type === 'grant_invincible') {
    divineStates.invincibleTurns = Math.max(divineStates.invincibleTurns, 1);
    divineStates.damageReductionTurns = Math.max(divineStates.damageReductionTurns, 1);
    divineStates.damageReductionRate = Math.max(divineStates.damageReductionRate, 0.5);
    showBuffFlash('本回合無敵');
    resultEl.textContent = `${flag.name}：本回合無敵，下回合傷害 -50%`;
  } else if (type === 'debuff_enemy_attack') {
    const monster = getCurrentStage();
    const duration = ['boss', 'elite', 'boss_guard'].includes(monster.rank) ? 2 : params.durationTurns;
    divineStates.enemyAttackMultiplier = params.attackMultiplier;
    divineStates.enemyAttackDebuffTurns = duration;
    resultEl.textContent = `${flag.name}：敵攻下降 ${duration} 回合`;
  } else if (type === 'destroy_all_orbs_of_selected_color') {
    const color = getRandomBoardColor();
    destroyBoardColor(color);
    resultEl.textContent = `${flag.name}：炸掉全部${traitRules[color]?.label ?? color}珠`;
  } else if (type === 'swap_two_orb_colors') {
    const first = getRandomBoardColor();
    const second = getRandomBoardColor(first);
    swapBoardColors(first, second);
    resultEl.textContent = `${flag.name}：交換${traitRules[first]?.label ?? first}與${traitRules[second]?.label ?? second}`;
  } else if (type === 'enable_color_attack') {
    divineStates.enabledAttackColors[params.targetColor] = params.durationTurns;
    resultEl.textContent = `${flag.name}：${traitRules[params.targetColor]?.label ?? params.targetColor}珠以 ATK 0.6x 攻擊 ${params.durationTurns} 回合`;
  }

  return { applied: true, type };
}
