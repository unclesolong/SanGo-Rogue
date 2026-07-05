function getBattleSpeedMultiplier() {
  const speed = Number(window.__battleSpeedMultiplier || 1);
  return Number.isFinite(speed) && speed > 0 ? speed : 1;
}

function scaleBattleMs(ms) {
  return Math.max(16, Math.round(ms / getBattleSpeedMultiplier()));
}

function battleTimeout(callback, ms, ...args) {
  return globalThis.setTimeout(callback, scaleBattleMs(ms), ...args);
}

function wait(ms) {
  return new Promise((resolve) => battleTimeout(resolve, ms));
}

function waitForImage(src, timeout = 900) {
  return new Promise((resolve) => {
    if (!src) {
      resolve();
      return;
    }
    const img = new Image();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    const timer = battleTimeout(finish, timeout);
    img.onload = async () => {
      window.clearTimeout(timer);
      try {
        if (img.decode) await img.decode();
      } catch {
        // Decoding can fail on cached images; the loaded image is still usable.
      }
      finish();
    };
    img.onerror = finish;
    img.src = src;
  });
}

function fallbackColorValue(color) {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${color}`).trim() || '#ffe2a3';
}

export function createUiEffects({
  boardEl,
  battleEl,
  enemyArtEl,
  enemyImageEl,
  teamEl,
  resultEl,
  getColorValue = fallbackColorValue,
  getComboBaseMultiplier = (combo) => 1 + Math.max(0, combo - 1) * 0.15,
} = {}) {
  const activeBoardCallouts = [];
  const activeEnemyDamageFloats = [];
  const activeOverflowCallouts = [];
  const activeEnemyStatusCallouts = [];

  function clamp(value, min, max) {
    if (max < min) return min;
    return Math.min(max, Math.max(min, value));
  }

  function getBattleBounds() {
    return battleEl?.getBoundingClientRect?.() || {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  function getBoardEffectRect() {
    const cells = Array.from(boardEl?.querySelectorAll?.('.gem-cell') || []);
    if (!cells.length) return boardEl?.getBoundingClientRect?.();

    const rects = cells.map((cell) => cell.getBoundingClientRect());
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
    };
  }

  function showBuffFlash(text) {
    const el = document.createElement('div');
    el.className = 'board-callout';
    el.textContent = text;
    const slot = activeBoardCallouts.length;
    activeBoardCallouts.push(el);
    const rect = boardEl.getBoundingClientRect();
    const bounds = getBattleBounds();
    const spacing = Math.max(36, Math.min(54, rect.height * 0.11));
    const offset = slot * spacing;
    const x = clamp(rect.left + rect.width / 2, bounds.left + 42, bounds.right - 42);
    const y = clamp(rect.top + rect.height * 0.58 - offset, bounds.top + 42, bounds.bottom - 72);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    const drift = -52;
    el.style.setProperty('--callout-mid-drift', `${drift * 0.36}px`);
    el.style.setProperty('--callout-drift', `${drift}px`);
    document.body.appendChild(el);
    battleTimeout(() => {
      const index = activeBoardCallouts.indexOf(el);
      if (index >= 0) activeBoardCallouts.splice(index, 1);
      el.remove();
    }, 1900);
  }

  function showEnemyStatusCallout(text) {
    const el = document.createElement('div');
    el.className = 'enemy-status-callout';
    el.textContent = text;
    const slot = activeEnemyStatusCallouts.length;
    activeEnemyStatusCallouts.push(el);
    const rect = enemyArtEl.getBoundingClientRect();
    const bounds = getBattleBounds();
    const xOffset = (slot % 2 === 0 ? -1 : 1) * Math.min(42, rect.width * 0.1) * Math.ceil(slot / 2);
    const yOffset = Math.floor(slot / 2) * 34;
    const x = clamp(rect.left + rect.width / 2 + xOffset, bounds.left + 48, bounds.right - 48);
    const y = clamp(rect.top + rect.height * 0.38 + yOffset, bounds.top + 34, rect.bottom - 52);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    battleTimeout(() => {
      const index = activeEnemyStatusCallouts.indexOf(el);
      if (index >= 0) activeEnemyStatusCallouts.splice(index, 1);
      el.remove();
    }, 1700);
  }

  function showEnemyBurnEffect() {
    if (!enemyArtEl) return;
    enemyArtEl.classList.remove('burn-hit');
    void enemyArtEl.offsetWidth;
    enemyArtEl.classList.add('burn-hit');

    const flame = document.createElement('div');
    flame.className = 'enemy-burn-effect';
    enemyArtEl.appendChild(flame);
    battleTimeout(() => {
      enemyArtEl.classList.remove('burn-hit');
      flame.remove();
    }, 1200);
  }

  function showOverflowCallout(title, detail = '', type = 'chain') {
    const el = document.createElement('div');
    el.className = `overflow-callout ${type}`;
    el.innerHTML = `<strong>${title}</strong>${detail ? `<span>${detail}</span>` : ''}`;
    const slot = activeOverflowCallouts.length;
    activeOverflowCallouts.push(el);
    const rect = enemyArtEl.getBoundingClientRect();
    const bounds = getBattleBounds();
    const x = clamp(rect.left + rect.width * 0.08, bounds.left + 10, bounds.right - 250);
    const y = clamp(rect.top + rect.height * 0.22 + slot * 50, bounds.top + 12, rect.bottom - 86);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    battleTimeout(() => {
      const index = activeOverflowCallouts.indexOf(el);
      if (index >= 0) activeOverflowCallouts.splice(index, 1);
      el.remove();
    }, 2200);
  }

  async function showSkillCastIntro(skill = {}) {
    const dragonSrc = skill.dragonArt || 'assets/vfx/hero-dragon-soul-ai.png';
    await waitForImage(dragonSrc);

    const el = document.createElement('div');
    el.className = 'skill-cast-pop skill-cast-pop--dragon-board';

    const boardRect = getBoardEffectRect();
    const centerX = boardRect ? boardRect.left + boardRect.width / 2 : window.innerWidth / 2;
    const centerY = boardRect ? boardRect.top + boardRect.height / 2 : window.innerHeight * 0.58;
    const boardWidth = boardRect ? Math.min(boardRect.width, window.innerWidth - 24) : window.innerWidth * 0.86;
    const boardHeight = boardRect ? Math.min(boardRect.height, window.innerHeight - 24) : window.innerHeight * 0.58;
    const dragonSize = boardRect
      ? Math.min(Math.max(Math.min(boardWidth, boardHeight) * 0.78, 220), 620)
      : Math.min(window.innerWidth * 0.72, window.innerHeight * 0.5, 620);
    el.style.left = `${centerX}px`;
    el.style.top = `${centerY}px`;
    el.style.setProperty('--skill-cast-x', `${centerX}px`);
    el.style.setProperty('--skill-cast-y', `${centerY}px`);
    el.style.setProperty('--skill-cast-width', `${Math.max(220, boardWidth)}px`);
    el.style.setProperty('--skill-cast-height', `${Math.max(220, boardHeight)}px`);
    el.style.setProperty('--skill-board-size', `${dragonSize}px`);

    const dragonTrail = document.createElement('div');
    dragonTrail.className = 'skill-dragon-trail';
    dragonTrail.style.setProperty('--skill-board-size', `${dragonSize}px`);
    el.appendChild(dragonTrail);

    const dragon = document.createElement('img');
    dragon.className = 'skill-dragon-img';
    dragon.src = dragonSrc;
    dragon.alt = '';
    dragon.style.setProperty('--skill-board-size', `${dragonSize}px`);
    el.appendChild(dragon);

    const name = document.createElement('strong');
    name.textContent = skill.name || '武將技能';
    el.appendChild(name);

    document.body.appendChild(el);
    await wait(1560);
    el.remove();
  }

  async function showEnemySkillCastIntro(skill = {}) {
    const el = document.createElement('div');
    el.className = 'enemy-skill-cast-pop';
    if (skill.variant) el.classList.add(`enemy-skill-cast-pop--${skill.variant}`);

    const name = document.createElement('strong');
    name.textContent = skill.name || '憒??澆?';
    el.appendChild(name);

    const rect = enemyArtEl?.getBoundingClientRect();
    if (rect) {
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.top + rect.height * 0.44}px`;
    }

    document.body.appendChild(el);
    await wait(880);
    el.remove();
  }

  function showChaosStormEffect() {
    if (!enemyArtEl) return;
    const storm = document.createElement('div');
    storm.className = 'chaos-storm-effect';
    storm.innerHTML = `
      <div class="chaos-cloud-ring ring-a"></div>
      <div class="chaos-cloud-ring ring-b"></div>
      <div class="chaos-cloud-core"></div>
      <div class="chaos-lightning bolt-a"></div>
      <div class="chaos-lightning bolt-b"></div>
      <div class="chaos-lightning bolt-c"></div>
    `;
    enemyArtEl.appendChild(storm);
    shakeBattleStage();
    battleTimeout(() => storm.remove(), 1700);
  }

  async function showIceTalismanCastEffect() {
    const seal = document.createElement('div');
    seal.className = 'ice-talisman-cast';
    document.body.appendChild(seal);
    await wait(980);
    seal.remove();
  }

  async function showBleedTalismanCastEffect() {
    const seal = document.createElement('div');
    seal.className = 'bleed-talisman-cast';
    const slash = document.createElement('div');
    slash.className = 'bleed-slash-trail';
    document.body.appendChild(seal);
    document.body.appendChild(slash);
    await wait(320);
    shakeBoard();
    await wait(240);
    seal.remove();
    slash.remove();
  }

  function showChaosDoomApplyEffect() {
    const targetEl = teamEl?.querySelector('.hero-card') || document.querySelector('.battle-party');
    if (!enemyImageEl || !targetEl) return;
    const sourceRect = enemyImageEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width * 0.52;
    const startY = sourceRect.top + sourceRect.height * 0.36;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height * 0.48;

    const curse = document.createElement('div');
    curse.className = 'chaos-doom-projectile';
    curse.style.left = `${startX}px`;
    curse.style.top = `${startY}px`;
    curse.style.setProperty('--tx', `${endX - startX}px`);
    curse.style.setProperty('--ty', `${endY - startY}px`);
    document.body.appendChild(curse);

    battleTimeout(() => {
      targetEl.classList.remove('chaos-doom-marked');
      void targetEl.offsetWidth;
      targetEl.classList.add('chaos-doom-marked');
      const seal = document.createElement('div');
      seal.className = 'chaos-doom-seal';
      targetEl.appendChild(seal);
      const label = document.createElement('div');
      label.className = 'chaos-doom-label';
      const labelIcon = document.createElement('img');
      labelIcon.src = 'assets/effects/debuff_doom_skull_icon_256.png';
      labelIcon.alt = '即死';
      label.appendChild(labelIcon);
      targetEl.appendChild(label);
      battleTimeout(() => seal.remove(), 1180);
      battleTimeout(() => label.remove(), 1180);
      battleTimeout(() => targetEl.classList.remove('chaos-doom-marked'), 1180);
    }, 720);

    battleTimeout(() => curse.remove(), 980);
  }

  function showAttackEffect(type = 'slash') {
    const layer = document.getElementById('attackEffectLayer');
    if (!layer) return;
    const effect = document.createElement('div');
    effect.className = `attack-effect ${type}`;
    layer.appendChild(effect);
    battleTimeout(() => effect.remove(), 1120);
  }

  function showBoardBombs(cells = []) {
    if (!boardEl || !cells.length) return;
    const children = [...boardEl.querySelectorAll('.orb')];
    const columns = Math.max(1, Math.round(Math.sqrt(children.length)));
    cells.forEach(({ x, y }, index) => {
      const cellEl = children[y * columns + x];
      if (!cellEl) return;
      const rect = cellEl.getBoundingClientRect();
      const bomb = document.createElement('div');
      bomb.className = 'board-bomb-pop';
      bomb.style.left = `${rect.left + rect.width / 2}px`;
      bomb.style.top = `${rect.top + rect.height / 2}px`;
      bomb.style.width = `${Math.max(34, rect.width * 1.16)}px`;
      bomb.style.height = `${Math.max(34, rect.height * 1.16)}px`;
      bomb.style.setProperty('--bomb-delay', `${Math.min(index * 24, 180)}ms`);
      document.body.appendChild(bomb);

      const marker = document.createElement('div');
      marker.className = 'board-bomb-marker';
      marker.style.left = `${rect.left}px`;
      marker.style.top = `${rect.top}px`;
      marker.style.width = `${rect.width}px`;
      marker.style.height = `${rect.height}px`;
      document.body.appendChild(marker);
      battleTimeout(() => marker.remove(), 1120);
      battleTimeout(() => bomb.remove(), 1360);
    });
  }

  function showBoardPoisonBursts(cells = []) {
    if (!boardEl || !cells.length) return;
    const children = [...boardEl.querySelectorAll('.orb')];
    const columns = Math.max(1, Math.round(Math.sqrt(children.length)));
    cells.forEach(({ x, y }, index) => {
      const cellEl = children[y * columns + x];
      if (!cellEl) return;
      const rect = cellEl.getBoundingClientRect();
      const burst = document.createElement('div');
      burst.className = 'board-poison-pop';
      burst.style.left = `${rect.left + rect.width / 2}px`;
      burst.style.top = `${rect.top + rect.height / 2}px`;
      burst.style.width = `${Math.max(96, rect.width * 2.55)}px`;
      burst.style.height = `${Math.max(96, rect.height * 2.55)}px`;
      burst.style.setProperty('--poison-delay', `${Math.min(index * 32, 220)}ms`);
      document.body.appendChild(burst);

      const marker = document.createElement('div');
      marker.className = 'board-poison-marker';
      marker.style.left = `${rect.left}px`;
      marker.style.top = `${rect.top}px`;
      marker.style.width = `${rect.width}px`;
      marker.style.height = `${rect.height}px`;
      document.body.appendChild(marker);
      battleTimeout(() => marker.remove(), 1180);
      battleTimeout(() => burst.remove(), 1380);
    });
  }

  function showBoardShatters(cells = []) {
    if (!boardEl || !cells.length) return;
    const children = [...boardEl.querySelectorAll('.orb')];
    const columns = Math.max(1, Math.round(Math.sqrt(children.length)));
    cells.forEach(({ x, y }, index) => {
      const cellEl = children[y * columns + x];
      if (!cellEl) return;
      const rect = cellEl.getBoundingClientRect();
      const crack = document.createElement('div');
      crack.className = 'board-shatter-crack';
      crack.style.left = `${rect.left}px`;
      crack.style.top = `${rect.top}px`;
      crack.style.width = `${rect.width}px`;
      crack.style.height = `${rect.height}px`;
      crack.style.setProperty('--shatter-delay', `${Math.min(index * 28, 220)}ms`);
      document.body.appendChild(crack);

      const debris = document.createElement('div');
      debris.className = 'board-shatter-debris';
      debris.style.left = `${rect.left + rect.width / 2}px`;
      debris.style.top = `${rect.top + rect.height / 2}px`;
      debris.style.width = `${Math.max(36, rect.width * 1.18)}px`;
      debris.style.height = `${Math.max(36, rect.height * 1.18)}px`;
      debris.style.setProperty('--shatter-delay', `${Math.min(index * 28, 220)}ms`);
      document.body.appendChild(debris);

      battleTimeout(() => crack.remove(), 1220);
      battleTimeout(() => debris.remove(), 1320);
    });
  }

  function showBoardConversions(cells = []) {
    if (!boardEl || !cells.length) return;
    const children = [...boardEl.querySelectorAll('.orb')];
    const columns = Math.max(1, Math.round(Math.sqrt(children.length)));
    cells.forEach(({ x, y }, index) => {
      const cellEl = children[y * columns + x];
      if (!cellEl) return;
      const rect = cellEl.getBoundingClientRect();
      const marker = document.createElement('div');
      marker.className = 'board-convert-marker';
      marker.style.left = `${rect.left}px`;
      marker.style.top = `${rect.top}px`;
      marker.style.width = `${rect.width}px`;
      marker.style.height = `${rect.height}px`;
      marker.style.setProperty('--convert-delay', `${Math.min(index * 32, 260)}ms`);
      document.body.appendChild(marker);
      battleTimeout(() => marker.remove(), 1450);
    });
  }

  function getPlayerAttackEffectType(color = 'light') {
    if (color === 'red' || color === 'enhancedRed') return 'fire';
    if (color === 'green') return 'poison';
    if (color === 'yellow') return 'thunder';
    if (color === 'dark') return 'dark';
    return 'light';
  }

  function getAttackEffectType(color = 'light', label = '') {
    if (label.includes('?貊?') || label.includes('?')) return 'bomb';
    return getPlayerAttackEffectType(color);
  }

  function showSpearThrusts() {
    if (!enemyArtEl) return;
    const rect = enemyArtEl.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.52;
    const centerY = rect.top + rect.height * 0.48;
    [
      { x: -120, y: -26, rot: -6, delay: 0, scale: 1 },
      { x: -88, y: 18, rot: 5, delay: 105, scale: 0.92 },
      { x: -142, y: 54, rot: -13, delay: 210, scale: 0.86 },
    ].forEach((hit) => {
      battleTimeout(() => {
        const spear = document.createElement('div');
        spear.className = 'zhao-spear-thrust';
        spear.style.left = `${centerX + hit.x}px`;
        spear.style.top = `${centerY + hit.y}px`;
        spear.style.setProperty('--spear-rot', `${hit.rot}deg`);
        spear.style.setProperty('--spear-scale', hit.scale);
        document.body.appendChild(spear);

        const spark = document.createElement('div');
        spark.className = 'zhao-spear-impact';
        spark.style.left = `${centerX + rect.width * 0.18}px`;
        spark.style.top = `${centerY + hit.y * 0.35}px`;
        spark.style.setProperty('--impact-delay', `${hit.delay}ms`);
        document.body.appendChild(spark);

        battleTimeout(() => spear.remove(), 620);
        battleTimeout(() => spark.remove(), 560);
      }, hit.delay);
    });
  }

  function showSpearShot() {
    if (!enemyArtEl) return;
    const sourceEl = teamEl?.querySelector('.hero-card') || document.querySelector('.battle-party') || battleEl;
    const sourceRect = sourceEl.getBoundingClientRect();
    const targetRect = enemyArtEl.getBoundingClientRect();
    const startX = sourceRect.left + sourceRect.width * 0.52;
    const startY = sourceRect.top + sourceRect.height * 0.36;
    const endX = targetRect.left + targetRect.width * 0.56;
    const endY = targetRect.top + targetRect.height * 0.5;
    const shot = document.createElement('div');
    shot.className = 'zhao-spear-shot';
    shot.style.left = `${startX}px`;
    shot.style.top = `${startY}px`;
    shot.style.setProperty('--shot-x', `${endX - startX}px`);
    shot.style.setProperty('--shot-y', `${endY - startY}px`);
    document.body.appendChild(shot);

    battleTimeout(() => {
      const spark = document.createElement('div');
      spark.className = 'zhao-spear-impact spear-shot-impact';
      spark.style.left = `${endX}px`;
      spark.style.top = `${endY}px`;
      document.body.appendChild(spark);
      battleTimeout(() => spark.remove(), 560);
    }, 330);

    battleTimeout(() => shot.remove(), 720);
  }

  function animateHeroStrike(color = 'red') {
    const card = teamEl.querySelector('.hero-card');
    const portrait = card?.querySelector('.hero-portrait');
    if (!card || !portrait) return;
    card.classList.remove('hero-strike');
    portrait.classList.remove('portrait-strike');
    void card.offsetWidth;
    card.classList.add('hero-strike');
    portrait.classList.add('portrait-strike');
    battleTimeout(() => {
      card.classList.remove('hero-strike');
      portrait.classList.remove('portrait-strike');
    }, 460);
  }

  function animateAttack(damage, skill = false, color = 'light', label = '', vfx = '') {
    animateHeroStrike(color);
    if (vfx === 'spearThrust') showSpearThrusts();
    else if (vfx === 'spearShot') showSpearShot();
    else if (vfx === 'thunderTriple') showAttackEffect('thunder-triple');
    else showAttackEffect(getAttackEffectType(color, label));
    battleEl.classList.remove('shake');
    void battleEl.offsetWidth;
    battleEl.classList.add('shake');
    enemyArtEl.classList.remove('hit', 'skill-hit', 'attack');
    void enemyArtEl.offsetWidth;
    enemyArtEl.classList.add(skill ? 'skill-hit' : 'hit');
    battleTimeout(() => enemyArtEl.classList.remove('hit', 'skill-hit'), skill ? 540 : 300);

    const rect = enemyArtEl.getBoundingClientRect();
    const float = document.createElement('div');
    float.className = 'damage-float enemy-damage-float';
    if (label) {
      const labelEl = document.createElement('span');
      labelEl.className = 'enemy-damage-label';
      labelEl.textContent = label;
      const amountEl = document.createElement('span');
      amountEl.className = 'enemy-damage-amount';
      amountEl.textContent = damage;
      float.append(labelEl, amountEl);
    } else {
      float.textContent = `-${damage}`;
    }
    const slot = activeEnemyDamageFloats.length;
    activeEnemyDamageFloats.push(float);
    const spacing = Math.max(70, Math.min(96, rect.height * 0.18));
    const offset = slot * spacing;
    float.style.setProperty('--damage-color', getColorValue(color));
    float.style.left = `${rect.left + rect.width / 2}px`;
    float.style.top = `${rect.top + rect.height * 0.46 - offset}px`;
    document.body.appendChild(float);
    battleTimeout(() => {
      const index = activeEnemyDamageFloats.indexOf(float);
      if (index >= 0) activeEnemyDamageFloats.splice(index, 1);
      float.remove();
    }, 1400);
  }

  function showComboPop(combo) {
    const rect = boardEl.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'combo-pop';
    pop.innerHTML = `<span>${combo} COMBO</span><small>x${getComboBaseMultiplier(combo).toFixed(2)}</small>`;
    pop.style.left = `${rect.left + rect.width / 2}px`;
    pop.style.top = `${rect.top + rect.height * 0.34}px`;
    document.body.appendChild(pop);
    battleTimeout(() => pop.remove(), 820);
  }

  function createAttackEffect(attackType = 'slash') {
    showAttackEffect(attackType);
    showAttackEffect('impact');
  }

  function createAttackAfterimage(enemyEl = enemyImageEl) {
    if (!enemyEl || !enemyEl.parentElement) return null;
    const parent = enemyEl.parentElement;
    const rect = enemyEl.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const clone = enemyEl.cloneNode(false);
    clone.removeAttribute('id');
    clone.className = 'enemy-afterimage';
    clone.style.left = `${rect.left - parentRect.left}px`;
    clone.style.top = `${rect.top - parentRect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    parent.appendChild(clone);
    battleTimeout(() => clone.remove(), 360);
    return clone;
  }

  function shakeBattleStage() {
    battleEl.classList.remove('shake');
    void battleEl.offsetWidth;
    battleEl.classList.add('shake');
    battleTimeout(() => battleEl.classList.remove('shake'), 260);
  }

  function shakeBoard() {
    if (!boardEl) return;
    boardEl.classList.remove('shake');
    void boardEl.offsetWidth;
    boardEl.classList.add('shake');
    battleTimeout(() => boardEl.classList.remove('shake'), 220);
  }

  function flashTargetHit(targetEl) {
    if (!targetEl) return;
    targetEl.classList.remove('target-hit');
    void targetEl.offsetWidth;
    targetEl.classList.add('target-hit');
    battleTimeout(() => targetEl.classList.remove('target-hit'), 280);
  }

  function showFloatingDamage(targetEl, damage) {
    if (!targetEl || !damage) return;
    const rect = targetEl.getBoundingClientRect();
    const float = document.createElement('div');
    float.className = 'player-damage-float';
    float.textContent = `-${damage}`;
    float.style.left = `${rect.left + rect.width / 2}px`;
    float.style.top = `${rect.top + 8}px`;
    document.body.appendChild(float);
    battleTimeout(() => float.remove(), 2000);
  }

  async function playEnemyAttackAnimation(enemyEl = enemyImageEl, targetEl = document.querySelector('.battle-party'), damage = 0, attackType = 'slash') {
    if (!enemyEl) return;
    if (attackType === 'obsidian-cavalry') {
      enemyArtEl.classList.remove('hit', 'skill-hit', 'attack', 'enemy-charging');
      enemyEl.classList.remove('enemy-windup', 'enemy-lunge', 'enemy-return');
      enemyEl.style.animation = '';
      enemyArtEl.classList.add('enemy-charging', 'obsidian-charge-casting');
      enemyEl.classList.add('enemy-phase-out');
      await wait(120);

      createAttackEffect(attackType);
      shakeBattleStage();
      flashTargetHit(targetEl);
      showFloatingDamage(targetEl, damage);
      await wait(720);

      enemyEl.classList.remove('enemy-phase-out');
      enemyEl.classList.add('enemy-phase-in');
      await wait(220);
      enemyEl.classList.remove('enemy-phase-in');
      enemyArtEl.classList.remove('enemy-charging', 'obsidian-charge-casting');
      return;
    }
    enemyArtEl.classList.remove('hit', 'skill-hit', 'attack', 'enemy-charging');
    enemyEl.classList.remove('enemy-windup', 'enemy-lunge');
    enemyEl.style.animation = '';
    enemyArtEl.classList.add('enemy-charging');
    enemyEl.classList.add('enemy-windup');
    await wait(150);

    createAttackAfterimage(enemyEl);
    battleTimeout(() => createAttackAfterimage(enemyEl), 48);
    battleTimeout(() => createAttackAfterimage(enemyEl), 92);
    enemyEl.classList.remove('enemy-windup');
    enemyEl.classList.add('enemy-lunge');
    await wait(180);

    createAttackEffect(attackType);
    shakeBattleStage();
    flashTargetHit(targetEl);
    showFloatingDamage(targetEl, damage);
    await wait(120);

    enemyEl.classList.remove('enemy-lunge');
    enemyEl.style.animation = `enemyReturn ${scaleBattleMs(250)}ms ease-out forwards`;
    await wait(250);
    enemyEl.style.animation = '';
    enemyArtEl.classList.remove('enemy-charging');
  }

  function animateEnemyAttack(type = 'slash') {
    playEnemyAttackAnimation(enemyImageEl, document.querySelector('.battle-party'), 0, type);
  }

  function showClawSlashes() {
    const rect = document.querySelector('.battle-party').getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.62;
    [
      { x: -58, y: -22, rot: -24, delay: 0 },
      { x: 2, y: 0, rot: -18, delay: 80 },
      { x: 56, y: 22, rot: -12, delay: 150 },
    ].forEach((slash) => {
      battleTimeout(() => {
        const el = document.createElement('div');
        el.className = 'claw-slash';
        el.style.left = `${centerX + slash.x}px`;
        el.style.top = `${centerY + slash.y}px`;
        el.style.setProperty('--rot', `${slash.rot}deg`);
        document.body.appendChild(el);
        battleTimeout(() => el.remove(), 560);
      }, slash.delay);
    });
  }

  function shootBeam(color, skill = false) {
    const sourceEl = teamEl.querySelector(`[data-color="${color}"]`) || boardEl;
    const sourceRect = sourceEl.getBoundingClientRect();
    const enemyRect = enemyArtEl.getBoundingClientRect();
    const start = {
      x: sourceRect.left + sourceRect.width / 2,
      y: sourceRect.top + sourceRect.height * 0.24,
    };
    const end = {
      x: enemyRect.left + enemyRect.width / 2,
      y: enemyRect.top + enemyRect.height / 2,
    };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.max(120, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const beam = document.createElement('div');
    beam.className = 'beam';
    beam.style.left = `${start.x}px`;
    beam.style.top = `${start.y}px`;
    beam.style.width = `${length}px`;
    beam.style.height = skill ? '18px' : '11px';
    beam.style.color = getColorValue(color);
    beam.style.transform = `rotate(${angle}deg)`;
    document.body.appendChild(beam);
    battleTimeout(() => beam.remove(), 560);
  }

  function flashResult() {
    resultEl.classList.remove('flash');
    void resultEl.offsetWidth;
    resultEl.classList.add('flash');
  }

  function updateCommandGaugeVisual(buttonEl, value = 0, max = 1, label = '') {
    if (!buttonEl) return;
    const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
    buttonEl.style.setProperty('--command-fill', `${Math.round(ratio * 100)}%`);
    buttonEl.style.setProperty('--command-fill-opacity', (0.52 + ratio * 0.48).toFixed(2));
    buttonEl.style.setProperty('--command-fill-light', (0.18 + ratio * 0.36).toFixed(2));
    buttonEl.style.setProperty('--command-fill-core', (0.42 + ratio * 0.32).toFixed(2));
    buttonEl.style.setProperty('--command-fill-ember', (0.16 + ratio * 0.24).toFixed(2));
    buttonEl.style.setProperty('--command-glow-size', `${Math.round(10 + ratio * 24)}px`);
    buttonEl.style.setProperty('--command-glow-alpha', (0.28 + ratio * 0.48).toFixed(2));
    buttonEl.style.setProperty('--command-aura-alpha', (ratio * 0.18).toFixed(2));
    buttonEl.setAttribute('aria-label', `${label}${value}/${max}`);
    buttonEl.dataset.gaugeReady = ratio >= 1 ? 'true' : 'false';
  }

  return {
    showBuffFlash,
    showOverflowCallout,
    showSkillCastIntro,
    showEnemySkillCastIntro,
    showChaosStormEffect,
    showIceTalismanCastEffect,
    showBleedTalismanCastEffect,
    showChaosDoomApplyEffect,
    showEnemyStatusCallout,
    showEnemyBurnEffect,
    animateAttack,
    showComboPop,
    showAttackEffect,
    showSpearThrusts,
    showSpearShot,
    showBoardBombs,
    showBoardPoisonBursts,
    showBoardShatters,
    showBoardConversions,
    getPlayerAttackEffectType,
    animateHeroStrike,
    createAttackEffect,
    createAttackAfterimage,
    shakeBattleStage,
    shakeBoard,
    flashTargetHit,
    showFloatingDamage,
    playEnemyAttackAnimation,
    animateEnemyAttack,
    showClawSlashes,
    shootBeam,
    flashResult,
    updateCommandGaugeVisual,
  };
}

export function showFloatingDamage() {
  throw new Error('Use createUiEffects().showFloatingDamage after DOM refs are available.');
}

export function showAttackEffect() {
  throw new Error('Use createUiEffects().showAttackEffect after DOM refs are available.');
}

export function showComboPop() {
  throw new Error('Use createUiEffects().showComboPop after DOM refs are available.');
}

export function shakeBattleStage() {
  throw new Error('Use createUiEffects().shakeBattleStage after DOM refs are available.');
}

