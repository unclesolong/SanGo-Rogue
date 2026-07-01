const saveKey = 'match-card-battle-save';

export function saveGame(snapshot, storage = window.localStorage) {
  storage.setItem(saveKey, JSON.stringify(snapshot));
}

export function loadGame(storage = window.localStorage) {
  const raw = storage.getItem(saveKey);
  return raw ? JSON.parse(raw) : null;
}

export function clearSave(storage = window.localStorage) {
  storage.removeItem(saveKey);
}
