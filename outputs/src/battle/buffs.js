function notImplemented(name) {
  throw new Error(`${name} API boundary exists, but implementation still lives in main.js.`);
}

export function addBuff() {
  notImplemented('addBuff');
}

export function tickBuffs() {
  notImplemented('tickBuffs');
}

export function addDebuff() {
  notImplemented('addDebuff');
}

export function tickDebuffs() {
  notImplemented('tickDebuffs');
}

export function createStatusEvent(payload) {
  return { type: 'status', ...payload };
}
