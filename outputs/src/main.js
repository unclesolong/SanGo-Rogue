import { width, height, characterRoster } from './config/constants.js?v=board-7x6-20260702a';
import { battleBalance } from './config/balance.js?v=poison-combo-multiplier-20260702a';
import { teamElements, traitRules } from './data/traits.js?v=dark-poison-help-20260702a';
import { heroDatabase } from './data/heroes.js?v=dragon-soul-burst-20260701f';
import { rogueRewards } from './data/rogueRewards.js?v=pursuit-order-20260701a';
import { equipmentRewards } from './data/equipmentRewards.js?v=weapon-icons-20260701a';
import { divineFlagsPack } from './data/divineFlags.js?v=divine-rework-20260701a';
import { stageData } from './data/monsters.js?v=doom-skull-icon-20260705a';
import { TALENT_STORAGE_KEY, defaultTalentLevels, thunderTalentConfig } from './data/talentDefinitions.js?v=talent-judiang-no-regen-20260704a';
import { createMonsterBattleState, getMonsterArt, getMonsterPreviewDamage, getMonsterTurnCooldown, getStageMonster } from './data/monsterCatalog.js';
import { completeStage, createStageProgress, createStageSelectModel } from './progression/stageProgress.js';
import {
  chooseEquipment,
  createEquipmentProgress,
  equipmentSlots,
  getEquipmentSlotLabels,
  pickEquipmentRewards,
} from './progression/equipmentProgress.js?v=gem-runes-20260701a';
import { getDomRefs } from './ui/dom.js';
import { createUiEffects } from './ui/effects.js?v=doom-card-icon-20260705a';
import { createAudioController } from './ui/audio.js?v=horse-charge-sfx-file-20260703a';
import { renderHeroRow } from './ui/renderBattle.js?v=enemy-poison-debuff-20260702a';
import { createTalentScreenController } from './ui/talentScreen.js?v=talent-hover-effects-20260704b';
import { calculateBombDamage as calculateBombDamageValue } from './battle/damage.js';
import { applyHeroAttackPresentation, getHeroAttackPresentation } from './battle/heroPresentation.js?v=hero-pursuit-straight-punch-20260702a';
import { canActivateHeroSkill, createHeroSkillDialogModel, createHeroSkillSystem } from './battle/skills.js?v=passive-bomb-refill-wait-20260703a';
import {
  createEnemySkillCooldowns,
  getEnemyActionIntents,
  getEnemyAttackType,
  getReadyEnemySkill,
  resetEnemySkillCooldown,
  resolveEnemyAction,
  tickEnemySkillCooldowns,
} from './battle/turns.js?v=baqi-soul-skills-20260703a';
import {
  applyDivineFlag as applyDivineFlagEffect,
  applyOrderReward as applyOrderRewardEffect,
  calculateDivineGaugeGain,
  calculateOrderGaugeGain,
  canUseDivine,
  canUseOrder,
  pickDivineRewards,
  pickOrderRewards,
} from './battle/rewards.js?v=board-refill-before-damage-20260703a';

const colors = teamElements.map((elementId) => traitRules[elementId]);
    
    const activeHero = heroDatabase.heroes[0];
    const playerHero = {
      ...activeHero,
      hero: activeHero.name,
      attack: activeHero.stats.attack,
      hp: activeHero.stats.hp,
      recovery: activeHero.stats.recovery,
      energy: 0,
      maxEnergy: heroDatabase.defaults.maxEnergy,
      skillName: activeHero.activeSkill.name,
      skillDescription: activeHero.activeSkill.description,
    };
    
    
    

    

    let board = [];
    let selected = null;
    let stage = 1;
    let selectedStage = 1;
    const stageProgress = createStageProgress(stageData.length, stageData.length);
    const equipmentProgress = createEquipmentProgress();
    let enemyMaxHp = 3000;
    let enemyHp = 3000;
    let playerMaxHp = 0;
    let playerHp = 0;
    let playerShield = 0;
    let playerShieldTurns = 0;
    let shieldCounterReady = false;
    let pendingShieldCounterDamage = 0;
    let ironWallTurns = 0;
    let enemyTurn = 3;
    let enemyActionCount = 0;
    let enemySkillCooldowns = {};
    let battleRound = 1;
    let playerStatusEffects = [];
    let enemyShield = 0;
    let enemyShieldTurns = 0;
    let enemyDamageReduction = 0;
    let enemyVulnerability = 0;
    let enemyDebuffs = [];
    let busy = false;
    let victoryResolving = false;
    let animMode = '';
    let swapAnim = null;
    let dropKeys = new Set();
    let boardRefillTimer = null;
    let boardRefillPromise = null;
    let boardRefillResolve = null;
    let boardRefillGeneration = 0;
    let pendingBoardRefillPreventAutoMatches = false;
    let chargeDamage = {};
    let thunderHoofRoute = null;
    let snakeSoulCurse = null;
    let activeBuffs = [];
    const frozenOrbAssetByColor = {
      red: 'assets/frozen-clean/FIRE STONE FROZEN CLEAN.png',
      enhancedRed: 'assets/frozen-clean/EXTRA FIRE STONE FROZEN CLEAN.png',
      green: 'assets/frozen-clean/EARTH STONE FROZEN CLEAN.png',
      yellow: 'assets/frozen-clean/SPARK STONE FROZEN CLEAN.png',
      light: 'assets/frozen-clean/LIGHT STONE FROZEN CLEAN.png',
      dark: 'assets/frozen-clean/DARK STONE FROZEN CLEAN.png',
    };
    const cleanOrbAssetByColor = {
      red: 'assets/FIRE STONE CLEAN.png',
      enhancedRed: 'assets/EXTRA FIRE STONE CLEAN.png',
      green: 'assets/EARTH STONE CLEAN.png',
      yellow: 'assets/SPARK STONE CLEAN.png',
      light: 'assets/LIGHT STONE CLEAN.png',
      dark: 'assets/DARK STONE CLEAN.png',
    };
    let chaosDoom = null;
    let orderPassives = {
      battleSpirit: false,
      pursuit: false,
    };
    let orderGauge = 0;
    let divineGauge = 0;
    let rewardSourceCell = null;
    let rewardMode = 'rogue';
    let pendingOrderColorConvert = null;
    let divineStates = {
      invincibleTurns: 0,
      enemyAttackMultiplier: 1,
      enemyAttackDebuffTurns: 0,
      enabledAttackColors: {},
      enhancedColorMultiplier: {},
      damageReductionTurns: 0,
      damageReductionRate: 0,
      fireAttackBombTurns: 0,
      eastWindTurns: 0,
      allColorsShieldTurns: 0,
      heavenGeneralThunderTurns: 0,
      azureDragonHealTurns: 0,
      azureDragonHealMultiplier: 0,
    };
    let bgmStarted = false;
    let heroCardPressTimer = null;
    let heroCardLongPressFired = false;
    let battleSpeedMultiplier = Number(localStorage.getItem('battleSpeedMultiplier') || 1) === 2 ? 2 : 1;
    window.__battleSpeedMultiplier = battleSpeedMultiplier;

    function getBattleSpeedMultiplier() {
      return battleSpeedMultiplier === 2 ? 2 : 1;
    }

    function scaleBattleMs(ms) {
      return Math.max(16, Math.round(ms / getBattleSpeedMultiplier()));
    }

    function battleTimeout(callback, ms, ...args) {
      return globalThis.setTimeout(callback, scaleBattleMs(ms), ...args);
    }

    const {
      boardEl,
      battleEl,
      enemyArtEl,
      enemyImageEl,
      teamEl,
      logEl,
      resultEl,
      victoryPanelEl,
      enemyNameEl,
      skillDialogEl,
      skillDialogImageEl,
      skillDialogTitleEl,
      skillDialogHeroEl,
      skillDialogDescEl,
      skillConfirmEl,
      buffRowEl,
      divineCommandButtonEl,
      orderCommandButtonEl,
      divineGaugeTextEl,
      orderGaugeTextEl,
      divineStatusBannerEl,
      rewardDialogEl,
      rewardOptionsEl,
      battleBgmEl,
      orbClearSfxEl,
      enemyAttackSfxEl,
      battleMessageEl,
      stageMapEl,
      rosterGridEl,
      talentHeroListEl,
      talentHeroNameEl,
      talentBoardEl,
      talentDetailEl,
      talentResonanceEl,
      activeTalentListEl,
      playerNameDisplayEl,
      nameDialogEl,
      nameFormEl,
      playerNameInputEl,
      screens,
    } = getDomRefs();
    const uiEffects = createUiEffects({
      boardEl,
      battleEl,
      enemyArtEl,
      enemyImageEl,
      teamEl,
      resultEl,
      getColorValue,
      getComboBaseMultiplier,
    });
    const audioController = createAudioController({
      battleBgmEl,
      orbClearSfxEl,
      enemyAttackSfxEl,
    });
    const heroSkillSystem = createHeroSkillSystem({
      battleBalance,
      destroyRandomOrbsByColor,
      playPassiveSfx,
      triggerBoardBurst,
      addLog,
    });
    let pendingSkillColor = null;
    let equipmentTurnAttackBonus = 0;
    let equipmentBattleState = {
      dragonSoulStacks: 0,
      fireBombsSinceHeal: 0,
      flowingFireCleared: 0,
      guiguCleared: 0,
      skyEyeUsedThisTurn: false,
    };
    const PLAYER_PROFILE_KEY = 'sangoPlayerProfileV1';

    function loadPlayerProfile() {
      try {
        return JSON.parse(localStorage.getItem(PLAYER_PROFILE_KEY) || 'null');
      } catch {
        return null;
      }
    }

    function savePlayerProfile(profile) {
      localStorage.setItem(PLAYER_PROFILE_KEY, JSON.stringify(profile));
    }

    function getPlayerName() {
      return loadPlayerProfile()?.name || '';
    }

    function updatePlayerNameDisplay() {
      if (playerNameDisplayEl) playerNameDisplayEl.textContent = getPlayerName() || '主公';
    }

    function openNameDialog() {
      nameDialogEl?.classList.add('show');
      playerNameInputEl?.focus();
    }

    function closeNameDialog() {
      nameDialogEl?.classList.remove('show');
    }

    function enterMainMenu() {
      updatePlayerNameDisplay();
      startBattleBgm();
      showScreen('menu');
    }

    function getTalentLevel(id) {
      try {
        const saved = JSON.parse(localStorage.getItem(TALENT_STORAGE_KEY) || 'null');
        if (Number.isFinite(saved?.levels?.[id])) return saved.levels[id];
      } catch {
        // Talent progress is optional in the prototype.
      }
      return defaultTalentLevels[id] ?? 0;
    }

    function hasTalent(id) {
      return getTalentLevel(id) > 0;
    }

    function getThunderSkyfallBonus() {
      if (thunderTalentConfig.skyfall15TalentIds.some((id) => hasTalent(id))) {
        return thunderTalentConfig.skyfall15Bonus;
      }
      if (hasTalent(thunderTalentConfig.skyfall10TalentId)) return thunderTalentConfig.skyfall10Bonus;
      return 0;
    }

    function randomColor() {
      if (divineStates.eastWindTurns > 0 && Math.random() < 0.3) return 'enhancedRed';
      const redBonus = sumEquipmentEffect('red_skyfall_weight_bonus');
      const thunderBonus = getThunderSkyfallBonus();
      if (redBonus <= 0 && thunderBonus <= 0) {
        const picked = colors[Math.floor(Math.random() * colors.length)].id;
        return divineStates.eastWindTurns > 0 && picked === 'red' ? 'enhancedRed' : picked;
      }

      const weighted = colors.map((color) => ({
        id: color.id,
        weight: color.id === 'red'
          ? 1 + redBonus * colors.length
          : color.id === 'yellow'
            ? 1 + thunderBonus * colors.length
            : 1,
      }));
      const totalWeight = weighted.reduce((sum, color) => sum + color.weight, 0);
      let roll = Math.random() * totalWeight;
      for (const color of weighted) {
        roll -= color.weight;
        if (roll <= 0) return divineStates.eastWindTurns > 0 && color.id === 'red' ? 'enhancedRed' : color.id;
      }
      const fallback = weighted[weighted.length - 1].id;
      return divineStates.eastWindTurns > 0 && fallback === 'red' ? 'enhancedRed' : fallback;
    }

    function getTeamMaxHp() {
      return playerHero.hp;
    }

    function getTraitValue(rule, count) {
      return rule.values[Math.min(7, Math.max(3, count))] ?? rule.values[3];
    }

    function getArmorBreakStatus() {
      return playerStatusEffects.find((effect) => effect.type === 'armorBreak');
    }

    function applyShieldGainModifiers(amount) {
      let shieldAmount = Math.round(amount);
      const armorBreak = getArmorBreakStatus();
      if (armorBreak) {
        const reduction = armorBreak.shieldReduction ?? 0.5;
        shieldAmount = Math.round(shieldAmount * Math.max(0, 1 - reduction));
        showBuffFlash(`裂甲 護盾-${Math.round(reduction * 100)}%`);
      }
      return shieldAmount;
    }

    function addPlayerShield(amount) {
      playerShield += amount;
      playerShieldTurns = 3;
      shieldCounterReady = true;
      addLog(`木特性產生護盾 ${amount}，維持 3 回合。`);
    }

    function healPlayer(amount) {
      const before = playerHp;
      playerHp = Math.min(playerMaxHp, playerHp + amount);
      addLog(`光特性回復 ${playerHp - before} HP。`);
    }

    async function gainPlayerShield(amount) {
      const shieldAmount = applyShieldGainModifiers(amount * (1 + sumEquipmentEffect('shield_gain_multiplier')));
      await showBattleMessage(`獲得護盾 +${shieldAmount}`, 'shield');
      showPlayerGain(shieldAmount, 'shield');
      await wait(320);
      addPlayerShield(shieldAmount);
      updateStats();
      renderTeam();
      await wait(180);
    }

    async function gainPlayerHeal(amount) {
      const realHeal = Math.max(0, Math.min(playerMaxHp - playerHp, amount));
      await showBattleMessage(`回復 HP +${realHeal}`, 'heal');
      showPlayerGain(realHeal, 'heal');
      await wait(320);
      healPlayer(amount);
      updateStats();
      renderTeam();
      await wait(180);
    }

    function showPlayerGain(amount, type) {
      const target = type === 'heal'
        ? document.getElementById('playerHpBar')?.parentElement || document.querySelector('.player-status')
        : document.querySelector('.player-status');
      const rect = target.getBoundingClientRect();
      if (type === 'heal') {
        const healEffect = document.createElement('div');
        healEffect.className = 'player-hp-heal-effect';
        healEffect.innerHTML = '<span></span><span></span><span></span>';
        target.classList.remove('hp-healing');
        void target.offsetWidth;
        target.classList.add('hp-healing');
        target.appendChild(healEffect);
        battleTimeout(() => {
          healEffect.remove();
          target.classList.remove('hp-healing');
        }, 1180);
      }
      const float = document.createElement('div');
      float.className = `player-gain-float ${type === 'heal' ? 'heal-gain-float' : ''}`;
      const labels = { shield: '+盾 ', heal: '+HP ', energy: '+能量 ' };
      const colors = { shield: '#7fc7ff', heal: '#70f2a6', energy: '#ffe15b' };
      if (type === 'heal') {
        const text = document.createElement('span');
        text.className = 'heal-gain-text';
        text.textContent = `HP +${amount}`;
        float.append(text);
      } else {
        float.textContent = `${labels[type] ?? '+'}${amount}`;
      }
      float.style.setProperty('--gain-color', colors[type] ?? '#ffe15b');
      float.style.left = `${rect.left + rect.width / 2}px`;
      float.style.top = `${type === 'heal' ? rect.top - 22 : rect.top + 10}px`;
      document.body.appendChild(float);
      battleTimeout(() => float.remove(), 1380);
    }

    function addHeroEnergy(amount) {
      playerHero.energy = Math.min(playerHero.maxEnergy, playerHero.energy + amount);
      addLog(`雷特性充能 +${amount}。`);
    }

    async function gainHeroEnergy(amount) {
      await showBattleMessage(`獲得能量 +${amount}`, 'energy');
      showPlayerGain(amount, 'energy');
      await wait(300);
      addHeroEnergy(amount);
      updateStats();
      renderTeam();
      await wait(160);
    }

    function refreshEnemyVulnerability() {
      enemyVulnerability = enemyDebuffs.reduce((sum, debuff) => {
        if (debuff.type === 'vulnerability') return sum + (debuff.layers || 0) * battleBalance.vulnerabilityPerLayer;
        return sum + (debuff.amount || 0);
      }, 0);
    }

    function renderEnemyDebuffs() {
      const el = document.getElementById('enemyDebuffs');
      if (!el) return;
      el.textContent = '';
      enemyDebuffs.forEach((debuff, index) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `enemy-debuff enemy-debuff-${debuff.type}`;
        chip.dataset.enemyDebuffIndex = String(index);
        const info = getEnemyDebuffInfo(debuff);
        chip.title = info.description || info.label;
        chip.setAttribute('aria-label', info.label);

        const defaultEnemyDebuffIcons = {
          burn: 'assets/effects/burn_debuff_icon_256.png',
          poison: 'assets/effects/poison_debuff_icon_256.png',
        };
        const icon = debuff.icon ?? defaultEnemyDebuffIcons[debuff.type] ?? '';
        if (icon) {
          const img = document.createElement('img');
          img.src = icon;
          img.alt = debuff.name || label;
          chip.appendChild(img);
        }

        const turns = document.createElement('span');
        turns.className = 'enemy-debuff-turns';
        turns.textContent = info.counter ?? '';
        chip.appendChild(turns);

        const text = document.createElement('span');
        text.className = 'enemy-debuff-label';
        text.textContent = info.label;
        chip.appendChild(text);

        chip.addEventListener('click', () => openDebuffInfoDialog(debuff, 'enemy'));
        el.appendChild(chip);
      });
    }

    function tickEnemyDebuffs() {
      enemyDebuffs.forEach((debuff) => {
        if (debuff.fresh && debuff.type !== 'burn') {
          debuff.fresh = false;
          return;
        }
        if (debuff.type === 'burn' || debuff.type === 'poison') {
          debuff.fresh = false;
          const dotDamage = Math.round(debuff.damage ?? enemyMaxHp * (debuff.amount || 0));
          const dealt = damageEnemy(dotDamage, { fixed: true });
          if (debuff.type === 'burn') {
            showEnemyBurnEffect();
            playBurnSfx();
            animateAttack(dealt, true, 'red', '燃燒');
            addLog(`燃燒造成 ${dealt} 傷害。`);
            resolveEnemyDefeat('燃燒');
          } else {
            animateAttack(dealt, true, 'green', '中毒');
            addLog(`中毒造成 ${dealt} 傷害。`);
            resolveEnemyDefeat('中毒');
          }
        }
        debuff.turns--;
        if (debuff.type === 'vulnerability') debuff.layers = Math.max(0, (debuff.layers || 0) - 1);
      });
      enemyDebuffs = enemyDebuffs.filter((debuff) => debuff.turns > 0 && (debuff.type !== 'vulnerability' || debuff.layers > 0));
      refreshEnemyVulnerability();
      renderEnemyDebuffs();
    }

    function addEnemyVulnerability(layers, count, comboMultiplier) {
      const existing = enemyDebuffs.find((debuff) => debuff.type === 'vulnerability');
      const gained = Math.max(1, Math.round(layers * comboMultiplier));
      if (existing) {
        existing.layers = Math.min(battleBalance.vulnerabilityMaxLayers, (existing.layers || 0) + gained);
        existing.turns = battleBalance.vulnerabilityTurns;
        existing.fresh = true;
      } else {
        enemyDebuffs.push({
        id: 'vulnerability',
        type: 'vulnerability',
        name: '易傷',
        layers: Math.min(battleBalance.vulnerabilityMaxLayers, gained),
        turns: battleBalance.vulnerabilityTurns,
        fresh: true,
        icon: 'assets/rogue/buffs/buff_sorcery_.png',
      });
      }
      refreshEnemyVulnerability();
      renderEnemyDebuffs();
      const current = enemyDebuffs.find((debuff) => debuff.type === 'vulnerability');
      showEnemyStatusCallout(`易傷 x${current?.layers ?? gained}`);
      addLog(`暗特性 ${count} 消，敵人易傷 +${gained} 層（COMBO x${comboMultiplier.toFixed(2)}）。`);
    }

    function addEnemyParalysis(turns = 1) {
      const existing = enemyDebuffs.find((debuff) => debuff.type === 'paralysis');
      if (existing) {
        existing.turns = Math.max(existing.turns, turns);
        existing.fresh = true;
      } else {
        enemyDebuffs.push({
          id: 'paralysis',
          type: 'paralysis',
          name: '麻痺',
          turns,
          fresh: true,
          icon: 'assets/talents/talent-icon-lightning.png',
          description: '下一次敵方行動無法攻擊。',
        });
      }
      renderEnemyDebuffs();
      showEnemyStatusCallout('麻痺');
      showBuffFlash('麻痺');
      addLog(`${thunderTalentConfig.labels.punishment}使敵人陷入麻痺。`);
    }

    function consumeEnemyParalysis() {
      const index = enemyDebuffs.findIndex((debuff) => debuff.type === 'paralysis');
      if (index < 0) return false;
      enemyDebuffs.splice(index, 1);
      renderEnemyDebuffs();
      showBuffFlash('敵人麻痺');
      addLog('敵人因麻痺無法行動。');
      return true;
    }

    function addEnemyBurn(durationTurns = battleBalance.enhancedFireBurnTurns, amount = battleBalance.enhancedFireBurnMaxHp) {
      const existing = enemyDebuffs.find((debuff) => debuff.type === 'burn');
      if (existing) {
        existing.turns = Math.max(existing.turns, durationTurns);
        existing.amount = Math.max(existing.amount || 0, amount);
        existing.fresh = false;
      } else {
        enemyDebuffs.push({
          id: 'burn',
          type: 'burn',
          name: '燃燒',
          description: '每回合受到最大 HP 5% 傷害。',
          icon: 'assets/effects/burn_debuff_icon_256.png',
          amount,
          turns: durationTurns,
          fresh: false,
        });
      }
      renderEnemyDebuffs();
      showEnemyStatusCallout('燃燒');
    }

    function addEnemyPoison(durationTurns = 2, damageOrRate = Math.round(playerHero.attack * battleBalance.poisonDamageAtkPerTurn)) {
      const damage = damageOrRate > 0 && damageOrRate <= 1
        ? Math.round(enemyMaxHp * damageOrRate)
        : Math.round(damageOrRate);
      const existing = enemyDebuffs.find((debuff) => debuff.type === 'poison');
      if (existing) {
        existing.turns = Math.max(0, existing.turns || 0) + durationTurns;
        existing.damage = Math.max(existing.damage || 0, damage);
        existing.fresh = false;
      } else {
        enemyDebuffs.push({
          id: 'poison',
          type: 'poison',
          name: '中毒',
          description: `每回合受到 ${damage} 毒傷。`,
          icon: 'assets/effects/poison_debuff_icon_256.png',
          damage,
          turns: durationTurns,
          fresh: false,
        });
      }
      renderEnemyDebuffs();
      showEnemyStatusCallout('中毒');
    }

    function getPlayerBrandStacks() {
      return playerStatusEffects
        .filter((effect) => effect.type === 'brand')
        .reduce((sum, effect) => sum + (effect.stacks ?? 1), 0);
    }

    function applyPlayerDamage(amount, { ignoreBrand = false, fixed = false } = {}) {
      if (divineStates.invincibleTurns > 0) {
        showBuffFlash('八陣圖：無敵');
        addLog('八陣圖擋下了敵人的攻擊。');
        return 0;
      }
      let damage = amount;
      const armorBreak = getArmorBreakStatus();
      if (fixed && armorBreak) {
        const bonusDamage = armorBreak.fixedDamageBonus ?? 100;
        damage += bonusDamage;
        showBuffFlash(`裂甲 固傷+${bonusDamage}`);
      }
      const brandStacks = ignoreBrand ? 0 : getPlayerBrandStacks();
      if (brandStacks > 0) {
        const bonusRate = brandStacks * 0.2;
        damage = Math.round(damage * (1 + bonusRate));
        showBuffFlash(`烙印 +${Math.round(bonusRate * 100)}%`);
      }
      if (ironWallTurns > 0) {
        damage = Math.round(damage * (1 - battleBalance.ironWallReduction));
        showBuffFlash('鐵壁 -30%');
      }
      if (divineStates.damageReductionTurns > 0 && divineStates.damageReductionRate > 0) {
        damage = Math.round(damage * (1 - divineStates.damageReductionRate));
        showBuffFlash(`八陣圖 -${Math.round(divineStates.damageReductionRate * 100)}%`);
      }
      const equipmentReduction = sumEquipmentEffect('enemy_damage_reduction');
      if (equipmentReduction > 0) {
        damage = Math.round(damage * Math.max(0, 1 - equipmentReduction));
        showBuffFlash(`裝備減傷 -${Math.round(equipmentReduction * 100)}%`);
      }
      const blocked = Math.min(playerShield, damage);
      if (blocked > 0) {
        const shieldBeforeHit = playerShield;
        playerShield -= blocked;
        damage -= blocked;
        addLog(`護盾抵擋 ${blocked} 傷害。`);
        if (shieldCounterReady) {
          const counterMultiplier = 1 + sumEquipmentEffect('shield_counter_damage_bonus');
          const counterDamage = Math.round(blocked * battleBalance.shieldCounterRate * counterMultiplier);
          if (counterDamage > 0) pendingShieldCounterDamage += counterDamage;
          shieldCounterReady = false;
        }
        if (shieldBeforeHit > 0 && playerShield <= 0) resolveShieldBreakEquipmentEffects();
      }
      playerHp = Math.max(0, playerHp - damage);
      if (damage > 0) showPlayerDamage(damage);
      return damage;
    }

    function resolveOnHitEquipmentEffects() {
      getEquipmentEffects('on_hit_fire_bomb_chance').forEach((effect) => {
        if (Math.random() >= (effect.chance ?? 0)) return;
        const destroyed = destroyRandomOrbsByColor('red', effect.bombCount ?? 1);
        if (destroyed <= 0) return;
        const damage = Math.round(playerHero.attack * (effect.value ?? 0) * getPlayerAttackMultiplier());
        const dealt = damageEnemy(damage);
        animateAttack(dealt, true, 'red', '餘燼反噬');
        showBuffFlash('餘燼反噬');
        addLog(`赤焰皮甲引爆火珠，反擊 ${dealt} 傷害。`);
        resolveEnemyDefeat('餘燼反噬');
      });
    }

    function resolveShieldBreakEquipmentEffects() {
      getEquipmentEffects('shield_break_random_bomb').forEach((effect) => {
        const destroyed = destroyRandomNonSpecialOrbs(effect.count ?? 5);
        if (destroyed <= 0) return;
        const dealt = applyBombDamageWithOptions(destroyed, 'yellow', false, { recordFireBomb: false });
        showBuffFlash('虎牢破盾');
        addLog(`虎牢重甲護盾破裂，引爆 ${destroyed} 顆隨機珠，造成 ${dealt} 傷害。`);
      });
    }

    function applyTurnStartEquipmentEffects() {
      equipmentBattleState.skyEyeUsedThisTurn = false;
      let spawned = 0;
      getEquipmentEffects('turn_start_spawn_orbs').forEach((effect) => {
        spawnRandomOrbs(effect.color ?? 'red', effect.count ?? 0);
        spawned += effect.count ?? 0;
        if (effect.color === 'rainbow') addLog(`七星火玉生成 ${effect.count ?? 0} 顆彩虹珠。`);
        else addLog(`烈陽符石生成 ${effect.count ?? 0} 顆火珠。`);
      });
      if (spawned > 0) {
        showBuffFlash(`符石生珠 +${spawned}`);
        stabilizeBoardMatchesWithoutClearing();
        renderBoard();
      }
      const shieldStacks = sumEquipmentEffect('turn_start_shield_stack');
      if (shieldStacks <= 0 || playerHp <= 0) return;
      const shieldAmount = applyShieldGainModifiers(playerMaxHp * 0.05 * shieldStacks);
      playerShield += shieldAmount;
      playerShieldTurns = Math.max(playerShieldTurns, 1);
      shieldCounterReady = true;
      showBuffFlash(`虎牢守勢 +${shieldAmount}`);
      addLog(`虎牢守勢獲得 ${shieldAmount} 護盾。`);
    }

    function resolveClearedOrbGemEffects(clearedCount) {
      if (clearedCount <= 0) return;

      const flowingFire = getEquipmentEffects('cleared_orb_spawn_enhanced_fire')[0];
      if (flowingFire) {
        equipmentBattleState.flowingFireCleared += clearedCount;
        let spawnCount = 0;
        while (equipmentBattleState.flowingFireCleared >= (flowingFire.count ?? 10)) {
          equipmentBattleState.flowingFireCleared -= flowingFire.count ?? 10;
          spawnCount += flowingFire.spawnCount ?? 1;
        }
        if (spawnCount > 0) {
          const conversion = convertRandomOrbsToColor('enhancedRed', spawnCount);
          showBoardConversions(conversion.cells);
          showBuffFlash(`流火 +${conversion.count}`);
          addLog(`流火符石生成 ${conversion.count} 顆強化火珠。`);
          stabilizeBoardMatchesWithoutClearing();
          renderBoard();
        }
      }

      const guigu = getEquipmentEffects('cleared_orb_gain_divine')[0];
      if (guigu) {
        equipmentBattleState.guiguCleared += clearedCount;
        let gain = 0;
        while (equipmentBattleState.guiguCleared >= (guigu.count ?? 20)) {
          equipmentBattleState.guiguCleared -= guigu.count ?? 20;
          gain += guigu.value ?? 1;
        }
        if (gain > 0) {
          divineGauge = Math.min(battleBalance.divineGaugeMax, divineGauge + gain);
          renderCommandGauges();
          showBuffFlash(`鬼谷神策 +${gain}`);
          addLog(`鬼谷兵書使神令能量 +${gain}。`);
        }
      }
    }

    function tickRogueTurnBuffs() {
      if (playerShieldTurns > 0) {
        playerShieldTurns--;
        if (playerShieldTurns <= 0) {
          playerShield = 0;
          addLog('木護盾消散。');
        }
      }
      if (enemyShieldTurns > 0) {
        enemyShieldTurns--;
        if (enemyShieldTurns <= 0 && enemyShield > 0) {
          enemyShield = 0;
          addLog('敵方護盾消散。');
        }
      }
    }

    function tryHeroPassiveOnTrait(color) {
      return heroSkillSystem.tryHeroPassive({ color, playerHero });
    }

    function getCurrentStage() {
      return getStageMonster(stageData, stage);
    }

    function getEquippedEquipment() {
      return Object.values(equipmentProgress.slots).filter(Boolean);
    }

    function getEquipmentEffects(type) {
      return getEquippedEquipment()
        .flatMap((equipment) => equipment.skill?.effects ?? [])
        .filter((effect) => effect.type === type);
    }

    function sumEquipmentEffect(type, key = 'value') {
      return getEquipmentEffects(type).reduce((sum, effect) => sum + (effect[key] ?? 0), 0);
    }

    function hasEquippedEquipment(id) {
      return getEquippedEquipment().some((equipment) => equipment.id === id);
    }

    function resetEquipmentRuntimeForSlot(slot) {
      if (slot === 'weapon') equipmentBattleState.dragonSoulStacks = 0;
      if (slot === 'armor') equipmentBattleState.fireBombsSinceHeal = 0;
      if (slot === 'treasure') {
        equipmentBattleState.flowingFireCleared = 0;
        equipmentBattleState.guiguCleared = 0;
        equipmentBattleState.skyEyeUsedThisTurn = false;
      }
      equipmentTurnAttackBonus = 0;
    }

    function resetEquipmentBattleState() {
      equipmentTurnAttackBonus = 0;
      equipmentBattleState = {
        dragonSoulStacks: 0,
        fireBombsSinceHeal: 0,
        flowingFireCleared: 0,
        guiguCleared: 0,
        skyEyeUsedThisTurn: false,
      };
    }

    function getEquipmentFireDamageMultiplier() {
      let bonus = sumEquipmentEffect('fire_damage_bonus');
      if (playerShield > 0) bonus += sumEquipmentEffect('shielded_fire_damage_bonus');
      return 1 + bonus;
    }

    function getEquipmentFireFollowUpRate(count) {
      const largeRate = getEquipmentEffects('large_fire_match_follow_up')
        .filter((effect) => count >= (effect.minCount ?? 6))
        .reduce((max, effect) => Math.max(max, effect.value ?? 0), 0);
      const baseRate = sumEquipmentEffect('fire_attack_follow_up');
      return Math.max(baseRate, largeRate);
    }

    function getActiveSkillExtraOrbCount() {
      return sumEquipmentEffect('active_skill_extra_orbs');
    }

    function getPlayerAttackMultiplier() {
      let multiplier = playerStatusEffects.reduce((value, effect) => {
        if (effect.type === 'attackDown') return value * (1 - effect.amount);
        return value;
      }, 1);
      activeBuffs.forEach((buff) => {
        if (buff.type === 'attack_up') multiplier *= 1 + buff.value;
        if (buff.type === 'battle_spirit') multiplier *= 1 + buff.value;
      });
      const hpRate = playerMaxHp > 0 ? playerHp / playerMaxHp : 1;
      getEquipmentEffects('low_hp_attack_bonus').forEach((effect) => {
        if (hpRate < (effect.hpBelow ?? 0)) multiplier *= 1 + (effect.value ?? 0);
      });
      if (equipmentTurnAttackBonus > 0) multiplier *= 1 + equipmentTurnAttackBonus;
      return multiplier;
    }

    function isFireAttackSealed() {
      return playerStatusEffects.some((effect) => effect.type === 'slow' || effect.type === 'fireSeal');
    }

    function getComboDamageMultiplier(combo) {
      const buff = activeBuffs.find((item) => item.type === 'combo_damage');
      const base = getComboBaseMultiplier(combo);
      const buffBonus = buff ? combo * buff.value : 0;
      const dragonSoulBonus = hasEquippedEquipment('dragon_soul_saber_sr') ? equipmentBattleState.dragonSoulStacks * 0.08 : 0;
      return base * (1 + buffBonus + dragonSoulBonus);
    }

    function getComboBaseMultiplier(combo) {
      return 1 + Math.max(0, combo - 1) * battleBalance.comboMultiplierStep;
    }

    function getPoisonComboMultiplier(combo) {
      const key = Math.min(7, Math.max(1, combo));
      return battleBalance.poisonComboMultipliers?.[key] ?? 1;
    }

    function getBuff(type) {
      return activeBuffs.find((buff) => buff.type === type);
    }

    function grantOrderPassive(passive) {
      if (passive === 'battle_spirit') {
        orderPassives.battleSpirit = true;
        showBuffFlash('獲得被動：戰意');
      } else if (passive === 'pursuit') {
        orderPassives.pursuit = true;
        showBuffFlash('獲得被動：追擊');
      }
    }

    function clearOrderPassives() {
      pendingOrderColorConvert = null;
      orderPassives = {
        battleSpirit: false,
        pursuit: false,
      };
      activeBuffs = activeBuffs.filter((buff) => buff.id !== 'battle_spirit');
    }

    function getOrbColorLabel(color) {
      const labels = {
        red: '紅',
        green: '綠',
        yellow: '黃',
        light: '光',
        dark: '暗',
        enhancedRed: '強化紅',
        rainbow: '彩虹',
      };
      return labels[color] ?? traitRules[color]?.label ?? color;
    }

    function addBattleSpiritStack() {
      let buff = activeBuffs.find((item) => item.id === 'battle_spirit');
      if (!buff) {
        buff = {
          id: 'battle_spirit',
          name: '戰意',
          type: 'battle_spirit',
          value: 0,
          stackValue: 0.05,
          maxStacks: 10,
          stacks: 0,
          turns: -1,
          description: '每層攻擊 +5%，最多 10 層。',
          icon: 'assets/rogue/buffs/buff_attack_up_.png',
          buffIcon: 'assets/rogue/buffs/buff_attack_up_.png',
        };
        activeBuffs.push(buff);
      }
      if (buff.stacks >= buff.maxStacks) return;
      buff.stacks++;
      buff.value = buff.stacks * buff.stackValue;
      showBuffFlash(`戰意 +1（${buff.stacks}/${buff.maxStacks}）`);
      addLog(`戰意提升：目前 ${buff.stacks} 層，攻擊 +${Math.round(buff.value * 100)}%。`);
      renderBuffs();
    }

    function addOrRefreshBuff(reward, { silent = false } = {}) {
      const existing = activeBuffs.find((buff) => buff.id === reward.id);
      if (existing) {
        existing.stacks = (existing.stacks || 1) + 1;
        existing.value = reward.value * existing.stacks;
        existing.turns = Math.max(existing.turns, reward.durationTurns);
      } else {
        activeBuffs.push({ ...reward, baseValue: reward.value, stacks: 1, turns: reward.durationTurns });
      }
      const current = activeBuffs.find((buff) => buff.id === reward.id);
      if (!silent) showBuffFlash(`${reward.name} x${current?.stacks ?? 1}`);
      renderBuffs();
    }

    function formatBuffValue(buff) {
      if (typeof buff.value !== 'number') return '';
      if (['attack_up', 'follow_up', 'combo_damage', 'battle_spirit'].includes(buff.type)) return ` ${Math.round(buff.value * 100)}%`;
      return '';
    }

    function getPlayerStatusMeta(effect) {
      const statusMeta = {
        attackDown: {
          name: '攻擊下降',
          icon: 'assets/rogue/buffs/buff_sorcery_.png',
          value: effect.amount ? ` -${Math.round(effect.amount * 100)}%` : '',
        },
        burn: {
          name: '燃燒',
          icon: 'assets/rogue/buffs/buff_attack_up_.png',
          value: effect.damage ? ` ${effect.damage}` : '',
        },
        poison: {
          name: '中毒',
          icon: 'assets/effects/debuff_poison_ai.png',
          value: effect.damage ? ` ${effect.damage}` : '',
        },
        bleed: {
          name: '流血',
          icon: 'assets/effects/debuff_bleed_ai.png',
          value: effect.damage ? ` ${effect.damage}` : '',
        },
        huntMark: {
          name: '獵印',
          icon: 'assets/effects/debuff_hunt_mark_ai.png',
          value: '',
        },
        slow: {
          name: '封攻',
          icon: 'assets/effects/debuff_slow_ai.png',
          value: '',
        },
        freeze: {
          name: '冰結',
          icon: 'assets/LIGHT STONE FROZEN.png',
          value: '',
        },
        doom: {
          name: '即死',
          icon: 'assets/effects/debuff_doom_skull_icon_256.png',
          value: '',
        },
        brand: {
          name: '烙印',
          icon: 'assets/effects/brand_debuff_icon_ai.png',
          value: effect.stacks ? ` x${effect.stacks}` : '',
        },
        armorBreak: {
          name: '裂甲',
          icon: 'assets/effects/debuff_armor_break_ai.png',
          value: '',
        },
      };
      return {
        ...statusMeta[effect.type],
        name: effect.name ?? statusMeta[effect.type]?.name ?? effect.type,
        icon: effect.icon ?? statusMeta[effect.type]?.icon ?? 'assets/rogue/buffs/buff_sorcery_.png',
        value: statusMeta[effect.type]?.value ?? '',
      };
    }

    function getPlayerDebuffInfo(effect) {
      const meta = getPlayerStatusMeta(effect);
      const details = [];
      if (effect.amount) details.push(`效果：${Math.round(effect.amount * 100)}%`);
      if (effect.damage) details.push(`每回合傷害：${effect.damage}`);
      if (effect.stacks) details.push(`層數：${effect.stacks}`);
      if (effect.requiredColor && effect.required) {
        details.push(`解除：累積消除 ${effect.required} 顆指定屬性珠`);
      }
      if (effect.turns > 0) details.push(`剩餘：${effect.turns} 回合`);
      return {
        name: meta.name,
        icon: meta.icon,
        label: `${meta.name}${meta.value}`,
        description: effect.description || details.join('，') || `${meta.name}${meta.value}`,
        counter: effect.turns > 0 ? effect.turns : '',
      };
    }

    function getEnemyDebuffInfo(debuff) {
      const label = debuff.type === 'vulnerability'
        ? `易傷 x${debuff.layers}`
        : debuff.type === 'burn'
          ? `燃燒 ${debuff.turns}`
          : debuff.type === 'poison'
            ? `中毒 ${debuff.turns}`
            : debuff.type === 'paralysis'
              ? `麻痺 ${debuff.turns}`
              : debuff.name
                ? `${debuff.name}${debuff.turns ? ` ${debuff.turns}` : ''}`
                : `${Math.round((debuff.amount || 0) * 100)}% ${debuff.turns}`;
      const details = [];
      if (debuff.layers) details.push(`層數：${debuff.layers}`);
      if (debuff.amount) details.push(`效果：${Math.round(debuff.amount * 100)}%`);
      if (debuff.damage) details.push(`每回合傷害：${debuff.damage}`);
      if (debuff.turns > 0) details.push(`剩餘：${debuff.turns} 回合`);
      return {
        name: debuff.name || label,
        icon: debuff.icon || '',
        label,
        description: debuff.description || details.join('，') || label,
        counter: debuff.type === 'vulnerability' ? debuff.layers : debuff.turns,
      };
    }

    function getPlayerBuffInfo(buff) {
      const value = formatBuffValue(buff);
      const details = [];
      if (value) details.push(`效果：${value.trim()}`);
      if (buff.stacks) details.push(`層數：${buff.stacks}`);
      if (buff.turns > 0) details.push(`剩餘：${buff.turns} 回合`);
      return {
        name: buff.name || '增益',
        icon: buff.buffIcon || buff.icon || 'assets/rogue/buffs/buff_attack_up_.png',
        label: `${buff.name || '增益'}${value}`,
        description: buff.description || details.join('，') || `${buff.name || '增益'}${value}`,
        counter: buff.turns > 0 ? buff.turns : buff.stacks ? buff.stacks : '',
      };
    }

    function openDebuffInfoDialog(effect, owner = 'player') {
      const oldDialog = document.getElementById('debuffInfoDialog');
      oldDialog?.remove();
      const info = owner === 'enemy'
        ? getEnemyDebuffInfo(effect)
        : owner === 'buff'
          ? getPlayerBuffInfo(effect)
          : getPlayerDebuffInfo(effect);
      const dialog = document.createElement('div');
      dialog.id = 'debuffInfoDialog';
      dialog.className = 'debuff-info-dialog';
      const panel = document.createElement('div');
      panel.className = 'debuff-info-panel';
      const icon = document.createElement('img');
      icon.className = 'debuff-info-icon';
      icon.src = info.icon || 'assets/rogue/buffs/buff_sorcery_.png';
      icon.alt = info.name;
      const title = document.createElement('strong');
      title.textContent = info.name;
      const description = document.createElement('p');
      description.textContent = info.description;
      const closeButton = document.createElement('button');
      closeButton.type = 'button';
      closeButton.className = 'debuff-info-close';
      closeButton.textContent = '關閉';
      closeButton.addEventListener('click', () => dialog.remove());
      panel.append(icon, title, description, closeButton);
      dialog.appendChild(panel);
      dialog.addEventListener('click', (event) => {
        if (event.target === dialog) dialog.remove();
      });
      document.body.appendChild(dialog);
    }

    function renderBuffs() {
      const buffHtml = activeBuffs.map((buff, index) => {
        const info = getPlayerBuffInfo(buff);
        return `
          <button type="button" class="buff-chip player-active-buff-chip" title="${info.description}" data-player-buff-index="${index}">
            <span class="buff-icon-wrap">
              <img src="${info.icon}" alt="${info.name}">
              ${info.counter ? `<b class="buff-turn-badge">${info.counter}</b>` : ''}
            </span>
            <span class="buff-label">${info.label}</span>
          </button>
        `;
      }).join('');
      const debuffHtml = playerStatusEffects.map((effect, index) => {
        const meta = getPlayerDebuffInfo(effect);
        return `
          <button type="button" class="buff-chip debuff-chip" title="${meta.description}" data-player-debuff-index="${index}">
            <span class="debuff-icon-wrap">
              <img src="${meta.icon}" alt="${meta.name}">
              ${meta.counter ? `<b class="debuff-turn-badge">${meta.counter}</b>` : ''}
            </span>
            <span class="debuff-label">${meta.label}</span>
          </button>
        `;
      }).join('');
      buffRowEl.innerHTML = `${buffHtml}${debuffHtml}`;
      buffRowEl.querySelectorAll('[data-player-buff-index]').forEach((button) => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.playerBuffIndex);
          if (Number.isFinite(index) && activeBuffs[index]) {
            openDebuffInfoDialog(activeBuffs[index], 'buff');
          }
        });
      });
      buffRowEl.querySelectorAll('[data-player-debuff-index]').forEach((button) => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.playerDebuffIndex);
          if (Number.isFinite(index) && playerStatusEffects[index]) {
            openDebuffInfoDialog(playerStatusEffects[index], 'player');
          }
        });
      });
    }

    function tickBuffs() {
      activeBuffs.forEach((buff) => {
        if (buff.turns > 0) buff.turns--;
      });
      activeBuffs = activeBuffs.filter((buff) => buff.turns !== 0);
      tickFrozenOrbs();
      tickBlankOrbs();
      tickSoulLockedOrbs();
      tickFlameMarkedOrbs();
      tickThunderHoofRoute();
      tickEnemyDebuffs();
      tickDivineStates();
      renderDivineStatusBanner();
      renderBuffs();
    }

    function tickFrozenOrbs() {
      let changed = false;
      board.forEach((row) => row.forEach((cell) => {
        if (!cell?.frozen) return;
        if (cell.frozen.fresh) {
          cell.frozen.fresh = false;
          return;
        }
        cell.frozen.turns--;
        changed = true;
        if (cell.frozen.turns <= 0) delete cell.frozen;
      }));
      if (changed) {
        stabilizeBoardMatchesWithoutClearing();
        renderBoard();
      }
    }

    function tickBlankOrbs() {
      let changed = false;
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (!cell?.blank) return;
        if (cell.blank.fresh) {
          cell.blank.fresh = false;
          return;
        }
        cell.blank.turns--;
        changed = true;
        if (cell.blank.turns <= 0) board[y][x] = makeOrb();
      }));
      if (changed) renderBoard();
    }

    function tickSoulLockedOrbs() {
      let changed = false;
      board.forEach((row) => row.forEach((cell) => {
        if (!cell?.soulLock) return;
        if (cell.soulLock.fresh) {
          cell.soulLock.fresh = false;
          return;
        }
        cell.soulLock.turns--;
        changed = true;
        if (cell.soulLock.turns <= 0) delete cell.soulLock;
      }));
      if (changed) renderBoard();
    }

    function tickFlameMarkedOrbs() {
      let changed = false;
      let emberExploded = 0;
      let flameArrayExploded = 0;
      let flameArrayDamage = 0;
      const burstCells = [];

      board.forEach((row, y) => row.forEach((cell, x) => {
        if (!cell) return;
        if (cell.emberMark) {
          if (cell.emberMark.fresh) {
            cell.emberMark.fresh = false;
          } else {
            cell.emberMark.turns--;
            changed = true;
            if (cell.emberMark.turns <= 0) {
              emberExploded++;
              burstCells.push({ x, y });
              delete cell.emberMark;
            }
          }
        }
        if (cell.flameArrayMark) {
          if (cell.flameArrayMark.fresh) {
            cell.flameArrayMark.fresh = false;
          } else {
            cell.flameArrayMark.turns--;
            changed = true;
            if (cell.flameArrayMark.turns <= 0) {
              const brandStacks = getPlayerBrandStacks();
              flameArrayExploded++;
              flameArrayDamage += (cell.flameArrayMark.explosionDamage ?? 150)
                + brandStacks * (cell.flameArrayMark.brandBonusDamage ?? 50);
              burstCells.push({ x, y });
              delete cell.flameArrayMark;
            }
          }
        }
      }));

      if (burstCells.length) {
        showBoardPoisonBursts(burstCells);
        playBombSfx();
      }
      if (emberExploded > 0) {
        addPlayerStatus({
          type: 'brand',
          name: '烙印',
          stacks: emberExploded,
          turns: 5,
          icon: 'assets/effects/brand_debuff_icon_ai.png',
          description: `每層使受到攻擊傷害 +20%，目前增加 ${emberExploded * 20}%。`,
        });
        addLog(`焰印爆發 ${emberExploded} 顆，玩家獲得烙印 ${emberExploded} 層。`);
      }
      if (flameArrayDamage > 0) {
        const dealt = applyPlayerDamage(flameArrayDamage, { ignoreBrand: true, fixed: true });
        addLog(`焰陣印記爆發 ${flameArrayExploded} 顆，造成 ${dealt} 傷害。`);
        updateStats();
      }
      if (changed || burstCells.length) renderBoard();
    }

    function clearThunderHoofRoute(success = false) {
      if (!thunderHoofRoute) return;
      board.forEach((row) => row.forEach((cell) => {
        if (cell?.thunderHoofMark) delete cell.thunderHoofMark;
      }));
      if (success) {
        showBuffFlash('雷蹄踏陣解除');
        addLog('成功消除衝鋒路徑，雷蹄踏陣解除。');
      }
      thunderHoofRoute = null;
      renderBoard();
    }

    function getThunderHoofMarkedCells() {
      const marked = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell?.thunderHoofMark) marked.push({ x, y, cell });
      }));
      return marked;
    }

    function recordThunderHoofClear(cell) {
      if (!cell?.thunderHoofMark || !thunderHoofRoute) return;
      thunderHoofRoute.cleared = Math.min(thunderHoofRoute.required, thunderHoofRoute.cleared + 1);
      if (thunderHoofRoute.cleared >= thunderHoofRoute.required) clearThunderHoofRoute(true);
    }

    function clearSnakeSoulCurse(success = false) {
      board.forEach((row) => row.forEach((cell) => {
        if (cell?.snakeSoul) delete cell.snakeSoul;
      }));
      if (success) {
        showBuffFlash('蛇魂詛咒解除');
        addLog('光珠淨化蛇魂詛咒，蛇魂珠解除。');
      }
      snakeSoulCurse = null;
      renderBoard();
    }

    function recordSnakeSoulLightClears(pendingTraits) {
      if (!snakeSoulCurse) return;
      const lightClears = pendingTraits
        .filter((effect) => effect.color === 'light')
        .reduce((sum, effect) => sum + effect.count, 0);
      if (lightClears <= 0) return;
      snakeSoulCurse.cleared = Math.min(snakeSoulCurse.required, snakeSoulCurse.cleared + lightClears);
      board.forEach((row) => row.forEach((cell) => {
        if (cell?.snakeSoul) {
          cell.snakeSoul.cleared = snakeSoulCurse.cleared;
          cell.snakeSoul.required = snakeSoulCurse.required;
        }
      }));
      addLog(`光珠淨化蛇魂 ${snakeSoulCurse.cleared}/${snakeSoulCurse.required}。`);
      if (snakeSoulCurse.cleared >= snakeSoulCurse.required) clearSnakeSoulCurse(true);
      else renderBoard();
    }

    function tickThunderHoofRoute() {
      if (!thunderHoofRoute) return;
      if (thunderHoofRoute.fresh) {
        thunderHoofRoute.fresh = false;
        return;
      }
      thunderHoofRoute.turns--;
      board.forEach((row) => row.forEach((cell) => {
        if (cell?.thunderHoofMark) cell.thunderHoofMark.turns = thunderHoofRoute.turns;
      }));
      const remainingMarks = getThunderHoofMarkedCells();
      if (thunderHoofRoute.cleared >= thunderHoofRoute.required || remainingMarks.length === 0) {
        clearThunderHoofRoute(true);
        return;
      }
      if (thunderHoofRoute.turns <= 0) {
        const burstCells = [];
        const targetColumns = new Set(remainingMarks.map(({ x }) => x));
        const columns = [...targetColumns];
        if (!columns.length) {
          clearThunderHoofRoute(true);
          return;
        }
        columns.forEach((x) => {
          for (let y = 0; y < height; y++) {
            burstCells.push({ x, y });
            board[y][x] = {
              blank: {
                turns: thunderHoofRoute.blankTurns ?? 5,
                fresh: true,
              },
            };
          }
        });
        showBoardPoisonBursts(burstCells);
        playHorseChargeSfx();
        animateEnemyAttack('obsidian-cavalry');
        showBuffFlash('雷蹄衝鋒：整欄破碎');
        addLog(`雷蹄踏陣未解除，黑曜鬼騎衝毀第 ${columns.map((x) => x + 1).join('、')} 欄，空白裂洞持續 ${thunderHoofRoute.blankTurns ?? 5} 回合。`);
        thunderHoofRoute = null;
        updateStats();
      }
      renderBoard();
    }

    function tickPoisonOrbs() {
      const exploded = [];
      let totalDamage = 0;
      let poisonDamage = 100;
      let poisonTurns = 2;
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (!cell?.poison) return;
        cell.poison.turns--;
        if (cell.poison.turns <= 0) {
          exploded.push({ x, y });
          totalDamage += cell.poison.explosionDamage ?? 75;
          poisonDamage = cell.poison.poisonDamage ?? poisonDamage;
          poisonTurns = cell.poison.poisonTurns ?? poisonTurns;
        }
      }));
      if (!exploded.length) {
        renderBoard();
        return false;
      }
      showBoardPoisonBursts(exploded);
      playBombSfx();
      exploded.forEach(({ x, y }) => {
        board[y][x] = makeOrb();
      });
      stabilizeBoardMatchesWithoutClearing();
      const dealt = applyPlayerDamage(totalDamage, { fixed: true });
      addPlayerStatus({
        type: 'poison',
        name: '中毒',
        damage: poisonDamage,
        turns: poisonTurns,
        icon: 'assets/POSION.png',
        description: `毒珠爆炸後中毒，每回合 ${poisonDamage} 傷害。`,
      });
      addLog(`毒珠爆炸 ${exploded.length} 顆，造成 ${dealt} 傷害並使玩家中毒。`);
      renderBoard();
      updateStats();
      return playerHp <= 0;
    }

    function tickDivineStates() {
      if (divineStates.invincibleTurns > 0) divineStates.invincibleTurns--;
      if (divineStates.enemyAttackDebuffTurns > 0) {
        divineStates.enemyAttackDebuffTurns--;
        if (divineStates.enemyAttackDebuffTurns <= 0) divineStates.enemyAttackMultiplier = 1;
      }
      if (divineStates.damageReductionTurns > 0) {
        divineStates.damageReductionTurns--;
        if (divineStates.damageReductionTurns <= 0) divineStates.damageReductionRate = 0;
      }
      if (divineStates.fireAttackBombTurns > 0) divineStates.fireAttackBombTurns--;
      if (divineStates.eastWindTurns > 0) divineStates.eastWindTurns--;
      if (divineStates.allColorsShieldTurns > 0) divineStates.allColorsShieldTurns--;
      if (divineStates.heavenGeneralThunderTurns > 0) divineStates.heavenGeneralThunderTurns--;
      if (divineStates.azureDragonHealTurns > 0) {
        divineStates.azureDragonHealTurns--;
        if (divineStates.azureDragonHealTurns <= 0) divineStates.azureDragonHealMultiplier = 0;
      }
      Object.keys(divineStates.enabledAttackColors).forEach((color) => {
        divineStates.enabledAttackColors[color]--;
        if (divineStates.enabledAttackColors[color] <= 0) delete divineStates.enabledAttackColors[color];
      });
      if (ironWallTurns > 0) ironWallTurns--;
    }

    function formatTurns(turns) {
      return turns > 0 ? `${turns} 回合` : '';
    }

    function renderDivineStatusBanner() {
      if (!divineStatusBannerEl) return;
      const items = [];
      if (divineStates.fireAttackBombTurns > 0) {
        items.push({
          name: '火燒連環令',
          text: `消除任意珠會引爆十字範圍，炸珠傷害 x${battleBalance.fireChainOrderBombMultiplier}（${formatTurns(divineStates.fireAttackBombTurns)}）`,
        });
      }
      if (divineStates.eastWindTurns > 0) {
        items.push({
          name: '東風令',
          text: `天降火珠 +30%，天降火珠必為強化火珠（${formatTurns(divineStates.eastWindTurns)}）`,
        });
      }
      if (divineStates.azureDragonHealTurns > 0) {
        items.push({
          name: '青龍回春',
          text: `所有消珠附帶回血 x${divineStates.azureDragonHealMultiplier || 2}（${formatTurns(divineStates.azureDragonHealTurns)}）`,
        });
      }
      if (divineStates.invincibleTurns > 0 || divineStates.damageReductionTurns > 0 || divineStates.allColorsShieldTurns > 0) {
        const effects = [];
        if (divineStates.invincibleTurns > 0) effects.push(`無敵 ${formatTurns(divineStates.invincibleTurns)}`);
        if (divineStates.damageReductionTurns > 0) effects.push(`減傷 ${Math.round(divineStates.damageReductionRate * 100)}% ${formatTurns(divineStates.damageReductionTurns)}`);
        if (divineStates.allColorsShieldTurns > 0) effects.push(`所有屬性珠都產生護盾 ${formatTurns(divineStates.allColorsShieldTurns)}`);
        items.push({ name: '八陣圖', text: effects.join('，') });
      }
      if (divineStates.enemyAttackDebuffTurns > 0 && divineStates.enemyAttackMultiplier < 1) {
        items.push({
          name: '空城計',
          text: `敵人攻擊降為 ${Math.round(divineStates.enemyAttackMultiplier * 100)}%（${formatTurns(divineStates.enemyAttackDebuffTurns)}）`,
        });
      }
      const heavenGeneralActive = divineStates.enabledAttackColors.yellow || divineStates.enabledAttackColors.light;
      if (heavenGeneralActive || divineStates.heavenGeneralThunderTurns > 0) {
        const thunderText = divineStates.heavenGeneralThunderTurns > 0
          ? `任意三消觸發天公之怒（${formatTurns(divineStates.heavenGeneralThunderTurns)}）`
          : '天公之怒已結束';
        items.push({
          name: '天公將軍',
          text: `黃珠 / 光珠可攻擊至本戰鬥結束，${thunderText}`,
        });
      }
      if (items.length === 0) {
        divineStatusBannerEl.innerHTML = '';
        divineStatusBannerEl.classList.remove('show');
        divineStatusBannerEl.hidden = true;
        return;
      }
      divineStatusBannerEl.hidden = false;
      divineStatusBannerEl.classList.add('show');
      divineStatusBannerEl.innerHTML = items.map((item) => `
        <div class="divine-status-item">
          <strong>${item.name}</strong>
          <span>${item.text}</span>
        </div>
      `).join('');
    }

    function showBuffFlash(text) {
      uiEffects.showBuffFlash(text);
    }

    function showOverflowCallout(title, detail = '', type = 'chain') {
      uiEffects.showOverflowCallout(title, detail, type);
    }

    async function showSkillCastIntro(skill) {
      await uiEffects.showSkillCastIntro(skill);
    }

    async function showEnemySkillCastIntro(skill) {
      await uiEffects.showEnemySkillCastIntro(skill);
    }

    function showEnemyStatusCallout(text) {
      uiEffects.showEnemyStatusCallout(text);
    }

    function showEnemyBurnEffect() {
      uiEffects.showEnemyBurnEffect();
    }

    async function showBattleMessage(text, type = '') {
      showBuffFlash(text);
      await wait(200);
    }

    function getChaosDoomSkill(stageInfo) {
      return stageInfo?.openingSkill?.effectType === 'chaos_doom' ? stageInfo.openingSkill : null;
    }

    function syncChaosDoomStatus() {
      playerStatusEffects = playerStatusEffects.filter((effect) => effect.type !== 'doom');
      if (chaosDoom?.active) {
        playerStatusEffects.push({
          type: 'doom',
          name: chaosDoom.name ?? '即死',
          turns: chaosDoom.turns,
          icon: chaosDoom.icon ?? 'assets/effects/debuff_doom_skull_icon_256.png',
          description: `${chaosDoom.turns} 回合後 HP 歸 0。消除 ${chaosDoom.required} 顆${getOrbColorLabel(chaosDoom.targetColor)}珠可解除。`,
        });
      }
      renderBuffs();
    }

    function renderChaosDoomWarning() {
      let panel = enemyArtEl.querySelector('.chaos-doom-warning');
      if (!chaosDoom?.active) {
        panel?.remove();
        return;
      }
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'chaos-doom-warning';
        enemyArtEl.appendChild(panel);
      }
      const label = getOrbColorLabel(chaosDoom.targetColor);
      const orbSrc = cleanOrbAssetByColor[chaosDoom.targetColor] ?? cleanOrbAssetByColor.red;
      panel.innerHTML = `
        <img src="${orbSrc}" alt="${label}珠">
        <div>
          <strong>${chaosDoom.skillName ?? '即死倒數'}<span>消珠提示：${label}珠 ${chaosDoom.cleared}/${chaosDoom.required}</span></strong>
          <small>需要消除 ${chaosDoom.required} 顆${label}珠</small>
        </div>
        <em>${chaosDoom.turns}回合</em>
      `;
    }

    function renderBossGhostfireAura(enabled) {
      enemyArtEl.classList.toggle('boss-chaos-field', enabled);
      enemyImageEl.classList.toggle('boss-chaos-sprite', enabled);
      let aura = enemyArtEl.querySelector('.boss-ghostfire-aura');
      if (!enabled) {
        aura?.remove();
        return;
      }
      if (aura) return;
      aura = document.createElement('div');
      aura.className = 'boss-ghostfire-aura';
      aura.innerHTML = Array.from({ length: 9 }, (_, index) => `<i style="--i:${index}"></i>`).join('');
      enemyArtEl.appendChild(aura);
    }

    function pickMostCommonChaosDoomTargetColor(targetColors) {
      const allowed = new Set(targetColors);
      const counts = Object.fromEntries(targetColors.map((color) => [color, 0]));
      board.flat().forEach((cell) => {
        const color = matchColor(cell);
        if (allowed.has(color)) counts[color]++;
      });
      const best = targetColors.reduce((winner, color) => {
        if (counts[color] > counts[winner]) return color;
        return winner;
      }, targetColors[0]);
      if (counts[best] > 0) return best;
      return targetColors[Math.floor(Math.random() * targetColors.length)];
    }

    function applyChaosDoomOpening(stageInfo) {
      const skill = getChaosDoomSkill(stageInfo);
      if (!skill) {
        chaosDoom = null;
        syncChaosDoomStatus();
        renderChaosDoomWarning();
        return;
      }
      const targetColors = skill.targetColors?.length ? skill.targetColors : ['red', 'green', 'yellow', 'light', 'dark'];
      const targetColor = pickMostCommonChaosDoomTargetColor(targetColors);
      chaosDoom = {
        active: true,
        name: skill.statusName ?? '即死',
        skillName: skill.name,
        icon: skill.icon,
        targetColor,
        required: skill.requiredClears ?? 10,
        cleared: 0,
        turns: skill.durationTurns ?? 5,
      };
      syncChaosDoomStatus();
      renderChaosDoomWarning();
      addLog(`${skill.name}：倒數 ${chaosDoom.turns} 回合。消除 ${chaosDoom.required} 顆${getOrbColorLabel(targetColor)}珠可解除。`);
      battleTimeout(() => {
        playChaosThunderSfx();
        uiEffects.showChaosStormEffect?.();
        showEnemySkillCastIntro({ name: skill.name, variant: 'chaos' });
        battleTimeout(() => uiEffects.showChaosDoomApplyEffect?.(), 520);
        showBuffFlash(`即死倒數 ${chaosDoom?.turns ?? 0} 回合`);
      }, 260);
    }

    function clearChaosDoom() {
      if (!chaosDoom?.active) return;
      const label = getOrbColorLabel(chaosDoom.targetColor);
      addLog(`累積消除 ${chaosDoom.required} 顆${label}珠，${chaosDoom.skillName ?? '即死倒數'}解除。`);
      showBuffFlash('即死解除');
      chaosDoom = null;
      syncChaosDoomStatus();
      renderChaosDoomWarning();
    }

    function recordChaosDoomClears(pendingTraits) {
      if (!chaosDoom?.active) return;
      const cleared = pendingTraits
        .filter((effect) => effect.color === chaosDoom.targetColor)
        .reduce((sum, effect) => sum + effect.count, 0);
      if (cleared <= 0) return;
      chaosDoom.cleared = Math.min(chaosDoom.required, chaosDoom.cleared + cleared);
      addLog(`${chaosDoom.skillName ?? '即死倒數'}：${getOrbColorLabel(chaosDoom.targetColor)}珠 ${chaosDoom.cleared}/${chaosDoom.required}。`);
      if (chaosDoom.cleared >= chaosDoom.required) {
        clearChaosDoom();
      } else {
        syncChaosDoomStatus();
        renderChaosDoomWarning();
      }
    }

    function tickChaosDoomCounter() {
      if (!chaosDoom?.active) return false;
      chaosDoom.turns--;
      if (chaosDoom.turns <= 0) {
        const damage = playerHp;
        const doomName = chaosDoom.skillName ?? '即死倒數';
        chaosDoom = null;
        playerHp = 0;
        if (damage > 0) showPlayerDamage(damage);
        addLog(`${doomName}倒數結束，玩家即死。`);
        resultEl.textContent = `${doomName}：即死`;
        flashResult();
        syncChaosDoomStatus();
        renderChaosDoomWarning();
        updateStats();
        return true;
      }
      syncChaosDoomStatus();
      renderChaosDoomWarning();
      return false;
    }

    async function playBattleStep(text, action, type = '') {
      await showBattleMessage(text, type);
      if (typeof action === 'function') action();
      await wait(360);
    }

    function startBattleBgm() {
      audioController.startLoopingBgm();
    }

    function unlockBattleAudioOnce() {
      audioController.startLoopingBgm();
      document.removeEventListener('pointerdown', unlockBattleAudioOnce);
      document.removeEventListener('keydown', unlockBattleAudioOnce);
    }

    function playOrbClearSfx() {
      audioController.playOrbClearSfx();
    }

    function playEnemyAttackSfx() {
      audioController.playEnemyAttackSfx();
    }

    function playBombSfx() {
      audioController.playBombSfx();
    }

    function playShatterSfx() {
      audioController.playShatterSfx?.();
    }

    function playCounterSfx() {
      audioController.playCounterSfx();
    }

    function playThunderSfx() {
      audioController.playThunderSfx();
    }

    function playChaosThunderSfx() {
      audioController.playChaosThunderSfx?.();
    }

    function playCourageExplosionSfx() {
      audioController.playCourageExplosionSfx();
    }

    function playBurnSfx() {
      audioController.playBurnSfx();
    }

    function playFreezeSfx() {
      audioController.playFreezeSfx?.();
    }

    function playHorseChargeSfx() {
      audioController.playHorseChargeSfx?.();
    }

    function playOverflowSfx() {
      audioController.playOverflowSfx();
    }

    function playBonusSfx() {
      audioController.playBonusSfx();
    }

    function playSkillCastSfx(skill) {
      audioController.playSkillCastSfx(skill);
    }

    function playComboOrderSfx() {
      audioController.playComboOrderSfx?.();
    }

    function playStraightPunchSfx() {
      audioController.playStraightPunchSfx?.();
    }

    function playAttackEventSfx(event) {
      if (event.sfx === 'comboOrder') playComboOrderSfx();
      if (event.sfx === 'straightPunch') playStraightPunchSfx();
      if (event.attackType === 'thunder' || event.sfx === 'thunder') playThunderSfx();
      if (event.sfx === 'courageExplosion' || event.label?.includes('爆破')) playCourageExplosionSfx();
    }

    function showBoardPoisonBursts(cells = []) {
      uiEffects.showBoardPoisonBursts?.(cells);
    }

    function playEnemyActionSfx(skill) {
      if (skill?.effectType === 'dash_damage' || skill?.effectType === 'thunder_hoof_route' || skill?.effectType === 'armor_break') {
        playHorseChargeSfx();
        return;
      }
      if (skill?.effectType === 'freeze') {
        playFreezeSfx();
        return;
      }
      if (skill?.effectType === 'aoe_shield') {
        playThunderSfx();
        return;
      }
      if (skill?.effectType === 'freeze_board_orbs') return;
      playEnemyAttackSfx();
    }

    function showAttackName(event, { playVoice = true } = {}) {
      const presentation = event.presentation || getHeroAttackPresentation(playerHero, event);
      if (!presentation?.name && !presentation?.icon) return;
      if (playVoice && presentation.voice) playHeroVoice(presentation.voice);
      const el = document.createElement('div');
      el.className = 'attack-name-pop';
      const icon = presentation.icon ? `<img src="${presentation.icon}" alt="">` : '';
      const heroName = presentation.heroName || playerHero.name || playerHero.hero;
      const actionName = presentation.name || event.label || '攻擊';
      el.innerHTML = `${icon}<span>${heroName}・${actionName}</span>`;
      document.body.appendChild(el);
      battleTimeout(() => el.remove(), 1000);
    }

    function addOrderGauge(count) {
      const gain = calculateOrderGaugeGain(count);
      if (!gain) return;
      orderGauge = Math.min(battleBalance.orderGaugeMax, orderGauge + gain);
      renderCommandGauges();
      showBuffFlash(orderGauge >= battleBalance.orderGaugeMax ? '軍令已滿' : '軍令蓄勢');
    }

    function addDivineGauge(count) {
      const gain = calculateDivineGaugeGain(count);
      if (!gain) return;
      divineGauge = Math.min(battleBalance.divineGaugeMax, divineGauge + gain);
      renderCommandGauges();
      showBuffFlash(divineGauge >= battleBalance.divineGaugeMax ? '神令已滿' : '神令蓄勢');
    }

    function addOverflowRewards(totalCleared) {
      if (totalCleared >= 8) {
        orderGauge = Math.min(battleBalance.orderGaugeMax, orderGauge + 1);
        divineGauge = Math.min(battleBalance.divineGaugeMax, divineGauge + 1);
        renderCommandGauges();
        showOverflowCallout('奇策連鎖！', '軍令 +1 / 神令旗 +1', 'chain');
        playOverflowSfx();
      }
      if (totalCleared >= 10) {
        const reward = rogueRewards[Math.floor(Math.random() * rogueRewards.length)];
        if (reward) {
          if (reward.type === 'color_convert') convertRandomBoardColor();
          else addOrRefreshBuff(reward, { silent: true });
          showOverflowCallout('BONUS 獲得', reward.name, 'bonus');
          playBonusSfx();
          addLog(`大型消除獲得 ${reward.name}。`);
        }
      }
    }

    function renderCommandGauges() {
      if (divineGaugeTextEl) divineGaugeTextEl.textContent = '';
      if (orderGaugeTextEl) orderGaugeTextEl.textContent = '';
      uiEffects.updateCommandGaugeVisual(divineCommandButtonEl, divineGauge, battleBalance.divineGaugeMax, '神令');
      uiEffects.updateCommandGaugeVisual(orderCommandButtonEl, orderGauge, battleBalance.orderGaugeMax, '軍令');
      divineCommandButtonEl?.classList.toggle('ready', divineGauge >= battleBalance.divineGaugeMax);
      orderCommandButtonEl?.classList.toggle('ready', orderGauge >= battleBalance.orderGaugeMax);
    }

    function triggerBoardBurst(text, type = 'fire') {
      showBuffFlash(text);
      showAttackEffect(type);
      battleEl.classList.remove('shake');
      void battleEl.offsetWidth;
      battleEl.classList.add('shake');
    }

    function cleanseOnePlayerDebuff() {
      const index = playerStatusEffects.findIndex((effect) => ['burn', 'poison', 'bleed', 'attackDown', 'slow', 'freeze'].includes(effect.type));
      if (index < 0) return false;
      const [removed] = playerStatusEffects.splice(index, 1);
      showBuffFlash('光淨化');
      addLog(`光特性清除了 ${removed.type}。`);
      return true;
    }

    function destroyRandomNonSpecialOrb() {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.blank && !cell.special) candidates.push({ x, y });
      }));
      if (!candidates.length) return false;
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      board[target.y][target.x] = null;
      showBoardBombs([target]);
      playBombSfx();
      scheduleBoardRefillAfterBomb();
      return 1;
    }

    function stabilizeBoardMatchesWithoutClearing() {
      for (let attempts = 0; attempts < 30; attempts++) {
        const { cells } = findMatches();
        if (!cells.size) return;
        cells.forEach((key) => {
          const [xText, yText] = key.split(',');
          const x = Number(xText);
          const y = Number(yText);
          if (board[y]?.[x] && !board[y][x].blank && !board[y][x].special) board[y][x] = makeOrb();
        });
      }
    }

    function scheduleBoardRefillAfterBomb({ preventAutoMatches = false, delay = 1000 } = {}) {
      pendingBoardRefillPreventAutoMatches = pendingBoardRefillPreventAutoMatches || preventAutoMatches;
      dropKeys = new Set();
      renderBoard();

      if (boardRefillTimer) {
        window.clearTimeout(boardRefillTimer);
        boardRefillTimer = null;
        boardRefillResolve?.();
      }
      const generation = ++boardRefillGeneration;
      boardRefillPromise = new Promise((resolve) => {
        boardRefillResolve = resolve;
      });
      boardRefillTimer = battleTimeout(() => {
        boardRefillTimer = null;
        dropKeys = collapseBoard();
        if (pendingBoardRefillPreventAutoMatches) stabilizeBoardMatchesWithoutClearing();
        pendingBoardRefillPreventAutoMatches = false;
        renderBoard();
        battleTimeout(() => {
          if (generation !== boardRefillGeneration) return;
          dropKeys = new Set();
          renderBoard();
          boardRefillResolve?.();
          boardRefillResolve = null;
          boardRefillPromise = null;
        }, 360);
      }, delay);
      return boardRefillPromise;
    }

    async function waitForBoardRefill() {
      if (boardRefillPromise) await boardRefillPromise;
    }

    function destroyRandomNonSpecialOrbs(requestedCount, { preventAutoMatches = false, visual = 'bomb' } = {}) {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.blank && !cell.special) candidates.push({ x, y });
      }));
      const count = Math.min(requestedCount, candidates.length);
      const bombedCells = [];
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * candidates.length);
        const target = candidates.splice(index, 1)[0];
        if (!target) continue;
        board[target.y][target.x] = null;
        bombedCells.push(target);
      }
      if (!bombedCells.length) return 0;
      if (visual === 'shatter') {
        showBoardShatters(bombedCells);
        playShatterSfx();
      } else {
        showBoardBombs(bombedCells);
        playBombSfx();
      }
      scheduleBoardRefillAfterBomb({ preventAutoMatches });
      return bombedCells.length;
    }

    function destroyRandomOrbsByColor(color, requestedCount, { allowEquipmentChain = true } = {}) {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.blank && !cell.special && cellColor(cell) === color) candidates.push({ x, y });
      }));
      if (!candidates.length) return 0;
      let destroyed = 0;
      const bombedCells = [];
      const count = Math.min(requestedCount, candidates.length);
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * candidates.length);
        const target = candidates.splice(index, 1)[0];
        if (!target) continue;
        board[target.y][target.x] = null;
        bombedCells.push(target);
        destroyed++;
      }
      if (destroyed > 0) {
        showBoardBombs(bombedCells);
        playBombSfx();
        scheduleBoardRefillAfterBomb();
        if (color === 'red') resolveFireBombEquipmentEffects(destroyed, { allowChain: allowEquipmentChain });
      }
      return destroyed;
    }

    function freezeRandomBoardOrbs(effect) {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.blank && !cell.special && !cell.frozen && !cell.poison) candidates.push({ x, y });
      }));
      if (!candidates.length) return 0;
      const count = Math.min(
        effect.count ?? Math.max(1, Math.round(candidates.length * (effect.boardFraction ?? 0.3333))),
        candidates.length,
      );
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * candidates.length);
        const target = candidates.splice(index, 1)[0];
        board[target.y][target.x].frozen = {
          turns: effect.durationTurns ?? 3,
          canMove: effect.canMoveFrozenOrbs ?? false,
          canMatch: effect.canMatchFrozenOrbs ?? true,
          fresh: true,
          lockIcon: effect.lockedOrbIcon,
        };
      }
      renderBoard();
      const locked = effect.canMatchFrozenOrbs === false;
      showBuffFlash(`${locked ? '鎖鏈珠' : '冰凍珠'} x${count}`);
      addLog(`${locked ? '魔門封鎖' : '冰咒'}封鎖 ${count} 顆珠子，持續 ${effect.durationTurns ?? 3} 回合。`);
      return count;
    }

    function shatterRandomBoardOrbs(effect) {
      const shattered = destroyRandomNonSpecialOrbs(effect.count ?? 10, { preventAutoMatches: true, visual: 'shatter' });
      if (shattered > 0) {
        addLog(`大地震裂震碎 ${shattered} 顆珠子，盤面重新落珠但不觸發消除。`);
      }
      return shattered;
    }

    function blankRandomBoardOrbs(effect) {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.blank && !cell.special && !cell.frozen && !cell.poison) candidates.push({ x, y });
      }));
      const count = Math.min(effect.count ?? 10, candidates.length);
      const blankedCells = [];
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * candidates.length);
        const target = candidates.splice(index, 1)[0];
        if (!target) continue;
        board[target.y][target.x] = {
          blank: {
            turns: effect.durationTurns ?? 3,
            fresh: true,
          },
        };
        blankedCells.push(target);
      }
      if (!blankedCells.length) return 0;
      showBoardShatters(blankedCells);
      playShatterSfx();
      renderBoard();
      showBuffFlash(`空白裂洞 x${blankedCells.length}`);
      addLog(`大地震裂震碎 ${blankedCells.length} 顆珠子，留下空白裂洞 ${effect.durationTurns ?? 3} 回合。`);
      return blankedCells.length;
    }

    function spawnPoisonBoardOrbs(effect) {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.blank && !cell.special && !cell.frozen && !cell.poison) candidates.push({ x, y });
      }));
      if (!candidates.length) return 0;
      const count = Math.min(effect.count ?? 5, candidates.length);
      for (let i = 0; i < count; i++) {
        const index = Math.floor(Math.random() * candidates.length);
        const target = candidates.splice(index, 1)[0];
        const minTurns = effect.minTurns ?? 1;
        const maxTurns = Math.max(minTurns, effect.maxTurns ?? 3);
        const turns = minTurns + Math.floor(Math.random() * (maxTurns - minTurns + 1));
        board[target.y][target.x].poison = {
          turns,
          explosionDamage: effect.explosionDamage ?? 75,
          poisonDamage: effect.poisonDamage ?? 100,
          poisonTurns: effect.poisonTurns ?? 2,
        };
      }
      renderBoard();
      showBuffFlash(`毒珠 x${count}`);
      addLog(`魔戟雷破賜予棋盤 ${count} 顆毒珠。`);
      return count;
    }

    function getMarkableBoardCells({ targetColor = null, excludeFire = false } = {}) {
      const cells = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (!cell || cell.special || cell.blank || cell.poison || cell.frozen || cell.soulLock || cell.snakeSoul || cell.emberMark || cell.flameArrayMark || cell.thunderHoofMark) return;
        const color = cellColor(cell);
        if (excludeFire && color === 'red') return;
        if (targetColor && color !== targetColor) return;
        cells.push({ x, y, color });
      }));
      return cells;
    }

    function pickRandomCells(cells, count) {
      const pool = [...cells];
      const picked = [];
      while (pool.length && picked.length < count) {
        const index = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(index, 1)[0]);
      }
      return picked;
    }

    function applyEmberMarkBoardEffect(effect) {
      const candidates = getMarkableBoardCells();
      const selectedCells = pickRandomCells(candidates, effect.count ?? 4);
      selectedCells.forEach(({ x, y }) => {
        board[y][x].emberMark = {
          turns: effect.durationTurns ?? 3,
          fresh: true,
          icon: effect.icon ?? 'assets/effects/ember_mark_overlay_ai.png',
        };
      });
      renderBoard();
      showBuffFlash(`焰印珠 x${selectedCells.length}`);
      addLog(`赤焰連舞標記 ${selectedCells.length} 顆焰印珠。`);
      return selectedCells.length;
    }

    function applyFlameArrayMarkBoardEffect(effect) {
      const availableColors = [...new Set(getMarkableBoardCells({ excludeFire: true }).map((cell) => cell.color))];
      if (!availableColors.length) return 0;
      const targetColor = effect.targetColor ?? availableColors[Math.floor(Math.random() * availableColors.length)];
      const selectedCells = pickRandomCells(getMarkableBoardCells({ targetColor, excludeFire: true }), effect.count ?? 6);
      selectedCells.forEach(({ x, y }) => {
        board[y][x].flameArrayMark = {
          turns: effect.durationTurns ?? 8,
          fresh: true,
          icon: effect.icon ?? 'assets/effects/flame_array_overlay_ai.png',
          explosionDamage: effect.explosionDamage ?? 150,
          brandBonusDamage: effect.brandBonusDamage ?? 50,
        };
      });
      renderBoard();
      showBuffFlash(`焰陣印記 ${getOrbColorLabel(targetColor)} x${selectedCells.length}`);
      addLog(`焰陣魅舞標記 ${selectedCells.length} 顆${getOrbColorLabel(targetColor)}珠。`);
      return selectedCells.length;
    }

    function applyThunderHoofRouteBoardEffect(effect) {
      const markCount = effect.count ?? 3;
      const selectedCells = pickRandomCells(getMarkableBoardCells(), markCount);
      thunderHoofRoute = {
        turns: effect.durationTurns ?? 3,
        required: effect.requiredClears ?? 3,
        cleared: 0,
        columns: selectedCells.map((cell) => cell.x),
        blankTurns: effect.blankTurns ?? 5,
        fresh: true,
      };
      selectedCells.forEach(({ x, y }) => {
        board[y][x].thunderHoofMark = {
          turns: thunderHoofRoute.turns,
          icon: effect.icon ?? 'assets/effects/thunder_hoof_mark_ai.png',
        };
      });
      renderBoard();
      showBuffFlash(`雷蹄踏陣 ${selectedCells.length} 顆`);
      addLog(`雷蹄踏陣隨機標記 ${selectedCells.length} 顆衝鋒路徑，${thunderHoofRoute.turns} 回合內消除 ${thunderHoofRoute.required} 顆可解除。`);
      return selectedCells.length;
    }

    function lockNonDarkBoardOrbs(effect) {
      let count = 0;
      board.forEach((row) => row.forEach((cell) => {
        if (!cell || cell.blank || cell.special || cell.poison || cell.frozen || cell.snakeSoul) return;
        if (cellColor(cell) === 'dark') return;
        cell.soulLock = {
          turns: effect.durationTurns ?? 2,
          fresh: true,
          icon: effect.icon ?? 'assets/effects/debuff_baqi_soul_bite_ai.png',
        };
        count++;
      }));
      if (count <= 0) return 0;
      renderBoard();
      showBuffFlash(`封鎖非暗珠 x${count}`);
      addLog(`八岐噬魂封鎖 ${count} 顆非暗珠，持續 ${effect.durationTurns ?? 2} 回合。`);
      return count;
    }

    function spawnSnakeSoulBoardOrbs(effect) {
      if (snakeSoulCurse) clearSnakeSoulCurse(false);
      const selectedCells = pickRandomCells(getMarkableBoardCells(), effect.count ?? 6);
      if (!selectedCells.length) return 0;
      snakeSoulCurse = {
        required: effect.requiredLightClears ?? 5,
        cleared: 0,
      };
      selectedCells.forEach(({ x, y }) => {
        board[y][x].snakeSoul = {
          required: snakeSoulCurse.required,
          cleared: 0,
          icon: effect.icon ?? 'assets/effects/snake_soul_orb_overlay_ai.png',
        };
      });
      renderBoard();
      showBuffFlash(`蛇魂珠 x${selectedCells.length}`);
      addLog(`蛇魂纏盤生成 ${selectedCells.length} 顆蛇魂珠；累積消除 ${snakeSoulCurse.required} 顆光珠可解除。`);
      return selectedCells.length;
    }

    function applyEnemyBoardEffect(effect) {
      if (effect.type === 'freeze_random_orbs') return freezeRandomBoardOrbs(effect);
      if (effect.type === 'shatter_random_orbs') return shatterRandomBoardOrbs(effect);
      if (effect.type === 'blank_random_orbs') return blankRandomBoardOrbs(effect);
      if (effect.type === 'spawn_poison_orbs') return spawnPoisonBoardOrbs(effect);
      if (effect.type === 'spawn_ember_marks') return applyEmberMarkBoardEffect(effect);
      if (effect.type === 'spawn_flame_array_marks') return applyFlameArrayMarkBoardEffect(effect);
      if (effect.type === 'spawn_thunder_hoof_route') return applyThunderHoofRouteBoardEffect(effect);
      if (effect.type === 'lock_non_dark_orbs') return lockNonDarkBoardOrbs(effect);
      if (effect.type === 'spawn_snake_soul_orbs') return spawnSnakeSoulBoardOrbs(effect);
      return 0;
    }

    function getBombDamage(destroyedCount) {
      if (destroyedCount <= 0) return 0;
      return calculateBombDamageValue({
        attack: playerHero.attack,
        destroyedCount,
        damagePerOrbAtk: battleBalance.bombDamageAtkPerOrb,
        attackMultiplier: getPlayerAttackMultiplier(),
      });
    }

    function resolveFireBombEquipmentEffects(destroyedCount, { allowChain = true } = {}) {
      if (destroyedCount <= 0) return;

      const healEffect = getEquipmentEffects('fire_bomb_heal_per_count')[0];
      if (healEffect) {
        equipmentBattleState.fireBombsSinceHeal += destroyedCount;
        while (equipmentBattleState.fireBombsSinceHeal >= (healEffect.count ?? 5)) {
          equipmentBattleState.fireBombsSinceHeal -= healEffect.count ?? 5;
          const lowHpHeal = getEquipmentEffects('low_hp_fire_bomb_heal_bonus')
            .find((effect) => playerMaxHp > 0 && playerHp / playerMaxHp < (effect.hpBelow ?? 0));
          const healRate = lowHpHeal?.value ?? healEffect.value ?? 0;
          const healAmount = Math.round(playerMaxHp * healRate);
          healPlayer(healAmount);
          showPlayerGain(healAmount, 'heal');
          showBuffFlash('龍鱗餘火');
        }
      }

      getEquipmentEffects('fire_bomb_follow_up_chance').forEach((effect) => {
        for (let i = 0; i < destroyedCount; i++) {
          if (enemyHp <= 0 || victoryResolving) return;
          if (Math.random() >= (effect.chance ?? 0)) continue;
          const followDamage = Math.round(playerHero.attack * (effect.value ?? 0) * getPlayerAttackMultiplier());
          const dealt = damageEnemy(followDamage);
          animateAttack(dealt, true, 'red', '獵殺');
          addLog(`赤狼長弓獵殺追擊 ${dealt} 傷害。`);
          resolveEnemyDefeat('獵殺');
        }
      });

      if (!allowChain) return;
      getEquipmentEffects('fire_bomb_chain_chance').forEach((effect) => {
        for (let i = 0; i < destroyedCount; i++) {
          if (enemyHp <= 0 || victoryResolving) return;
          if (Math.random() >= (effect.chance ?? 0)) continue;
          const chained = destroyRandomOrbsByColor('red', effect.value ?? 1, { allowEquipmentChain: false });
          const damage = applyBombDamageWithOptions(chained, 'red', false, { recordFireBomb: false });
          if (damage > 0) addLog(`修羅戰意再次引爆 ${chained} 顆火珠。`);
        }
      });
    }

    function applyBombDamage(destroyedCount, color = 'yellow', deferVisual = false) {
      return applyBombDamageWithOptions(destroyedCount, color, deferVisual);
    }

    function applyBombDamageWithOptions(destroyedCount, color = 'yellow', deferVisual = false, { recordFireBomb = true } = {}) {
      if (destroyedCount <= 0) return 0;
      if (recordFireBomb && color === 'red') resolveFireBombEquipmentEffects(destroyedCount);
      const damage = getBombDamage(destroyedCount);
      if (deferVisual) {
        addLog(`炸珠蓄力 ${damage} 傷害。`);
        return damage;
      }
      const dealt = damageEnemy(damage);
      if (!deferVisual) animateAttack(dealt, true, color, '炸珠');
      addLog(`炸珠追加 ${dealt} 傷害。`);
      resolveEnemyDefeat('炸珠');
      return dealt;
    }

    function playHeroVoice(src) {
      audioController.playHeroVoice(src);
    }

    function playPassiveSfx() {
      audioController.playPassiveSfx();
    }

    function playRewardSfx(reward) {
      audioController.playRewardSfx(reward);
    }

    function addPlayerStatus(effect) {
      const existing = playerStatusEffects.find((item) => item.type === effect.type);
      if (existing) {
        existing.turns = Math.max(existing.turns, effect.turns);
        if (effect.type === 'brand') existing.stacks = (existing.stacks ?? 1) + (effect.stacks ?? 1);
        existing.damage = effect.damage ?? existing.damage;
        existing.amount = effect.amount ?? existing.amount;
        existing.icon = effect.icon ?? existing.icon;
        existing.name = effect.name ?? existing.name;
        existing.description = effect.type === 'brand'
          ? `每層使受到攻擊傷害 +20%，目前增加 ${(existing.stacks ?? 1) * 20}%。`
          : effect.description ?? existing.description;
      } else {
        playerStatusEffects.push(effect);
      }
      renderBuffs();
      showBuffFlash(effect.name ?? getPlayerStatusMeta(effect).name);
    }

    function tickPlayerStatuses() {
      let dotDamage = 0;
      playerStatusEffects.forEach((effect) => {
        if (effect.type === 'doom') return;
        if (effect.type === 'burn' || effect.type === 'poison' || effect.type === 'bleed') dotDamage += effect.damage;
        effect.turns--;
      });
      playerStatusEffects = playerStatusEffects.filter((effect) => effect.turns > 0);
      if (dotDamage > 0) {
        playerHp = Math.max(0, playerHp - dotDamage);
        showPlayerDamage(dotDamage);
        addLog(`異常狀態造成 ${dotDamage} 傷害。`);
      }
      renderBuffs();
    }

    function damageEnemy(amount, options = {}) {
      if (victoryResolving || enemyHp <= 0) return 0;
      if (options.fixed) {
        const damage = Math.min(enemyHp, Math.max(0, Math.round(amount)));
        enemyHp = Math.max(0, enemyHp - damage);
        return damage;
      }
      let damage = amount;
      if (enemyVulnerability > 0) {
        damage = Math.round(damage * (1 + enemyVulnerability));
      }
      if (enemyDamageReduction > 0) {
        damage = Math.round(damage * (1 - enemyDamageReduction));
        enemyDamageReduction = 0;
        addLog('敵人的減傷抵消了一部分傷害。');
      }
      const shieldBlocked = Math.min(enemyShield, damage);
      if (shieldBlocked > 0) {
        enemyShield -= shieldBlocked;
        if (enemyShield <= 0) enemyShieldTurns = 0;
        damage -= shieldBlocked;
        addLog(`敵人護盾吸收 ${shieldBlocked} 傷害。`);
      }
      enemyHp = Math.max(0, enemyHp - damage);
      return damage;
    }

    function resolveEnemyDefeat(source = '') {
      if (enemyHp > 0) return false;
      if (!victoryResolving) {
        if (source) addLog(`${getStagePresentation(stage).name} 被擊破。`);
        showVictory();
      }
      return true;
    }

    function showScreen(name) {
      Object.entries(screens).forEach(([key, screen]) => {
        const active = key === name;
        screen.classList.toggle('active', active);
        screen.style.display = active ? 'grid' : 'none';
      });
      if (name === 'battle') battleEl.style.display = 'grid';
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    const talentScreen = createTalentScreenController({
      heroDatabase,
      activeHero,
      talentHeroListEl,
      talentHeroNameEl,
      talentBoardEl,
      talentDetailEl,
      talentResonanceEl,
      activeTalentListEl,
      showScreen,
    });

    const stagePresentation = [
      {
        id: 'mob_yellow_turban_demon_soldier',
        title: '妖兵',
        status: '流血 / 冰咒',
        icon: 'assets/monsters/clean/mob_yellow_turban_demon_soldier_green_clean.png',
      },
      {
        id: 'mob_ghostfire_spear_soldier',
        title: '鬼火槍卒',
        status: '火傷 / 二連刺',
        icon: 'assets/monsters/clean/mob_ghostfire_spear_soldier_green_clean.png',
      },
      {
        id: 'mob_rotten_shell_shield',
        title: '腐甲巨盾',
        status: '護盾 / 空白裂洞',
        icon: 'assets/monsters/clean/MONSTER_3_clean.png',
      },
      {
        id: 'mob_snake_shadow_warlock',
        title: '蛇影術士',
        status: '中毒 / 毒珠',
        icon: 'assets/monsters/clean/MONSTER_4_clean.png',
      },
      {
        id: 'mob_bloodmoon_wolf_general',
        title: '狼牙妖將',
        status: '獵印 / 流血',
        icon: 'assets/monsters/clean/MONSTER__5_clean.png',
      },
      {
        id: 'mob_dark_gate_warrior',
        title: '幽門力士',
        status: '封攻 / 魔門封鎖',
        icon: 'assets/monsters/clean/MONSTER_6_clean.png',
      },
      {
        id: 'mob_red_flame_demon_lady',
        title: '赤焰妖姬',
        status: '焰印 / 妖火重生',
        icon: 'assets/monsters/clean/MONSTER_7_clean.png',
      },
      {
        id: 'mob_black_sun_demon_rider',
        title: '黑曜鬼騎',
        status: '裂甲 / 雷蹄踏陣',
        icon: 'assets/monsters/clean/MONSTER_8_clean.png',
      },
      {
        id: 'mob_baqi_remnant',
        title: '八岐殘魂',
        status: '噬魂 / 蛇魂',
        icon: 'assets/monsters/transparent/MONSTER_9_baqi_remnant_ai.png',
      },
      {
        id: 'mob_hulao_demon_lu',
        title: '虎牢魔呂',
        status: '混沌 / 魔戟雷破',
        icon: 'assets/monsters/clean/MONSTER_10_clean.png',
      },
    ];

    function getStagePresentation(stageInfoOrNo) {
      const stageNo = typeof stageInfoOrNo === 'number' ? stageInfoOrNo : stageInfoOrNo?.stageNo;
      const monster = typeof stageInfoOrNo === 'object' ? stageInfoOrNo : stageData[stageNo - 1];
      const stageId = monster?.id;
      const presentation = stagePresentation.find((item, index) => item.id === stageId || index + 1 === stageNo) ?? {};
      return {
        ...presentation,
        name: monster?.name ?? presentation.name ?? `第 ${stageNo} 關`,
        title: presentation.title ?? monster?.name ?? '妖魔',
        status: presentation.status ?? '妖力',
        icon: presentation.icon ?? (monster ? getMonsterArt(monster) : 'assets/monster-yellow-turban-clean.png'),
      };
    }

    function renderStageMap() {
      stageMapEl.innerHTML = createStageSelectModel(stageData, stageProgress).map((data) => `
        <button class="stage-node ${data.locked ? 'locked' : ''} ${data.cleared ? 'cleared' : ''}" data-stage="${data.stageNo}" type="button" ${data.locked ? 'disabled' : ''}>
          <i aria-hidden="true"><img src="${getStagePresentation(data).icon}" alt=""></i>
          <span>${data.stageNo}. ${getStagePresentation(data).name}</span>
          <small>${data.locked ? '未解鎖' : data.cleared ? '已通關' : getStagePresentation(data).status}</small>
          ${data.locked ? '<b aria-hidden="true">鎖</b>' : ''}
        </button>
      `).join('');
      stageMapEl.querySelectorAll('[data-stage]').forEach((button) => {
        button.addEventListener('click', () => {
          if (button.disabled) return;
          startBattleBgm();
          selectedStage = Number(button.dataset.stage);
          stage = selectedStage;
          logEl.innerHTML = '';
          resultEl.textContent = '';
          clearOrderPassives();
          showScreen('battle');
          startStage(true);
          addLog(`虎牢妖門 ${selectedStage}：${getStagePresentation(selectedStage).name} 出現。`);
        });
      });
    }

    function makeOrb(color = randomColor(), special = false, power = 'cross') {
      return { color, special, power };
    }

    function cellColor(cell) {
      const color = typeof cell === 'string' ? cell : cell?.color;
      if (color === 'enhancedRed') return 'red';
      return color;
    }

    function rawCellColor(cell) {
      return typeof cell === 'string' ? cell : cell?.color;
    }

    function cellClass(cell) {
      if (!cell) return 'empty';
      if (cell.blank) return 'empty blank-orb';
      const raw = rawCellColor(cell);
      const frozen = cell?.frozen ? ` frozen${cell.frozen.canMatch === false ? ' locked-orb' : ''}` : '';
      const soulLock = cell?.soulLock ? ' soul-locked-orb' : '';
      const snakeSoul = cell?.snakeSoul ? ' snake-soul-orb' : '';
      const poison = cell?.poison ? ' poison-orb' : '';
      const flameMark = cell?.emberMark
        ? ' ember-marked-orb'
        : cell?.flameArrayMark
          ? ' flame-array-marked-orb'
          : cell?.thunderHoofMark
            ? ' thunder-hoof-marked-orb'
            : '';
      if (raw === 'enhancedRed') return `red extra-fire${frozen}${soulLock}${snakeSoul}${poison}${flameMark}`;
      if (raw === 'rainbow') return `rainbow${frozen}${soulLock}${snakeSoul}${poison}${flameMark}`;
      return `${cellColor(cell)}${frozen}${soulLock}${snakeSoul}${poison}${flameMark}`;
    }

    function matchColor(cell) {
      if (cell?.special) return null;
      if (cell?.blank) return null;
      if (cell?.poison) return null;
      if (cell?.soulLock) return null;
      if (cell?.snakeSoul) return null;
      if (cell?.frozen && cell.frozen.canMatch === false) return null;
      const color = cellColor(cell);
      return color === 'rainbow' ? null : color;
    }

    function createBoard() {
      if (boardRefillTimer) {
        window.clearTimeout(boardRefillTimer);
        boardRefillTimer = null;
      }
      boardRefillResolve?.();
      boardRefillResolve = null;
      boardRefillPromise = null;
      boardRefillGeneration++;
      pendingBoardRefillPreventAutoMatches = false;
      snakeSoulCurse = null;
      board = Array.from({ length: height }, () => Array.from({ length: width }, () => makeOrb()));
      while (findMatches().groups.length) {
        board = Array.from({ length: height }, () => Array.from({ length: width }, () => makeOrb()));
      }
      selected = null;
      dropKeys = new Set();
      renderBoard();
    }

    function renderTeam() {
      teamEl.innerHTML = renderHeroRow({
        hero: playerHero,
        ready: canActivateHeroSkill(playerHero),
        equipmentLabels: getEquipmentSlotLabels(equipmentProgress),
        equipmentItems: equipmentProgress.slots,
      });
      bindHeroCardSkillPress(teamEl.querySelector('.hero-card'));
      bindEquipmentSlotPress(teamEl.querySelectorAll('[data-equipment-slot]'));
    }

    function bindEquipmentSlotPress(slotEls) {
      slotEls.forEach((slotEl) => {
        slotEl.addEventListener('click', () => openEquipmentDetailDialog(slotEl.dataset.equipmentSlot));
      });
    }

    function bindHeroCardSkillPress(heroCardEl) {
      if (!heroCardEl) return;
      const clearPressTimer = () => {
        if (!heroCardPressTimer) return;
        window.clearTimeout(heroCardPressTimer);
        heroCardPressTimer = null;
      };
      heroCardEl.addEventListener('pointerdown', (event) => {
        if (event.button && event.button !== 0) return;
        heroCardLongPressFired = false;
        heroCardEl.setPointerCapture?.(event.pointerId);
        clearPressTimer();
        heroCardPressTimer = window.setTimeout(() => {
          heroCardLongPressFired = true;
          heroCardPressTimer = null;
          openSkillDialog();
        }, 2000);
      });
      heroCardEl.addEventListener('pointerup', (event) => {
        heroCardEl.releasePointerCapture?.(event.pointerId);
        const wasLongPress = heroCardLongPressFired;
        clearPressTimer();
        if (wasLongPress) return;
        tryActivateHeroSkillFromCard();
      });
      heroCardEl.addEventListener('pointercancel', clearPressTimer);
      heroCardEl.addEventListener('pointerleave', clearPressTimer);
      heroCardEl.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    function tryActivateHeroSkillFromCard() {
      if (busy || enemyHp <= 0 || playerHp <= 0) return;
      if (!canActivateHeroSkill(playerHero)) {
        showBuffFlash('能量不足');
        addLog(`能量不足：${playerHero.energy}/${playerHero.maxEnergy}`);
        return;
      }
      activateHeroSkill('hero');
    }

    function openSkillDialog() {
      if (busy || enemyHp <= 0 || playerHp <= 0) return;
      const model = createHeroSkillDialogModel(playerHero);
      pendingSkillColor = model.pendingSkillColor;
      skillDialogImageEl.src = model.imageSrc;
      skillDialogImageEl.alt = model.imageAlt;
      skillDialogTitleEl.textContent = model.title;
      skillDialogHeroEl.textContent = model.subtitle;
      skillDialogDescEl.textContent = model.description;
      skillConfirmEl.disabled = !model.ready;
      skillConfirmEl.toggleAttribute('hidden', !model.ready);
      skillDialogEl.classList.toggle('skill-ready', model.ready);
      skillConfirmEl.textContent = model.confirmText;
      skillDialogEl.classList.add('show');
    }

    function closeSkillDialog() {
      pendingSkillColor = null;
      skillDialogEl.classList.remove('show');
      skillDialogEl.classList.remove('skill-ready');
      skillConfirmEl.disabled = false;
      skillConfirmEl.removeAttribute('hidden');
      skillConfirmEl.textContent = '發動';
    }

    function pickRewards(count = 3) {
      return pickOrderRewards(rogueRewards, count);
    }

    function pickDivineFlags(count = 3) {
      return pickDivineRewards(divineFlagsPack.flags, count);
    }

    function pickStageEquipmentRewards(count = 3) {
      return pickEquipmentRewards(equipmentRewards, count, equipmentProgress);
    }

    function renderEquipmentRewardIcon(equipment, className = 'equipment-reward-icon') {
      if (equipment.icon) return `<img class="${className}" src="${equipment.icon}" alt="${equipment.name}">`;
      const slotLabel = equipmentSlots[equipment.slot] ?? '裝備';
      const rarityClass = equipment.rarity === 'SR' ? 'is-sr' : 'is-r';
      return `
        <span class="${className} equipment-fallback-icon ${rarityClass}" aria-hidden="true">
          <b>${equipment.rarity}</b>
          <i>${slotLabel}</i>
        </span>
      `;
    }

    function openRewardDialog(cell) {
      rewardSourceCell = cell;
      rewardMode = 'rogue';
      rewardDialogEl.querySelector('strong').textContent = '選擇軍令';
      rewardDialogEl.querySelector('.roster-flavor').textContent = '選擇一個 BUFF，本次探索立即生效。';
      rewardOptionsEl.innerHTML = pickRewards(3).map((reward) => `
        <button class="reward-card" data-reward="${reward.id}" type="button">
          <img src="${reward.icon}" alt="${reward.name}">
          <strong>${reward.name}</strong>
          <span>${reward.description}</span>
        </button>
      `).join('');
      rewardOptionsEl.querySelectorAll('[data-reward]').forEach((button) => {
        button.addEventListener('click', () => chooseReward(button.dataset.reward));
      });
      rewardDialogEl.classList.add('show');
    }

    function openDivineFlagDialog(cell) {
      rewardSourceCell = cell;
      rewardMode = 'divine';
      rewardDialogEl.querySelector('strong').textContent = '選擇神令旗';
      rewardDialogEl.querySelector('.roster-flavor').textContent = `5 消以上觸發神令旗，選擇一種時空力量。`;
      rewardOptionsEl.innerHTML = pickDivineFlags(3).map((flag) => `
        <button class="reward-card" data-reward="${flag.id}" type="button">
          <img src="${flag.icon}" alt="${flag.name}">
          <strong>${flag.name}</strong>
          <small>${flag.category}</small>
          <span>${flag.description}</span>
        </button>
      `).join('');
      rewardOptionsEl.querySelectorAll('[data-reward]').forEach((button) => {
        button.addEventListener('click', () => chooseDivineFlag(button.dataset.reward));
      });
      rewardDialogEl.classList.add('show');
    }

    function openEquipmentRewardDialog() {
      rewardSourceCell = null;
      rewardMode = 'equipment';
      const rewards = pickStageEquipmentRewards(3);

      if (!rewards.length) {
        victoryPanelEl.classList.add('show');
        return;
      }

      rewardDialogEl.querySelector('strong').textContent = '選擇通關獎勵';
      rewardDialogEl.querySelector('.roster-flavor').textContent = '選擇一件裝備加入本章配置。武器、甲冑、兵符、寶石只能裝在對應欄位。';
      rewardOptionsEl.innerHTML = `
        ${rewards.map((equipment) => `
        <button class="reward-card equipment-reward-card" data-equipment="${equipment.id}" type="button">
          ${renderEquipmentRewardIcon(equipment)}
          <small>${equipment.rarity} / ${equipment.school}</small>
          <strong>${equipment.name}</strong>
          <em>${equipment.skill.name}</em>
          <span>${equipment.skill.description}</span>
        </button>
        `).join('')}
        <button class="equipment-reward-skip" type="button">不拿裝備</button>
      `;
      rewardOptionsEl.querySelectorAll('[data-equipment]').forEach((button) => {
        button.addEventListener('click', () => chooseEquipmentReward(button.dataset.equipment));
      });
      rewardOptionsEl.querySelector('.equipment-reward-skip')?.addEventListener('click', skipEquipmentReward);
      rewardDialogEl.classList.add('show');
    }

    function openEquipmentDetailDialog(slot) {
      if (rewardDialogEl.classList.contains('show') && rewardMode !== 'equipmentDetail') return;
      const equipment = equipmentProgress.slots[slot];
      const slotLabel = equipmentSlots[slot] ?? '裝備';

      if (!equipment) {
        showBuffFlash(`${slotLabel}尚未裝備`);
        return;
      }

      rewardMode = 'equipmentDetail';
      rewardSourceCell = null;
      rewardDialogEl.querySelector('strong').textContent = `${slotLabel}詳情`;
      rewardDialogEl.querySelector('.roster-flavor').textContent = '點擊空白處關閉。';
      rewardOptionsEl.innerHTML = `
        <article class="reward-card equipment-detail-card">
          ${renderEquipmentRewardIcon(equipment, 'equipment-detail-icon')}
          <small>${equipment.rarity} / ${equipment.school}</small>
          <strong>${equipment.name}</strong>
          <em>${equipment.skill.name}</em>
          <span>${equipment.skill.description}</span>
          <button class="equipment-detail-close" type="button">關閉</button>
        </article>
      `;
      rewardOptionsEl.querySelector('.equipment-detail-close')?.addEventListener('click', closeRewardDialog);
      rewardDialogEl.classList.add('show');
    }

    function closeRewardDialog() {
      rewardSourceCell = null;
      rewardMode = 'rogue';
      rewardDialogEl.classList.remove('show');
      rewardDialogEl.classList.remove('battle-help-dialog');
    }

    function renderBattleHelpCards(sections) {
      return sections.map((section) => `
        <article class="reward-card battle-help-card">
          <strong>${section.title}</strong>
          <span>${section.lines.map((line) => `<em>${line}</em>`).join('')}</span>
        </article>
      `).join('');
    }

    function openBattleHelpDialog(kind) {
      closeBattleQuickMenu();
      rewardSourceCell = null;
      rewardMode = 'help';
      rewardDialogEl.classList.add('battle-help-dialog');
      const titleEl = rewardDialogEl.querySelector('strong');
      const flavorEl = rewardDialogEl.querySelector('.roster-flavor');
      const help = {
        orb: {
          title: '消除說明',
          flavor: '這裡列出五色珠的基本效果；英雄、武器、天賦、軍令、神令可能再追加額外效果。',
          sections: [
            {
              title: '屬性珠',
              lines: [
                '火珠：造成攻擊傷害，3/4/5/6/7+ 消 = 1/1.2/1.5/2/3 倍攻擊。',
                '木珠：獲得護盾，3/4/5/6/7+ 消 = 玩家最大 HP 的 5/10/15/20/25%。',
                '雷珠：獲得英雄能量，3/4/5/6/7+ 消 = 10/14/20/26/30。',
                '光珠：回復 HP，3/4/5/6/7+ 消 = 回復力的 10/12/15/20/25%。4 消以上會先清除 1 個負面狀態；沒有可清除狀態時，額外回復玩家最大 HP 的 5%。',
                '暗珠：觸發毒箭，使敵人中毒。3/4/5/6/7+ 消 = 中毒 1/2/3/4/5 回合；重複上毒會累加回合。',
                '毒傷：每回合傷害 = 英雄攻擊力 10% x 毒傷 Combo 倍率；再次上毒時，每回合毒傷保留較高的傷害值。',
              ],
            },
            {
              title: 'Combo 與大型消除',
              lines: [
                '一般 Combo 倍率會影響攻擊、護盾、英雄能量與回復：1/2/3/4/5/6/7 Combo = 1/1.15/1.3/1.45/1.6/1.75/1.9 倍。',
                '毒傷 Combo 倍率只影響毒箭的每回合毒傷：1/2/3/4/5/6/7+ Combo = 1.1/1.4/1.8/2.5/3/3.5/4 倍。',
                '單次消除 8 顆以上：奇策連鎖，軍令 +1、神令 +1。',
                '單次消除 10 顆以上：額外獲得 1 個 BONUS 效果。',
              ],
            },
          ],
        },
        order: {
          title: '軍令說明',
          flavor: '軍令滿時可選擇一次戰術效果；消除 4 顆以上會增加軍令，奇策連鎖也會額外增加。',
          sections: [
            {
              title: '目前軍令',
              lines: [
                '猛攻令：攻擊 +25%，持續 5 回合；取得後開啟戰意，被動紅珠 3 消以上可疊攻擊 +5%，最多 10 層。',
                '追擊令：持續 3 回合；攻擊後追加 50% 攻擊力追擊。取得後開啟被動追擊，紅珠 3 消以上有 30% 機率追加 50% 攻擊力追擊。',
                '連擊令：持續 5 回合；Combo 傷害提升，且 Combo 3/5 以上會追加連擊傷害。',
                '疾風令：獲得一次額外移動。',
                '妖術令：選擇並轉換 10 顆珠子。',
              ],
            },
          ],
        },
        divine: {
          title: '神令說明',
          flavor: '神令滿時可選擇一次神令旗效果；消除 5 顆以上會增加神令，奇策連鎖也會額外增加。',
          sections: [
            {
              title: '目前神令',
              lines: [
                '火燒連環令：轉換火珠；消除時引爆十字範圍，炸珠傷害 x2.5。',
                '東風令：火珠天降提高，火珠變為強化火珠，持續 3 回合。',
                '青龍現世：立即恢復最大 HP 50%，3 回合內所有消珠附帶回血，回血效果 x2。',
                '七星燈：生成 5 顆彩虹珠。',
                '萬箭齊發：造成攻擊力 2.5 倍傷害，並附加燃燒與中毒。',
                '八陣圖：無敵、減傷，並讓所有屬性珠也產生護盾。',
                '空城計：降低敵人攻擊。',
                '天降神雷：摧毀隨機一種顏色的所有珠。',
                '奇門遁甲：交換兩種珠色。',
                '天公將軍：雷珠與光珠也可攻擊，並讓任意 3 消觸發天公之怒。',
              ],
            },
          ],
        },
      }[kind];
      if (!help) return;
      if (titleEl) titleEl.textContent = help.title;
      if (flavorEl) flavorEl.textContent = help.flavor;
      rewardOptionsEl.innerHTML = `
        ${renderBattleHelpCards(help.sections)}
        <button class="reward-skip battle-help-close" type="button">關閉</button>
      `;
      rewardOptionsEl.querySelector('.battle-help-close')?.addEventListener('click', closeRewardDialog);
      rewardDialogEl.classList.add('show');
    }

    function skipEquipmentReward() {
      closeRewardDialog();
      showBuffFlash('未選裝備');
      addLog('本次通關未選擇裝備。');
      busy = false;
      nextStage();
    }

    function openOrderCommandDialog() {
      if (busy) return;
      if (!canUseOrder(orderGauge, battleBalance.orderGaugeMax)) {
        showBuffFlash('軍令尚未充滿');
        return;
      }
      busy = true;
      openRewardDialog({ power: 'order' });
    }

    function openDivineCommandDialog() {
      if (busy) return;
      if (!canUseDivine(divineGauge, battleBalance.divineGaugeMax)) {
        showBuffFlash('神令尚未充滿');
        return;
      }
      busy = true;
      openDivineFlagDialog({ power: 'divine' });
    }

    function chooseReward(id) {
      const reward = rogueRewards.find((item) => item.id === id);
      if (!reward) return;
      closeRewardDialog();
      orderGauge = 0;
      renderCommandGauges();
      playRewardSfx(reward);
      applyOrderRewardEffect(reward, {
        convertRandomBoardColor,
        convertRandomOrbsToChosenColor,
        addOrRefreshBuff,
        grantOrderPassive,
        showBuffFlash,
        addLog,
      });
      updateStats();
      renderTeam();
      busy = false;
    }

    async function chooseDivineFlag(id) {
      const flag = divineFlagsPack.flags.find((item) => item.id === id);
      if (!flag) return;
      closeRewardDialog();
      divineGauge = 0;
      renderCommandGauges();
      await applyDivineFlag(flag);
      addLog(`神令旗「${flag.name}」：${flag.description}`);
      updateStats();
      renderTeam();
      renderBoard();
      if (resolveEnemyDefeat(flag.name)) return;
      busy = false;
    }

    function getBoardColors() {
      return [...new Set(board.flat().filter((cell) => cell && !cell.blank && !cell.special).map((cell) => cellColor(cell)).filter((color) => colors.some((item) => item.id === color)))];
    }

    function getRandomBoardColor(except = null) {
      const available = getBoardColors().filter((color) => color !== except);
      return available[Math.floor(Math.random() * available.length)] || colors[0].id;
    }

    function convertBoardColor(from, to) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x] && !board[y][x].blank && !board[y][x].special && cellColor(board[y][x]) === from) board[y][x].color = to;
        }
      }
    }

    function spawnRandomOrbs(color, count) {
      const spots = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x] && !board[y][x].blank && !board[y][x]?.special) spots.push({ x, y });
        }
      }
      for (let i = 0; i < count && spots.length; i++) {
        const index = Math.floor(Math.random() * spots.length);
        const spot = spots.splice(index, 1)[0];
        board[spot.y][spot.x] = makeOrb(color);
      }
    }

    function convertRandomOrbsToColor(color, count) {
      const spots = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x] && !board[y][x].blank && !board[y][x].special && rawCellColor(board[y][x]) !== color) spots.push({ x, y });
        }
      }
      let converted = 0;
      const convertedCells = [];
      for (let i = 0; i < count && spots.length; i++) {
        const index = Math.floor(Math.random() * spots.length);
        const spot = spots.splice(index, 1)[0];
        board[spot.y][spot.x] = makeOrb(color);
        convertedCells.push(spot);
        converted++;
      }
      return { count: converted, cells: convertedCells };
    }

    async function destroyBoardColor(color) {
      let destroyed = 0;
      const bombedCells = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x] && !board[y][x].blank && !board[y][x].special && cellColor(board[y][x]) === color) {
            board[y][x] = null;
            bombedCells.push({ x, y });
            destroyed++;
          }
        }
      }
      showBoardBombs(bombedCells);
      if (destroyed > 0) playBombSfx();
      if (destroyed > 0) await scheduleBoardRefillAfterBomb();
      addOrderGauge(destroyed);
      addDivineGauge(destroyed);
      addOverflowRewards(destroyed);
      applyBombDamage(destroyed, 'yellow');
      return destroyed;
    }

    function destroySurroundingOrbsForFireAttack(cells) {
      if (divineStates.fireAttackBombTurns <= 0) return 0;
      const matchedCells = [...cells];
      const matched = new Set(matchedCells.map(({ x, y }) => `${x},${y}`));
      const targets = new Map();
      const crossOffsets = [
        { dx: 0, dy: 0 },
        { dx: 0, dy: -1 },
        { dx: 1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
      ];
      matchedCells.forEach(({ x, y }) => {
        crossOffsets.forEach(({ dx, dy }) => {
          const tx = x + dx;
          const ty = y + dy;
          const key = `${tx},${ty}`;
          if (tx < 0 || tx >= width || ty < 0 || ty >= height || matched.has(key)) return;
          const cell = board[ty][tx];
          if (!cell || cell.special) return;
          targets.set(key, { x: tx, y: ty });
        });
      });
      const bombedCells = [...targets.values()];
      bombedCells.forEach(({ x, y }) => {
        board[y][x] = null;
      });
      if (bombedCells.length > 0) {
        showBoardBombs(bombedCells);
        playBombSfx();
        addLog(`火燒連環令引爆十字範圍 ${bombedCells.length} 顆珠。`);
      }
      return bombedCells.length;
    }

    function swapBoardColors(first, second) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!board[y][x] || board[y][x].special) continue;
          if (cellColor(board[y][x]) === first) board[y][x].color = second;
          else if (cellColor(board[y][x]) === second) board[y][x].color = first;
        }
      }
    }

    async function applyDivineFlag(flag) {
      await applyDivineFlagEffect(flag, {
        traitRules,
        battleBalance,
        playerHero,
        playerMaxHp,
        divineStates,
        getCurrentStage,
        getRandomBoardColor,
        convertBoardColor,
        spawnRandomOrbs,
        damageEnemy,
        animateAttack,
        showAttackEffect,
        showBuffFlash,
        gainPlayerHeal,
        destroyBoardColor,
        swapBoardColors,
        addEnemyBurn,
        addEnemyPoison,
        resultEl,
      });
      flashResult();
      renderDivineStatusBanner();
    }

    function convertRandomBoardColor() {
      const available = [...new Set(board.flat().filter((cell) => cell && !cell.blank && !cell.special).map((cell) => cellColor(cell)).filter(Boolean))];
      if (available.length < 2) return;
      const from = available[Math.floor(Math.random() * available.length)];
      let to = from;
      while (to === from) to = colors[Math.floor(Math.random() * colors.length)].id;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x] && !board[y][x].blank && !board[y][x].special && cellColor(board[y][x]) === from) board[y][x].color = to;
        }
      }
      renderBoard();
      resultEl.textContent = `妖術令：${traitRules[from].label} 轉為 ${traitRules[to].label}`;
      flashResult();
    }

    function convertRandomOrbsToChosenColor(count = 10) {
      pendingOrderColorConvert = { count };
      selected = null;
      renderBoard();
      resultEl.textContent = '妖術令：點擊棋盤上一顆珠子，隨機 10 顆轉成該顏色。';
      flashResult();
      return { pending: true, label: '等待選色', count };
    }

    function resolvePendingOrderColorConvert(x, y) {
      if (!pendingOrderColorConvert) return false;
      const cell = board[y][x];
      if (!cell) return true;
      const targetColor = rawCellColor(cell) === 'enhancedRed' ? 'red' : cellColor(cell);
      if (!targetColor || targetColor === 'rainbow') {
        showBuffFlash('請選擇一般顏色珠');
        return true;
      }
      const { count } = pendingOrderColorConvert;
      pendingOrderColorConvert = null;
      const result = convertRandomOrbsToColor(targetColor, count);
      stabilizeBoardMatchesWithoutClearing();
      renderBoard();
      showBoardConversions(result.cells);
      const label = getOrbColorLabel(targetColor);
      resultEl.textContent = `妖術令：隨機 ${result.count} 顆轉為${label}珠`;
      flashResult();
      showBuffFlash(`妖術令：${label}珠 x${result.count}`);
      addLog(`妖術令：指定${label}珠，隨機轉換 ${result.count} 顆。`);
      updateStats();
      renderTeam();
      return true;
    }

    function renderRoster() {
      rosterGridEl.innerHTML = heroDatabase.heroes.map((hero) => `
        <article class="hero-profile-card">
          <img src="${hero.art.card}" alt="${hero.name} 卡片">
          <div class="hero-profile-actions">
            <button class="hero-talent-button" data-hero-id="${hero.id}" type="button">天賦</button>
          </div>
        </article>
      `).join('');
      rosterGridEl.querySelectorAll('[data-hero-id]').forEach((button) => {
        button.addEventListener('click', () => talentScreen.open(button.dataset.heroId));
      });
    }

    function renderBoard(matched = new Set()) {
      boardEl.innerHTML = '';
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const button = document.createElement('button');
          const key = `${x},${y}`;
          const cell = board[y][x];
          const special = cell?.special ? ' special' : '';
          const power = cell?.special && cell?.power === 'sameColor' ? ' same-color-token' : '';
          const drop = dropKeys.has(key) ? ' drop' : '';
          const swapClass = getSwapClass(x, y);
          button.className = `orb gem gem-cell ${cellClass(cell)}${special}${power}${drop}${swapClass}${selected && selected.x === x && selected.y === y ? ' selected' : ''}${matched.has(key) ? ' matched' : ''}`;
          if (cell?.blank) {
            button.title = `空白裂洞 ${cell.blank.turns} 回合`;
            const timer = document.createElement('span');
            timer.className = 'blank-orb-turns';
            timer.textContent = cell.blank.turns;
            button.appendChild(timer);
          }
          if (cell?.frozen) {
            if (cell.frozen.lockIcon || cell.frozen.canMatch === false) {
              button.title = `鎖鏈封鎖 ${cell.frozen.turns} 回合`;
              const lock = document.createElement('span');
              lock.className = 'locked-orb-overlay';
              lock.style.backgroundImage = `url("${cell.frozen.lockIcon ?? 'assets/effects/orb_lock_chain_overlay_ai.png'}")`;
              button.appendChild(lock);
              const timer = document.createElement('span');
              timer.className = 'locked-orb-turns';
              timer.textContent = cell.frozen.turns;
              button.appendChild(timer);
            } else {
              const frozenSrc = frozenOrbAssetByColor[rawCellColor(cell)] ?? frozenOrbAssetByColor[cellColor(cell)];
              if (frozenSrc) button.style.backgroundImage = `url("${frozenSrc}")`;
              button.title = `冰凍 ${cell.frozen.turns} 回合`;
            }
          }
          if (cell?.poison) {
            button.style.backgroundImage = 'url("assets/POSION_CLEAN.png")';
            button.title = `毒珠 ${cell.poison.turns} 回合後爆炸`;
            const timer = document.createElement('span');
            timer.className = 'poison-orb-turns';
            timer.textContent = cell.poison.turns;
            button.appendChild(timer);
          }
          if (cell?.soulLock) {
            button.title = `噬魂封鎖 ${cell.soulLock.turns} 回合`;
            const mark = document.createElement('span');
            mark.className = 'soul-lock-overlay';
            mark.style.backgroundImage = `url("${cell.soulLock.icon ?? 'assets/effects/debuff_baqi_soul_bite_ai.png'}")`;
            button.appendChild(mark);
            const timer = document.createElement('span');
            timer.className = 'soul-lock-turns';
            timer.textContent = cell.soulLock.turns;
            button.appendChild(timer);
          }
          if (cell?.snakeSoul) {
            const cleared = snakeSoulCurse?.cleared ?? cell.snakeSoul.cleared ?? 0;
            const required = snakeSoulCurse?.required ?? cell.snakeSoul.required ?? 5;
            button.title = `蛇魂珠：不可消除，可移動。光珠 ${cleared}/${required} 解除`;
            const mark = document.createElement('span');
            mark.className = 'snake-soul-overlay';
            mark.style.backgroundImage = `url("${cell.snakeSoul.icon ?? 'assets/effects/snake_soul_orb_overlay_ai.png'}")`;
            button.appendChild(mark);
            const timer = document.createElement('span');
            timer.className = 'snake-soul-progress';
            timer.textContent = `${cleared}/${required}`;
            button.appendChild(timer);
          }
          if (cell?.emberMark) {
            button.title = `焰印珠 ${cell.emberMark.turns} 回合後爆發`;
            const mark = document.createElement('span');
            mark.className = 'ember-mark-overlay';
            mark.style.backgroundImage = `url("${cell.emberMark.icon ?? 'assets/effects/ember_mark_overlay_ai.png'}")`;
            button.appendChild(mark);
            const timer = document.createElement('span');
            timer.className = 'ember-mark-turns';
            timer.textContent = cell.emberMark.turns;
            button.appendChild(timer);
          }
          if (cell?.flameArrayMark) {
            button.title = `焰陣印記 ${cell.flameArrayMark.turns} 回合後爆發`;
            const mark = document.createElement('span');
            mark.className = 'flame-array-overlay';
            mark.style.backgroundImage = `url("${cell.flameArrayMark.icon ?? 'assets/effects/flame_array_overlay_ai.png'}")`;
            button.appendChild(mark);
            const timer = document.createElement('span');
            timer.className = 'flame-array-turns';
            timer.textContent = cell.flameArrayMark.turns;
            button.appendChild(timer);
          }
          if (cell?.thunderHoofMark) {
            const cleared = thunderHoofRoute?.cleared ?? 0;
            const required = thunderHoofRoute?.required ?? 3;
            button.title = `雷蹄踏陣 ${cell.thunderHoofMark.turns} 回合，已消除 ${cleared}/${required}`;
            const mark = document.createElement('span');
            mark.className = 'thunder-hoof-overlay';
            mark.style.backgroundImage = `url("${cell.thunderHoofMark.icon ?? 'assets/effects/thunder_hoof_mark_ai.png'}")`;
            button.appendChild(mark);
            const timer = document.createElement('span');
            timer.className = 'thunder-hoof-turns';
            timer.textContent = cell.thunderHoofMark.turns;
            button.appendChild(timer);
          }
          button.setAttribute('aria-label', `${x + 1},${y + 1}`);
          if (!cell || cell?.blank) button.disabled = true;
          button.addEventListener('click', () => clickOrb(x, y));
          boardEl.appendChild(button);
        }
      }
    }

    function clickOrb(x, y) {
      if (busy || boardRefillTimer || enemyHp <= 0 || playerHp <= 0) return;
      if (resolvePendingOrderColorConvert(x, y)) return;
      if (board[y][x]?.blank) {
        selected = null;
        showBuffFlash('空白裂洞無法操作');
        renderBoard();
        return;
      }
      if (board[y][x]?.frozen && board[y][x].frozen.canMove === false) {
        selected = null;
        showBuffFlash(board[y][x].frozen.canMatch === false ? '鎖鏈珠無法移動' : '冰凍珠無法移動');
        renderBoard();
        return;
      }
      if (board[y][x]?.special && !selected) {
        activateSpecial(x, y);
        return;
      }
      if (!selected) {
        selected = { x, y };
        renderBoard();
        return;
      }

      const dx = Math.abs(selected.x - x);
      const dy = Math.abs(selected.y - y);
      const extraSwapRange = equipmentBattleState.skyEyeUsedThisTurn ? 0 : sumEquipmentEffect('first_move_extra_swap_range');
      const maxSwapDistance = 1 + extraSwapRange;
      if (dx + dy < 1 || dx + dy > maxSwapDistance) {
        selected = { x, y };
        renderBoard();
        return;
      }

      const first = selected;
      const second = { x, y };
      if (board[first.y][first.x]?.frozen?.canMove === false || board[second.y][second.x]?.frozen?.canMove === false) {
        selected = null;
        const locked = board[first.y][first.x]?.frozen?.canMatch === false || board[second.y][second.x]?.frozen?.canMatch === false;
        showBuffFlash(locked ? '鎖鏈珠無法移動' : '冰凍珠無法移動');
        renderBoard();
        return;
      }
      busy = true;
      if (extraSwapRange > 0 && dx + dy > 1) {
        equipmentBattleState.skyEyeUsedThisTurn = true;
        showBuffFlash('天眼步');
      } else if (extraSwapRange > 0) {
        equipmentBattleState.skyEyeUsedThisTurn = true;
      }
      swap(first, second);
      swapAnim = { first, second };
      selected = null;
      renderBoard();
      const matches = findMatches();
      if (!matches.groups.length) {
        battleTimeout(async () => {
          swapAnim = null;
          renderBoard();
          resultEl.textContent = '未形成消除，消耗 1 回合。';
          flashResult();
          addLog('未形成三消，盤面保留並消耗 1 回合。');
          await resolvePlayerTurnEnd({ allowExtraMove: false });
        }, 170);
        return;
      }
      battleTimeout(() => {
        swapAnim = null;
        handleMove({ x, y });
      }, 170);
    }

    async function resolvePlayerTurnEnd({ allowExtraMove = true } = {}) {
      tickPlayerStatuses();
      const poisonOrbsKilled = tickPoisonOrbs();
      const chaosDoomKilled = tickChaosDoomCounter();
      tickRogueTurnBuffs();
      if (poisonOrbsKilled || chaosDoomKilled || playerHp <= 0) {
        addLog('玩家倒下了。');
        showDefeat();
        return;
      }
      const gale = getBuff('extra_move');
      if (allowExtraMove && gale) {
        activeBuffs = activeBuffs.filter((buff) => buff.id !== gale.id);
        renderBuffs();
        resultEl.textContent = '疾風令：獲得一次額外移動。';
        flashResult();
        showBuffFlash('疾風再動');
        updateStats();
        renderTeam();
        busy = false;
        return;
      }
      enemyTurn--;
      enemySkillCooldowns = tickEnemySkillCooldowns(enemySkillCooldowns);
      battleRound = Math.min(20, battleRound + 1);
      const readyEnemySkill = getReadyEnemySkill(getCurrentStage(), enemySkillCooldowns);
      if (enemyHp <= 0) {
        await showVictory();
        return;
      } else if (readyEnemySkill || enemyTurn <= 0) {
        try {
          await performEnemyAction(readyEnemySkill);
        } catch (error) {
          console.error('Enemy action failed:', error);
          addLog('敵方行動中斷，回合繼續。');
        }
        if (readyEnemySkill) enemySkillCooldowns = resetEnemySkillCooldown(enemySkillCooldowns, readyEnemySkill);
        if (enemyTurn <= 0) enemyTurn = getMonsterTurnCooldown(getCurrentStage());
        if (enemyHp <= 0) {
          await showVictory();
          return;
        }
        if (playerHp <= 0) {
          showDefeat();
          return;
        }
      }
      tickBuffs();
      if (playerHp <= 0) {
        showDefeat();
        return;
      }
      if (enemyHp <= 0) {
        await showVictory();
        return;
      }
      if (enemyHp > 0 && playerHp > 0) applyTurnStartEquipmentEffects();
      updateStats();
      renderTeam();
      busy = false;
    }

    async function handleMove(lastMove = null) {
      busy = true;
      equipmentTurnAttackBonus = 0;
      let totalDamage = 0;
      let combo = 0;
      let fourMatchCount = 0;
      let fiveMatchCount = 0;
      let totalClearedThisMove = 0;
      const attackEvents = [];
      const pendingTraits = [];
      const fireAttackSealed = isFireAttackSealed();
      let fireSealNotified = false;

      while (true) {
        const { groups, cells } = findMatches();
        if (!groups.length) break;
        combo++;
        if (combo >= 2) showComboPop(combo);
        const specialCreates = getSpecialCreates(groups, lastMove);
        addOrderGauge(cells.length);
        addDivineGauge(cells.length);
        addOverflowRewards(cells.length);
        totalClearedThisMove += cells.length;
        const comboCounts = {};
        const comboEnhanced = {};
        groups.forEach((group) => {
          const color = group.map((cell) => cellColor(board[cell.y][cell.x])).find((item) => item !== 'rainbow') || cellColor(board[group[0].y][group[0].x]);
          if (group.length === 4) fourMatchCount++;
          if (group.length >= 5) fiveMatchCount++;
          comboCounts[color] = (comboCounts[color] || 0) + group.length;
          if (group.some((cell) => rawCellColor(board[cell.y][cell.x]) === 'enhancedRed')) comboEnhanced[color] = true;
        });
        for (const [color, count] of Object.entries(comboCounts)) {
          const rule = traitRules[color];
          if (!rule) continue;
          pendingTraits.push({ color, count, value: getTraitValue(rule, count), enhanced: !!comboEnhanced[color] });
        }
        boardEl.classList.remove('shake');
        void boardEl.offsetWidth;
        boardEl.classList.add('shake');
        renderBoard(new Set([...cells].map((c) => `${c.x},${c.y}`)));
        await wait(230);
        playOrbClearSfx();
        await wait(200);
        const fireAttackBombed = fireAttackSealed ? 0 : destroySurroundingOrbsForFireAttack(cells);
        if (fireAttackBombed > 0) {
          const baseBombDamage = applyBombDamage(fireAttackBombed, 'red', true);
          const bombDamage = Math.round(baseBombDamage * battleBalance.fireChainOrderBombMultiplier);
          totalDamage += bombDamage;
          if (bombDamage > 0) {
            attackEvents.push({ color: 'red', count: fireAttackBombed, damage: bombDamage, attackType: 'fire', label: '火燒連環', skill: true });
          }
        }
        clearCells(cells);
        if (fireAttackBombed > 0) {
          dropKeys = new Set();
          renderBoard();
          await wait(1000);
        }
        dropKeys = collapseBoard();
        placeSpecialCreatesAfterCollapse(specialCreates);
        renderBoard();
        await wait(460);
        dropKeys = new Set();
      }

      await waitForBoardRefill();

      if (combo === 0) {
        addLog('沒有形成消除。');
        equipmentTurnAttackBonus = 0;
        busy = false;
        return;
      }

      await wait(220);
      recordSnakeSoulLightClears(pendingTraits);
      recordChaosDoomClears(pendingTraits);
      resolveClearedOrbGemEffects(totalClearedThisMove);
      const fourMatchEffect = getEquipmentEffects('four_match_turn_attack_stack')[0];
      if (fourMatchEffect && fourMatchCount > 0) {
        const stacks = Math.min(fourMatchCount, fourMatchEffect.maxStacks ?? fourMatchCount);
        equipmentTurnAttackBonus = stacks * (fourMatchEffect.value ?? 0);
        showBuffFlash(`破陣 x${stacks}`);
      }
      const fiveMatchEffect = getEquipmentEffects('five_match_combo_stack')[0];
      if (fiveMatchEffect && fiveMatchCount > 0 && hasEquippedEquipment('dragon_soul_saber_sr')) {
        const before = equipmentBattleState.dragonSoulStacks;
        equipmentBattleState.dragonSoulStacks = Math.min(
          fiveMatchEffect.maxStacks ?? 5,
          equipmentBattleState.dragonSoulStacks + fiveMatchCount,
        );
        if (equipmentBattleState.dragonSoulStacks > before) showBuffFlash(`龍魂 ${equipmentBattleState.dragonSoulStacks}`);
      }
      const finalComboMultiplier = getComboDamageMultiplier(combo);
      const turnRedCount = pendingTraits
        .filter((effect) => effect.color === 'red')
        .reduce((sum, effect) => sum + effect.count, 0);
      const activeRedAttackCount = fireAttackSealed ? 0 : turnRedCount;
      if (orderPassives.battleSpirit && activeRedAttackCount >= 3) addBattleSpiritStack();
      let redOrbBonusDamage = activeRedAttackCount > 0 ? Math.round(activeRedAttackCount * battleBalance.redOrbBonusAtk * playerHero.attack) : 0;
      let shieldGain = 0;
      let energyGain = 0;
      let healGain = 0;
      const azureDragonHealingActive = divineStates.azureDragonHealTurns > 0;
      const azureDragonHealMultiplier = divineStates.azureDragonHealMultiplier || 2;
      for (const effect of pendingTraits) {
        const { color, count, value, enhanced } = effect;
        const rule = traitRules[color];
        if (!rule) continue;
        if (azureDragonHealingActive && rule.type !== 'heal') {
          const healValue = getTraitValue(traitRules.light, count);
          healGain += Math.round(playerHero.recovery * healValue * finalComboMultiplier * azureDragonHealMultiplier);
        }
        if (fireAttackSealed && color === 'red' && (rule.type === 'attack' || divineStates.enabledAttackColors[color] > 0)) {
          if (!fireSealNotified) {
            fireSealNotified = true;
            showBuffFlash('封攻：火珠失效');
            addLog('封攻中：火珠可以消除，但不會發動攻擊。');
          }
          continue;
        }
        if (divineStates.allColorsShieldTurns > 0 && rule.type !== 'shield') {
          const shieldValue = getTraitValue(traitRules.green, count);
          shieldGain += Math.round(playerMaxHp * shieldValue * finalComboMultiplier);
          if (count >= 4) ironWallTurns = Math.max(ironWallTurns, 1);
        }
        if (divineStates.heavenGeneralThunderTurns > 0 && count >= 3) {
          const thunderDamage = Math.round(playerHero.attack * battleBalance.thunderStrikeAtk * getPlayerAttackMultiplier() * finalComboMultiplier);
          totalDamage += thunderDamage;
          attackEvents.push({ color: 'yellow', count, damage: thunderDamage, attackType: 'thunder', label: '天公之怒', skill: true });
        }
        if (color === 'yellow' && hasTalent(thunderTalentConfig.attackTalentId)) {
          let thunderPunishmentDamage = Math.round(
            playerHero.attack * thunderTalentConfig.baseAttackRate
            + playerHero.recovery * thunderTalentConfig.baseRecoveryRate,
          );
          if (hasTalent(thunderTalentConfig.chargeTalentId)) {
            thunderPunishmentDamage = Math.round(thunderPunishmentDamage * (1 + thunderTalentConfig.chargeDamageBonus));
          }
          if (hasTalent(thunderTalentConfig.thunderGodTalentId)) {
            thunderPunishmentDamage = Math.round(thunderPunishmentDamage * (1 + thunderTalentConfig.thunderGodDamageBonus));
          }
          totalDamage += thunderPunishmentDamage;
          const upgradedThunder = hasTalent(thunderTalentConfig.thunderGodTalentId);
          const thunderLabel = upgradedThunder ? thunderTalentConfig.labels.thunderGod : thunderTalentConfig.labels.punishment;
          attackEvents.push({
            color: 'yellow',
            count,
            damage: thunderPunishmentDamage,
            attackType: 'thunder',
            label: thunderLabel,
            sfx: 'thunder',
            skill: true,
            vfx: upgradedThunder ? 'thunderTriple' : '',
          });
          if (hasTalent(thunderTalentConfig.paralysisTalentId) && Math.random() < thunderTalentConfig.paralysisChance) addEnemyParalysis(1);
          addLog(`${thunderLabel}造成 ${thunderPunishmentDamage} 雷傷。`);
        }
        if (rule.type === 'attack' || divineStates.enabledAttackColors[color] > 0) {
          let multiplier = getPlayerAttackMultiplier() * finalComboMultiplier;
          if (enhanced && color === 'red') multiplier *= battleBalance.enhancedFireMultiplier;
          const fireDamageMultiplier = color === 'red' ? getEquipmentFireDamageMultiplier() : 1;
          multiplier *= fireDamageMultiplier;
          const baseValue = rule.type === 'attack' ? value : 0.6;
          let damage = Math.round(playerHero.attack * baseValue * multiplier);
          if (color === 'red' && redOrbBonusDamage > 0) {
            const bonusDamage = Math.round(redOrbBonusDamage * fireDamageMultiplier);
            damage += bonusDamage;
            addLog(`紅珠總數 ${turnRedCount}，追加 ${bonusDamage} 火傷。`);
            redOrbBonusDamage = 0;
          }
          totalDamage += damage;
          attackEvents.push(applyHeroAttackPresentation(playerHero, {
            source: 'orb_match',
            color,
            count,
            damage,
            attackType: color === 'yellow' ? 'thunder' : color === 'red' && count >= 5 ? 'fire' : color,
          }));
          if (color === 'red' && enhanced) {
            const bonusDamage = Math.round(playerHero.attack * battleBalance.enhancedFireFlatAtk * getPlayerAttackMultiplier() * finalComboMultiplier * fireDamageMultiplier);
            totalDamage += bonusDamage;
            attackEvents.push({ color, count, damage: bonusDamage, attackType: 'fire', label: '強化火珠爆裂', skill: true });
            addEnemyBurn();
          }
          showCardDamage('red', damage);
          addLog(`${rule.label}特性 ${count} 消，最終 COMBO x${finalComboMultiplier.toFixed(1)}，趙雲蓄力 ${damage}。`);
          if (getBuff('attack_up')) showBuffFlash('猛攻 +25%');
          const passiveBomb = tryHeroPassiveOnTrait(color);
          if (passiveBomb?.damage > 0) {
            totalDamage += passiveBomb.damage;
            attackEvents.push({
              color: 'red',
              count: passiveBomb.count,
              damage: passiveBomb.damage,
              attackType: 'fire',
              label: '渾身是膽・緋紅爆破',
              sfx: 'courageExplosion',
              skill: true,
            });
          }
        } else if (rule.type === 'shield') {
          shieldGain += Math.round(playerMaxHp * value * finalComboMultiplier);
          if (count >= 4) {
            ironWallTurns = Math.max(ironWallTurns, 1);
            showBuffFlash('鐵壁 1 回合');
          }
        } else if (rule.type === 'energy') {
          const energyMultiplier = color === 'yellow' && hasTalent(thunderTalentConfig.energyDoubleTalentId) ? 2 : 1;
          energyGain += Math.round(value * finalComboMultiplier * energyMultiplier);
        } else if (rule.type === 'heal') {
          const healMultiplier = azureDragonHealingActive ? azureDragonHealMultiplier : 1;
          healGain += Math.round(playerHero.recovery * value * finalComboMultiplier * healMultiplier);
          if (count >= 4 && !cleanseOnePlayerDebuff()) healGain += Math.round(playerMaxHp * battleBalance.lightCleanseExtraHealMaxHp);
        } else if (rule.type === 'poison') {
          const poisonComboMultiplier = getPoisonComboMultiplier(combo);
          const poisonDamage = Math.round(playerHero.attack * battleBalance.poisonDamageAtkPerTurn * poisonComboMultiplier);
          showBuffFlash('毒箭');
          addEnemyPoison(value, poisonDamage);
          addLog(`暗珠 ${count} 消，Combo x${poisonComboMultiplier.toFixed(1)}，使敵人中毒 ${value} 回合，每回合 ${poisonDamage} 毒傷。`);
        }
      }
      await waitForBoardRefill();
      const comboOrder = getBuff('combo_damage');
      if (comboOrder && combo >= 3) {
        const comboBonusDamage = Math.round(playerHero.attack * getPlayerAttackMultiplier() * (combo >= 5 ? 2 : 1));
        totalDamage += comboBonusDamage;
        attackEvents.push({
          color: 'red',
          count: combo,
          damage: comboBonusDamage,
          attackType: 'fire',
          label: combo >= 5 ? '連擊令・五連破' : '連擊令・三連破',
          sfx: 'comboOrder',
          skill: true,
        });
      }
      const comboThresholdFollowUp = getEquipmentEffects('combo_threshold_follow_up')[0];
      if (
        comboThresholdFollowUp
        && hasEquippedEquipment('dragon_soul_saber_sr')
        && equipmentBattleState.dragonSoulStacks >= (comboThresholdFollowUp.requiredStacks ?? 5)
        && combo >= (comboThresholdFollowUp.minCombo ?? 5)
      ) {
        const dragonSoulDamage = Math.round(playerHero.attack * (comboThresholdFollowUp.value ?? 0) * getPlayerAttackMultiplier());
        totalDamage += dragonSoulDamage;
        attackEvents.push({
          color: 'red',
          count: combo,
          damage: dragonSoulDamage,
          attackType: 'fire',
          label: '龍魂追擊',
          skill: true,
        });
      }
      if (shieldGain > 0) await gainPlayerShield(shieldGain);
      if (energyGain > 0) await gainHeroEnergy(energyGain);
      if (healGain > 0) {
        if (azureDragonHealingActive) showBuffFlash(`青龍回春 +${healGain}`);
        await gainPlayerHeal(healGain);
      }

      let followUpUsed = false;
      for (const event of attackEvents) {
        const presentation = event.presentation || getHeroAttackPresentation(playerHero, event);
        const actionName = event.label || presentation?.name || '攻擊';
        showAttackName({ ...event, presentation }, { playVoice: !event.skill });
        let dealt = 0;
        await playBattleStep(`${playerHero.hero}・${actionName}`, () => {
          playAttackEventSfx(event);
          if (!['spearThrust', 'spearShot'].includes(event.vfx)) shootBeam(event.color);
          dealt = damageEnemy(event.damage);
          addLog(`${actionName}造成 ${dealt} 傷害。`);
          updateStats();
          animateAttack(dealt, !!event.skill, event.color, actionName, event.vfx);
        }, event.color);
        if (resolveEnemyDefeat(actionName)) return;
        await wait(120);
        if (event.color === 'red' && enemyHp > 0) {
          const equipmentFollowRate = getEquipmentFireFollowUpRate(event.count);
          if (equipmentFollowRate > 0) {
            const equipmentFollowDamage = Math.round(playerHero.attack * equipmentFollowRate * getPlayerAttackMultiplier());
            let equipmentFollowDealt = 0;
            await playBattleStep('萬箭追魂', () => {
              equipmentFollowDealt = damageEnemy(equipmentFollowDamage);
              totalDamage += equipmentFollowDealt;
              shootBeam('red', true);
              animateAttack(equipmentFollowDealt, true, 'red', '萬箭追魂');
              addLog(`虎牢重弩追加 ${equipmentFollowDealt} 傷害。`);
              updateStats();
            }, 'red');
            if (resolveEnemyDefeat('萬箭追魂')) return;
            await wait(120);
          }
        }
      }
      const followUp = enemyHp > 0 ? getBuff('follow_up') : null;
      if (followUp && !followUpUsed && pendingTraits.length > 0) {
        followUpUsed = true;
        const followDamage = Math.round(playerHero.attack * followUp.value * getPlayerAttackMultiplier() * finalComboMultiplier);
        const followEvent = applyHeroAttackPresentation(playerHero, {
          source: 'hero_pursuit',
          color: 'red',
          count: turnRedCount || 3,
          damage: followDamage,
          attackType: 'red',
          label: '追擊',
          skill: true,
        });
        const followPresentation = followEvent.presentation || getHeroAttackPresentation(playerHero, followEvent);
        const followActionName = followEvent.label || followPresentation?.name || '追擊';
        let followDealt = 0;
        showAttackName({ ...followEvent, presentation: followPresentation }, { playVoice: false });
        await playBattleStep(`${playerHero.hero}・${followActionName}`, () => {
          playAttackEventSfx(followEvent);
          if (!['spearThrust', 'spearShot'].includes(followEvent.vfx)) shootBeam(followEvent.color, true);
          followDealt = damageEnemy(followEvent.damage);
          totalDamage += followDealt;
          animateAttack(followDealt, true, followEvent.color, followActionName, followEvent.vfx);
          addLog(`${playerHero.hero} 追擊造成 ${followDealt} 傷害。`);
          updateStats();
        }, followEvent.color);
        if (resolveEnemyDefeat(followActionName)) return;
        await wait(120);
      }
      if (!followUpUsed && orderPassives.pursuit && activeRedAttackCount >= 3 && enemyHp > 0 && attackEvents.length && Math.random() < 0.3) {
        followUpUsed = true;
        const followDamage = Math.round(playerHero.attack * 0.5 * getPlayerAttackMultiplier() * finalComboMultiplier);
        const followEvent = applyHeroAttackPresentation(playerHero, {
          source: 'hero_pursuit',
          color: 'red',
          count: turnRedCount,
          damage: followDamage,
          attackType: 'red',
          label: '追擊',
          skill: true,
        });
        const followPresentation = followEvent.presentation || getHeroAttackPresentation(playerHero, followEvent);
        const followActionName = followEvent.label || followPresentation?.name || '追擊';
        let followDealt = 0;
        showAttackName({ ...followEvent, presentation: followPresentation }, { playVoice: false });
        await playBattleStep(`${playerHero.hero}・${followActionName}`, () => {
          playAttackEventSfx(followEvent);
          if (!['spearThrust', 'spearShot'].includes(followEvent.vfx)) shootBeam(followEvent.color, true);
          followDealt = damageEnemy(followEvent.damage);
          totalDamage += followDealt;
          animateAttack(followDealt, true, followEvent.color, followActionName, followEvent.vfx);
          addLog(`${playerHero.hero} 追擊造成 ${followDealt} 傷害。`);
          updateStats();
        }, followEvent.color);
        if (resolveEnemyDefeat(followActionName)) return;
        await wait(120);
      }
      await wait(160);

      if (findMatches().groups.length) {
        addLog('炸珠落下形成連鎖消除。');
        showBuffFlash('落珠連鎖');
        await handleMove();
        return;
      }

      resultEl.textContent = totalDamage > 0 ? `${combo} Combo x${finalComboMultiplier.toFixed(2)}，造成 ${totalDamage} 傷害` : `${combo} Combo x${finalComboMultiplier.toFixed(2)}，觸發特性效果`;
      flashResult();
      await clearChargeDamage();
      equipmentTurnAttackBonus = 0;
      await resolvePlayerTurnEnd();
    }

    function chooseEquipmentReward(id) {
      const equipment = equipmentRewards.find((item) => item.id === id);
      if (!equipment) return;
      const currentEquipment = equipmentProgress.slots[equipment.slot];
      if (currentEquipment && currentEquipment.id !== equipment.id) {
        const slotLabel = equipmentSlots[equipment.slot] ?? '裝備';
        const confirmed = window.confirm(`${slotLabel}已裝備 ${currentEquipment.rarity} ${currentEquipment.name}。\n是否替換成 ${equipment.rarity} ${equipment.name}？`);
        if (!confirmed) return;
        resetEquipmentRuntimeForSlot(equipment.slot);
      }
      const result = chooseEquipment(equipmentProgress, equipment);
      if (!result.equipped) {
        showBuffFlash('欄位不符');
        return;
      }

      closeRewardDialog();
      showBuffFlash(`${equipment.rarity} ${equipment.name}`);
      addLog(`獲得裝備：${equipment.rarity} ${equipment.name}（${equipment.skill.name}）。`);
      renderTeam();
      busy = false;
      nextStage();
    }
    async function activateSpecial(x, y) {
      const cell = board[y][x];
      if (cell.power === 'sameColor' && divineGauge < battleBalance.divineGaugeMax) {
        showBuffFlash('神令尚未充滿');
        return;
      }
      if (cell.power !== 'sameColor' && orderGauge < battleBalance.orderGaugeMax) {
        showBuffFlash('軍令尚未充滿');
        return;
      }
      busy = true;
      board[y][x] = null;
      dropKeys = collapseBoard();
      renderBoard();
      await wait(220);
      dropKeys = new Set();
      renderBoard();
      if (cell.power === 'sameColor') {
        divineGauge = 0;
        openDivineFlagDialog(cell);
      } else {
        orderGauge = 0;
        openRewardDialog(cell);
      }
    }

    async function activateHeroSkill(color) {
      if (busy || boardRefillTimer || enemyHp <= 0 || playerHp <= 0) return;
      if (playerHero.energy < playerHero.maxEnergy) return;
      closeSkillDialog();
      busy = true;
      playerHero.energy = 0;
      const activeSkill = playerHero.activeSkill;
      updateStats();
      renderTeam();
      playSkillCastSfx(activeSkill);
      await showSkillCastIntro(activeSkill);
      if (
        activeSkill.id === 'active_dragon_soul_burst'
        || activeSkill.type === 'convert_random_orbs_to_enhanced_fire'
      ) {
        const skillLevel = Math.max(1, Math.min(activeSkill.skillLevel ?? 1, activeSkill.convertCountsByLevel.length));
        const extraOrbs = getActiveSkillExtraOrbCount();
        const requestedCount = activeSkill.convertCountsByLevel[skillLevel - 1] + extraOrbs;
        const conversion = convertRandomOrbsToColor(activeSkill.targetColor ?? 'enhancedRed', requestedCount);
        const converted = conversion.count;
        stabilizeBoardMatchesWithoutClearing();
        renderBoard();
        showBoardConversions(conversion.cells);
        await wait(220);
        showBuffFlash(`${activeSkill.name} ${converted}`);
        resultEl.textContent = `${playerHero.hero} 釋放 ${activeSkill.name}，轉換 ${converted} 顆強化火珠`;
        flashResult();
        addLog(`${playerHero.hero} 釋放 ${activeSkill.name}，將 ${converted} 顆珠子轉換成強化火珠。${extraOrbs > 0 ? `裝備額外 +${extraOrbs}。` : ''}`);
      } else {
        const damage = Math.round(playerHero.attack * activeSkill.damageMultiplier * getPlayerAttackMultiplier());
        const dealt = damageEnemy(damage);
        showCardDamage('red', dealt);
        await wait(440);
        shootBeam('red', true);
        await wait(160);
        resultEl.textContent = `${playerHero.hero} 主動技能，造成 ${dealt} 傷害`;
        flashResult();
        animateAttack(dealt, true, 'red', playerHero.skillName);
        await clearChargeDamage();
        addLog(`${playerHero.hero} 釋放 ${playerHero.skillName}。`);
      }
      updateStats();
      renderTeam();
      if (enemyHp <= 0) {
        await showVictory();
        return;
      }
      busy = false;
    }

    function swap(a, b) {
      const temp = board[a.y][a.x];
      board[a.y][a.x] = board[b.y][b.x];
      board[b.y][b.x] = temp;
    }

    function getSwapClass(x, y) {
      if (!swapAnim) return '';
      const { first, second } = swapAnim;
      if (x === first.x && y === first.y) {
        if (second.x > first.x) return ' swap-left';
        if (second.x < first.x) return ' swap-right';
        if (second.y > first.y) return ' swap-up';
        if (second.y < first.y) return ' swap-down';
      }
      if (x === second.x && y === second.y) {
        if (first.x > second.x) return ' swap-left';
        if (first.x < second.x) return ' swap-right';
        if (first.y > second.y) return ' swap-up';
        if (first.y < second.y) return ' swap-down';
      }
      return '';
    }

    function findMatches() {
      const groups = [];
      const cellsByKey = new Map();
      const matchingColor = (cell, fallback) => {
        if (cell?.special) return null;
        const color = cellColor(cell);
        return color === 'rainbow' ? fallback : color;
      };

      for (let y = 0; y < height; y++) {
        let run = [{ x: 0, y }];
        let runColor = matchColor(board[y][0]) || matchColor(board[y][1]) || null;
        for (let x = 1; x < width; x++) {
          const current = matchingColor(board[y][x], runColor);
          const previous = matchingColor(board[y][x - 1], current || runColor);
          if (current && previous && current === previous) {
            run.push({ x, y });
            runColor = current;
          }
          else {
            if (run.length >= 3) groups.push(run);
            run = [{ x, y }];
            runColor = matchColor(board[y][x]) || matchColor(board[y][x + 1]) || null;
          }
        }
        if (run.length >= 3) groups.push(run);
      }

      for (let x = 0; x < width; x++) {
        let run = [{ x, y: 0 }];
        let runColor = matchColor(board[0][x]) || matchColor(board[1]?.[x]) || null;
        for (let y = 1; y < height; y++) {
          const current = matchingColor(board[y][x], runColor);
          const previous = matchingColor(board[y - 1][x], current || runColor);
          if (current && previous && current === previous) {
            run.push({ x, y });
            runColor = current;
          }
          else {
            if (run.length >= 3) groups.push(run);
            run = [{ x, y }];
            runColor = matchColor(board[y][x]) || matchColor(board[y + 1]?.[x]) || null;
          }
        }
        if (run.length >= 3) groups.push(run);
      }

      groups.flat().forEach((cell) => cellsByKey.set(`${cell.x},${cell.y}`, cell));
      return { groups, cells: [...cellsByKey.values()] };
    }

    function getSpecialCreates(groups, lastMove = null) {
      const creates = new Map();
      return creates;
      groups.forEach((group) => {
        if (group.length < 4) return;
        const anchor = lastMove && group.some((cell) => cell.x === lastMove.x && cell.y === lastMove.y)
          ? lastMove
          : group[Math.floor(group.length / 2)];
        const color = cellColor(board[anchor.y][anchor.x]);
        creates.set(`${anchor.x},${anchor.y}`, makeOrb(color, true, group.length >= divineFlagsPack.trigger.minCount ? 'sameColor' : 'box'));
      });
      return creates;
    }

    function clearCells(cells, specialCreates = new Map()) {
      cells.forEach(({ x, y }) => {
        recordThunderHoofClear(board[y][x]);
        board[y][x] = specialCreates.get(`${x},${y}`) || null;
      });
    }

    function placeSpecialCreatesAfterCollapse(specialCreates) {
      specialCreates.forEach((special, key) => {
        const [xText, yText] = key.split(',');
        const x = Number(xText);
        const originalY = Number(yText);
        let targetY = Math.min(height - 1, originalY);
        while (targetY < height - 1 && board[targetY + 1][x] && board[targetY + 1][x].special) targetY++;
        board[targetY][x] = special;
      });
    }

    function collapseBoard() {
      const moved = new Set();
      const collapseSegment = (x, topY, bottomY) => {
        if (topY > bottomY) return;
        const stack = [];
        for (let y = bottomY; y >= topY; y--) {
          const cell = board[y][x];
          if (cell && !cell.blank) stack.push({ cell, fromY: y });
        }
        for (let y = bottomY; y >= topY; y--) {
          const item = stack.shift();
          if (item) {
            board[y][x] = item.cell;
            if (item.fromY !== y) moved.add(`${x},${y}`);
          } else {
            board[y][x] = makeOrb();
            moved.add(`${x},${y}`);
          }
        }
      };

      for (let x = 0; x < width; x++) {
        let bottomY = height - 1;
        for (let y = height - 1; y >= 0; y--) {
          if (!board[y][x]?.blank) continue;
          collapseSegment(x, y + 1, bottomY);
          bottomY = y - 1;
        }
        collapseSegment(x, 0, bottomY);
      }
      return moved;
    }

    function addLog(text) {
      const line = document.createElement('div');
      line.textContent = text;
      logEl.prepend(line);
    }

    function updateShieldBar(barEl, shield, maxHp) {
      if (!barEl) return;
      let labelEl = barEl.querySelector('.shield-value');
      if (!labelEl) {
        labelEl = document.createElement('div');
        labelEl.className = 'shield-value';
        barEl.appendChild(labelEl);
      }
      const safeShield = Math.max(0, Math.round(shield || 0));
      const ratio = maxHp > 0 ? Math.min(1, safeShield / maxHp) : 0;
      barEl.style.setProperty('--shield-width', `${ratio * 100}%`);
      barEl.dataset.shieldLabel = safeShield > 0 ? `護盾 ${safeShield}` : '';
      labelEl.textContent = safeShield > 0 ? `護盾 ${safeShield}` : '';
      barEl.classList.toggle('has-shield', safeShield > 0);
    }

    function renderEnemyIntentPanel(monster) {
      const panel = document.getElementById('enemyIntentPanel');
      if (!panel) return;
      const intents = getEnemyActionIntents(monster, {
        currentTurn: enemyTurn,
        skillCooldowns: enemySkillCooldowns,
        attackMultiplier: divineStates.enemyAttackMultiplier,
      });
      panel.textContent = '';
      panel.setAttribute('role', 'button');
      panel.setAttribute('tabindex', '0');
      panel.setAttribute('aria-label', '查看怪物攻擊機制');
      panel.title = '查看怪物攻擊機制';

      const title = document.createElement('strong');
      title.className = 'enemy-intent-title';
      title.textContent = '敵方行動 ⓘ';
      panel.appendChild(title);

      intents.forEach((intent, index) => {
        const row = document.createElement('div');
        row.className = `enemy-intent-row ${index === 0 ? 'is-next' : ''} ${intent.turnsRemaining <= 0 ? 'is-ready' : ''}`;

        const name = document.createElement('span');
        name.className = 'enemy-intent-name';
        name.textContent = intent.name;

        const meta = document.createElement('span');
        meta.className = 'enemy-intent-meta';
        const timing = intent.turnsRemaining <= 0 ? '即將' : `${intent.turnsRemaining} 回合`;
        meta.textContent = timing;

        row.append(name, meta);
        panel.appendChild(row);
      });
    }

    function openEnemyMechanicDialog(monster = getCurrentStage()) {
      if (!monster) return;
      closeBattleQuickMenu?.();
      const existing = document.getElementById('enemyMechanicDialog');
      existing?.remove();

      const overlay = document.createElement('div');
      overlay.id = 'enemyMechanicDialog';
      overlay.className = 'enemy-mechanic-dialog';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', `${monster.name} 攻擊機制`);

      const box = document.createElement('div');
      box.className = 'enemy-mechanic-box';

      const header = document.createElement('div');
      header.className = 'enemy-mechanic-header';
      const title = document.createElement('strong');
      title.textContent = monster.name;
      const sub = document.createElement('span');
      sub.textContent = `普通攻擊：每 ${monster.basicAttackTurns} 回合 / 傷害 ${getMonsterPreviewDamage(monster, divineStates.enemyAttackMultiplier)}`;
      header.append(title, sub);

      const list = document.createElement('div');
      list.className = 'enemy-mechanic-list';
      [monster.specialSkill, ...(monster.skills ?? [])].filter(Boolean).forEach((skill) => {
        const card = document.createElement('section');
        card.className = 'enemy-mechanic-card';
        const name = document.createElement('strong');
        name.textContent = `${skill.name} / ${skill.frequencyTurns ?? '-'} 回合`;
        const desc = document.createElement('span');
        desc.textContent = skill.description ?? '無說明。';
        card.append(name, desc);
        list.appendChild(card);
      });

      const tips = document.createElement('div');
      tips.className = 'enemy-mechanic-tips';
      (monster.mechanicTips ?? ['觀察右下角倒數，技能快到時先保留補血、護盾或可消除路徑。']).forEach((tip) => {
        const line = document.createElement('p');
        line.textContent = tip;
        tips.appendChild(line);
      });

      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'enemy-mechanic-close';
      close.textContent = '關閉';
      close.addEventListener('click', () => overlay.remove());
      overlay.addEventListener('click', (event) => {
        if (event.target === overlay) overlay.remove();
      });

      box.append(header, list, tips, close);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
      close.focus();
    }

    function updateStats() {
      const currentStage = getCurrentStage();
      document.getElementById('enemyHp').textContent = enemyHp;
      document.getElementById('enemyMaxHp').textContent = ` / ${enemyMaxHp}`;
      document.getElementById('playerHp').textContent = playerHp;
      document.getElementById('playerMaxHp').textContent = playerMaxHp;
      document.getElementById('enemyTurn').textContent = enemyTurn;
      renderEnemyIntentPanel(currentStage);
      const turnBox = document.querySelector('.turn');
      if (turnBox) {
        let intentLabel = document.getElementById('enemyIntentLabel');
        if (!intentLabel) {
          intentLabel = document.createElement('span');
          intentLabel.id = 'enemyIntentLabel';
          intentLabel.className = 'enemy-intent-label';
          turnBox.appendChild(intentLabel);
        }
        intentLabel.textContent = '';
      }
      const battleStageInfo = document.getElementById('battleStageInfo');
      if (battleStageInfo) battleStageInfo.textContent = `第 ${stage} 層 / 回合 ${Math.min(20, battleRound)}/20`;
      document.getElementById('enemyPreviewDamage').textContent = getMonsterPreviewDamage(currentStage, divineStates.enemyAttackMultiplier);
      const enemyHpFill = document.getElementById('enemyHpBar');
      const playerHpFill = document.getElementById('playerHpBar');
      enemyHpFill.style.width = `${enemyHp / enemyMaxHp * 100}%`;
      playerHpFill.style.width = `${playerHp / playerMaxHp * 100}%`;
      updateShieldBar(enemyHpFill.parentElement, enemyShield, enemyMaxHp);
      updateShieldBar(playerHpFill.parentElement, playerShield, playerMaxHp);
      const heroEnergyText = document.getElementById('heroEnergyText');
      const heroEnergyFill = document.getElementById('heroEnergyFill');
      if (heroEnergyText) heroEnergyText.textContent = `${playerHero.energy}/${playerHero.maxEnergy}`;
      if (heroEnergyFill) heroEnergyFill.style.width = `${Math.min(100, playerHero.energy / playerHero.maxEnergy * 100)}%`;
      renderCommandGauges();
      renderDivineStatusBanner();
    }

    function animateAttack(damage, skill = false, color = 'light', label = '', vfx = '') {
      uiEffects.animateAttack(damage, skill, color, label, vfx);
    }

    function showComboPop(combo) {
      uiEffects.showComboPop(combo);
    }

    function getAttackType(skill) {
      if (!skill) return 'slash';
      if (skill.effectType === 'poison') return 'poison';
      if (skill.effectType === 'burn') return 'fire';
      if (['freeze', 'damage_slow', 'damage_debuff'].includes(skill.effectType)) return 'dark';
      if (['dash_damage', 'multi_hit'].includes(skill.effectType)) return 'slash';
      if (skill.name?.includes('雷')) return 'thunder';
      return 'slash';
    }

    function showAttackEffect(type = 'slash') {
      uiEffects.showAttackEffect(type);
    }

    function showBoardBombs(cells = []) {
      uiEffects.showBoardBombs(cells);
    }

    function showBoardShatters(cells = []) {
      uiEffects.showBoardShatters(cells);
    }

    function showBoardConversions(cells = []) {
      uiEffects.showBoardConversions(cells);
    }

    function getPlayerAttackEffectType(color = 'light') {
      return uiEffects.getPlayerAttackEffectType(color);
    }

    function animateHeroStrike(color = 'red') {
      uiEffects.animateHeroStrike(color);
    }

    function createAttackEffect(attackType = 'slash') {
      uiEffects.createAttackEffect(attackType);
    }

    function createAttackAfterimage(enemyEl = enemyImageEl) {
      return uiEffects.createAttackAfterimage(enemyEl);
    }

    function shakeBattleStage() {
      uiEffects.shakeBattleStage();
    }

    function flashTargetHit(targetEl) {
      uiEffects.flashTargetHit(targetEl);
    }

    function showFloatingDamage(targetEl, damage) {
      uiEffects.showFloatingDamage(targetEl, damage);
    }

    async function playEnemyAttackAnimation(enemyEl = enemyImageEl, targetEl = document.querySelector('.battle-party'), damage = 0, attackType = 'slash') {
      await uiEffects.playEnemyAttackAnimation(enemyEl, targetEl, damage, attackType);
    }

    function animateEnemyAttack(type = 'slash') {
      uiEffects.animateEnemyAttack(type);
    }

    function showClawSlashes() {
      uiEffects.showClawSlashes();
    }

    async function performEnemyAction(forcedSkill = null) {
      if (!forcedSkill && consumeEnemyParalysis()) {
        enemyTurn = getMonsterTurnCooldown(getCurrentStage());
        updateStats();
        await wait(520);
        return;
      }
      const monster = getCurrentStage();
      const action = resolveEnemyAction(monster, {
        actionCount: enemyActionCount,
        playerStatusCount: playerStatusEffects.length,
        attackMultiplier: divineStates.enemyAttackMultiplier,
        forcedSkill,
      });
      enemyActionCount = action.actionCount;
      const skill = action.skill;
      const useSkill = action.useSkill;
      const damage = action.damage;
      const label = action.label;
      const hits = action.hits;

      if (useSkill) {
        await showEnemySkillCastIntro(skill);
        if (skill.effectType === 'freeze_board_orbs') {
          playFreezeSfx();
          if (monster.id === 'mob_dark_gate_warrior') {
            await playEnemyAttackAnimation(enemyImageEl, document.querySelector('.battle-party'), 0, 'dark-gate-lock');
          } else {
            await uiEffects.showIceTalismanCastEffect?.();
          }
        }
        if (skill.effectType === 'bleed') {
          playEnemyActionSfx(skill);
          const bladeAnimation = uiEffects.showBleedTalismanCastEffect?.() ?? Promise.resolve();
          await wait(420);
          showClawSlashes();
          flashTargetHit(document.querySelector('.battle-party'));
          let dealt = 0;
          if (hits?.length) {
            for (let index = 0; index < hits.length; index++) {
              const hitDamage = applyPlayerDamage(hits[index]);
              dealt += hitDamage;
              if (hits[index] > 0 && enemyHp > 0) resolveOnHitEquipmentEffects();
              addLog(`${label} 第 ${index + 1} 擊，玩家受到 ${hitDamage} 傷害。`);
              if (index < hits.length - 1) await wait(120);
            }
          } else {
            dealt = damage > 0 ? applyPlayerDamage(damage) : 0;
            if (damage > 0 && enemyHp > 0) resolveOnHitEquipmentEffects();
            addLog(`${label}，玩家受到 ${dealt} 傷害。`);
          }
          action.playerStatuses.forEach((status) => addPlayerStatus(status));
          if (skill.description) addLog(skill.description);
          if (playerHp <= 0) addLog('玩家隊伍倒下了。');
          await bladeAnimation;
          if (pendingShieldCounterDamage > 0 && enemyHp > 0) {
            const counterDamage = pendingShieldCounterDamage;
            pendingShieldCounterDamage = 0;
            await playBattleStep(`護盾反擊 ${counterDamage}`, () => {
              playCounterSfx();
              const dealtCounter = damageEnemy(counterDamage);
              showBuffFlash(`護盾反擊 ${dealtCounter}`);
              animateAttack(dealtCounter, true, 'green', '護盾反擊');
              addLog(`護盾反擊造成 ${dealtCounter} 傷害。`);
              updateStats();
            }, 'green');
            resolveEnemyDefeat('護盾反擊');
          }
          return;
        }
        if (action.shieldGain > 0) {
          enemyShield += action.shieldGain;
          enemyShieldTurns = Math.max(enemyShieldTurns, action.shieldTurns ?? 0);
          if (action.damageReduction !== null) enemyDamageReduction = action.damageReduction;
          addLog(`${label}，獲得 ${skill.shield ?? 0} 護盾。`);
          updateStats();
          if (action.endsAfterShield) return;
        }
        action.playerStatuses.forEach((status) => addPlayerStatus(status));
        if (skill.effectType !== 'baqi_soul_bite') action.boardEffects.forEach((effect) => applyEnemyBoardEffect(effect));
      }

      if (useSkill && ['freeze_board_orbs', 'shatter_board_orbs', 'flame_array_marks', 'thunder_hoof_route', 'snake_soul_bind'].includes(skill.effectType)) {
        if (skill.description) addLog(skill.description);
        if (skill.effectType === 'shatter_board_orbs') {
          playEnemyActionSfx(skill);
          await playEnemyAttackAnimation(enemyImageEl, document.querySelector('.battle-party'), 0, 'rotten-shield-quake');
        } else if (skill.effectType === 'flame_array_marks') {
          playEnemyActionSfx(skill);
          await playEnemyAttackAnimation(enemyImageEl, document.querySelector('.battle-party'), 0, 'fire');
        } else if (skill.effectType === 'thunder_hoof_route') {
          playEnemyActionSfx(skill);
          await playEnemyAttackAnimation(enemyImageEl, document.querySelector('.battle-party'), 0, 'obsidian-cavalry');
        } else if (skill.effectType === 'snake_soul_bind') {
          playEnemyActionSfx(skill);
          await playEnemyAttackAnimation(enemyImageEl, document.querySelector('.battle-party'), 0, 'snake-soul-bite');
        }
        await wait(520);
        return;
      }

      if (monster.id === 'mob_black_sun_demon_rider' && !useSkill) {
        playHorseChargeSfx();
      } else {
        playEnemyActionSfx(useSkill ? skill : null);
      }
      let attackType = getEnemyAttackType(useSkill ? skill : null);
      if (monster.id === 'mob_ghostfire_spear_soldier') {
        attackType = 'ghostfire-spear';
      } else if (monster.id === 'mob_rotten_shell_shield') {
        attackType = 'rotten-shield-quake';
      } else if (monster.id === 'mob_snake_shadow_warlock') {
        attackType = 'snake-soul-bite';
      } else if (monster.id === 'mob_bloodmoon_wolf_general') {
        attackType = 'bloodmoon-hunt';
      } else if (monster.id === 'mob_dark_gate_warrior') {
        attackType = 'dark-gate-lock';
      } else if (monster.id === 'mob_red_flame_demon_lady') {
        attackType = useSkill && skill?.effectType === 'flame_array_marks' ? 'fire' : 'slash';
      } else if (monster.id === 'mob_black_sun_demon_rider') {
        attackType = 'obsidian-cavalry';
      } else if (monster.id === 'mob_baqi_remnant') {
        attackType = 'snake-soul-bite';
      }
      const attackAnimation = playEnemyAttackAnimation(enemyImageEl, document.querySelector('.battle-party'), 0, attackType);
      if (attackType === 'slash') showClawSlashes();
      await wait(330);
      let dealt = 0;
      if (hits?.length) {
        for (let index = 0; index < hits.length; index++) {
          const hitDamage = applyPlayerDamage(hits[index]);
          dealt += hitDamage;
          if (hits[index] > 0 && enemyHp > 0) resolveOnHitEquipmentEffects();
          addLog(`${label} 第 ${index + 1} 擊，玩家受到 ${hitDamage} 傷害。`);
          if (index < hits.length - 1) await wait(180);
        }
      } else {
        dealt = damage > 0 ? applyPlayerDamage(damage) : 0;
        if (damage > 0 && enemyHp > 0) resolveOnHitEquipmentEffects();
        addLog(`${label}，玩家受到 ${dealt} 傷害。`);
      }
      if (useSkill && skill.description) addLog(skill.description);
      if (useSkill && skill.effectType === 'baqi_soul_bite') {
        action.boardEffects.forEach((effect) => applyEnemyBoardEffect(effect));
      }
      if (playerHp <= 0) addLog('玩家隊伍倒下了。');
      await attackAnimation;
      if (pendingShieldCounterDamage > 0 && enemyHp > 0) {
        const counterDamage = pendingShieldCounterDamage;
        pendingShieldCounterDamage = 0;
        await playBattleStep(`護盾反擊 ${counterDamage}`, () => {
          playCounterSfx();
          const dealtCounter = damageEnemy(counterDamage);
          showBuffFlash(`護盾反擊 ${dealtCounter}`);
          animateAttack(dealtCounter, true, 'green', '護盾反擊');
          addLog(`護盾反擊造成 ${dealtCounter} 傷害。`);
          updateStats();
        }, 'green');
        resolveEnemyDefeat('護盾反擊');
      }
    }

    function showPlayerDamage(damage) {
      battleEl.classList.remove('hurt');
      void battleEl.offsetWidth;
      battleEl.classList.add('hurt');
      const target = document.querySelector('.player-status');
      const rect = target.getBoundingClientRect();
      const float = document.createElement('div');
      float.className = 'player-damage-float';
      float.textContent = `-${damage}`;
      float.style.left = `${rect.left + rect.width / 2}px`;
      float.style.top = `${rect.top + 8}px`;
      document.body.appendChild(float);
      battleTimeout(() => {
        float.remove();
        battleEl.classList.remove('hurt');
      }, 2000);
    }

    function showCardDamage(color, damage) {
      chargeDamage[color] = (chargeDamage[color] || 0) + damage;
      renderTeam();
      const card = teamEl.querySelector(`[data-color="${color}"]`);
      if (!card) return;
      card.classList.remove('attack-pulse');
      void card.offsetWidth;
      card.classList.add('attack-pulse');
      battleTimeout(() => {
        card.classList.remove('attack-pulse');
      }, 380);
    }

    async function clearChargeDamage() {
      teamEl.querySelectorAll('.card-damage').forEach((el) => el.classList.add('firing'));
      await wait(320);
      chargeDamage = {};
      renderTeam();
    }

    function getColorValue(color) {
      return getComputedStyle(document.documentElement).getPropertyValue(`--${color}`).trim() || '#ffe2a3';
    }

    function shootBeam(color, skill = false) {
      uiEffects.shootBeam(color, skill);
    }

    function flashResult() {
      uiEffects.flashResult();
    }

    async function showVictory() {
      if (victoryResolving) return;
      victoryResolving = true;
      busy = true;
      selected = null;
      enemyHp = 0;
      pendingShieldCounterDamage = 0;
      enemyDebuffs = [];
      renderEnemyDebuffs();
      updateStats();
      completeStage(stageProgress, stage);
      resultEl.textContent = '';
      enemyArtEl.classList.remove('hit', 'skill-hit', 'attack');
      enemyArtEl.classList.add('dead');
      await wait(1000);
      resultEl.textContent = 'Victory';
      const victoryTitle = document.getElementById('victoryTitle');
      const victorySubtitle = document.getElementById('victorySubtitle');
      if (victoryTitle) victoryTitle.textContent = 'Victory';
      if (victorySubtitle) victorySubtitle.textContent = '';
      victoryPanelEl.classList.remove('defeat');
      document.getElementById('nextStage').textContent = '回到關卡選擇';
      victoryPanelEl.classList.remove('show');
      openEquipmentRewardDialog();
    }

    function showDefeat() {
      if (victoryResolving) return;
      victoryResolving = true;
      busy = true;
      selected = null;
      playerHp = 0;
      pendingShieldCounterDamage = 0;
      resultEl.textContent = 'DEFECT';
      updateStats();
      renderTeam();
      const victoryTitle = document.getElementById('victoryTitle');
      const victorySubtitle = document.getElementById('victorySubtitle');
      if (victoryTitle) victoryTitle.textContent = 'DEFECT';
      if (victorySubtitle) victorySubtitle.textContent = '失敗';
      document.getElementById('nextStage').textContent = '回到關卡頁面';
      victoryPanelEl.classList.add('defeat', 'show');
    }

    function startStage(resetTeam = false) {
      startBattleBgm();
      const currentStage = getCurrentStage();
      playerMaxHp = getTeamMaxHp();
      if (resetTeam) {
        playerHp = playerMaxHp;
        playerHero.energy = 0;
        playerShield = 0;
        playerShieldTurns = 0;
        resetEquipmentBattleState();
        orderGauge = battleBalance.orderGaugeMax;
        divineGauge = battleBalance.divineGaugeMax;
        playerStatusEffects = [];
        activeBuffs = [];
        clearOrderPassives();
        divineStates = {
          invincibleTurns: 0,
          enemyAttackMultiplier: 1,
          enemyAttackDebuffTurns: 0,
          enabledAttackColors: {},
          enhancedColorMultiplier: {},
          damageReductionTurns: 0,
          damageReductionRate: 0,
          fireAttackBombTurns: 0,
          eastWindTurns: 0,
          allColorsShieldTurns: 0,
          heavenGeneralThunderTurns: 0,
          azureDragonHealTurns: 0,
          azureDragonHealMultiplier: 0,
        };
      }
      playerHp = Math.min(playerHp, playerMaxHp);
      const monsterBattleState = createMonsterBattleState(currentStage);
      enemyMaxHp = monsterBattleState.maxHp;
      enemyHp = monsterBattleState.hp;
      enemyTurn = monsterBattleState.turn;
      enemyActionCount = monsterBattleState.actionCount;
      enemySkillCooldowns = createEnemySkillCooldowns(currentStage);
      battleRound = 1;
      enemyShield = monsterBattleState.shield;
      enemyShieldTurns = 0;
      enemyDamageReduction = monsterBattleState.damageReduction;
      enemyVulnerability = monsterBattleState.vulnerability;
      enemyDebuffs = monsterBattleState.debuffs;
      busy = false;
      victoryResolving = false;
      selected = null;
      swapAnim = null;
      animMode = '';
      chargeDamage = {};
      thunderHoofRoute = null;
      snakeSoulCurse = null;
      closeSkillDialog();
      victoryPanelEl.classList.remove('show');
      victoryPanelEl.classList.remove('defeat');
      enemyArtEl.classList.remove('dead', 'hit', 'skill-hit', 'attack');
      enemyNameEl.textContent = getStagePresentation(currentStage).name;
      document.getElementById('enemyImage').src = getMonsterArt(currentStage);
      document.getElementById('enemyImage').alt = getStagePresentation(currentStage).name;
      renderBossGhostfireAura(currentStage.id === 'mob_hulao_demon_lu');
      updateStats();
      renderEnemyDebuffs();
      renderBuffs();
      renderCommandGauges();
      createBoard();
      applyTurnStartEquipmentEffects();
      renderBoard();
      updateStats();
      renderTeam();
      applyChaosDoomOpening(currentStage);
    }

    function nextStage() {
      victoryPanelEl.classList.remove('show');
      victoryPanelEl.classList.remove('defeat');
      resultEl.textContent = '';
      renderStageMap();
      showScreen('stage');
    }

    function restart() {
      stage = selectedStage;
      playerMaxHp = getTeamMaxHp();
      logEl.innerHTML = '';
      resultEl.textContent = '';
      victoryPanelEl.classList.remove('show');
      victoryPanelEl.classList.remove('defeat');
      startStage(true);
      addLog(`虎牢妖門 ${stage}：${getStagePresentation(stage).name} 出現。`);
    }

    function wait(ms) {
      return new Promise((resolve) => battleTimeout(resolve, ms));
    }


    document.getElementById('newBoard').addEventListener('click', () => {
      if (busy) return;
      createBoard();
      addLog('盤面已重洗。');
    });
    document.addEventListener('pointerdown', unlockBattleAudioOnce);
    document.addEventListener('keydown', unlockBattleAudioOnce);
    document.getElementById('restart').addEventListener('click', restart);
    document.getElementById('nextStage').addEventListener('click', nextStage);
    divineCommandButtonEl?.addEventListener('click', openDivineCommandDialog);
    orderCommandButtonEl?.addEventListener('click', openOrderCommandDialog);
    document.getElementById('skillCancel').addEventListener('click', closeSkillDialog);
    skillDialogEl.addEventListener('click', (event) => {
      if (event.target === skillDialogEl) closeSkillDialog();
    });
    rewardDialogEl.addEventListener('click', (event) => {
      if (event.target === rewardDialogEl && ['equipmentDetail', 'help'].includes(rewardMode)) closeRewardDialog();
    });
    skillConfirmEl.addEventListener('click', () => {
      if (pendingSkillColor) activateHeroSkill(pendingSkillColor);
    });
    document.getElementById('startGame').addEventListener('click', () => {
      if (!getPlayerName()) {
        openNameDialog();
        return;
      }
      enterMainMenu();
    });
    nameFormEl?.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = playerNameInputEl.value.trim() || '主公';
      savePlayerProfile({ name, createdAt: Date.now() });
      closeNameDialog();
      enterMainMenu();
    });
    playerNameDisplayEl?.addEventListener('click', () => {
      if (playerNameInputEl) playerNameInputEl.value = getPlayerName();
      openNameDialog();
    });
    document.getElementById('goAdventure').addEventListener('click', () => {
      renderStageMap();
      showScreen('stage');
    });
    document.getElementById('goTeam').addEventListener('click', () => {
      renderRoster();
      showScreen('team');
    });
    document.getElementById('goRift')?.addEventListener('click', () => alert('裂縫探索準備中'));
    document.getElementById('goGacha')?.addEventListener('click', () => alert('異世召喚準備中'));
    document.getElementById('backMenu').addEventListener('click', () => showScreen('menu'));
    document.getElementById('backMenuFromTeam').addEventListener('click', () => showScreen('menu'));
    document.getElementById('backTeamFromTalent').addEventListener('click', () => {
      renderRoster();
      showScreen('team');
    });
    const battleQuickMenuEl = document.getElementById('battleQuickMenu');
    const battleSpeedToggleEl = document.getElementById('battleSpeedToggle');
    function applyBattleSpeedUi() {
      window.__battleSpeedMultiplier = battleSpeedMultiplier;
      document.body.classList.toggle('battle-speed-2x', battleSpeedMultiplier === 2);
      if (!battleSpeedToggleEl) return;
      battleSpeedToggleEl.classList.toggle('active', battleSpeedMultiplier === 2);
      battleSpeedToggleEl.setAttribute('aria-pressed', battleSpeedMultiplier === 2 ? 'true' : 'false');
      battleSpeedToggleEl.textContent = battleSpeedMultiplier === 2 ? '2倍速 ON' : '2倍速 OFF';
    }
    function toggleBattleSpeed() {
      battleSpeedMultiplier = battleSpeedMultiplier === 2 ? 1 : 2;
      localStorage.setItem('battleSpeedMultiplier', String(battleSpeedMultiplier));
      applyBattleSpeedUi();
    }
    const closeBattleQuickMenu = () => {
      if (battleQuickMenuEl) battleQuickMenuEl.hidden = true;
    };
    const goBattleStageSelect = () => {
      if (busy) return;
      closeBattleQuickMenu();
      renderStageMap();
      showScreen('stage');
    };
    const goBattleMainMenu = () => {
      if (busy) return;
      closeBattleQuickMenu();
      showScreen('menu');
    };
    document.getElementById('battleToStage').addEventListener('click', goBattleStageSelect);
    document.getElementById('battleToMenu').addEventListener('click', goBattleMainMenu);
    document.getElementById('battleHelpOrb')?.addEventListener('click', () => openBattleHelpDialog('orb'));
    document.getElementById('battleHelpOrder')?.addEventListener('click', () => openBattleHelpDialog('order'));
    document.getElementById('battleHelpDivine')?.addEventListener('click', () => openBattleHelpDialog('divine'));
    document.getElementById('enemyIntentPanel')?.addEventListener('click', () => openEnemyMechanicDialog(getCurrentStage()));
    document.getElementById('enemyIntentPanel')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openEnemyMechanicDialog(getCurrentStage());
    });
    battleSpeedToggleEl?.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleBattleSpeed();
    });
    document.getElementById('battleQuickStage')?.addEventListener('click', goBattleStageSelect);
    document.getElementById('battleQuickMenuHome')?.addEventListener('click', goBattleMainMenu);
    document.getElementById('battleMenuGear')?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (busy || !battleQuickMenuEl) return;
      battleQuickMenuEl.hidden = !battleQuickMenuEl.hidden;
    });
    document.addEventListener('pointerdown', (event) => {
      if (battleQuickMenuEl?.hidden !== false) return;
      const target = event.target;
      if (target instanceof Node && (battleQuickMenuEl.contains(target) || document.getElementById('battleMenuGear')?.contains(target))) return;
      closeBattleQuickMenu();
    });
    document.body.addEventListener('pointerdown', startBattleBgm, { once: true });
    applyBattleSpeedUi();
    updatePlayerNameDisplay();

    renderTeam();
    renderRoster();
    renderStageMap();
    restart();


