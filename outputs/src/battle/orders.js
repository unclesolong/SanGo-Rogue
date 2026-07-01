export function canUseOrder(gauge, max) {
  return gauge >= max;
}

export function calculateOrderGaugeGain(clearedCount) {
  return clearedCount >= 4 ? 1 : 0;
}

export function pickOrderRewards(rewards, count = 3) {
  const pool = [...rewards];
  const picked = [];
  while (picked.length < count && pool.length) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

export function applyOrderReward(reward, {
  convertRandomBoardColor,
  convertRandomOrbsToChosenColor,
  addOrRefreshBuff,
  grantOrderPassive,
  showBuffFlash,
  addLog,
} = {}) {
  if (!reward) return { applied: false };

  if (reward.type === 'color_convert') {
    const result = convertRandomOrbsToChosenColor
      ? convertRandomOrbsToChosenColor(reward.value)
      : convertRandomBoardColor?.();
    if (result?.cancelled) return { applied: false, type: reward.type };
    showBuffFlash?.(reward.name);
    addLog?.(`${reward.name}：${result?.label ?? '選擇顏色'}轉換 ${result?.count ?? reward.value} 顆。`);
    return { applied: true, type: reward.type };
  }

  addOrRefreshBuff?.(reward);
  if (reward.passive) grantOrderPassive?.(reward.passive);
  addLog?.(`${reward.name}：${reward.description}`);
  return { applied: true, type: reward.type };
}
