import { attackArts } from '../data/attackArts.js';

function getAttackArt(count = 3) {
  return attackArts.find((art) => count >= art.min) ?? attackArts[attackArts.length - 1] ?? null;
}

function getHeroName(hero = {}) {
  return hero.name || hero.hero || '';
}

function getGenericAttackPresentation(hero = {}, event = {}) {
  const isPursuit = event.source === 'hero_pursuit';
  return {
    heroId: hero.id || '',
    heroName: getHeroName(hero),
    name: isPursuit ? '追擊' : event.label || '攻擊',
    icon: hero.activeSkill?.icon || hero.art?.battleIcon || '',
    voice: null,
    sfx: isPursuit ? 'straightPunch' : '',
    vfx: isPursuit ? 'spearShot' : '',
  };
}

function getZhaoYunAttackPresentation(hero = {}, event = {}) {
  const art = getAttackArt(event.count);
  const affinityColor = hero.orbAffinity || 'red';
  const isOrbMatchAttack = event.source === 'orb_match';
  const isAffinityAttack = isOrbMatchAttack && event.color === affinityColor;
  const isPursuit = event.source === 'hero_pursuit';

  return {
    heroId: hero.id || 'hero_zhao_yun',
    heroName: getHeroName(hero),
    name: isPursuit ? '追擊' : art?.name || event.label || '攻擊',
    icon: art?.icon || hero.activeSkill?.icon || '',
    voice: isOrbMatchAttack ? art?.voice || null : null,
    sfx: isPursuit ? 'straightPunch' : '',
    vfx: isPursuit ? 'spearShot' : isAffinityAttack && event.count >= 3 && event.count <= 4 ? 'spearThrust' : '',
  };
}

export function getHeroAttackPresentation(hero = {}, event = {}) {
  if (hero.id === 'hero_zhao_yun') return getZhaoYunAttackPresentation(hero, event);
  return getGenericAttackPresentation(hero, event);
}

export function applyHeroAttackPresentation(hero = {}, event = {}) {
  const presentation = getHeroAttackPresentation(hero, event);
  return {
    ...event,
    owner: event.owner || hero.id || '',
    presentation,
    sfx: event.sfx ?? presentation?.sfx ?? '',
    vfx: event.vfx ?? presentation?.vfx ?? '',
  };
}
