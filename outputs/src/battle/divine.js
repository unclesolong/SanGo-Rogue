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
  playerMaxHp,
  divineStates,
  getCurrentStage,
  getRandomBoardColor,
  convertBoardColor,
  spawnRandomOrbs,
  damageEnemy,
  animateAttack,
  showAttackEffect,
  showBuffFlash,
  gainPlayerHeal,
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
    resultEl.textContent = `${flag.name}：${traitRules[source]?.label ?? source}珠轉為${traitRules[target]?.label ?? target}珠，本回合消珠會引爆十字。`;
  } else if (type === 'enhance_color_orbs') {
    convertBoardColor(params.targetColor, params.enhancedColor);
    divineStates.enhancedColorMultiplier[params.enhancedColor] = battleBalance.enhancedFireMultiplier;
    divineStates.eastWindTurns = Math.max(divineStates.eastWindTurns ?? 0, params.durationTurns ?? 3);
    showAttackEffect('fire');
    resultEl.textContent = `${flag.name}：火珠轉為強化火珠，火珠天降提高 3 回合。`;
  } else if (type === 'azure_dragon_heal') {
    const immediateHeal = Math.round(playerMaxHp * (params.immediateMaxHpRate ?? 0.5));
    divineStates.azureDragonHealTurns = Math.max(divineStates.azureDragonHealTurns ?? 0, params.durationTurns ?? 3);
    divineStates.azureDragonHealMultiplier = Math.max(divineStates.azureDragonHealMultiplier ?? 0, params.healMultiplier ?? 2);
    showBuffFlash('青龍回春');
    showAttackEffect('light');
    await gainPlayerHeal?.(immediateHeal);
    resultEl.textContent = `${flag.name}：青龍回春，立即恢復 ${immediateHeal} HP，3 回合內所有消珠附帶回血 x${divineStates.azureDragonHealMultiplier}。`;
  } else if (type === 'spawn_orbs') {
    spawnRandomOrbs(params.orbColor, params.count);
    resultEl.textContent = `${flag.name}：生成 ${params.count} 顆彩虹珠。`;
  } else if (type === 'fixed_damage_all_enemies') {
    const dealt = damageEnemy(playerHero.attack * (params.damageAtk ?? 2.5));
    animateAttack(dealt, true, 'light', flag.name);
    addEnemyBurn?.(params.durationTurns, params.burnMaxHp);
    addEnemyPoison?.(params.durationTurns, params.poisonMaxHp);
    resultEl.textContent = `${flag.name}：造成 ${dealt} 傷害，並附加燃燒與中毒。`;
  } else if (type === 'grant_invincible') {
    divineStates.invincibleTurns = Math.max(divineStates.invincibleTurns, params.durationTurns ?? 1);
    divineStates.damageReductionTurns = Math.max(divineStates.damageReductionTurns, params.durationTurns ?? 1);
    divineStates.damageReductionRate = Math.max(divineStates.damageReductionRate, params.damageReductionRate ?? 0.5);
    divineStates.allColorsShieldTurns = Math.max(divineStates.allColorsShieldTurns ?? 0, params.allColorsShieldTurns ?? 1);
    showBuffFlash('八陣圖');
    resultEl.textContent = `${flag.name}：本回合無敵，下一回合受到傷害 -50%。`;
  } else if (type === 'debuff_enemy_attack') {
    const monster = getCurrentStage();
    const duration = ['boss', 'elite', 'boss_guard'].includes(monster.rank) ? 2 : params.durationTurns;
    divineStates.enemyAttackMultiplier = params.attackMultiplier;
    divineStates.enemyAttackDebuffTurns = duration;
    resultEl.textContent = `${flag.name}：敵人攻擊降低至 ${Math.round(params.attackMultiplier * 100)}%，持續 ${duration} 回合。`;
  } else if (type === 'destroy_all_orbs_of_selected_color') {
    const color = getRandomBoardColor();
    await destroyBoardColor(color);
    resultEl.textContent = `${flag.name}：炸掉所有${traitRules[color]?.label ?? color}珠。`;
  } else if (type === 'swap_two_orb_colors') {
    const first = getRandomBoardColor();
    const second = getRandomBoardColor(first);
    swapBoardColors(first, second);
    resultEl.textContent = `${flag.name}：交換${traitRules[first]?.label ?? first}珠與${traitRules[second]?.label ?? second}珠。`;
  } else if (type === 'enable_color_attack') {
    const attackColors = params.attackColors ?? [params.targetColor].filter(Boolean);
    attackColors.forEach((color) => {
      divineStates.enabledAttackColors[color] = Number.POSITIVE_INFINITY;
    });
    divineStates.heavenGeneralThunderTurns = Math.max(divineStates.heavenGeneralThunderTurns ?? 0, params.thunderTurns ?? 3);
    resultEl.textContent = `${flag.name}：雷珠與光珠可攻擊，任意 3 消觸發天公之怒 3 回合。`;
  }

  return { applied: true, type };
}
