function notImplemented(name) {
  throw new Error(`${name} API boundary exists, but implementation still lives in main.js.`);
}

export function createBoardModel() {
  notImplemented('createBoardModel');
}

export function getCellColor() {
  notImplemented('getCellColor');
}

export function swapCells() {
  notImplemented('swapCells');
}

export function collapseBoardModel() {
  notImplemented('collapseBoardModel');
}

export function cloneBoardModel(board) {
  return board.map((row) => row.map((cell) => cell ? { ...cell } : cell));
}
