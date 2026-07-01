export function createStageProgress(totalStages, initialUnlockedStage = 1) {
  return {
    totalStages,
    unlockedStage: Math.min(totalStages, Math.max(1, initialUnlockedStage)),
    clearedStages: new Set(),
  };
}

export function isStageUnlocked(progress, stageNo) {
  return stageNo <= progress.unlockedStage;
}

export function isStageCleared(progress, stageNo) {
  return progress.clearedStages.has(stageNo);
}

export function completeStage(progress, stageNo) {
  progress.clearedStages.add(stageNo);
  progress.unlockedStage = Math.min(progress.totalStages, Math.max(progress.unlockedStage, stageNo + 1));
  return progress;
}

export function getStageNodeState(progress, stageNo) {
  return {
    locked: !isStageUnlocked(progress, stageNo),
    cleared: isStageCleared(progress, stageNo),
    current: stageNo === progress.unlockedStage && !isStageCleared(progress, stageNo),
  };
}

export function createStageSelectModel(stageData, progress) {
  return stageData.map((stageInfo, index) => {
    const stageNo = index + 1;
    return {
      ...stageInfo,
      stageNo,
      ...getStageNodeState(progress, stageNo),
    };
  });
}
