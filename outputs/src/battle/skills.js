function notImplemented(name) {
  throw new Error(`${name} API boundary exists, but implementation still lives in main.js.`);
}

export function canActivateHeroSkill(hero) {
  return hero.energy >= hero.maxEnergy;
}

export function createHeroSkillEvent() {
  notImplemented('createHeroSkillEvent');
}

export function createHeroSkillDialogModel(hero) {
  const ready = canActivateHeroSkill(hero);
  return {
    ready,
    pendingSkillColor: ready ? 'hero' : null,
    imageSrc: `${hero.art.card}?v=${hero.activeSkill?.id ?? 'hero-card'}-press-skill-20260701e`,
    imageAlt: hero.hero,
    title: hero.hero,
    subtitle: `${hero.hero} / ${hero.title}`,
    description: `主動：${hero.skillName}，${hero.skillDescription} 被動：${hero.passiveSkill.name}，${hero.passiveSkill.description}`,
    confirmText: ready ? '發動' : `能量 ${hero.energy}/${hero.maxEnergy}`,
  };
}

export function spendHeroEnergy(hero, amount = hero.maxEnergy) {
  hero.energy = Math.max(0, hero.energy - amount);
  return hero.energy;
}

export function createHeroSkillSystem({
  battleBalance,
  destroyRandomOrbsByColor,
  playPassiveSfx,
  triggerBoardBurst,
  addLog,
} = {}) {
  function tryHeroPassive({ color, playerHero } = {}) {
    const passive = playerHero.passiveSkill;
    if (passive?.type !== 'crimson_bomb_on_red_orb_match' || playerHero.orbAffinity !== color) return 0;
    if (Math.random() >= passive.chance) return 0;

    const minBombs = passive.minBombs ?? battleBalance.zhaoPassiveMinBombs;
    const maxBombs = passive.maxBombs ?? battleBalance.zhaoPassiveMaxBombs;
    const requested = minBombs + Math.floor(Math.random() * (maxBombs - minBombs + 1));
    const bombed = destroyRandomOrbsByColor('red', requested, { allowEquipmentChain: false });
    if (!bombed) return 0;

    const damage = Math.round(playerHero.attack * (passive.damagePerOrbAtk ?? battleBalance.bombDamageAtkPerOrb) * bombed);
    playPassiveSfx();
    triggerBoardBurst(`${passive.name}・緋紅爆破 ${bombed}`, 'fire');
    addLog(`${playerHero.hero} 被動「${passive.name}」觸發，引爆 ${bombed} 顆緋紅珠。`);
    return { count: bombed, damage };
  }

  return {
    tryHeroPassive,
  };
}

export function tryHeroPassive() {
  throw new Error('Use createHeroSkillSystem().tryHeroPassive after callbacks are available.');
}
