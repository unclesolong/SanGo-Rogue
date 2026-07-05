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

export async function applyDivineFlag(flag, {
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
  addEnemyBurn,
  addEnemyPoison,
  resultEl,
} = {}) {
  if (!flag) return { applied: false };

  const { type, params } = flag.effect;
  if (type === 'convert_random_color_to_color') {
    const target = params.targetColor;
    const source = params.sourceColor === 'random' ? getRandomBoardColor(target) : params.sourceColor;
    convertBoardColor(source, target);
    divineStates.fireAttackBombTurns = Math.max(divineStates.fireAttackBombTurns ?? 0, params.fireAttackBombTurns ?? 1);
    resultEl.textContent = `${flag.name}：${traitRules[source]?.label ?? source} 轉為 ${traitRules[target]?.label ?? target}，本回合消除觸發十字炸珠。`;
  } else if (type === 'enhance_color_orbs') {
    convertBoardColor(params.targetColor, params.enhancedColor);
    divineStates.enhancedColorMultiplier[params.enhancedColor] = battleBalance.enhancedFireMultiplier;
    divineStates.eastWindTurns = Math.max(divineStates.eastWindTurns ?? 0, params.durationTurns ?? 3);
    showAttackEffect('fire');
    resultEl.textContent = `${flag.name}：火珠轉為強化火珠，3 回合天降火珠提升且必為強化火珠。`;
  } else if (type === 'next_color_match_damage_multiplier') {
    divineStates.nextColorDamage = { ...params };
    resultEl.textContent = `${flag.name}：下一次紅色消除傷害 x${params.damageMultiplier}`;
  } else if (type === 'spawn_orbs') {
    spawnRandomOrbs(params.orbColor, params.count);
    resultEl.textContent = `${flag.name}：生成 ${params.count} 顆彩虹珠。`;
  } else if (type === 'fixed_damage_all_enemies') {
    const dealt = damageEnemy(playerHero.attack * (params.damageAtk ?? 2.5));
    animateAttack(dealt, true, 'light', flag.name);
    addEnemyBurn?.(params.durationTurns, params.burnMaxHp);
    addEnemyPoison?.(params.durationTurns, params.poisonMaxHp);
    resultEl.textContent = `${flag.name}：造成 ${dealt} 傷害，附加燃燒與中毒。`;
  } else if (type === 'grant_invincible') {
    divineStates.invincibleTurns = Math.max(divineStates.invincibleTurns, params.durationTurns ?? 1);
    divineStates.damageReductionTurns = Math.max(divineStates.damageReductionTurns, params.durationTurns ?? 1);
    divineStates.damageReductionRate = Math.max(divineStates.damageReductionRate, params.damageReductionRate ?? 0.5);
    divineStates.allColorsShieldTurns = Math.max(divineStates.allColorsShieldTurns ?? 0, params.allColorsShieldTurns ?? 1);
    showBuffFlash('八陣圖');
    resultEl.textContent = `${flag.name}：無敵 1 回合，傷害 -50%，所有屬性消除附帶護盾。`;
  } else if (type === 'debuff_enemy_attack') {
    const monster = getCurrentStage();
    const duration = ['boss', 'elite', 'boss_guard'].includes(monster.rank) ? 2 : params.durationTurns;
    divineStates.enemyAttackMultiplier = params.attackMultiplier;
    divineStates.enemyAttackDebuffTurns = duration;
    resultEl.textContent = `${flag.name}：敵人攻擊降低 ${duration} 回合。`;
  } else if (type === 'destroy_all_orbs_of_selected_color') {
    const color = getRandomBoardColor();
    await destroyBoardColor(color);
    resultEl.textContent = `${flag.name}：消除 ${traitRules[color]?.label ?? color} 珠。`;
  } else if (type === 'swap_two_orb_colors') {
    const first = getRandomBoardColor();
    const second = getRandomBoardColor(first);
    swapBoardColors(first, second);
    resultEl.textContent = `${flag.name}：交換 ${traitRules[first]?.label ?? first} / ${traitRules[second]?.label ?? second} 珠。`;
  } else if (type === 'enable_color_attack') {
    const attackColors = params.attackColors ?? [params.targetColor].filter(Boolean);
    attackColors.forEach((color) => {
      divineStates.enabledAttackColors[color] = Number.POSITIVE_INFINITY;
    });
    divineStates.heavenGeneralThunderTurns = Math.max(divineStates.heavenGeneralThunderTurns ?? 0, params.thunderTurns ?? 3);
    resultEl.textContent = `${flag.name}：黃珠與光珠本場戰鬥可攻擊，3 回合任意消除觸發天公之怒。`;
  }

  return { applied: true, type };
}
