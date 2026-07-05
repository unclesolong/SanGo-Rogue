import {
  TALENT_STORAGE_KEY,
  applyTalentTextOverrides,
  talentTestPointTotal,
  thunderSmallTalentText,
} from '../data/talentDefinitions.js?v=talent-judiang-no-regen-20260704a';

const talentNodes = [
  { id: 'core_fire_heart', name: '赤焰之心', color: 'red', size: 'special', x: 50, y: 52, level: 1, max: 1, effect: '主動技能產生的火珠數量 +3。', next: '核心天賦已啟動。' },

  { id: 'fire_small_1', name: '火攻', color: 'red', size: 'small', x: 39, y: 43, level: 1, max: 1, effect: '火珠傷害 +3%。', next: '已啟動。' },
  { id: 'fire_small_2', name: '火脈', color: 'red', size: 'small', x: 38, y: 28, level: 1, max: 1, effect: '火系節點連線。', next: '已啟動。' },
  { id: 'fire_small_3', name: '灼心', color: 'red', size: 'small', x: 50, y: 52, level: 1, max: 1, effect: '火系分歧銜接。', next: '已啟動。' },
  { id: 'fire_small_4', name: '焰魂', color: 'red', size: 'small', x: 50, y: 34, level: 0, max: 1, effect: '火系大珠前置。', next: '解鎖後可點大珠。' },
  { id: 'fire_small_5', name: '燎原', color: 'red', size: 'small', x: 50, y: 24, level: 0, max: 1, effect: '火系終極前置。', next: '解鎖後可點終極天賦。' },
  { id: 'fire_small_6', name: '焚天', color: 'red', size: 'small', x: 50, y: 16, level: 0, max: 1, effect: '火系終極連線。', next: '已啟動。' },
  { id: 'fire_small_7', name: '赤印', color: 'red', size: 'small', x: 50, y: 12, level: 0, max: 1, effect: '火系大珠銜接。', next: '已啟動。' },
  { id: 'burning_edge', name: '燃焰之力', color: 'red', size: 'medium', x: 23, y: 42, level: 1, max: 3, effect: '火珠傷害 +15%。', next: '火珠傷害提升至 +20%。' },
  { id: 'ember_extend', name: '火勢蔓延', color: 'red', size: 'medium', x: 24, y: 25, level: 0, max: 3, effect: '消除火珠後，20% 機率生成 1 顆火珠。', next: '生成機率提升至 25%。' },
  { id: 'fire_combo', name: '赤焰連段', color: 'red', size: 'medium', x: 35, y: 35, level: 0, max: 3, effect: '火珠消除後提升連擊傷害。', next: '連擊傷害提升。' },
  { id: 'fire_execute', name: '焚敵斬', color: 'red', size: 'medium', x: 65, y: 35, level: 0, max: 3, effect: '敵人低血量時火傷害提升。', next: '觸發門檻提高。' },
  { id: 'fire_rupture', name: '爆燃裂甲', color: 'red', size: 'medium', x: 35, y: 18, level: 0, max: 3, effect: '火傷害有機率造成破甲。', next: '破甲機率提升。' },
  { id: 'fire_rage', name: '怒焰蓄勢', color: 'red', size: 'medium', x: 65, y: 18, level: 0, max: 3, effect: '施放技能後提升火珠傷害。', next: '傷害提升。' },
  { id: 'flame_chain', name: '爆炎連鎖', color: 'red', size: 'large', x: 50, y: 18, level: 3, max: 3, effect: '引爆火珠時，30% 機率額外引爆 1 顆。', next: '機率提升至 40%。' },
  { id: 'flame_break', name: '烈焰破甲', color: 'red', size: 'large', x: 17, y: 22, level: 0, max: 3, effect: '火傷害有機率降低敵人防禦。', next: '破甲機率提升。' },
  { id: 'fire_ultimate', name: '赤龍焚世', color: 'red', size: 'special', x: 50, y: 5, level: 0, max: 1, effect: '終極天賦：火珠引爆後追加赤龍斬擊。', next: '解鎖終極天賦。' },

  { id: 'wood_small_1', name: '木攻', color: 'green', size: 'small', x: 40, y: 61, level: 1, max: 1, effect: '木珠傷害 +3%。', next: '已啟動。' },
  { id: 'wood_small_2', name: '木脈', color: 'green', size: 'small', x: 28, y: 72, level: 1, max: 1, effect: '木系節點連線。', next: '已啟動。' },
  { id: 'wood_small_3', name: '生息', color: 'green', size: 'small', x: 50, y: 52, level: 1, max: 1, effect: '木系分歧銜接。', next: '已啟動。' },
  { id: 'wood_small_4', name: '堅根', color: 'green', size: 'small', x: 50, y: 34, level: 0, max: 1, effect: '木系大珠前置。', next: '解鎖後可點大珠。' },
  { id: 'wood_small_5', name: '靈根', color: 'green', size: 'small', x: 50, y: 24, level: 0, max: 1, effect: '木系終極前置。', next: '解鎖後可點終極天賦。' },
  { id: 'wood_small_6', name: '青魂', color: 'green', size: 'small', x: 50, y: 16, level: 0, max: 1, effect: '木系終極連線。', next: '已啟動。' },
  { id: 'wood_small_7', name: '青印', color: 'green', size: 'small', x: 50, y: 12, level: 0, max: 1, effect: '木系大珠銜接。', next: '已啟動。' },
  { id: 'wood_recover', name: '戰意昂揚', color: 'green', size: 'medium', x: 16, y: 62, level: 1, max: 3, effect: '生命低於 50% 時，攻擊力 +15%。', next: '攻擊力提升至 +20%。' },
  { id: 'wood_guard', name: '護體真氣', color: 'green', size: 'medium', x: 22, y: 86, level: 0, max: 3, effect: '每回合開始，獲得少量護盾。', next: '護盾量提升。' },
  { id: 'wood_restore', name: '回春戰意', color: 'green', size: 'medium', x: 35, y: 35, level: 0, max: 3, effect: '受擊後有機率回復生命。', next: '回復量提升。' },
  { id: 'wood_thorns', name: '荊棘護身', color: 'green', size: 'medium', x: 65, y: 35, level: 0, max: 3, effect: '護盾存在時反彈傷害。', next: '反彈傷害提升。' },
  { id: 'wood_renew', name: '再生戰陣', color: 'green', size: 'medium', x: 35, y: 18, level: 0, max: 3, effect: '回復時提升下一次攻擊。', next: '攻擊提升。' },
  { id: 'wood_wall', name: '青木壁壘', color: 'green', size: 'medium', x: 65, y: 18, level: 0, max: 3, effect: '護盾破裂時減少傷害。', next: '減傷提升。' },
  { id: 'wood_counter', name: '青木反擊', color: 'green', size: 'large', x: 10, y: 77, level: 0, max: 3, effect: '獲得護盾時，提升反擊傷害。', next: '反擊傷害提升。' },
  { id: 'wood_lifeline', name: '不屈生機', color: 'green', size: 'large', x: 34, y: 91, level: 0, max: 3, effect: '低血量時提高生存能力。', next: '觸發門檻降低。' },
  { id: 'wood_ultimate', name: '青龍不滅', color: 'green', size: 'special', x: 50, y: 5, level: 0, max: 1, effect: '終極天賦：瀕死時獲得大量護盾並回復生命。', next: '解鎖終極天賦。' },

  { id: 'thunder_small_1', color: 'yellow', size: 'small', x: 49, y: 64, level: 1, max: 1 },
  { id: 'thunder_small_2', color: 'yellow', size: 'small', x: 51, y: 75, level: 1, max: 1 },
  { id: 'thunder_small_3', color: 'yellow', size: 'small', x: 50, y: 52, level: 1, max: 1 },
  { id: 'thunder_small_4', color: 'yellow', size: 'small', x: 50, y: 34, level: 0, max: 1 },
  { id: 'thunder_small_5', color: 'yellow', size: 'small', x: 50, y: 24, level: 0, max: 1 },
  { id: 'thunder_small_6', color: 'yellow', size: 'small', x: 50, y: 16, level: 0, max: 1 },
  { id: 'thunder_small_7', color: 'yellow', size: 'small', x: 50, y: 12, level: 0, max: 1 },
  { id: 'thunder_charge', name: '戰意沸騰', color: 'yellow', size: 'medium', x: 42, y: 84, level: 1, max: 3, effect: '消雷珠時，本回合攻擊力 +10%。', next: '最多可疊 2 層。' },
  { id: 'thunder_focus', name: '疾雷聚勢', color: 'yellow', size: 'medium', x: 58, y: 84, level: 0, max: 3, effect: '高 Combo 時增加軍令能量。', next: '能量提升。' },
  { id: 'thunder_chain', name: '連鎖電光', color: 'yellow', size: 'medium', x: 35, y: 35, level: 0, max: 3, effect: '高 Combo 時追加雷傷。', next: '追加傷害提升。' },
  { id: 'thunder_order', name: '軍令疾行', color: 'yellow', size: 'medium', x: 65, y: 35, level: 0, max: 3, effect: '軍令蓄能速度提升。', next: '蓄能提升。' },
  { id: 'thunder_flash', name: '瞬雷突襲', color: 'yellow', size: 'medium', x: 35, y: 18, level: 0, max: 3, effect: '連擊時有機率追加一次突襲。', next: '觸發率提升。' },
  { id: 'thunder_overload', name: '雷鳴過載', color: 'yellow', size: 'medium', x: 65, y: 18, level: 0, max: 3, effect: '能量滿時提高雷珠傷害。', next: '傷害提升。' },
  { id: 'thunder_combo', name: '連擊強化', color: 'yellow', size: 'large', x: 49, y: 93, level: 2, max: 3, effect: 'Combo 傷害 +10%。', next: 'Combo 傷害提升至 +15%。' },
  { id: 'thunder_burst', name: '雷霆突擊', color: 'yellow', size: 'large', x: 67, y: 91, level: 0, max: 3, effect: '連擊後追加一次小額傷害。', next: '追加傷害提升。' },
  { id: 'thunder_ultimate', name: '蒼雷破軍', color: 'yellow', size: 'special', x: 50, y: 5, level: 0, max: 1, effect: '終極天賦：高 Combo 時召喚雷槍追擊。', next: '解鎖終極天賦。' },

  { id: 'light_small_1', name: '光攻', color: 'light', size: 'small', x: 60, y: 61, level: 1, max: 1, effect: '光珠傷害 +3%。', next: '已啟動。' },
  { id: 'light_small_2', name: '光脈', color: 'light', size: 'small', x: 72, y: 72, level: 1, max: 1, effect: '光系節點連線。', next: '已啟動。' },
  { id: 'light_small_3', name: '神息', color: 'light', size: 'small', x: 50, y: 52, level: 1, max: 1, effect: '光系分歧銜接。', next: '已啟動。' },
  { id: 'light_small_4', name: '聖印', color: 'light', size: 'small', x: 50, y: 34, level: 0, max: 1, effect: '光系大珠前置。', next: '解鎖後可點大珠。' },
  { id: 'light_small_5', name: '御光', color: 'light', size: 'small', x: 50, y: 24, level: 0, max: 1, effect: '光系終極前置。', next: '解鎖後可點終極天賦。' },
  { id: 'light_small_6', name: '天祐', color: 'light', size: 'small', x: 50, y: 16, level: 0, max: 1, effect: '光系終極連線。', next: '已啟動。' },
  { id: 'light_small_7', name: '光印', color: 'light', size: 'small', x: 50, y: 12, level: 0, max: 1, effect: '光系大珠銜接。', next: '已啟動。' },
  { id: 'light_order', name: '神令精通', color: 'light', size: 'medium', x: 84, y: 62, level: 2, max: 3, effect: '神令技能冷卻需求 -1。', next: '神令效果 +10%。' },
  { id: 'light_heal', name: '神氣回復', color: 'light', size: 'medium', x: 78, y: 86, level: 0, max: 3, effect: '每消除 20 顆珠子，獲得 1 點神令能量。', next: '需求降低為 18 顆。' },
  { id: 'light_purify', name: '破邪淨化', color: 'light', size: 'medium', x: 35, y: 35, level: 0, max: 3, effect: '神令施放時清除一個負面效果。', next: '淨化機率提升。' },
  { id: 'light_barrier', name: '神光屏障', color: 'light', size: 'medium', x: 65, y: 35, level: 0, max: 3, effect: '光珠消除後獲得護盾。', next: '護盾量提升。' },
  { id: 'light_sanctuary', name: '聖域守護', color: 'light', size: 'medium', x: 35, y: 18, level: 0, max: 3, effect: '神令施放後減少下回合傷害。', next: '減傷提升。' },
  { id: 'light_verdict', name: '天光裁決', color: 'light', size: 'medium', x: 65, y: 18, level: 0, max: 3, effect: '光珠傷害可追加裁決傷害。', next: '裁決傷害提升。' },
  { id: 'light_bless', name: '天光庇佑', color: 'light', size: 'large', x: 90, y: 77, level: 0, max: 3, effect: '神令施放後獲得護盾。', next: '護盾量提升。' },
  { id: 'light_judgement', name: '神威斬', color: 'light', size: 'large', x: 66, y: 76, level: 0, max: 3, effect: '光珠消除後有機率追加斬擊。', next: '觸發率提升。' },
  { id: 'light_ultimate', name: '天命神威', color: 'light', size: 'special', x: 50, y: 5, level: 0, max: 1, effect: '終極天賦：神令施放後追加全屏神威斬。', next: '解鎖終極天賦。' },

  { id: 'dark_small_1', name: '暗攻', color: 'dark', size: 'small', x: 61, y: 43, level: 1, max: 1, effect: '暗珠傷害 +3%。', next: '已啟動。' },
  { id: 'dark_small_2', name: '暗脈', color: 'dark', size: 'small', x: 62, y: 28, level: 1, max: 1, effect: '暗系節點連線。', next: '已啟動。' },
  { id: 'dark_small_3', name: '妖火', color: 'dark', size: 'small', x: 50, y: 52, level: 1, max: 1, effect: '暗系分歧銜接。', next: '已啟動。' },
  { id: 'dark_small_4', name: '魔契', color: 'dark', size: 'small', x: 50, y: 34, level: 0, max: 1, effect: '暗系大珠前置。', next: '解鎖後可點大珠。' },
  { id: 'dark_small_5', name: '噬魂', color: 'dark', size: 'small', x: 50, y: 24, level: 0, max: 1, effect: '暗系終極前置。', next: '解鎖後可點終極天賦。' },
  { id: 'dark_small_6', name: '魔印', color: 'dark', size: 'small', x: 50, y: 16, level: 0, max: 1, effect: '暗系終極連線。', next: '已啟動。' },
  { id: 'dark_small_7', name: '妖印', color: 'dark', size: 'small', x: 50, y: 12, level: 0, max: 1, effect: '暗系大珠銜接。', next: '已啟動。' },
  { id: 'dark_burn', name: '餘燼灼燒', color: 'dark', size: 'medium', x: 77, y: 42, level: 0, max: 3, effect: '引爆傷害的 15% 轉為持續灼燒。', next: '灼燒持續 2 回合。' },
  { id: 'dark_echo', name: '妖魂回響', color: 'dark', size: 'medium', x: 76, y: 25, level: 0, max: 3, effect: '引爆後有機率補充暗珠。', next: '補充機率提升。' },
  { id: 'dark_drain', name: '魂火吸取', color: 'dark', size: 'medium', x: 35, y: 35, level: 0, max: 3, effect: '引爆後回復少量生命。', next: '回復量提升。' },
  { id: 'dark_curse', name: '妖咒擴散', color: 'dark', size: 'medium', x: 65, y: 35, level: 0, max: 3, effect: '灼燒效果可擴散到下一名敵人。', next: '擴散傷害提升。' },
  { id: 'dark_shadow', name: '影焰潛襲', color: 'dark', size: 'medium', x: 35, y: 18, level: 0, max: 3, effect: '暗珠消除後降低敵人攻擊。', next: '降低幅度提升。' },
  { id: 'dark_abyss', name: '深淵回饋', color: 'dark', size: 'medium', x: 65, y: 18, level: 0, max: 3, effect: '敵人有灼燒時提升引爆傷害。', next: '引爆傷害提升。' },
  { id: 'dark_bomb', name: '引爆共鳴', color: 'dark', size: 'large', x: 50, y: 10, level: 3, max: 3, effect: '引爆傷害 +30%。', next: '共鳴已滿級。' },
  { id: 'dark_devour', name: '魔焰吞噬', color: 'dark', size: 'large', x: 83, y: 22, level: 0, max: 3, effect: '擊破敵人時延長增益效果。', next: '延長回合提升。' },
  { id: 'dark_ultimate', name: '妖界終焉', color: 'dark', size: 'special', x: 50, y: 5, level: 0, max: 1, effect: '終極天賦：引爆後召喚妖火連鎖爆裂。', next: '解鎖終極天賦。' },
];

const talentLinks = [
  ['core_fire_heart', 'fire_small_1'], ['fire_small_1', 'fire_small_2'], ['fire_small_1', 'burning_edge'], ['fire_small_2', 'ember_extend'], ['fire_small_2', 'flame_chain'], ['ember_extend', 'flame_break'],
  ['core_fire_heart', 'wood_small_1'], ['wood_small_1', 'wood_small_2'], ['wood_small_2', 'wood_recover'], ['wood_small_2', 'wood_guard'], ['wood_guard', 'wood_lifeline'], ['wood_recover', 'wood_counter'],
  ['core_fire_heart', 'thunder_small_1'], ['thunder_small_1', 'thunder_small_2'], ['thunder_small_2', 'thunder_charge'], ['thunder_small_2', 'thunder_focus'], ['thunder_charge', 'thunder_combo'], ['thunder_focus', 'thunder_burst'],
  ['core_fire_heart', 'light_small_1'], ['light_small_1', 'light_small_2'], ['light_small_2', 'light_order'], ['light_small_2', 'light_heal'], ['light_order', 'light_bless'], ['light_heal', 'light_judgement'],
  ['core_fire_heart', 'dark_small_1'], ['dark_small_1', 'dark_small_2'], ['dark_small_2', 'dark_burn'], ['dark_small_2', 'dark_echo'], ['dark_small_2', 'dark_bomb'], ['dark_echo', 'dark_devour'],
];

const talentIconByColor = {
  red: 'assets/talents/talent-icon-fire.png',
  green: 'assets/talents/talent-icon-wood.png',
  yellow: 'assets/talents/talent-icon-lightning.png',
  light: 'assets/talents/talent-icon-light.png',
  dark: 'assets/talents/talent-icon-dark.png',
};

const talentElementTabs = [
  { color: 'red', label: '火', root: 'fire_small_1' },
  { color: 'green', label: '木', root: 'wood_small_1' },
  { color: 'yellow', label: '雷', root: 'thunder_small_1' },
  { color: 'light', label: '光', root: 'light_small_1' },
  { color: 'dark', label: '暗', root: 'dark_small_1' },
];

let talentPointState = Object.fromEntries(
  talentElementTabs.map((tab) => [tab.color, { owned: talentTestPointTotal, available: talentTestPointTotal }]),
);

applyTalentTextOverrides(talentNodes, thunderSmallTalentText);
talentNodes.forEach((node) => {
  node.level = 0;
  node.max = 1;
});

function loadTalentProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(TALENT_STORAGE_KEY) || 'null');
    if (!saved) return;
    if (saved.points) {
      talentPointState = {
        ...talentPointState,
        ...saved.points,
      };
    }
    if (saved.levels) {
      talentNodes.forEach((node) => {
        if (Number.isFinite(saved.levels[node.id])) node.level = saved.levels[node.id];
      });
    }
  } catch {
    // Ignore broken local talent data; the prototype can rebuild from defaults.
  }
}

function saveTalentProgress() {
  try {
    localStorage.setItem(TALENT_STORAGE_KEY, JSON.stringify({
      points: talentPointState,
      levels: Object.fromEntries(talentNodes.map((node) => [node.id, node.level])),
    }));
  } catch {
    // Local storage may be unavailable in some browser modes.
  }
}

loadTalentProgress();

function getHeroDisplayName(hero) {
  return hero.id === 'hero_zhao_yun' ? '趙雲' : hero.name;
}

function getTalentSizeLabel(size) {
  if (size === 'special') return '終極';
  if (size === 'large') return '大珠';
  if (size === 'medium') return '中珠';
  return '小珠';
}

function escapeTalentText(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createTalentScreenController({
  heroDatabase,
  activeHero,
  talentHeroListEl,
  talentHeroNameEl,
  talentBoardEl,
  talentDetailEl,
  talentResonanceEl,
  activeTalentListEl,
  showScreen,
}) {
  let selectedTalentId = 'fire_small_1';
  let activeTalentElement = 'red';

  function getTalentNode(id) {
    return talentNodes.find((node) => node.id === id) ?? talentNodes[0];
  }

  function getActiveElementTab() {
    return talentElementTabs.find((tab) => tab.color === activeTalentElement) ?? talentElementTabs[0];
  }

  function getActiveBranchNodes() {
    return talentNodes.filter((node) => node.color === activeTalentElement && node.id !== 'core_fire_heart');
  }

  function renderTalentPoints() {
    const pointEl = document.querySelector('#talentScreen .talent-point-box strong');
    const pointState = talentPointState[activeTalentElement] ?? talentPointState.red;
    if (pointEl) pointEl.textContent = `${pointState.available} / ${pointState.owned}`;
  }

  function showTalentHoverCard(node, x, y) {
    const card = talentBoardEl?.querySelector('[data-talent-hover-card]');
    if (!card || !node) return;
    card.innerHTML = `
      <b>${escapeTalentText(node.name)}</b>
      <small>${escapeTalentText(getTalentSizeLabel(node.size))}</small>
      <p>${escapeTalentText(node.effect ?? '尚未設定。')}</p>
    `;
    card.style.left = `${x}%`;
    card.style.top = `${y}%`;
    card.classList.toggle('below', y < 18);
    card.classList.add('show');
  }

  function hideTalentHoverCard() {
    talentBoardEl?.querySelector('[data-talent-hover-card]')?.classList.remove('show', 'below');
  }

  function showTalentHoverFromButton(button) {
    const node = getTalentNode(button?.dataset?.talentId);
    if (!node) return;
    const x = Number(button.dataset.talentX);
    const y = Number(button.dataset.talentY);
    showTalentHoverCard(node, Number.isFinite(x) ? x : 50, Number.isFinite(y) ? y : 50);
  }

  function getExclusiveSiblings(node) {
    if (!['medium', 'large'].includes(node.size)) return [];
    const sameSize = getActiveBranchNodes().filter((item) => item.size === node.size);
    const index = sameSize.findIndex((item) => item.id === node.id);
    if (index < 0) return [];
    const pairStart = index % 2 === 0 ? index : index - 1;
    return sameSize.slice(pairStart, pairStart + 2).filter((item) => item.id !== node.id);
  }

  function createBranchLinks(branchNodes) {
    const [smallA, smallB, smallC, smallD, smallE, smallF, smallG] = branchNodes.filter((node) => node.size === 'small');
    const mediumNodes = branchNodes.filter((node) => node.size === 'medium');
    const largeNodes = branchNodes.filter((node) => node.size === 'large');
    const specialNode = branchNodes.find((node) => node.size === 'special');
    return [
      [smallA?.id, smallB?.id],
      [smallB?.id, mediumNodes[0]?.id],
      [smallB?.id, mediumNodes[1]?.id],
      [mediumNodes[0]?.id, smallC?.id],
      [mediumNodes[1]?.id, smallC?.id],
      [smallC?.id, smallD?.id],
      [smallD?.id, mediumNodes[2]?.id],
      [smallD?.id, mediumNodes[3]?.id],
      [mediumNodes[2]?.id, smallE?.id],
      [mediumNodes[3]?.id, smallE?.id],
      [smallE?.id, smallF?.id],
      [smallF?.id, mediumNodes[4]?.id],
      [smallF?.id, mediumNodes[5]?.id],
      [mediumNodes[4]?.id, smallG?.id],
      [mediumNodes[5]?.id, smallG?.id],
      [smallG?.id, largeNodes[0]?.id],
      [smallG?.id, largeNodes[1]?.id],
      [largeNodes[0]?.id, specialNode?.id],
      [largeNodes[1]?.id, specialNode?.id],
    ].filter(([fromId, toId]) => fromId && toId);
  }

  function canLearnTalent(node) {
    if (!node || node.level > 0) return false;
    const branchNodes = getActiveBranchNodes();
    const firstNode = branchNodes.find((item) => item.size === 'small');
    if (node.id === firstNode?.id) return true;
    return createBranchLinks(branchNodes).some(([fromId, toId]) => (
      toId === node.id && getTalentNode(fromId).level > 0
    ));
  }

  function upgradeSelectedTalent() {
    const node = getTalentNode(selectedTalentId);
    if (!node || node.color !== activeTalentElement) return;
    if (!canLearnTalent(node)) return;
    const pointState = talentPointState[activeTalentElement] ?? talentPointState.red;
    if (pointState.available <= 0) return;
    getExclusiveSiblings(node).forEach((sibling) => {
      if (sibling.level <= 0) return;
      pointState.available = Math.min(pointState.owned, pointState.available + sibling.level);
      sibling.level = 0;
    });
    node.level = 1;
    pointState.available = Math.max(0, pointState.available - 1);
    saveTalentProgress();
    renderBoard();
    renderDetail();
  }

  function resetActiveElementTalents() {
    const tab = getActiveElementTab();
    const confirmed = window.confirm(`是否重置${tab.label}屬天賦？`);
    if (!confirmed) return;
    talentNodes.forEach((node) => {
      if (node.color === activeTalentElement) node.level = 0;
    });
    talentPointState[activeTalentElement].available = talentPointState[activeTalentElement].owned;
    saveTalentProgress();
    selectedTalentId = tab.root;
    renderBoard();
    renderDetail();
  }


  function getBranchPosition(node, indexBySize) {
    if (node.size === 'small') {
      const points = [[50, 86], [50, 79], [50, 65], [50, 58], [50, 44], [50, 37], [50, 23]];
      return points[indexBySize.small++] ?? [50, 64];
    }
    if (node.size === 'medium') {
      const points = [[32, 72], [68, 72], [32, 51], [68, 51], [32, 30], [68, 30]];
      return points[indexBySize.medium++] ?? [50, 45];
    }
    if (node.size === 'large') {
      const points = [[36, 16], [64, 16]];
      return points[indexBySize.large++] ?? [50, 14];
    }
    const points = [[50, 14]];
    return points[indexBySize.special++] ?? [50, 5];
  }

  function renderHeroList(heroId) {
    if (!talentHeroListEl) return;
    talentHeroListEl.innerHTML = heroDatabase.heroes.map((hero) => `
      <button class="${hero.id === heroId ? 'active' : ''}" data-talent-hero="${hero.id}" type="button">
        <img src="${hero.art.portrait || hero.art.card}" alt="${hero.name}">
        <span>${getHeroDisplayName(hero)}</span>
      </button>
    `).join('');
    talentHeroListEl.querySelectorAll('[data-talent-hero]').forEach((button) => {
      button.addEventListener('click', () => open(button.dataset.talentHero));
    });
  }

  function renderBoard() {
    if (!talentBoardEl) return;
    const branchNodes = getActiveBranchNodes();
    if (!branchNodes.some((node) => node.id === selectedTalentId)) {
      selectedTalentId = branchNodes.find((node) => node.level > 0)?.id ?? branchNodes[0]?.id ?? selectedTalentId;
    }
    const sizeIndex = { small: 0, medium: 0, large: 0, special: 0 };
    const positionedNodes = branchNodes.map((node) => {
      const [x, y] = getBranchPosition(node, sizeIndex);
      return { ...node, x, y };
    });
    const positionedById = Object.fromEntries(positionedNodes.map((node) => [node.id, node]));
    const branchLinks = createBranchLinks(positionedNodes);
    const lineSvg = branchLinks.map(([fromId, toId]) => {
      const from = positionedById[fromId];
      const to = positionedById[toId];
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
    }).join('');

    talentBoardEl.innerHTML = `
      <div class="talent-tree-title talent-${activeTalentElement}">${talentElementTabs.find((tab) => tab.color === activeTalentElement)?.label ?? ''}系流派</div>
      <button class="talent-reset-button" type="button" data-talent-reset>重置天賦</button>
      <svg class="talent-link-layer talent-tree-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lineSvg}</svg>
      ${positionedNodes.map((node) => `
        <button class="talent-node talent-${node.color} talent-${node.size} ${node.id === selectedTalentId ? 'selected' : ''} ${node.level > 0 ? 'active' : 'locked'} ${canLearnTalent(node) ? 'learnable' : ''}"
          style="left:${node.x}%; top:${node.y}%"
          data-talent-id="${node.id}"
          data-talent-x="${node.x}"
          data-talent-y="${node.y}"
          title="${escapeTalentText(`${node.name}：${node.effect ?? '尚未設定。'}`)}"
          aria-label="${escapeTalentText(`${node.name}，${getTalentSizeLabel(node.size)}，${node.effect ?? ''}`)}"
          type="button">
          <img src="${talentIconByColor[node.color]}" alt="" aria-hidden="true">
          <span>${node.name}</span>
        </button>
      `).join('')}
      <div class="talent-hover-card" data-talent-hover-card aria-hidden="true"></div>
      <div class="talent-element-tabs" role="tablist" aria-label="天賦屬性">
        ${talentElementTabs.map((tab) => `
          <button class="talent-element-tab talent-${tab.color} ${tab.color === activeTalentElement ? 'active' : ''}" data-talent-element="${tab.color}" type="button">${tab.label}</button>
        `).join('')}
      </div>
    `; 
    talentBoardEl.onmousemove = (event) => {
      const button = event.target.closest?.('[data-talent-id]');
      if (!button || !talentBoardEl.contains(button)) {
        hideTalentHoverCard();
        return;
      }
      showTalentHoverFromButton(button);
    };
    talentBoardEl.onpointerover = (event) => {
      const button = event.target.closest?.('[data-talent-id]');
      if (button && talentBoardEl.contains(button)) showTalentHoverFromButton(button);
    };
    talentBoardEl.onmouseleave = hideTalentHoverCard;
    talentBoardEl.querySelectorAll('[data-talent-id]').forEach((button) => {
      const node = getTalentNode(button.dataset.talentId);
      const positionedNode = positionedById[button.dataset.talentId] ?? node;
      button.addEventListener('mouseenter', () => showTalentHoverCard(node, positionedNode.x, positionedNode.y));
      button.addEventListener('mouseleave', hideTalentHoverCard);
      button.addEventListener('focus', () => showTalentHoverCard(node, positionedNode.x, positionedNode.y));
      button.addEventListener('blur', hideTalentHoverCard);
      button.addEventListener('click', () => {
        selectedTalentId = button.dataset.talentId;
        const clickedNode = getTalentNode(selectedTalentId);
        showTalentHoverCard(clickedNode, positionedNode.x, positionedNode.y);
        if (canLearnTalent(clickedNode)) {
          upgradeSelectedTalent();
        } else {
          renderBoard();
          renderDetail();
        }
      });
    });
    talentBoardEl.querySelectorAll('[data-talent-element]').forEach((button) => {
      button.addEventListener('click', () => {
        activeTalentElement = button.dataset.talentElement;
        selectedTalentId = talentElementTabs.find((tab) => tab.color === activeTalentElement)?.root ?? selectedTalentId;
        renderBoard();
        renderDetail();
      });
    });
    talentBoardEl.querySelector('[data-talent-reset]')?.addEventListener('click', resetActiveElementTalents);
    renderTalentPoints();
  }

  function renderDetail() {
    const node = getTalentNode(selectedTalentId);
    const canLearn = canLearnTalent(node);
    if (talentDetailEl) {
      talentDetailEl.innerHTML = `
        <div class="talent-detail-icon talent-${node.color}">
          <img src="${talentIconByColor[node.color]}" alt="" aria-hidden="true">
        </div>
        <strong>${node.name}</strong>
        <small>${getTalentSizeLabel(node.size)}</small>
        <p><b>效果</b>${node.effect}</p>
        <button type="button" data-talent-upgrade ${!canLearn ? 'disabled' : ''}>${node.level > 0 ? '已啟動' : '啟動天賦'}</button>
      `;
      talentDetailEl.querySelector('[data-talent-upgrade]')?.addEventListener('click', upgradeSelectedTalent);
    }
    if (talentResonanceEl) {
      const activeEffects = getActiveBranchNodes().filter((item) => item.level > 0);
      talentResonanceEl.innerHTML = activeEffects.length
        ? activeEffects.slice(0, 8).map((item) => `
          <article>
            <b>${escapeTalentText(item.name)}</b>
            <span>${escapeTalentText(item.effect ?? '尚未設定。')}</span>
          </article>
        `).join('')
        : '<article><b>尚未觸發天賦</b><span>點亮天賦後，效果會顯示在這裡。</span></article>';
    }
    if (activeTalentListEl) {
      activeTalentListEl.innerHTML = talentNodes
        .filter((item) => item.level > 0 && item.size !== 'small')
        .slice(0, 8)
        .map((item) => `
          <button class="talent-pill talent-${item.color}" data-talent-pill="${item.id}" type="button">
            <span>${item.name}</span>
          </button>
        `).join('');
      activeTalentListEl.querySelectorAll('[data-talent-pill]').forEach((button) => {
        button.addEventListener('click', () => {
          selectedTalentId = button.dataset.talentPill;
          renderBoard();
          renderDetail();
        });
      });
    }
  }

  function open(heroId = activeHero.id) {
    const hero = heroDatabase.heroes.find((item) => item.id === heroId) ?? activeHero;
    if (talentHeroNameEl) talentHeroNameEl.textContent = getHeroDisplayName(hero);
    renderHeroList(hero.id);
    renderBoard();
    renderDetail();
    renderTalentPoints();
    showScreen('talent');
  }

  return {
    open,
  };
}

