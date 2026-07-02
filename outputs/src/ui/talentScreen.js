const talentNodes = [
  { id: 'core_fire_heart', name: '赤焰之心', color: 'red', size: 'special', x: 50, y: 52, level: 1, max: 1, effect: '主動技能產生的火珠數量 +3。', next: '核心天賦已啟動。' },
  { id: 'flame_chain', name: '爆炎連鎖', color: 'red', size: 'large', x: 50, y: 18, level: 3, max: 3, effect: '引爆火珠時，30% 機率額外引爆 1 顆。', next: '機率提升至 40%。' },
  { id: 'burning_edge', name: '燃焰之力', color: 'red', size: 'medium', x: 22, y: 38, level: 1, max: 3, effect: '火珠傷害 +15%。', next: '火珠傷害提升至 +20%。' },
  { id: 'ember_extend', name: '火勢蔓延', color: 'red', size: 'medium', x: 30, y: 23, level: 2, max: 3, effect: '消除火珠後，20% 機率生成 1 顆火珠。', next: '生成機率提升至 25%。' },
  { id: 'wood_recover', name: '戰意昂揚', color: 'green', size: 'medium', x: 24, y: 68, level: 1, max: 3, effect: '生命低於 50% 時，攻擊力 +15%。', next: '攻擊力提升至 +20%。' },
  { id: 'wood_guard', name: '護體真氣', color: 'green', size: 'medium', x: 28, y: 83, level: 2, max: 3, effect: '每回合開始，獲得少量護盾。', next: '護盾量提升。' },
  { id: 'thunder_combo', name: '連擊強化', color: 'yellow', size: 'large', x: 50, y: 84, level: 2, max: 3, effect: 'Combo 傷害 +10%。', next: 'Combo 傷害提升至 +15%。' },
  { id: 'thunder_charge', name: '戰意沸騰', color: 'yellow', size: 'medium', x: 63, y: 80, level: 1, max: 3, effect: '4 消雷珠時，本回合攻擊力 +10%。', next: '最多可疊 2 層。' },
  { id: 'light_order', name: '神令精通', color: 'light', size: 'large', x: 72, y: 66, level: 2, max: 3, effect: '神令技能冷卻需求 -1。', next: '神令效果 +10%。' },
  { id: 'light_heal', name: '神氣回復', color: 'light', size: 'medium', x: 78, y: 82, level: 1, max: 3, effect: '每消除 20 顆珠子，獲得 1 點神令能量。', next: '需求降低為 18 顆。' },
  { id: 'dark_bomb', name: '引爆共鳴', color: 'dark', size: 'large', x: 72, y: 25, level: 3, max: 3, effect: '引爆傷害 +30%。', next: '共鳴已滿級。' },
  { id: 'dark_burn', name: '餘燼灼燒', color: 'dark', size: 'medium', x: 82, y: 42, level: 0, max: 3, effect: '引爆傷害的 15% 轉為持續灼燒。', next: '灼燒持續 2 回合。' },
  { id: 'small_fire_a', name: '火脈', color: 'red', size: 'small', x: 39, y: 39, level: 1, max: 1, effect: '火系節點連線。', next: '已啟動。' },
  { id: 'small_green_a', name: '木脈', color: 'green', size: 'small', x: 36, y: 67, level: 1, max: 1, effect: '木系節點連線。', next: '已啟動。' },
  { id: 'small_yellow_a', name: '雷脈', color: 'yellow', size: 'small', x: 50, y: 67, level: 1, max: 1, effect: '雷系節點連線。', next: '已啟動。' },
  { id: 'small_light_a', name: '光脈', color: 'light', size: 'small', x: 64, y: 60, level: 1, max: 1, effect: '光系節點連線。', next: '已啟動。' },
  { id: 'small_dark_a', name: '暗脈', color: 'dark', size: 'small', x: 61, y: 39, level: 1, max: 1, effect: '暗系節點連線。', next: '已啟動。' },
];

const talentLinks = [
  ['core_fire_heart', 'small_fire_a'], ['small_fire_a', 'burning_edge'], ['burning_edge', 'ember_extend'], ['ember_extend', 'flame_chain'], ['flame_chain', 'dark_bomb'],
  ['core_fire_heart', 'small_green_a'], ['small_green_a', 'wood_recover'], ['wood_recover', 'wood_guard'],
  ['core_fire_heart', 'small_yellow_a'], ['small_yellow_a', 'thunder_combo'], ['thunder_combo', 'thunder_charge'],
  ['core_fire_heart', 'small_light_a'], ['small_light_a', 'light_order'], ['light_order', 'light_heal'],
  ['core_fire_heart', 'small_dark_a'], ['small_dark_a', 'dark_bomb'], ['dark_bomb', 'dark_burn'],
];

function getHeroDisplayName(hero) {
  return hero.id === 'hero_zhao_yun' ? '趙雲' : hero.name;
}

function getTalentSizeLabel(size) {
  if (size === 'special') return '特殊格';
  if (size === 'large') return '大格';
  if (size === 'medium') return '中格';
  return '小格';
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
  let selectedTalentId = 'core_fire_heart';

  function getTalentNode(id) {
    return talentNodes.find((node) => node.id === id) ?? talentNodes[0];
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
    const lineSvg = talentLinks.map(([fromId, toId]) => {
      const from = getTalentNode(fromId);
      const to = getTalentNode(toId);
      return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" />`;
    }).join('');

    talentBoardEl.innerHTML = `
      <svg class="talent-link-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lineSvg}</svg>
      <div class="talent-core-ring" aria-hidden="true"></div>
      ${talentNodes.map((node) => `
        <button class="talent-node talent-${node.color} talent-${node.size} ${node.id === selectedTalentId ? 'selected' : ''} ${node.level > 0 ? 'active' : 'locked'}"
          style="left:${node.x}%; top:${node.y}%"
          data-talent-id="${node.id}"
          type="button">
          <i>${node.level}/${node.max}</i>
          <span>${node.name}</span>
        </button>
      `).join('')}
    `;
    talentBoardEl.querySelectorAll('[data-talent-id]').forEach((button) => {
      button.addEventListener('click', () => {
        selectedTalentId = button.dataset.talentId;
        renderBoard();
        renderDetail();
      });
    });
  }

  function renderDetail() {
    const node = getTalentNode(selectedTalentId);
    if (talentDetailEl) {
      talentDetailEl.innerHTML = `
        <div class="talent-detail-icon talent-${node.color}">
          <span>${node.level}/${node.max}</span>
        </div>
        <strong>${node.name}</strong>
        <small>${getTalentSizeLabel(node.size)}</small>
        <p><b>目前效果</b>${node.effect}</p>
        <p><b>下一級效果</b>${node.next}</p>
        <button type="button">升級</button>
      `;
    }
    if (talentResonanceEl) {
      talentResonanceEl.innerHTML = `
        <article><b>烈焰共鳴</b><span>火珠傷害 +25%</span></article>
        <article><b>引爆共鳴</b><span>引爆傷害 +30%</span></article>
        <article><b>戰意共鳴</b><span>攻擊力 +15% / 神令冷卻 -1</span></article>
      `;
    }
    if (activeTalentListEl) {
      activeTalentListEl.innerHTML = talentNodes
        .filter((item) => item.level > 0 && item.size !== 'small')
        .slice(0, 8)
        .map((item) => `
          <button class="talent-pill talent-${item.color}" data-talent-pill="${item.id}" type="button">
            <span>${item.name}</span>
            <small>Lv.${item.level}</small>
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
    showScreen('talent');
  }

  return {
    open,
  };
}
