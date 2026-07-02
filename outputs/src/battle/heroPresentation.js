import { attackArts } from '../data/attackArts.js';

function getAttackArt(count = 3) {
  return attackArts.find((art) => count >= art.min) ?? attackArts[attackArts.length - 1] ?? null;
}

function getHeroName(hero = {}) {
  return hero.name || hero.hero || '';
}

function getGenericAttackPresentation(hero = {}, event = {}) {
  return {
    heroId: hero.id || '',
    heroName: getHeroName(hero),
    name: event.label || '攻擊',
    icon: hero.activeSkill?.icon || hero.art?.battleIcon || '',
    voice: null,
    vfx: '',
  };
}

function getZhaoYunAttackPresentation(hero = {}, event = {}) {
  const art = getAttackArt(event.count);
  const affinityColor = hero.orbAffinity || 'red';
  const isOrbMatchAttack = event.source === 'orb_match';
  const isAffinityAttack = isOrbMatchAttack && event.color === affinityColor;

  return {
    heroId: hero.id || 'hero_zhao_yun',
    heroName: getHeroName(hero),
    name: art?.name || event.label || '攻擊',
    icon: art?.icon || hero.activeSkill?.icon || '',
    voice: isOrbMatchAttack ? art?.voice || null : null,
    vfx: isAffinityAttack && event.count >= 3 && event.count <= 4 ? 'spearThrust' : '',
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
    vfx: event.vfx ?? presentation?.vfx ?? '',
  };
}
