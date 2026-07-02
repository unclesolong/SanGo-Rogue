export function createAudioController({
  battleBgmEl,
  orbClearSfxEl,
  enemyAttackSfxEl,
  documentRef = document,
} = {}) {
  let bgmStarted = false;
  let sfxContext = null;

  function startLoopingBgm() {
    if (!battleBgmEl) return;
    if (bgmStarted && !battleBgmEl.paused) return;
    battleBgmEl.volume = 0.36;
    const playPromise = battleBgmEl.play();
    if (playPromise) {
      playPromise.then(() => {
        bgmStarted = true;
      }).catch(() => {});
    }
  }

  function unlockAudioOnce() {
    startLoopingBgm();
    documentRef.removeEventListener('pointerdown', unlockAudioOnce);
    documentRef.removeEventListener('keydown', unlockAudioOnce);
  }

  function playAudioCue(audioEl, { volume = 0.7, removeAfter = 1200 } = {}) {
    if (!audioEl) return;
    const sound = audioEl.cloneNode();
    sound.volume = volume;
    sound.play().catch(() => {});
    window.setTimeout(() => sound.remove(), removeAfter);
  }

  function playOrbClearSfx() {
    playAudioCue(orbClearSfxEl, { volume: 0.62 });
  }

  function playEnemyAttackSfx() {
    playAudioCue(enemyAttackSfxEl, { volume: 0.72 });
  }

  function getSfxContext() {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) return null;
    if (!sfxContext) sfxContext = new AudioContextCtor();
    if (sfxContext.state === 'suspended') sfxContext.resume().catch(() => {});
    return sfxContext;
  }

  function createNoiseBuffer(context, duration, power = 2.4) {
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const progress = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - progress, power);
    }
    return buffer;
  }

  function playNoiseBurst({ duration = 0.34, volume = 0.6, filterType = 'lowpass', startFreq = 900, endFreq = 160, power = 2.4 } = {}) {
    const context = getSfxContext();
    if (!context) {
      playOrbClearSfx();
      return;
    }
    const now = context.currentTime;
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = createNoiseBuffer(context, duration, power);
    filter.type = filterType;
    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    noiseGain.gain.setValueAtTime(volume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noise.connect(filter).connect(noiseGain).connect(context.destination);
    noise.start(now);
    noise.stop(now + duration);
    return context;
  }

  function playBombSfx() {
    const context = playNoiseBurst({ duration: 0.44, volume: 0.82, startFreq: 1100, endFreq: 120, power: 2.05 });
    if (!context) return;
    const now = context.currentTime;

    const thump = context.createOscillator();
    const thumpGain = context.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(120, now);
    thump.frequency.exponentialRampToValueAtTime(44, now + 0.18);
    thumpGain.gain.setValueAtTime(0.58, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    thump.connect(thumpGain).connect(context.destination);

    thump.start(now);
    thump.stop(now + 0.3);
  }

  function playShatterSfx() {
    const context = playNoiseBurst({ duration: 0.72, volume: 0.72, startFreq: 520, endFreq: 62, power: 1.55 });
    if (!context) return;
    const now = context.currentTime;

    const quake = context.createOscillator();
    const quakeGain = context.createGain();
    quake.type = 'sine';
    quake.frequency.setValueAtTime(54, now);
    quake.frequency.exponentialRampToValueAtTime(28, now + 0.54);
    quakeGain.gain.setValueAtTime(0.62, now);
    quakeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.72);
    quake.connect(quakeGain).connect(context.destination);
    quake.start(now);
    quake.stop(now + 0.74);

    [240, 310, 185, 420, 132].forEach((freq, index) => {
      const chip = context.createOscillator();
      const gain = context.createGain();
      const start = now + 0.06 + index * 0.045;
      chip.type = 'triangle';
      chip.frequency.setValueAtTime(freq, start);
      chip.frequency.exponentialRampToValueAtTime(Math.max(58, freq * 0.42), start + 0.16);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      chip.connect(gain).connect(context.destination);
      chip.start(start);
      chip.stop(start + 0.22);
    });
  }

  function playCounterSfx() {
    const context = getSfxContext();
    if (!context) {
      playEnemyAttackSfx();
      return;
    }
    const now = context.currentTime;
    [900, 1320].forEach((freq, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + index * 0.035);
      gain.gain.setValueAtTime(0.32, now + index * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + index * 0.035);
      osc.connect(gain).connect(context.destination);
      osc.start(now + index * 0.035);
      osc.stop(now + 0.2 + index * 0.035);
    });
  }

  function playThunderSfx() {
    const context = playNoiseBurst({ duration: 0.48, volume: 0.62, filterType: 'bandpass', startFreq: 2600, endFreq: 420, power: 1.35 });
    if (!context) return;
    const now = context.currentTime;
    [1800, 930, 520].forEach((freq, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + index * 0.035);
      gain.gain.setValueAtTime(0.2, now + index * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + index * 0.04);
      osc.connect(gain).connect(context.destination);
      osc.start(now + index * 0.035);
      osc.stop(now + 0.18 + index * 0.04);
    });
  }

  function playChaosThunderSfx() {
    const playSynthFallback = () => {
      const context = playNoiseBurst({ duration: 1.25, volume: 0.9, filterType: 'lowpass', startFreq: 1400, endFreq: 58, power: 1.1 });
      if (!context) return;
      const now = context.currentTime;

      const rumble = context.createOscillator();
      const rumbleGain = context.createGain();
      rumble.type = 'sawtooth';
      rumble.frequency.setValueAtTime(42, now);
      rumble.frequency.exponentialRampToValueAtTime(24, now + 1.05);
      rumbleGain.gain.setValueAtTime(0.58, now);
      rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.28);
      rumble.connect(rumbleGain).connect(context.destination);
      rumble.start(now);
      rumble.stop(now + 1.3);

      [0.08, 0.24, 0.48, 0.74].forEach((delay, index) => {
        const snap = context.createOscillator();
        const gain = context.createGain();
        const start = now + delay;
        snap.type = index % 2 ? 'square' : 'sawtooth';
        snap.frequency.setValueAtTime(index % 2 ? 840 : 1560, start);
        snap.frequency.exponentialRampToValueAtTime(index % 2 ? 210 : 380, start + 0.16);
        gain.gain.setValueAtTime(index === 0 ? 0.42 : 0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        snap.connect(gain).connect(context.destination);
        snap.start(start);
        snap.stop(start + 0.24);
      });
    };

    const sound = new Audio('assets/audio/sfx_boss_chaos_thunder_01.wav');
    sound.volume = 0.92;
    sound.play().catch(playSynthFallback);
  }

  function playCourageExplosionSfx() {
    const context = playNoiseBurst({ duration: 0.62, volume: 0.86, startFreq: 1500, endFreq: 72, power: 1.75 });
    if (!context) return;
    const now = context.currentTime;
    const boom = context.createOscillator();
    const gain = context.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(84, now);
    boom.frequency.exponentialRampToValueAtTime(32, now + 0.34);
    gain.gain.setValueAtTime(0.68, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    boom.connect(gain).connect(context.destination);
    boom.start(now);
    boom.stop(now + 0.44);
  }

  function playBurnSfx() {
    const context = playNoiseBurst({ duration: 0.78, volume: 0.52, startFreq: 1800, endFreq: 260, power: 1.25 });
    if (!context) return;
    const now = context.currentTime;
    [96, 142].forEach((freq, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.58, now + 0.48 + index * 0.08);
      gain.gain.setValueAtTime(index === 0 ? 0.18 : 0.12, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58 + index * 0.08);
      osc.connect(gain).connect(context.destination);
      osc.start(now + index * 0.08);
      osc.stop(now + 0.62 + index * 0.08);
    });
  }

  function playFreezeSfx() {
    const context = getSfxContext();
    if (!context) {
      playOrbClearSfx();
      return;
    }
    const now = context.currentTime;
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = createNoiseBuffer(context, 0.42, 1.1);
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(4200, now + 0.28);
    noiseGain.gain.setValueAtTime(0.68, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    noise.connect(filter).connect(noiseGain).connect(context.destination);
    noise.start(now);
    noise.stop(now + 0.44);

    [1760, 2340, 3120].forEach((freq, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.045);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.22, now + 0.18 + index * 0.045);
      gain.gain.setValueAtTime(0.28, now + index * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22 + index * 0.045);
      osc.connect(gain).connect(context.destination);
      osc.start(now + index * 0.045);
      osc.stop(now + 0.25 + index * 0.045);
    });
  }

  function playOverflowSfx() {
    const context = getSfxContext();
    if (!context) {
      playOrbClearSfx();
      return;
    }
    const now = context.currentTime;
    [392, 523, 784].forEach((freq, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = index === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.075);
      gain.gain.setValueAtTime(index === 0 ? 0.32 : 0.24, now + index * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32 + index * 0.075);
      osc.connect(gain).connect(context.destination);
      osc.start(now + index * 0.075);
      osc.stop(now + 0.34 + index * 0.075);
    });
  }

  function playBonusSfx() {
    const context = getSfxContext();
    if (!context) {
      playOrbClearSfx();
      return;
    }
    const now = context.currentTime;
    [660, 990, 1320, 1760].forEach((freq, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.055);
      gain.gain.setValueAtTime(0.2, now + index * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24 + index * 0.055);
      osc.connect(gain).connect(context.destination);
      osc.start(now + index * 0.055);
      osc.stop(now + 0.26 + index * 0.055);
    });
  }

  function playSkillCastSfx(skill = {}) {
    if (skill.sfx) {
      playHeroVoice(skill.sfx);
      return;
    }
    if (skill.id === 'active_dragon_soul_burst' || skill.name?.includes('龍')) {
      const context = playNoiseBurst({ duration: 0.72, volume: 0.58, filterType: 'bandpass', startFreq: 1800, endFreq: 260, power: 1.15 });
      if (!context) return;
      const now = context.currentTime;

      const roar = context.createOscillator();
      const roarGain = context.createGain();
      roar.type = 'sawtooth';
      roar.frequency.setValueAtTime(92, now);
      roar.frequency.exponentialRampToValueAtTime(48, now + 0.58);
      roarGain.gain.setValueAtTime(0.38, now);
      roarGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      roar.connect(roarGain).connect(context.destination);
      roar.start(now);
      roar.stop(now + 0.72);

      [392, 587, 784, 1175].forEach((freq, index) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = index < 2 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.08 + index * 0.07);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.34 + index * 0.06);
        gain.gain.setValueAtTime(index === 0 ? 0.28 : 0.18, now + 0.08 + index * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.46 + index * 0.06);
        osc.connect(gain).connect(context.destination);
        osc.start(now + 0.08 + index * 0.07);
        osc.stop(now + 0.5 + index * 0.06);
      });
      return;
    }
    const context = getSfxContext();
    if (!context) {
      playOrbClearSfx();
      return;
    }
    const now = context.currentTime;
    [220, 330, 660].forEach((freq, index) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = index === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + 0.32 + index * 0.08);
      gain.gain.setValueAtTime(index === 0 ? 0.26 : 0.2, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42 + index * 0.08);
      osc.connect(gain).connect(context.destination);
      osc.start(now + index * 0.08);
      osc.stop(now + 0.46 + index * 0.08);
    });
  }

  function playHeroVoice(src) {
    if (!src) return;
    const sound = new Audio(src);
    sound.volume = 0.86;
    sound.play().catch(() => {});
  }

  function playComboOrderSfx() {
    playHeroVoice('assets/audio/sfx_combo_angry_hahh_1s.wav');
  }

  function playPassiveSfx() {
    playHeroVoice('assets/audio/sfx_hero_zhaoyun_passive_courage_trigger_ding_01.wav');
  }

  function playRewardSfx(reward) {
    playHeroVoice(reward?.sfx);
  }

  return {
    startLoopingBgm,
    unlockAudioOnce,
    playAudioCue,
    playOrbClearSfx,
    playEnemyAttackSfx,
    playBombSfx,
    playShatterSfx,
    playCounterSfx,
    playThunderSfx,
    playChaosThunderSfx,
    playCourageExplosionSfx,
    playBurnSfx,
    playFreezeSfx,
    playOverflowSfx,
    playBonusSfx,
    playSkillCastSfx,
    playComboOrderSfx,
    playHeroVoice,
    playPassiveSfx,
    playRewardSfx,
  };
}

export function startLoopingBgm() {
  throw new Error('Use createAudioController().startLoopingBgm after audio refs are available.');
}

export function playAudioCue() {
  throw new Error('Use createAudioController().playAudioCue after audio refs are available.');
}

export function playBombSfx() {
  throw new Error('Use createAudioController().playBombSfx after audio refs are available.');
}

export function playShatterSfx() {
  throw new Error('Use createAudioController().playShatterSfx after audio refs are available.');
}

export function playCounterSfx() {
  throw new Error('Use createAudioController().playCounterSfx after audio refs are available.');
}

export function playThunderSfx() {
  throw new Error('Use createAudioController().playThunderSfx after audio refs are available.');
}

export function playChaosThunderSfx() {
  throw new Error('Use createAudioController().playChaosThunderSfx after audio refs are available.');
}

export function playCourageExplosionSfx() {
  throw new Error('Use createAudioController().playCourageExplosionSfx after audio refs are available.');
}

export function playBurnSfx() {
  throw new Error('Use createAudioController().playBurnSfx after audio refs are available.');
}

export function playFreezeSfx() {
  throw new Error('Use createAudioController().playFreezeSfx after audio refs are available.');
}

export function playOverflowSfx() {
  throw new Error('Use createAudioController().playOverflowSfx after audio refs are available.');
}

export function playBonusSfx() {
  throw new Error('Use createAudioController().playBonusSfx after audio refs are available.');
}

export function playSkillCastSfx() {
  throw new Error('Use createAudioController().playSkillCastSfx after audio refs are available.');
}

export function unlockAudioOnce() {
  throw new Error('Use createAudioController().unlockAudioOnce after audio refs are available.');
}
