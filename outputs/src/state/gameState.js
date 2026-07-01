export function createInitialGameState(overrides = {}) {
  return {
    board: [],
    selected: null,
    stage: 1,
    selectedStage: 1,
    enemy: null,
    player: null,
    buffs: [],
    debuffs: [],
    orderGauge: 0,
    divineGauge: 0,
    busy: false,
    ...overrides,
  };
}

export function resetBattleRuntimeState(state, overrides = {}) {
  return {
    ...state,
    board: [],
    selected: null,
    buffs: [],
    debuffs: [],
    orderGauge: 0,
    divineGauge: 0,
    busy: false,
    ...overrides,
  };
}

export function createGameStateSnapshot(state) {
  return structuredClone(state);
}
