import { width, height, characterRoster } from './config/constants.js';
import { battleBalance } from './config/balance.js?v=command-gauge-20260701b';
import { teamElements, traitRules } from './data/traits.js?v=energy-double-20260701f';
import { heroDatabase } from './data/heroes.js?v=dragon-soul-burst-20260701f';
import { rogueRewards } from './data/rogueRewards.js?v=command-gauge-20260701b';
import { equipmentRewards } from './data/equipmentRewards.js?v=hulao-armor-20260701a';
import { divineFlagsPack } from './data/divineFlags.js';
import { attackArts } from './data/attackArts.js';
import { stageData } from './data/monsters.js';
import { createMonsterBattleState, getMonsterArt, getMonsterPreviewDamage, getMonsterTurnCooldown, getStageMonster } from './data/monsterCatalog.js';
import { completeStage, createStageProgress, createStageSelectModel } from './progression/stageProgress.js';
import {
  chooseEquipment,
  createEquipmentProgress,
  equipmentSlots,
  getEquipmentSlotLabels,
  pickEquipmentRewards,
} from './progression/equipmentProgress.js?v=hulao-armor-20260701a';
import { getDomRefs } from './ui/dom.js';
import { createUiEffects } from './ui/effects.js?v=enemy-skill-pop-20260701a';
import { createAudioController } from './ui/audio.js?v=earthquake-shatter-sfx-20260701a';
import { renderEnemyDebuffs as renderEnemyDebuffsView, renderHeroRow } from './ui/renderBattle.js?v=hulao-armor-20260701a';
import { calculateBombDamage as calculateBombDamageValue } from './battle/damage.js';
import { canActivateHeroSkill, createHeroSkillDialogModel, createHeroSkillSystem } from './battle/skills.js?v=dragon-soul-burst-20260701f';
import {
  createEnemySkillCooldowns,
  getEnemyAttackType,
  getNextEnemySkillIntent,
  getReadyEnemySkill,
  resetEnemySkillCooldown,
  resolveEnemyAction,
  tickEnemySkillCooldowns,
} from './battle/turns.js';
import {
  applyDivineFlag as applyDivineFlagEffect,
  applyOrderReward as applyOrderRewardEffect,
  calculateDivineGaugeGain,
  calculateOrderGaugeGain,
  canUseDivine,
  canUseOrder,
  pickDivineRewards,
  pickOrderRewards,
} from './battle/rewards.js';

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
    let enemyDamageReduction = 0;
    let enemyVulnerability = 0;
    let enemyDebuffs = [];
    let busy = false;
    let victoryResolving = false;
    let animMode = '';
    let swapAnim = null;
    let dropKeys = new Set();
    let chargeDamage = {};
    let activeBuffs = [];
    const frozenOrbAssetByColor = {
      red: 'assets/frozen-clean/FIRE STONE FROZEN CLEAN.png',
      enhancedRed: 'assets/frozen-clean/EXTRA FIRE STONE FROZEN CLEAN.png',
      green: 'assets/frozen-clean/EARTH STONE FROZEN CLEAN.png',
      yellow: 'assets/frozen-clean/SPARK STONE FROZEN CLEAN.png',
      light: 'assets/frozen-clean/LIGHT STONE FROZEN CLEAN.png',
      dark: 'assets/frozen-clean/DARK STONE FROZEN CLEAN.png',
    };
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
      nextColorDamage: null,
      enabledAttackColors: {},
      enhancedColorMultiplier: {},
      damageReductionTurns: 0,
      damageReductionRate: 0,
    };
    let bgmStarted = false;
    let heroCardPressTimer = null;
    let heroCardLongPressFired = false;

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
      rewardDialogEl,
      rewardOptionsEl,
      battleBgmEl,
      orbClearSfxEl,
      enemyAttackSfxEl,
      battleMessageEl,
      stageMapEl,
      rosterGridEl,
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
    };

    function randomColor() {
      return colors[Math.floor(Math.random() * colors.length)].id;
    }

    function getTeamMaxHp() {
      return playerHero.hp;
    }

    function getTraitValue(rule, count) {
      return rule.values[Math.min(7, Math.max(3, count))] ?? rule.values[3];
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
      await showBattleMessage(`獲得護盾 +${amount}`, 'shield');
      showPlayerGain(amount, 'shield');
      await wait(320);
      addPlayerShield(amount);
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
      const target = document.querySelector('.player-status');
      const rect = target.getBoundingClientRect();
      const float = document.createElement('div');
      float.className = 'player-gain-float';
      const labels = { shield: '+盾 ', heal: '+HP ', energy: '+能量 ' };
      const colors = { shield: '#7fc7ff', heal: '#70f2a6', energy: '#ffe15b' };
      float.textContent = `${labels[type] ?? '+'}${amount}`;
      float.style.setProperty('--gain-color', colors[type] ?? '#ffe15b');
      float.style.left = `${rect.left + rect.width / 2}px`;
      float.style.top = `${rect.top + 10}px`;
      document.body.appendChild(float);
      window.setTimeout(() => float.remove(), 1380);
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
      el.innerHTML = renderEnemyDebuffsView({ debuffs: enemyDebuffs });
      return;
      el.innerHTML = enemyDebuffs.map((debuff) => `
        <div class="enemy-debuff" title="${debuff.description || debuff.name}">
          <img src="${debuff.icon}" alt="${debuff.name}">
          <span>${debuff.type === 'vulnerability' ? `易傷 x${debuff.layers}` : debuff.type === 'burn' ? `燃燒 ${debuff.turns}` : `${Math.round((debuff.amount || 0) * 100)}% ${debuff.turns}`}</span>
        </div>
      `).join('');
    }

    function tickEnemyDebuffs() {
      enemyDebuffs.forEach((debuff) => {
        if (debuff.fresh && debuff.type !== 'burn') {
          debuff.fresh = false;
          return;
        }
        if (debuff.type === 'burn') {
          debuff.fresh = false;
          const burnDamage = Math.round(enemyMaxHp * (debuff.amount || 0));
          const dealt = damageEnemy(burnDamage, { fixed: true });
          showEnemyBurnEffect();
          playBurnSfx();
          animateAttack(dealt, true, 'red', '燃燒');
          addLog(`燃燒造成 ${dealt} 傷害。`);
          resolveEnemyDefeat('燃燒');
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

    function addEnemyBurn() {
      const existing = enemyDebuffs.find((debuff) => debuff.type === 'burn');
      if (existing) {
        existing.turns = Math.max(existing.turns, battleBalance.enhancedFireBurnTurns);
        existing.fresh = false;
      } else {
        enemyDebuffs.push({
          id: 'burn',
          type: 'burn',
          name: '燃燒',
          description: '每回合受到最大 HP 5% 傷害。',
          amount: battleBalance.enhancedFireBurnMaxHp,
          turns: battleBalance.enhancedFireBurnTurns,
          fresh: false,
          icon: 'assets/rogue/buffs/buff_attack_up_.png',
        });
      }
      renderEnemyDebuffs();
      showEnemyStatusCallout('燃燒');
    }

    function applyPlayerDamage(amount) {
      if (divineStates.invincibleTurns > 0) {
        showBuffFlash('八陣圖：無敵');
        addLog('八陣圖擋下了敵人的攻擊。');
        return 0;
      }
      let damage = amount;
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
          const counterDamage = Math.round(blocked * battleBalance.shieldCounterRate);
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
      const shieldStacks = sumEquipmentEffect('turn_start_shield_stack');
      if (shieldStacks <= 0 || playerHp <= 0) return;
      const shieldAmount = Math.round(playerMaxHp * 0.05 * shieldStacks);
      playerShield += shieldAmount;
      playerShieldTurns = Math.max(playerShieldTurns, 1);
      shieldCounterReady = true;
      showBuffFlash(`虎牢守勢 +${shieldAmount}`);
      addLog(`虎牢守勢獲得 ${shieldAmount} 護盾。`);
    }

    function tickRogueTurnBuffs() {
      if (playerShieldTurns > 0) {
        playerShieldTurns--;
        if (playerShieldTurns <= 0) {
          playerShield = 0;
          addLog('木護盾消散。');
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
      equipmentTurnAttackBonus = 0;
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
          icon: 'assets/POSION.png',
          value: effect.damage ? ` ${effect.damage}` : '',
        },
        slow: {
          name: '遲緩',
          icon: 'assets/rogue/buffs/buff_sorcery_.png',
          value: '',
        },
        freeze: {
          name: '冰結',
          icon: 'assets/LIGHT STONE FROZEN.png',
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

    function renderBuffs() {
      const buffHtml = activeBuffs.map((buff) => `
        <div class="buff-chip" title="${buff.description}">
          <img src="${buff.buffIcon}" alt="${buff.name}">
          <span>${buff.name}${formatBuffValue(buff)} ${buff.turns > 0 ? buff.turns : ''}</span>
        </div>
      `).join('');
      const debuffHtml = playerStatusEffects.map((effect) => {
        const meta = getPlayerStatusMeta(effect);
        return `
          <div class="buff-chip debuff-chip" title="${effect.description ?? meta.name}">
            <img src="${meta.icon}" alt="${meta.name}">
            <span>${meta.name}${meta.value} ${effect.turns > 0 ? effect.turns : ''}</span>
          </div>
        `;
      }).join('');
      buffRowEl.innerHTML = `${buffHtml}${debuffHtml}`;
    }

    function tickBuffs() {
      activeBuffs.forEach((buff) => {
        if (buff.turns > 0) buff.turns--;
      });
      activeBuffs = activeBuffs.filter((buff) => buff.turns !== 0);
      tickFrozenOrbs();
      tickEnemyDebuffs();
      tickDivineStates();
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
      if (changed) renderBoard();
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
      Object.keys(divineStates.enabledAttackColors).forEach((color) => {
        divineStates.enabledAttackColors[color]--;
        if (divineStates.enabledAttackColors[color] <= 0) delete divineStates.enabledAttackColors[color];
      });
      if (ironWallTurns > 0) ironWallTurns--;
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

    function playCourageExplosionSfx() {
      audioController.playCourageExplosionSfx();
    }

    function playBurnSfx() {
      audioController.playBurnSfx();
    }

    function playFreezeSfx() {
      audioController.playFreezeSfx?.();
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

    function playAttackEventSfx(event) {
      if (event.attackType === 'thunder' || event.sfx === 'thunder') playThunderSfx();
      if (event.sfx === 'courageExplosion' || event.label?.includes('爆破')) playCourageExplosionSfx();
    }

    function playEnemyActionSfx(skill) {
      if (skill?.effectType === 'freeze') {
        playFreezeSfx();
        return;
      }
      if (skill?.effectType === 'freeze_board_orbs') return;
      playEnemyAttackSfx();
    }

    function getAttackArt(count) {
      return attackArts.find((art) => count >= art.min) ?? attackArts[attackArts.length - 1];
    }

    function showAttackName(count, { playVoice = true } = {}) {
      const art = getAttackArt(count);
      if (playVoice) playHeroVoice(art.voice);
      const el = document.createElement('div');
      el.className = 'attack-name-pop';
      el.innerHTML = `<img src="${art.icon}" alt=""><span>${playerHero.name}・${art.name}</span>`;
      document.body.appendChild(el);
      window.setTimeout(() => el.remove(), 1000);
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
      const index = playerStatusEffects.findIndex((effect) => ['burn', 'poison', 'attackDown', 'slow', 'freeze'].includes(effect.type));
      if (index < 0) return false;
      const [removed] = playerStatusEffects.splice(index, 1);
      showBuffFlash('光淨化');
      addLog(`光特性清除了 ${removed.type}。`);
      return true;
    }

    function destroyRandomNonSpecialOrb() {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.special) candidates.push({ x, y });
      }));
      if (!candidates.length) return false;
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      board[target.y][target.x] = null;
      showBoardBombs([target]);
      playBombSfx();
      dropKeys = collapseBoard();
      renderBoard();
      window.setTimeout(() => {
        dropKeys = new Set();
        renderBoard();
      }, 260);
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
          if (board[y]?.[x] && !board[y][x].special) board[y][x] = makeOrb();
        });
      }
    }

    function destroyRandomNonSpecialOrbs(requestedCount, { preventAutoMatches = false, visual = 'bomb' } = {}) {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.special) candidates.push({ x, y });
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
      dropKeys = collapseBoard();
      if (preventAutoMatches) stabilizeBoardMatchesWithoutClearing();
      renderBoard();
      window.setTimeout(() => {
        dropKeys = new Set();
        renderBoard();
      }, 260);
      return bombedCells.length;
    }

    function destroyRandomOrbsByColor(color, requestedCount, { allowEquipmentChain = true } = {}) {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.special && cellColor(cell) === color) candidates.push({ x, y });
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
        dropKeys = collapseBoard();
        renderBoard();
        window.setTimeout(() => {
          dropKeys = new Set();
          renderBoard();
        }, 260);
        if (color === 'red') resolveFireBombEquipmentEffects(destroyed, { allowChain: allowEquipmentChain });
      }
      return destroyed;
    }

    function freezeRandomBoardOrbs(effect) {
      const candidates = [];
      board.forEach((row, y) => row.forEach((cell, x) => {
        if (cell && !cell.special && !cell.frozen) candidates.push({ x, y });
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
        };
      }
      renderBoard();
      playFreezeSfx();
      showBuffFlash(`冰凍珠 x${count}`);
      addLog(`冰咒凍結 ${count} 顆珠子，持續 ${effect.durationTurns ?? 3} 回合。`);
      return count;
    }

    function shatterRandomBoardOrbs(effect) {
      const shattered = destroyRandomNonSpecialOrbs(effect.count ?? 10, { preventAutoMatches: true, visual: 'shatter' });
      if (shattered > 0) {
        addLog(`大地震裂震碎 ${shattered} 顆珠子，盤面重新落珠但不觸發消除。`);
      }
      return shattered;
    }

    function applyEnemyBoardEffect(effect) {
      if (effect.type === 'freeze_random_orbs') return freezeRandomBoardOrbs(effect);
      if (effect.type === 'shatter_random_orbs') return shatterRandomBoardOrbs(effect);
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
        existing.damage = effect.damage ?? existing.damage;
        existing.amount = effect.amount ?? existing.amount;
        existing.icon = effect.icon ?? existing.icon;
        existing.name = effect.name ?? existing.name;
        existing.description = effect.description ?? existing.description;
      } else {
        playerStatusEffects.push(effect);
      }
      renderBuffs();
      showBuffFlash(effect.name ?? getPlayerStatusMeta(effect).name);
    }

    function tickPlayerStatuses() {
      let dotDamage = 0;
      playerStatusEffects.forEach((effect) => {
        if (effect.type === 'burn' || effect.type === 'poison') dotDamage += effect.damage;
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
        damage -= shieldBlocked;
        addLog(`敵人護盾吸收 ${shieldBlocked} 傷害。`);
      }
      enemyHp = Math.max(0, enemyHp - damage);
      return damage;
    }

    function resolveEnemyDefeat(source = '') {
      if (enemyHp > 0) return false;
      if (!victoryResolving) {
        if (source) addLog(`${getCurrentStage().name} 被擊破。`);
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

    function renderStageMap() {
      const stageLabels = [
        '黃巾妖兵',
        '鬼火燎營',
        '妖甲巨斧',
        '妖影術士',
        '血月狼將',
        '魔門力士',
        '奈蝕妖姬',
        '冥幽鬼騎',
        '八岐妖魂',
        '虎牢魔君',
      ];
      stageMapEl.innerHTML = createStageSelectModel(stageData, stageProgress).map((data) => `
        <button class="stage-node ${data.locked ? 'locked' : ''} ${data.cleared ? 'cleared' : ''}" data-stage="${data.stageNo}" type="button" ${data.locked ? 'disabled' : ''}>
          <i aria-hidden="true"></i>
          <span>${data.stageNo}. ${stageLabels[data.stageNo - 1] ?? data.name}</span>
          <small>${data.locked ? '未解鎖' : data.cleared ? '已通關' : `妖力 ${data.hp}`}</small>
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
          addLog(`虎牢妖門 ${selectedStage}：${stageData[selectedStage - 1].name} 出現。`);
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
      const raw = rawCellColor(cell);
      const frozen = cell?.frozen ? ' frozen' : '';
      if (raw === 'enhancedRed') return `red extra-fire${frozen}`;
      if (raw === 'rainbow') return `rainbow${frozen}`;
      return `${cellColor(cell)}${frozen}`;
    }

    function matchColor(cell) {
      if (cell?.special) return null;
      if (cell?.frozen && cell.frozen.canMatch === false) return null;
      const color = cellColor(cell);
      return color === 'rainbow' ? null : color;
    }

    function createBoard() {
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
      rewardDialogEl.querySelector('.roster-flavor').textContent = '選擇一件裝備加入本章配置。武器只能裝在武器欄，甲冑只能裝在甲冑欄。';
      rewardOptionsEl.innerHTML = `
        ${rewards.map((equipment) => `
        <button class="reward-card equipment-reward-card" data-equipment="${equipment.id}" type="button">
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

    function chooseDivineFlag(id) {
      const flag = divineFlagsPack.flags.find((item) => item.id === id);
      if (!flag) return;
      closeRewardDialog();
      divineGauge = 0;
      renderCommandGauges();
      applyDivineFlag(flag);
      addLog(`神令旗「${flag.name}」：${flag.description}`);
      updateStats();
      renderTeam();
      renderBoard();
      if (resolveEnemyDefeat(flag.name)) return;
      busy = false;
    }

    function getBoardColors() {
      return [...new Set(board.flat().filter((cell) => cell && !cell.special).map((cell) => cellColor(cell)).filter((color) => colors.some((item) => item.id === color)))];
    }

    function getRandomBoardColor(except = null) {
      const available = getBoardColors().filter((color) => color !== except);
      return available[Math.floor(Math.random() * available.length)] || colors[0].id;
    }

    function convertBoardColor(from, to) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x] && !board[y][x].special && cellColor(board[y][x]) === from) board[y][x].color = to;
        }
      }
    }

    function spawnRandomOrbs(color, count) {
      const spots = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (!board[y][x]?.special) spots.push({ x, y });
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
          if (board[y][x] && !board[y][x].special && rawCellColor(board[y][x]) !== color) spots.push({ x, y });
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

    function destroyBoardColor(color) {
      let destroyed = 0;
      const bombedCells = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x] && !board[y][x].special && cellColor(board[y][x]) === color) {
            board[y][x] = null;
            bombedCells.push({ x, y });
            destroyed++;
          }
        }
      }
      showBoardBombs(bombedCells);
      if (destroyed > 0) playBombSfx();
      dropKeys = collapseBoard();
      addOrderGauge(destroyed);
      addDivineGauge(destroyed);
      addOverflowRewards(destroyed);
      applyBombDamage(destroyed, 'yellow');
      return destroyed;
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

    function applyDivineFlag(flag) {
      applyDivineFlagEffect(flag, {
        traitRules,
        battleBalance,
        playerHero,
        divineStates,
        getCurrentStage,
        getRandomBoardColor,
        convertBoardColor,
        spawnRandomOrbs,
        damageEnemy,
        animateAttack,
        showAttackEffect,
        showBuffFlash,
        destroyBoardColor,
        swapBoardColors,
        resultEl,
      });
      flashResult();
    }

    function convertRandomBoardColor() {
      const available = [...new Set(board.flat().filter((cell) => cell && !cell.special).map((cell) => cellColor(cell)).filter(Boolean))];
      if (available.length < 2) return;
      const from = available[Math.floor(Math.random() * available.length)];
      let to = from;
      while (to === from) to = colors[Math.floor(Math.random() * colors.length)].id;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (board[y][x] && !board[y][x].special && cellColor(board[y][x]) === from) board[y][x].color = to;
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
        </article>
      `).join('');
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
          if (cell?.frozen) {
            const frozenSrc = frozenOrbAssetByColor[rawCellColor(cell)] ?? frozenOrbAssetByColor[cellColor(cell)];
            if (frozenSrc) button.style.backgroundImage = `url("${frozenSrc}")`;
            button.title = `冰凍 ${cell.frozen.turns} 回合`;
          }
          button.setAttribute('aria-label', `${x + 1},${y + 1}`);
          button.addEventListener('click', () => clickOrb(x, y));
          boardEl.appendChild(button);
        }
      }
    }

    function clickOrb(x, y) {
      if (busy || enemyHp <= 0 || playerHp <= 0) return;
      if (resolvePendingOrderColorConvert(x, y)) return;
      if (board[y][x]?.frozen && board[y][x].frozen.canMove === false) {
        selected = null;
        showBuffFlash('冰凍珠無法移動');
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
      if (dx + dy !== 1) {
        selected = { x, y };
        renderBoard();
        return;
      }

      const first = selected;
      const second = { x, y };
      if (board[first.y][first.x]?.frozen?.canMove === false || board[second.y][second.x]?.frozen?.canMove === false) {
        selected = null;
        showBuffFlash('冰凍珠無法移動');
        renderBoard();
        return;
      }
      busy = true;
      swap(first, second);
      swapAnim = { first, second };
      selected = null;
      renderBoard();
      const matches = findMatches();
      if (!matches.groups.length) {
        window.setTimeout(async () => {
          swapAnim = null;
          renderBoard();
          resultEl.textContent = '未形成消除，消耗 1 回合。';
          flashResult();
          addLog('未形成三消，盤面保留並消耗 1 回合。');
          await resolvePlayerTurnEnd({ allowExtraMove: false });
        }, 170);
        return;
      }
      window.setTimeout(() => {
        swapAnim = null;
        handleMove({ x, y });
      }, 170);
    }

    async function resolvePlayerTurnEnd({ allowExtraMove = true } = {}) {
      tickPlayerStatuses();
      tickRogueTurnBuffs();
      if (playerHp <= 0) {
        addLog('玩家倒下了。');
        updateStats();
        renderTeam();
        busy = false;
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
      }
      tickBuffs();
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
      const attackEvents = [];
      const pendingTraits = [];

      while (true) {
        const { groups, cells } = findMatches();
        if (!groups.length) break;
        combo++;
        if (combo >= 2) showComboPop(combo);
        const specialCreates = getSpecialCreates(groups, lastMove);
        addOrderGauge(cells.length);
        addDivineGauge(cells.length);
        addOverflowRewards(cells.length);
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
        clearCells(cells);
        dropKeys = collapseBoard();
        placeSpecialCreatesAfterCollapse(specialCreates);
        renderBoard();
        await wait(460);
        dropKeys = new Set();
      }

      if (combo === 0) {
        addLog('沒有形成消除。');
        equipmentTurnAttackBonus = 0;
        busy = false;
        return;
      }

      await wait(220);
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
      if (orderPassives.battleSpirit && turnRedCount >= 3) addBattleSpiritStack();
      let redOrbBonusDamage = turnRedCount > 0 ? Math.round(turnRedCount * battleBalance.redOrbBonusAtk * playerHero.attack) : 0;
      let shieldGain = 0;
      let energyGain = 0;
      let healGain = 0;
      for (const effect of pendingTraits) {
        const { color, count, value, enhanced } = effect;
        const rule = traitRules[color];
        if (!rule) continue;
        if (rule.type === 'attack' || divineStates.enabledAttackColors[color] > 0) {
          let multiplier = getPlayerAttackMultiplier() * finalComboMultiplier;
          let consumedDragonMultiplier = 1;
          if (enhanced && color === 'red') multiplier *= battleBalance.enhancedFireMultiplier;
          if (divineStates.nextColorDamage?.targetColor === color) {
            consumedDragonMultiplier = divineStates.nextColorDamage.damageMultiplier;
            multiplier *= consumedDragonMultiplier;
            showBuffFlash(`青龍現世 x${consumedDragonMultiplier}`);
            if (divineStates.nextColorDamage.consumeOnTrigger) divineStates.nextColorDamage = null;
          }
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
          attackEvents.push({ color, count, damage, attackType: color === 'yellow' ? 'thunder' : color === 'red' && count >= 5 ? 'fire' : color });
          if (color === 'red' && enhanced) {
            const bonusDamage = Math.round(playerHero.attack * battleBalance.enhancedFireFlatAtk * getPlayerAttackMultiplier() * finalComboMultiplier * consumedDragonMultiplier * fireDamageMultiplier);
            totalDamage += bonusDamage;
            attackEvents.push({ color, count, damage: bonusDamage, attackType: 'fire', label: '強化火珠爆裂', skill: true });
            addEnemyBurn();
          }
          if (color === 'red' && count >= 4) triggerBoardBurst(count >= 5 ? '烈焰斬' : '火焰爆擊', 'fire');
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
          energyGain += Math.round(value * finalComboMultiplier);
          if (count >= 4) {
            const thunderDamage = Math.round(playerHero.attack * battleBalance.thunderStrikeAtk * getPlayerAttackMultiplier() * finalComboMultiplier);
            totalDamage += thunderDamage;
            attackEvents.push({ color: 'yellow', count, damage: thunderDamage, attackType: 'thunder', label: '雷擊', skill: true });
            if (count >= 5) {
              const bombed = destroyRandomNonSpecialOrb();
              const bombDamage = applyBombDamage(bombed, 'yellow', true);
              totalDamage += bombDamage;
              if (bombDamage > 0) attackEvents.push({ color: 'yellow', count, damage: bombDamage, attackType: 'thunder', label: '炸珠雷爆', skill: true });
            }
          }
        } else if (rule.type === 'heal') {
          healGain += Math.round(playerHero.recovery * value * finalComboMultiplier);
          if (count >= 4 && !cleanseOnePlayerDebuff()) healGain += Math.round(playerMaxHp * battleBalance.lightCleanseExtraHealMaxHp);
        } else if (rule.type === 'vulnerability') {
          addEnemyVulnerability(value, count, finalComboMultiplier);
        }
      }
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
      if (healGain > 0) await gainPlayerHeal(healGain);

      let followUpUsed = false;
      for (const event of attackEvents) {
        const actionName = event.label || getAttackArt(event.count).name;
        showAttackName(event.count, { playVoice: !event.skill });
        let dealt = 0;
        await playBattleStep(`${playerHero.hero}・${actionName}`, () => {
          playAttackEventSfx(event);
          shootBeam(event.color);
          dealt = damageEnemy(event.damage);
          addLog(`${actionName}造成 ${dealt} 傷害。`);
          updateStats();
          animateAttack(dealt, !!event.skill, event.color, actionName);
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
        const followUp = enemyHp > 0 ? getBuff('follow_up') : null;
        if (followUp && !followUpUsed) {
          followUpUsed = true;
          const followDamage = Math.round(playerHero.attack * followUp.value * getPlayerAttackMultiplier() * finalComboMultiplier);
          let followDealt = 0;
          await playBattleStep('追擊令・突進！', () => {
            followDealt = damageEnemy(followDamage);
            totalDamage += followDealt;
            shootBeam('red', true);
            animateAttack(followDealt, true, 'red', '追擊');
            addLog(`追擊令追加 ${followDealt} 傷害。`);
            updateStats();
          }, 'red');
          if (resolveEnemyDefeat('追擊令')) return;
          await wait(120);
        }
      }
      if (!followUpUsed && orderPassives.pursuit && turnRedCount >= 3 && enemyHp > 0 && attackEvents.length && Math.random() < 0.3) {
        followUpUsed = true;
        const followDamage = Math.round(playerHero.attack * 0.5 * getPlayerAttackMultiplier() * finalComboMultiplier);
        let followDealt = 0;
        await playBattleStep('被動追擊・突進！', () => {
          followDealt = damageEnemy(followDamage);
          totalDamage += followDealt;
          shootBeam('red', true);
          animateAttack(followDealt, true, 'red', '追擊');
          addLog(`被動追擊追加 ${followDealt} 傷害。`);
          updateStats();
        }, 'red');
        if (resolveEnemyDefeat('被動追擊')) return;
        await wait(120);
      }
      await wait(160);

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
      if (busy || enemyHp <= 0 || playerHp <= 0) return;
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
      for (let x = 0; x < width; x++) {
        const stack = [];
        for (let y = height - 1; y >= 0; y--) {
          if (board[y][x]) stack.push({ cell: board[y][x], fromY: y });
        }
        for (let y = height - 1; y >= 0; y--) {
          const item = stack.shift();
          if (item) {
            board[y][x] = item.cell;
            if (item.fromY !== y) moved.add(`${x},${y}`);
          } else {
            board[y][x] = makeOrb();
            moved.add(`${x},${y}`);
          }
        }
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

    function updateStats() {
      const currentStage = getCurrentStage();
      document.getElementById('enemyHp').textContent = enemyHp;
      document.getElementById('enemyMaxHp').textContent = enemyMaxHp;
      document.getElementById('playerHp').textContent = playerHp;
      document.getElementById('playerMaxHp').textContent = playerMaxHp;
      document.getElementById('enemyTurn').textContent = enemyTurn;
      const turnBox = document.querySelector('.turn');
      if (turnBox) {
        let intentLabel = document.getElementById('enemyIntentLabel');
        if (!intentLabel) {
          intentLabel = document.createElement('span');
          intentLabel.id = 'enemyIntentLabel';
          intentLabel.className = 'enemy-intent-label';
          turnBox.appendChild(intentLabel);
        }
        const nextSkillIntent = getNextEnemySkillIntent(currentStage, {
          actionCount: enemyActionCount,
          currentTurn: enemyTurn,
          skillCooldowns: enemySkillCooldowns,
        });
        intentLabel.textContent = nextSkillIntent
          ? `下一招 ${nextSkillIntent.name} ${nextSkillIntent.turnsRemaining} 回合`
          : '';
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
    }

    function animateAttack(damage, skill = false, color = 'light', label = '') {
      uiEffects.animateAttack(damage, skill, color, label);
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
        if (action.shieldGain > 0) {
          enemyShield += action.shieldGain;
          if (action.damageReduction !== null) enemyDamageReduction = action.damageReduction;
          addLog(`${label}，獲得 ${skill.shield ?? 0} 護盾。`);
          updateStats();
          if (action.endsAfterShield) return;
        }
        action.playerStatuses.forEach((status) => addPlayerStatus(status));
        action.boardEffects.forEach((effect) => applyEnemyBoardEffect(effect));
      }

      if (useSkill && ['freeze_board_orbs', 'shatter_board_orbs'].includes(skill.effectType)) {
        if (skill.description) addLog(skill.description);
        await wait(520);
        return;
      }

      playEnemyActionSfx(useSkill ? skill : null);
      const attackType = getEnemyAttackType(useSkill ? skill : null);
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
      window.setTimeout(() => {
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
      window.setTimeout(() => {
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
      document.getElementById('nextStage').textContent = '回到關卡選擇';
      victoryPanelEl.classList.remove('show');
      openEquipmentRewardDialog();
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
        orderGauge = 0;
        divineGauge = 0;
        playerStatusEffects = [];
        activeBuffs = [];
        clearOrderPassives();
        divineStates = {
          invincibleTurns: 0,
          enemyAttackMultiplier: 1,
          enemyAttackDebuffTurns: 0,
          nextColorDamage: null,
          enabledAttackColors: {},
          enhancedColorMultiplier: {},
          damageReductionTurns: 0,
          damageReductionRate: 0,
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
      enemyDamageReduction = monsterBattleState.damageReduction;
      enemyVulnerability = monsterBattleState.vulnerability;
      enemyDebuffs = monsterBattleState.debuffs;
      busy = false;
      victoryResolving = false;
      selected = null;
      swapAnim = null;
      animMode = '';
      chargeDamage = {};
      closeSkillDialog();
      victoryPanelEl.classList.remove('show');
      enemyArtEl.classList.remove('dead', 'hit', 'skill-hit', 'attack');
      enemyNameEl.textContent = currentStage.name;
      document.getElementById('enemyImage').src = getMonsterArt(currentStage);
      document.getElementById('enemyImage').alt = currentStage.name;
      applyTurnStartEquipmentEffects();
      updateStats();
      renderEnemyDebuffs();
      renderBuffs();
      renderCommandGauges();
      createBoard();
      renderTeam();
    }

    function nextStage() {
      victoryPanelEl.classList.remove('show');
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
      startStage(true);
      addLog(`虎牢妖門 ${stage}：${stageData[stage - 1].name} 出現。`);
    }

    function wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
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
      if (event.target === rewardDialogEl && rewardMode === 'equipmentDetail') closeRewardDialog();
    });
    skillConfirmEl.addEventListener('click', () => {
      if (pendingSkillColor) activateHeroSkill(pendingSkillColor);
    });
    document.getElementById('startGame').addEventListener('click', () => {
      startBattleBgm();
      showScreen('menu');
    });
    document.getElementById('goAdventure').addEventListener('click', () => {
      renderStageMap();
      showScreen('stage');
    });
    document.getElementById('goTeam').addEventListener('click', () => {
      renderRoster();
      showScreen('team');
    });
    document.getElementById('goShop').addEventListener('click', () => alert('商店功能準備中'));
    document.getElementById('goGacha').addEventListener('click', () => alert('抽卡功能準備中'));
    document.getElementById('backMenu').addEventListener('click', () => showScreen('menu'));
    document.getElementById('backMenuFromTeam').addEventListener('click', () => showScreen('menu'));
    document.getElementById('battleToStage').addEventListener('click', () => {
      if (busy) return;
      renderStageMap();
      showScreen('stage');
    });
    document.getElementById('battleToMenu').addEventListener('click', () => {
      if (busy) return;
      showScreen('menu');
    });
    document.body.addEventListener('pointerdown', startBattleBgm, { once: true });

    renderTeam();
    renderRoster();
    renderStageMap();
    restart();
