function notImplemented(name) {
  throw new Error(`${name} API boundary exists, but implementation still lives in main.js.`);
}

export function calculateEnemyDamageTaken() {
  notImplemented('calculateEnemyDamageTaken');
}

export function applyEnemyDamage() {
  notImplemented('applyEnemyDamage');
}

export function applyPlayerDamage() {
  notImplemented('applyPlayerDamage');
}

export function calculateBombDamage({
  attack,
  destroyedCount,
  damagePerOrbAtk,
  attackMultiplier = 1,
} = {}) {
  if (!destroyedCount || destroyedCount <= 0) return 0;
  return Math.round(attack * damagePerOrbAtk * destroyedCount * attackMultiplier);
}

export function createDamageEvent(payload) {
  return { type: 'damage', ...payload };
}
