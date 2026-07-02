export const teamElements = ['red', 'green', 'yellow', 'light', 'dark'];

export const traitRules = {
  red: { id: 'red', label: '火', name: '火攻', type: 'attack', values: { 3: 1, 4: 1.2, 5: 1.5, 6: 2, 7: 3 } },
  green: { id: 'green', label: '木', name: '護盾', type: 'shield', values: { 3: 0.05, 4: 0.1, 5: 0.15, 6: 0.2, 7: 0.25 } },
  yellow: { id: 'yellow', label: '雷', name: '能量', type: 'energy', values: { 3: 10, 4: 14, 5: 20, 6: 26, 7: 30 } },
  light: { id: 'light', label: '光', name: '治療', type: 'heal', values: { 3: 0.1, 4: 0.12, 5: 0.15, 6: 0.2, 7: 0.25 } },
  dark: { id: 'dark', label: '暗', name: '毒傷', type: 'poison', values: { 3: 1, 4: 2, 5: 3, 6: 4, 7: 5 } },
};
