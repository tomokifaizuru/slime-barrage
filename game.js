/**
 * Slime Barrage v0.7
 * Original IP — casual pink-hair hoodie girl vs cute colorful slimes.
 * Canvas world sprites + HTML/CSS overlays for crisp UI text.
 * Procedural Web Audio SFX + original GB-inspired BGM (no copyrighted audio).
 * World/camera zoom (VIEW_ZOOM) — UI overlays stay screen-sized.
 */
(() => {
  'use strict';

  // ---------- Config ----------
  // Mutable view size: landscape stays classic 480×270; portrait grows taller
  // so width-fit scale fills the phone with no letterbars / no side crop.
  const BASE_W = 480, BASE_H = 270;
  let W = BASE_W, H = BASE_H;
  const WORLD_W = 2400, WORLD_H = 2400;
  const WIN_TIME = 300; // 5 minutes
  const VERSION = 'v0.7';
  const VIEW_H_MIN = 270;
  const VIEW_H_MAX = 1200;
  // World→screen zoom: visible meadow is W/1.25 × H/1.25; canvas CSS + UI unchanged.
  const VIEW_ZOOM = 1.25;
  function viewWorldW() { return W / VIEW_ZOOM; }
  function viewWorldH() { return H / VIEW_ZOOM; }

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const gameBox = document.getElementById('gameBox');
  const uiRoot = document.getElementById('ui');
  const el = {
    menu: document.getElementById('menu'),
    hud: document.getElementById('hud'),
    pause: document.getElementById('pause'),
    levelup: document.getElementById('levelup'),
    end: document.getElementById('end'),
    playBtn: document.getElementById('playBtn'),
    menuBtn: document.getElementById('menuBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    pauseMenuBtn: document.getElementById('pauseMenuBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    muteBtnMenu: document.getElementById('muteBtnMenu'),
    muteBtnHud: document.getElementById('muteBtnHud'),
    musicVol: document.getElementById('musicVol'),
    sfxVol: document.getElementById('sfxVol'),
    musicVolVal: document.getElementById('musicVolVal'),
    sfxVolVal: document.getElementById('sfxVolVal'),
    musicVolPause: document.getElementById('musicVolPause'),
    sfxVolPause: document.getElementById('sfxVolPause'),
    musicVolPauseVal: document.getElementById('musicVolPauseVal'),
    sfxVolPauseVal: document.getElementById('sfxVolPauseVal'),
    hpFill: document.getElementById('hpFill'),
    hpText: document.getElementById('hpText'),
    xpFill: document.getElementById('xpFill'),
    xpText: document.getElementById('xpText'),
    timer: document.getElementById('timer'),
    kills: document.getElementById('kills'),
    cards: document.getElementById('cards'),
    levelupTitle: document.getElementById('levelupTitle'),
    endTitle: document.getElementById('endTitle'),
    endStats: document.getElementById('endStats'),
  };

  // Resize internal view to match viewport aspect, then CSS-size the box to fill.
  // Portrait: keep W=480, grow H so width-fit fills the phone (no letterbars,
  // no side crop). Landscape: classic 480×270 for stability.
  // --ui-scale stays the v0.5 comfortable clamp (not raw cover zoom).
  function resizeView(vw, vh) {
    const isPortrait = vh > vw;
    let nextW, nextH;
    if (isPortrait) {
      nextW = BASE_W;
      nextH = Math.round(BASE_W * vh / vw);
      nextH = Math.max(VIEW_H_MIN, Math.min(VIEW_H_MAX, nextH));
    } else {
      nextW = BASE_W;
      nextH = BASE_H;
    }
    if (nextW === W && nextH === H && canvas.width === W && canvas.height === H) {
      return;
    }
    W = nextW;
    H = nextH;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = false;
  }

  function fitCanvas() {
    const vw = window.innerWidth || document.documentElement.clientWidth || BASE_W;
    const vh = window.innerHeight || document.documentElement.clientHeight || BASE_H;
    const isPortrait = vh > vw;

    resizeView(vw, vh);

    let scale;
    let covering = false;

    if (isPortrait) {
      // Aspects match → width-fit fills viewport (pads ~0).
      scale = vw / W;
    } else {
      const containScale = Math.min(vw / W, vh / H);
      const intScale = Math.max(1, Math.floor(containScale + 1e-9));
      const intUsage = Math.min((W * intScale) / vw, (H * intScale) / vh);
      // Prefer integer when it already fills most of the screen, else fractional.
      if (intScale >= 1 && (intUsage >= 0.85 || containScale - intScale < 0.12)) {
        scale = Math.min(intScale, containScale);
      } else {
        scale = containScale;
      }
      // Tiny cover only — avoid aggressive crop zoom.
      const coverScale = Math.max(vw / W, vh / H);
      const cropFrac = Math.max(
        Math.max(0, (W * coverScale - vw) / (W * coverScale)),
        Math.max(0, (H * coverScale - vh) / (H * coverScale))
      );
      if (cropFrac > 0 && cropFrac < 0.04 && coverScale > scale) {
        scale = coverScale;
        covering = true;
        const snapped = Math.round(coverScale);
        if (snapped > 0 && Math.abs(snapped - coverScale) < 0.05) {
          const cropSnap = Math.max(
            Math.max(0, (W * snapped - vw) / (W * snapped)),
            Math.max(0, (H * snapped - vh) / (H * snapped))
          );
          if (cropSnap < 0.04) scale = snapped;
        }
      }
    }

    if (!(scale > 0) || !isFinite(scale)) scale = 1;

    const boxW = W * scale;
    const boxH = H * scale;
    gameBox.style.width = boxW + 'px';
    gameBox.style.height = boxH + 'px';

    const padX = (covering || boxW > vw + 0.5) ? Math.max(0, (boxW - vw) / 2) : 0;
    const padY = (covering || boxH > vh + 0.5) ? Math.max(0, (boxH - vh) / 2) : 0;

    // Comfortable UI: base on display scale, clamp so phones aren't tiny or giant.
    const shortSide = Math.min(vw, vh);
    let uiMax = 3;
    if (shortSide < 500) uiMax = 2;       // phones
    else if (shortSide < 900) uiMax = 2.5; // tablets
    const uiScale = Math.min(uiMax, Math.max(1, scale));

    uiRoot.style.setProperty('--ui-scale', String(uiScale));
    uiRoot.style.setProperty('--ui-pad-x', padX + 'px');
    uiRoot.style.setProperty('--ui-pad-y', padY + 'px');
  }
  window.addEventListener('resize', fitCanvas);
  window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 50));
  fitCanvas();

  // ---------- Audio (procedural Web Audio API) ----------
  const AudioFX = (() => {
    let ctxA = null;
    let master = null;
    let sfxGain = null;
    let bgmGain = null;
    let muted = localStorage.getItem('slimeBarrageMuted') === '1';
    let unlocked = false;
    let musicVol = clamp01(parseFloat(localStorage.getItem('slimeBarrageMusicVol')));
    let sfxVol = clamp01(parseFloat(localStorage.getItem('slimeBarrageSfxVol')));
    if (!isFinite(musicVol)) musicVol = 1;
    if (!isFinite(sfxVol)) sfxVol = 1;
    let bgmDucked = false;

    let bgmWanted = false;
    let bgmPlaying = false;
    let bgmTimer = null;
    let bgmNextTime = 0;
    let bgmStep = 0;
    let pulse50 = null;
    let pulse25 = null;

    const BGM_BPM = 120;
    const BGM_STEPS_PER_BEAT = 2; // eighth notes
    const BGM_STEP = 60 / BGM_BPM / BGM_STEPS_PER_BEAT;
    const BGM_LOOKAHEAD = 0.12;
    const BGM_SCHEDULE_AHEAD = 0.25;
    const BGM_GAIN = 0.15;

    function clamp01(v) {
      if (!isFinite(v)) return NaN;
      return Math.max(0, Math.min(1, v));
    }
    function effectiveBgmGain() {
      const duck = bgmDucked ? 0.12 : 1;
      return BGM_GAIN * musicVol * duck;
    }
    function applyVolumes() {
      if (master) master.gain.value = muted ? 0 : 0.35;
      if (sfxGain) sfxGain.gain.value = sfxVol;
      if (bgmGain) {
        bgmGain.gain.cancelScheduledValues(ctxA ? ctxA.currentTime : 0);
        bgmGain.gain.setValueAtTime(Math.max(0.0001, effectiveBgmGain()), ctxA ? ctxA.currentTime : 0);
      }
    }

    // Original "Moonlit Meadow" — G major cozy night walk (NOT Nintendo melodies)
    // 16 bars × 8 eighths = 128 steps. 0 = rest.
    const L = {
      b3: 246.94, d4: 293.66, e4: 329.63, g4: 392.00, a4: 440.00,
      b4: 493.88, c5: 523.25, d5: 587.33, e5: 659.26
    };
    const Bs = {
      g2: 98.00, b2: 123.47, c3: 130.81, d3: 146.83, e3: 164.81
    };
    const Ar = {
      g3: 196.00, b3: 246.94, d4: 293.66, e4: 329.63,
      g4: 392.00, a4: 440.00, b4: 493.88, d5: 587.33
    };

    const LEAD = [
      // bars 1-4 (theme A)
      L.b4, 0, L.a4, L.g4, L.e4, 0, L.d4, L.e4,
      L.g4, 0, L.a4, L.b4, L.a4, L.g4, L.e4, 0,
      L.d4, L.e4, L.g4, 0, L.a4, L.g4, L.e4, L.d4,
      L.b3, 0, L.d4, L.e4, L.g4, 0, 0, 0,
      // bars 5-8 (A')
      L.b4, L.a4, L.g4, L.e4, L.d4, 0, L.e4, L.g4,
      L.a4, 0, L.b4, L.d5, L.c5, L.b4, L.a4, L.g4,
      L.e4, 0, L.g4, L.a4, L.b4, L.a4, L.g4, L.e4,
      L.d4, 0, L.e4, L.d4, L.b3, 0, 0, 0,
      // bars 9-12 (bridge B)
      L.d5, 0, L.b4, L.a4, L.g4, 0, L.a4, L.b4,
      L.d5, L.e5, L.d5, 0, L.b4, L.a4, L.g4, L.a4,
      L.b4, 0, L.d5, L.b4, L.a4, L.g4, L.e4, 0,
      L.d4, L.e4, L.g4, L.a4, L.g4, 0, 0, 0,
      // bars 13-16 (A return + cadence)
      L.b4, 0, L.a4, L.g4, L.e4, 0, L.d4, L.e4,
      L.g4, 0, L.a4, L.b4, L.a4, L.g4, L.e4, L.d4,
      L.b4, L.g4, L.e4, L.d4, L.e4, L.g4, L.a4, 0,
      L.g4, 0, L.d4, 0, L.g4, 0, 0, 0,
    ];

    function hold(freq, n) { const a = []; for (let i = 0; i < n; i++) a.push(freq); return a; }
    const BASS = [].concat(
      // bars 1-4
      hold(Bs.g2, 4), hold(Bs.d3, 4), hold(Bs.e3, 4), hold(Bs.c3, 4),
      hold(Bs.g2, 4), hold(Bs.d3, 4), hold(Bs.c3, 4), hold(Bs.d3, 4),
      // bars 5-8
      hold(Bs.g2, 4), hold(Bs.d3, 4), hold(Bs.e3, 4), hold(Bs.c3, 4),
      hold(Bs.g2, 4), hold(Bs.b2, 4), hold(Bs.c3, 4), hold(Bs.d3, 4),
      // bars 9-12
      hold(Bs.e3, 4), hold(Bs.b2, 4), hold(Bs.c3, 4), hold(Bs.d3, 4),
      hold(Bs.e3, 4), hold(Bs.g2, 4), hold(Bs.c3, 4), hold(Bs.d3, 4),
      // bars 13-16
      hold(Bs.g2, 4), hold(Bs.d3, 4), hold(Bs.e3, 4), hold(Bs.c3, 4),
      hold(Bs.g2, 4), hold(Bs.e3, 4), hold(Bs.c3, 4), hold(Bs.d3, 2), hold(Bs.g2, 2)
    );

    const ARP = [].concat(
      [Ar.g3, Ar.b3, Ar.d4, Ar.b3, Ar.g3, Ar.b3, Ar.d4, Ar.g4],
      [Ar.d4, Ar.a4, Ar.d5, Ar.a4, Ar.d4, Ar.a4, Ar.d5, Ar.a4],
      [Ar.e4, Ar.g4, Ar.b4, Ar.g4, Ar.e4, Ar.g4, Ar.b4, Ar.e4],
      [Ar.g3, Ar.e4, Ar.g4, Ar.e4, Ar.g3, Ar.e4, Ar.g4, Ar.e4],
      [Ar.g3, Ar.b3, Ar.d4, Ar.b3, Ar.g3, Ar.b3, Ar.d4, Ar.g4],
      [Ar.d4, Ar.a4, Ar.d5, Ar.a4, Ar.d4, Ar.a4, Ar.d5, Ar.a4],
      [Ar.e4, Ar.g4, Ar.b4, Ar.g4, Ar.e4, Ar.g4, Ar.a4, Ar.e4],
      [Ar.d4, Ar.g4, Ar.a4, Ar.g4, Ar.d4, Ar.g4, Ar.a4, Ar.d4],
      [Ar.e4, Ar.g4, Ar.b4, Ar.g4, Ar.e4, Ar.g4, Ar.b4, Ar.e4],
      [Ar.b3, Ar.d4, Ar.a4, Ar.d4, Ar.b3, Ar.d4, Ar.a4, Ar.d4],
      [Ar.g3, Ar.e4, Ar.g4, Ar.e4, Ar.g3, Ar.e4, Ar.g4, Ar.e4],
      [Ar.d4, Ar.g4, Ar.a4, Ar.g4, Ar.d4, Ar.g4, Ar.a4, Ar.d4],
      [Ar.g3, Ar.b3, Ar.d4, Ar.b3, Ar.g3, Ar.b3, Ar.d4, Ar.g4],
      [Ar.e4, Ar.g4, Ar.b4, Ar.g4, Ar.e4, Ar.g4, Ar.b4, Ar.e4],
      [Ar.g3, Ar.e4, Ar.g4, Ar.e4, Ar.g3, Ar.e4, Ar.g4, Ar.a4],
      [Ar.g3, Ar.b3, Ar.d4, Ar.g4, Ar.d4, Ar.b3, Ar.g3, 0]
    );

    function ensure() {
      if (ctxA) return true;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctxA = new AC();
      master = ctxA.createGain();
      master.gain.value = muted ? 0 : 0.35;
      master.connect(ctxA.destination);

      sfxGain = ctxA.createGain();
      sfxGain.gain.value = sfxVol;
      sfxGain.connect(master);

      bgmGain = ctxA.createGain();
      bgmGain.gain.value = effectiveBgmGain();
      bgmGain.connect(master);

      pulse50 = makePulseWave(0.5);
      pulse25 = makePulseWave(0.25);
      return true;
    }

    function makePulseWave(duty) {
      const n = 256;
      const real = new Float32Array(n);
      const imag = new Float32Array(n);
      for (let i = 1; i < n; i++) {
        imag[i] = (2 / (i * Math.PI)) * Math.sin(Math.PI * i * duty);
      }
      return ctxA.createPeriodicWave(real, imag);
    }

    async function unlock() {
      if (!ensure()) return;
      if (ctxA.state === 'suspended') {
        try { await ctxA.resume(); } catch (_) {}
      }
      unlocked = true;
      if (bgmWanted && !bgmPlaying) startBgm(true);
    }

    function setMuted(m) {
      muted = !!m;
      localStorage.setItem('slimeBarrageMuted', muted ? '1' : '0');
      applyVolumes();
      syncMuteUI();
    }
    function toggleMute() { setMuted(!muted); }
    function isMuted() { return muted; }
    function getMusicVol() { return musicVol; }
    function getSfxVol() { return sfxVol; }
    function setMusicVol(v) {
      musicVol = clamp01(v);
      if (!isFinite(musicVol)) musicVol = 1;
      localStorage.setItem('slimeBarrageMusicVol', String(musicVol));
      applyVolumes();
      syncVolUI();
    }
    function setSfxVol(v) {
      sfxVol = clamp01(v);
      if (!isFinite(sfxVol)) sfxVol = 1;
      localStorage.setItem('slimeBarrageSfxVol', String(sfxVol));
      applyVolumes();
      syncVolUI();
    }
    function setBgmDucked(d) {
      bgmDucked = !!d;
      applyVolumes();
    }

    function tone(freq, dur, type, vol, slideTo) {
      if (!ensure() || muted || !unlocked) return;
      const t0 = ctxA.currentTime;
      const o = ctxA.createOscillator();
      const g = ctxA.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(sfxGain);
      o.start(t0); o.stop(t0 + dur + 0.02);
    }

    function noise(dur, vol, filterFreq) {
      if (!ensure() || muted || !unlocked) return;
      const t0 = ctxA.currentTime;
      const n = Math.floor(ctxA.sampleRate * dur);
      const buf = ctxA.createBuffer(1, n, ctxA.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ctxA.createBufferSource();
      src.buffer = buf;
      const g = ctxA.createGain();
      g.gain.setValueAtTime(vol || 0.15, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      if (filterFreq) {
        const f = ctxA.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = filterFreq;
        src.connect(f); f.connect(g);
      } else {
        src.connect(g);
      }
      g.connect(sfxGain);
      src.start(t0); src.stop(t0 + dur + 0.02);
    }

    function shoot() { tone(880, 0.06, 'square', 0.08, 420); }
    function hit() { tone(220, 0.05, 'triangle', 0.12, 110); noise(0.04, 0.06, 800); }
    function kill() { tone(160, 0.08, 'sawtooth', 0.1, 60); noise(0.07, 0.08, 600); }
    function xp() { tone(990, 0.05, 'sine', 0.05, 1320); }
    function levelUp() {
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => {
        setTimeout(() => tone(f, 0.12, 'triangle', 0.12), i * 70);
      });
    }
    function hurt() { tone(140, 0.15, 'sawtooth', 0.18, 70); noise(0.1, 0.1, 400); }
    function death() {
      tone(200, 0.35, 'sawtooth', 0.2, 40);
      setTimeout(() => noise(0.25, 0.12, 300), 80);
    }
    function win() {
      [523, 659, 784, 1046, 784, 1046].forEach((f, i) => {
        setTimeout(() => tone(f, 0.14, 'triangle', 0.14), i * 90);
      });
    }
    function click() { tone(660, 0.04, 'square', 0.07); }

    function bgmPulse(freq, when, dur, wave, vol) {
      if (!freq || freq <= 0) return;
      const o = ctxA.createOscillator();
      const g = ctxA.createGain();
      o.setPeriodicWave(wave);
      o.frequency.setValueAtTime(freq, when);
      const attack = Math.min(0.012, dur * 0.15);
      const release = Math.min(0.06, dur * 0.35);
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(vol, when + attack);
      const sustainEnd = when + Math.max(attack, dur - release);
      g.gain.setValueAtTime(vol, sustainEnd);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      o.connect(g); g.connect(bgmGain);
      o.start(when);
      o.stop(when + dur + 0.03);
    }

    function bgmNoiseHit(when, dur, vol) {
      const n = Math.floor(ctxA.sampleRate * dur);
      const buf = ctxA.createBuffer(1, n, ctxA.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = ctxA.createBufferSource();
      src.buffer = buf;
      const f = ctxA.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1800;
      f.Q.value = 0.8;
      const g = ctxA.createGain();
      g.gain.setValueAtTime(vol, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      src.connect(f); f.connect(g); g.connect(bgmGain);
      src.start(when); src.stop(when + dur + 0.02);
    }

    function scheduleStep(step, when) {
      const i = step % 128;
      const lead = LEAD[i];
      const bass = BASS[i];
      const arp = ARP[i];
      const prevBass = BASS[(i + 127) % 128];

      if (lead) bgmPulse(lead, when, BGM_STEP * 0.85, pulse25, 0.22);
      if (bass && (bass !== prevBass || i % 4 === 0)) {
        bgmPulse(bass, when, BGM_STEP * 3.6, pulse50, 0.18);
      }
      if (arp && i % 2 === 0) bgmPulse(arp, when, BGM_STEP * 0.7, pulse50, 0.08);
      const within = i % 8;
      if (within === 2 || within === 6) bgmNoiseHit(when, 0.045, 0.045);
    }

    function schedulerTick() {
      if (!bgmPlaying || !ctxA) return;
      const now = ctxA.currentTime;
      while (bgmNextTime < now + BGM_SCHEDULE_AHEAD) {
        scheduleStep(bgmStep, bgmNextTime);
        bgmNextTime += BGM_STEP;
        bgmStep++;
      }
    }

    function stopBgmSchedulerOnly() {
      bgmPlaying = false;
      if (bgmTimer != null) {
        clearInterval(bgmTimer);
        bgmTimer = null;
      }
    }

    function startBgm(restart) {
      bgmWanted = true;
      if (!ensure() || !unlocked) return;
      if (ctxA.state === 'suspended') {
        ctxA.resume().then(() => { if (bgmWanted) startBgm(true); }).catch(() => {});
        return;
      }
      if (bgmPlaying && !restart) return;
      stopBgmSchedulerOnly();
      bgmPlaying = true;
      bgmStep = 0;
      bgmNextTime = ctxA.currentTime + 0.05;
      if (bgmGain) {
        bgmGain.gain.cancelScheduledValues(ctxA.currentTime);
        bgmGain.gain.setValueAtTime(Math.max(0.0001, effectiveBgmGain()), ctxA.currentTime);
      }
      schedulerTick();
      bgmTimer = setInterval(schedulerTick, BGM_LOOKAHEAD * 1000);
    }

    function stopBgm(fade) {
      bgmWanted = false;
      if (!ensure()) {
        stopBgmSchedulerOnly();
        return;
      }
      const t = ctxA.currentTime;
      if (fade && bgmGain && bgmPlaying) {
        bgmGain.gain.cancelScheduledValues(t);
        bgmGain.gain.setValueAtTime(Math.max(0.0001, bgmGain.gain.value), t);
        bgmGain.gain.linearRampToValueAtTime(0.0001, t + 0.35);
        stopBgmSchedulerOnly();
        setTimeout(() => {
          if (!bgmWanted && bgmGain) {
            bgmGain.gain.cancelScheduledValues(ctxA.currentTime);
            bgmGain.gain.setValueAtTime(Math.max(0.0001, effectiveBgmGain()), ctxA.currentTime);
          }
        }, 400);
      } else {
        stopBgmSchedulerOnly();
        if (bgmGain) {
          bgmGain.gain.cancelScheduledValues(t);
          bgmGain.gain.setValueAtTime(Math.max(0.0001, effectiveBgmGain()), t);
        }
      }
    }

    return {
      unlock, toggleMute, setMuted, isMuted,
      getMusicVol, getSfxVol, setMusicVol, setSfxVol, setBgmDucked,
      shoot, hit, kill, xp, levelUp, hurt, death, win, click,
      startBgm, stopBgm,
    };
  })();

  function syncMuteUI() {
    const label = AudioFX.isMuted() ? '🔇 Muted' : '🔊 Sound';
    const short = AudioFX.isMuted() ? '🔇' : '🔊';
    el.muteBtnMenu.textContent = label;
    el.muteBtnMenu.classList.toggle('muted', AudioFX.isMuted());
    el.muteBtnHud.textContent = short;
    el.muteBtnHud.classList.toggle('muted', AudioFX.isMuted());
  }

  function syncVolUI() {
    const m = Math.round(AudioFX.getMusicVol() * 100);
    const s = Math.round(AudioFX.getSfxVol() * 100);
    const pairs = [
      [el.musicVol, el.musicVolVal, m],
      [el.sfxVol, el.sfxVolVal, s],
      [el.musicVolPause, el.musicVolPauseVal, m],
      [el.sfxVolPause, el.sfxVolPauseVal, s],
    ];
    for (const [input, label, val] of pairs) {
      if (!input) continue;
      if (document.activeElement !== input) input.value = String(val);
      if (label) label.textContent = String(val);
    }
  }
  syncMuteUI();
  syncVolUI();

  function bindVolSlider(input, setter) {
    if (!input) return;
    const onChange = () => {
      AudioFX.unlock();
      setter(parseInt(input.value, 10) / 100);
    };
    input.addEventListener('input', onChange);
    input.addEventListener('change', onChange);
  }
  bindVolSlider(el.musicVol, AudioFX.setMusicVol);
  bindVolSlider(el.sfxVol, AudioFX.setSfxVol);
  bindVolSlider(el.musicVolPause, AudioFX.setMusicVol);
  bindVolSlider(el.sfxVolPause, AudioFX.setSfxVol);

  // ---------- Input ----------
  const keys = Object.create(null);
  const touchPad = document.getElementById('touchPad');
  const stickKnob = document.getElementById('stickKnob');
  let touchVec = { x: 0, y: 0 };
  let touchActive = false;

  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    if (state === 'MENU' && (e.code === 'Enter' || e.code === 'Space')) {
      AudioFX.unlock(); AudioFX.click(); startGame();
    }
    if ((state === 'GAMEOVER' || state === 'WIN') && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyR')) {
      AudioFX.click(); goMenu();
    }
    if (state === 'LEVELUP') {
      if (e.code === 'Digit1' || e.code === 'Numpad1') pickUpgrade(0);
      if (e.code === 'Digit2' || e.code === 'Numpad2') pickUpgrade(1);
      if (e.code === 'Digit3' || e.code === 'Numpad3') pickUpgrade(2);
    }
    if (e.code === 'KeyM') { AudioFX.unlock(); AudioFX.toggleMute(); }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (state === 'PLAYING') { e.preventDefault(); togglePause(true); }
      else if (state === 'PAUSED') { e.preventDefault(); togglePause(false); }
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (isTouch) touchPad.classList.remove('hidden');

  function stickFromEvent(clientX, clientY) {
    const rect = touchPad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx, dy = clientY - cy;
    const max = rect.width / 2 - 10;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    touchVec.x = dx / max;
    touchVec.y = dy / max;
  }
  function resetStick() {
    touchVec.x = 0; touchVec.y = 0;
    stickKnob.style.transform = 'translate(-50%, -50%)';
  }
  touchPad.addEventListener('touchstart', e => {
    e.preventDefault(); touchActive = true;
    stickFromEvent(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  touchPad.addEventListener('touchmove', e => {
    e.preventDefault();
    stickFromEvent(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
  touchPad.addEventListener('touchend', e => { e.preventDefault(); touchActive = false; resetStick(); });
  touchPad.addEventListener('touchcancel', () => { touchActive = false; resetStick(); });

  el.playBtn.addEventListener('click', () => {
    AudioFX.unlock();
    AudioFX.click();
    startGame();
  });
  el.menuBtn.addEventListener('click', () => { AudioFX.click(); goMenu(); });
  el.muteBtnMenu.addEventListener('click', () => { AudioFX.unlock(); AudioFX.toggleMute(); });
  el.muteBtnHud.addEventListener('click', () => { AudioFX.unlock(); AudioFX.toggleMute(); });
  el.pauseBtn.addEventListener('click', () => {
    AudioFX.unlock();
    AudioFX.click();
    if (state === 'PLAYING') togglePause(true);
  });
  el.resumeBtn.addEventListener('click', () => {
    AudioFX.unlock();
    AudioFX.click();
    togglePause(false);
  });
  el.pauseMenuBtn.addEventListener('click', () => {
    AudioFX.click();
    AudioFX.setBgmDucked(false);
    goMenu();
  });

  // ---------- Pixel sprite helpers ----------
  function makeSprite(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    drawFn(g, w, h);
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const og = out.getContext('2d');
    og.imageSmoothingEnabled = false;
    og.drawImage(c, 0, 0);
    out._pixelW = w; out._pixelH = h;
    return out;
  }
  function blit(c, spr, x, y, dw, dh) {
    if (!spr || typeof spr !== 'object' || !spr.width) return;
    if (dw != null && dh != null) c.drawImage(spr, x, y, dw, dh);
    else c.drawImage(spr, x, y);
  }
  function px(g, x, y, col, s = 1) {
    g.fillStyle = col;
    g.fillRect(x, y, s, s);
  }
  function fillRect(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  }

  function drawHeroFront(g) {
    fillRect(g, 3, 10, 3, 8, '#6b4f9a');
    fillRect(g, 14, 10, 3, 8, '#6b4f9a');
    fillRect(g, 6, 18, 3, 5, '#3a4a78');
    fillRect(g, 11, 18, 3, 5, '#3a4a78');
    px(g, 7, 20, '#c8d4f0'); px(g, 12, 19, '#c8d4f0');
    fillRect(g, 6, 23, 3, 2, '#f5f5f5');
    fillRect(g, 11, 23, 3, 2, '#f5f5f5');
    fillRect(g, 5, 25, 4, 2, '#ffffff');
    fillRect(g, 10, 25, 4, 2, '#ffffff');
    px(g, 5, 25, '#f7a8c8'); px(g, 10, 25, '#f7a8c8');
    fillRect(g, 5, 10, 10, 9, '#c4b0e8');
    fillRect(g, 6, 14, 8, 4, '#b39ddb');
    px(g, 8, 11, '#ffffff'); px(g, 8, 12, '#ffffff');
    px(g, 11, 11, '#ffffff'); px(g, 11, 12, '#ffffff');
    fillRect(g, 3, 11, 2, 6, '#c4b0e8');
    fillRect(g, 15, 11, 2, 6, '#c4b0e8');
    fillRect(g, 3, 16, 2, 2, '#f0c4b0');
    fillRect(g, 15, 16, 2, 2, '#f0c4b0');
    fillRect(g, 8, 8, 4, 2, '#f0c4b0');
    fillRect(g, 6, 2, 8, 7, '#f0c4b0');
    fillRect(g, 5, 1, 10, 4, '#f7a0c0');
    fillRect(g, 4, 3, 2, 5, '#f7a0c0');
    fillRect(g, 14, 3, 2, 5, '#f7a0c0');
    fillRect(g, 4, 7, 2, 1, '#ffe8f0');
    fillRect(g, 14, 7, 2, 1, '#ffe8f0');
    fillRect(g, 6, 1, 2, 1, '#ffe8f0');
    fillRect(g, 7, 3, 2, 2, '#f7a0c0');
    fillRect(g, 11, 3, 2, 2, '#f7a0c0');
    px(g, 14, 3, '#ffffff'); px(g, 15, 4, '#ffffff');
    px(g, 15, 3, '#ffffff'); px(g, 14, 4, '#ffffff');
    fillRect(g, 7, 5, 2, 2, '#7b4fb8');
    fillRect(g, 11, 5, 2, 2, '#7b4fb8');
    px(g, 7, 5, '#ffffff'); px(g, 11, 5, '#ffffff');
    px(g, 9, 8, '#d08090'); px(g, 10, 8, '#d08090');
  }

  function drawHeroSide(g) {
    fillRect(g, 4, 10, 5, 8, '#6b4f9a');
    fillRect(g, 9, 18, 4, 5, '#3a4a78');
    px(g, 10, 20, '#c8d4f0');
    fillRect(g, 9, 23, 4, 2, '#f5f5f5');
    fillRect(g, 8, 25, 5, 2, '#ffffff');
    px(g, 8, 25, '#f7a8c8');
    fillRect(g, 7, 10, 8, 9, '#c4b0e8');
    fillRect(g, 8, 14, 5, 3, '#b39ddb');
    fillRect(g, 13, 12, 4, 2, '#c4b0e8');
    fillRect(g, 16, 12, 2, 2, '#f0c4b0');
    fillRect(g, 8, 2, 7, 7, '#f0c4b0');
    fillRect(g, 7, 1, 9, 4, '#f7a0c0');
    fillRect(g, 6, 3, 2, 5, '#f7a0c0');
    fillRect(g, 6, 7, 2, 1, '#ffe8f0');
    fillRect(g, 14, 1, 2, 1, '#ffe8f0');
    fillRect(g, 12, 5, 2, 2, '#7b4fb8');
    px(g, 12, 5, '#ffffff');
    px(g, 7, 3, '#ffffff'); px(g, 8, 4, '#ffffff');
  }

  const heroFront = makeSprite(20, 28, (g) => drawHeroFront(g));
  const heroSide = makeSprite(20, 28, (g) => drawHeroSide(g));
  const heroWalkA = makeSprite(20, 28, (g) => {
    drawHeroFront(g);
    fillRect(g, 6, 18, 3, 5, '#0d1520');
    fillRect(g, 5, 19, 3, 5, '#3a4a78');
    fillRect(g, 5, 24, 3, 2, '#f5f5f5');
    fillRect(g, 4, 26, 4, 2, '#ffffff');
  });
  const heroWalkB = makeSprite(20, 28, (g) => {
    drawHeroFront(g);
    fillRect(g, 11, 18, 3, 5, '#0d1520');
    fillRect(g, 12, 19, 3, 5, '#3a4a78');
    fillRect(g, 12, 24, 3, 2, '#f5f5f5');
    fillRect(g, 12, 26, 4, 2, '#ffffff');
  });

  function makeSlimeFrames(colors, size = 16, crowned = false) {
    const frames = [];
    const stretches = [
      { sy: 0, sh: 0 },
      { sy: -1, sh: 1 },
      { sy: 1, sh: -2 },
      { sy: 0, sh: 0 },
    ];
    for (const st of stretches) {
      frames.push(makeSprite(size + (crowned ? 8 : 2), size + (crowned ? 10 : 2), (g, w, h) => {
        const baseY = (crowned ? 8 : 1) + st.sy;
        const bh = size - 2 + st.sh;
        const bw = size - 2 - st.sh;
        const bx = Math.floor((w - bw) / 2);
        const mid = Math.floor(bh / 2);
        for (let y = 0; y < bh; y++) {
          const t = Math.abs(y - mid) / (mid || 1);
          const inset = Math.floor(t * t * (bw / 3));
          fillRect(g, bx + inset, baseY + y, bw - inset * 2, 1, colors.mid);
        }
        fillRect(g, bx + 2, baseY + bh - 2, bw - 4, 2, colors.dark);
        fillRect(g, bx + Math.floor(bw * 0.25), baseY + 2, Math.max(2, Math.floor(bw * 0.3)), 2, colors.hi);
        px(g, bx + Math.floor(bw * 0.6), baseY + Math.floor(bh * 0.45), colors.spot, 2);
        const eyeY = baseY + Math.floor(bh * 0.4);
        const cx = Math.floor(w / 2);
        fillRect(g, cx - 4, eyeY, 2, 2, '#1a1020');
        fillRect(g, cx + 2, eyeY, 2, 2, '#1a1020');
        px(g, cx - 1, eyeY + 3, '#1a1020');
        px(g, cx, eyeY + 4, '#1a1020');
        px(g, cx + 1, eyeY + 3, '#1a1020');
        if (crowned) {
          fillRect(g, cx - 5, 2, 10, 4, '#e8c84a');
          fillRect(g, cx - 5, 1, 2, 3, '#e8c84a');
          fillRect(g, cx - 1, 0, 2, 3, '#e8c84a');
          fillRect(g, cx + 3, 1, 2, 3, '#e8c84a');
          px(g, cx - 4, 3, '#a855f7');
          px(g, cx, 2, '#a855f7');
          px(g, cx + 4, 3, '#a855f7');
          fillRect(g, bx - 1, baseY + 2, 2, 3, '#6bcf7a');
          fillRect(g, bx + bw - 1, baseY + 2, 2, 3, '#6bcf7a');
        }
      }));
    }
    return frames;
  }

  const slimePalettes = {
    mint:   { mid: '#7dcea0', dark: '#4a9a6e', hi: '#c8f5d8', spot: '#5bb88a' },
    pink:   { mid: '#f5a0c0', dark: '#d07098', hi: '#ffe0ee', spot: '#e878a8' },
    yellow: { mid: '#f0d060', dark: '#c9a030', hi: '#fff0b0', spot: '#e0b840' },
    purple: { mid: '#c0a0e8', dark: '#8a6cbc', hi: '#e8d8ff', spot: '#a888d8' },
  };
  const slimeFrames = {
    mint: makeSlimeFrames(slimePalettes.mint, 16),
    pink: makeSlimeFrames(slimePalettes.pink, 16),
    yellow: makeSlimeFrames(slimePalettes.yellow, 16),
    purple: makeSlimeFrames(slimePalettes.purple, 16),
    king: makeSlimeFrames(slimePalettes.mint, 22, true),
  };

  const projSprite = makeSprite(6, 6, (g) => {
    fillRect(g, 2, 0, 2, 6, '#ffe8a0');
    fillRect(g, 0, 2, 6, 2, '#ffe8a0');
    fillRect(g, 2, 2, 2, 2, '#ffffff');
  });
  const gemSprite = makeSprite(8, 8, (g) => {
    fillRect(g, 3, 0, 2, 8, '#7cf0ff');
    fillRect(g, 0, 3, 8, 2, '#7cf0ff');
    fillRect(g, 2, 1, 4, 6, '#40d8f0');
    fillRect(g, 3, 2, 2, 4, '#e0ffff');
  });

  // Night-meadow props (procedural) — trunk/core is the solid collider; canopy is visual only.
  function drawTreeSprite(g, w, h, palette) {
    const cx = (w / 2) | 0;
    // trunk
    fillRect(g, cx - 2, h - 12, 4, 11, palette.trunk);
    fillRect(g, cx - 1, h - 12, 2, 11, palette.trunkHi);
    // canopy layers
    fillRect(g, cx - 9, 6, 18, 12, palette.leaf);
    fillRect(g, cx - 7, 2, 14, 10, palette.leafHi);
    fillRect(g, cx - 5, 0, 10, 6, palette.leaf);
    // night speckles
    px(g, cx - 4, 5, palette.speck);
    px(g, cx + 3, 8, palette.speck);
    px(g, cx + 1, 3, '#c090ff');
    // root shadow
    fillRect(g, cx - 4, h - 2, 8, 2, 'rgba(0,0,0,0.35)');
  }
  function drawBushSprite(g, w, h, palette) {
    const cx = (w / 2) | 0;
    fillRect(g, cx - 7, h - 10, 14, 8, palette.leaf);
    fillRect(g, cx - 5, h - 13, 10, 7, palette.leafHi);
    fillRect(g, cx - 3, h - 15, 6, 4, palette.leaf);
    px(g, cx - 2, h - 11, palette.speck);
    px(g, cx + 2, h - 9, '#6a8cff');
    fillRect(g, cx - 1, h - 4, 2, 3, palette.trunk);
    fillRect(g, cx - 4, h - 2, 8, 2, 'rgba(0,0,0,0.3)');
  }
  const treePalettes = [
    { trunk: '#5a3a28', trunkHi: '#7a5640', leaf: '#1e4a32', leafHi: '#2a6a48', speck: '#7dcea0' },
    { trunk: '#4a3020', trunkHi: '#6a4834', leaf: '#243e38', leafHi: '#356a58', speck: '#a0e0c0' },
    { trunk: '#5a3a28', trunkHi: '#7a5640', leaf: '#2a3e50', leafHi: '#3a5a68', speck: '#90b0ff' },
  ];
  const bushPalettes = [
    { trunk: '#4a3020', leaf: '#2a5a38', leafHi: '#3a7a50', speck: '#c090ff' },
    { trunk: '#4a3020', leaf: '#1e4a40', leafHi: '#2e6a58', speck: '#7dcea0' },
    { trunk: '#4a3020', leaf: '#3a4a30', leafHi: '#5a6a40', speck: '#e8c84a' },
  ];
  const treeSprites = treePalettes.map((pal) =>
    makeSprite(24, 32, (g, w, h) => drawTreeSprite(g, w, h, pal))
  );
  const bushSprites = bushPalettes.map((pal) =>
    makeSprite(16, 16, (g, w, h) => drawBushSprite(g, w, h, pal))
  );

  // ---------- Game state ----------
  let state = 'MENU';
  let player, enemies, projectiles, gems, particles;
  let obstacles = [];
  let cam = { x: 0, y: 0 };
  let timeAlive = 0;
  let spawnTimer = 0;
  let killCount = 0;
  let upgradeChoices = [];
  let animT = 0;
  let flashHurt = 0;
  let menuPulse = 0;

  const UPGRADE_DEFS = [
    { id: 'dmg', name: 'Sharp Spark', desc: '+25% projectile damage', apply: p => { p.damage = Math.round(p.damage * 1.25); } },
    { id: 'rate', name: 'Rapid Fire', desc: '+20% fire rate', apply: p => { p.fireCdMax = Math.max(0.12, p.fireCdMax * 0.8); } },
    { id: 'spd', name: 'Sneaker Boost', desc: '+15% move speed', apply: p => { p.speed *= 1.15; } },
    { id: 'hp', name: 'Hoodie Padding', desc: '+20 max HP & heal 20', apply: p => { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 20); } },
    { id: 'magnet', name: 'Gem Magnet', desc: '+40% pickup range', apply: p => { p.magnet *= 1.4; } },
    { id: 'multi', name: 'Multishot', desc: '+1 projectile', apply: p => { p.multishot += 1; } },
    { id: 'pierce', name: 'Pierce Shot', desc: 'Projectiles pierce +1', apply: p => { p.pierce += 1; } },
    { id: 'heal', name: 'Snack Break', desc: 'Restore 40 HP', apply: p => { p.hp = Math.min(p.maxHp, p.hp + 40); } },
  ];

  function resetPlayer() {
    return {
      x: WORLD_W / 2, y: WORLD_H / 2,
      w: 14, h: 22,
      speed: 95,
      hp: 100, maxHp: 100,
      xp: 0, xpNext: 8, level: 1,
      damage: 12,
      fireCd: 0, fireCdMax: 0.45,
      multishot: 1, pierce: 0,
      magnet: 48,
      invuln: 0,
      facing: 1,
      moving: false,
      walkFrame: 0,
    };
  }

  function showOnly(panel) {
    el.menu.classList.toggle('hidden', panel !== 'menu');
    el.hud.classList.toggle('hidden', panel !== 'hud' && panel !== 'levelup' && panel !== 'end' && panel !== 'pause');
    // Keep HUD visible under levelup/end/pause for context, but hide on menu
    if (panel === 'levelup' || panel === 'end' || panel === 'pause') el.hud.classList.remove('hidden');
    if (panel === 'menu') el.hud.classList.add('hidden');
    el.pause.classList.toggle('hidden', panel !== 'pause');
    el.levelup.classList.toggle('hidden', panel !== 'levelup');
    el.end.classList.toggle('hidden', panel !== 'end');
  }

  function togglePause(on) {
    if (on) {
      if (state !== 'PLAYING') return;
      state = 'PAUSED';
      AudioFX.setBgmDucked(true);
      syncVolUI();
      showOnly('pause');
    } else {
      if (state !== 'PAUSED') return;
      state = 'PLAYING';
      AudioFX.setBgmDucked(false);
      showOnly('hud');
      syncHud();
    }
  }

  // Seeded scatter of trees/bushes across the 2400×2400 meadow.
  // Keeps a clear radius around world-center spawn so the run starts open.
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildObstacles() {
    const rand = mulberry32(0x5B07A7E ^ 0x51E); // fixed seed → stable layout
    const list = [];
    const spawnX = WORLD_W / 2, spawnY = WORLD_H / 2;
    const CLEAR_R = 200;
    const MIN_GAP = 36;
    const TARGET = 170;

    function ok(x, y, r) {
      const dx = x - spawnX, dy = y - spawnY;
      if (dx * dx + dy * dy < (CLEAR_R + r) * (CLEAR_R + r)) return false;
      if (x < 48 || y < 48 || x > WORLD_W - 48 || y > WORLD_H - 48) return false;
      for (const o of list) {
        const ddx = o.x - x, ddy = o.y - y;
        const need = o.r + r + MIN_GAP * 0.35;
        if (ddx * ddx + ddy * ddy < need * need) return false;
      }
      return true;
    }

    let attempts = 0;
    while (list.length < TARGET && attempts < TARGET * 40) {
      attempts++;
      const isTree = rand() < 0.55;
      const x = 60 + rand() * (WORLD_W - 120);
      const y = 60 + rand() * (WORLD_H - 120);
      if (isTree) {
        const variant = (rand() * treeSprites.length) | 0;
        const r = 8 + (rand() * 3) | 0;
        if (!ok(x, y, r)) continue;
        list.push({
          kind: 'tree', x, y, r,
          spr: treeSprites[variant],
          ox: treeSprites[variant].width / 2,
          oy: treeSprites[variant].height - 2,
        });
      } else {
        const variant = (rand() * bushSprites.length) | 0;
        const r = 6 + (rand() * 2) | 0;
        if (!ok(x, y, r)) continue;
        list.push({
          kind: 'bush', x, y, r,
          spr: bushSprites[variant],
          ox: bushSprites[variant].width / 2,
          oy: bushSprites[variant].height - 2,
        });
      }
    }
    return list;
  }
  obstacles = buildObstacles();

  // Circle vs solid trunk/bush core. Projectiles intentionally ignore obstacles (pass through foliage).
  function resolveObstacleCircle(ent, radius) {
    for (const o of obstacles) {
      const dx = ent.x - o.x;
      const dy = ent.y - o.y;
      const minD = o.r + radius;
      const d2 = dx * dx + dy * dy;
      if (d2 > 0 && d2 < minD * minD) {
        const d = Math.sqrt(d2) || 0.0001;
        const push = (minD - d) / d;
        ent.x += dx * push;
        ent.y += dy * push;
      } else if (d2 === 0) {
        ent.x += minD;
      }
    }
  }

  function overlapsObstacle(x, y, radius) {
    for (const o of obstacles) {
      const dx = x - o.x, dy = y - o.y;
      const minD = o.r + radius;
      if (dx * dx + dy * dy < minD * minD) return true;
    }
    return false;
  }

  function startGame() {
    player = resetPlayer();
    enemies = [];
    projectiles = [];
    gems = [];
    particles = [];
    timeAlive = 0;
    spawnTimer = 0.5;
    killCount = 0;
    flashHurt = 0;
    AudioFX.setBgmDucked(false);
    state = 'PLAYING';
    showOnly('hud');
    syncHud();
    for (let i = 0; i < 8; i++) spawnSlime(true);
    AudioFX.startBgm(true);
  }

  function goMenu() {
    AudioFX.setBgmDucked(false);
    AudioFX.stopBgm(true);
    state = 'MENU';
    showOnly('menu');
  }

  function xpForLevel(lv) {
    return Math.floor(8 + (lv - 1) * 5 + Math.pow(lv, 1.35));
  }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function syncHud() {
    if (!player) return;
    const hpPct = Math.max(0, Math.min(1, player.hp / player.maxHp)) * 100;
    el.hpFill.style.width = hpPct + '%';
    el.hpFill.classList.toggle('low', player.hp / player.maxHp < 0.3);
    el.hpText.textContent = 'HP ' + Math.ceil(player.hp) + '/' + player.maxHp;
    const xpPct = Math.max(0, Math.min(1, player.xp / player.xpNext)) * 100;
    el.xpFill.style.width = xpPct + '%';
    el.xpText.textContent = 'Lv ' + player.level;
    const remain = Math.max(0, WIN_TIME - timeAlive);
    el.timer.textContent = formatTime(remain);
    el.kills.textContent = 'Kills ' + killCount;
  }

  // ---------- Spawning ----------
  function spawnSlime(far = false) {
    const colors = ['mint', 'pink', 'yellow', 'purple'];
    const t = timeAlive;
    const isKing = t > 45 && Math.random() < 0.06 + Math.min(0.08, t / 600);
    const color = isKing ? 'king' : colors[(Math.random() * colors.length) | 0];
    const ang = Math.random() * Math.PI * 2;
    const dist = far ? 220 + Math.random() * 180 : 280 + Math.random() * 220;
    let x = player.x + Math.cos(ang) * dist;
    let y = player.y + Math.sin(ang) * dist;
    x = Math.max(40, Math.min(WORLD_W - 40, x));
    y = Math.max(40, Math.min(WORLD_H - 40, y));
    const spawnR = isKing ? 16 : 10;
    for (let tries = 0; tries < 8 && overlapsObstacle(x, y, spawnR); tries++) {
      const a2 = Math.random() * Math.PI * 2;
      const d2 = dist + tries * 24;
      x = Math.max(40, Math.min(WORLD_W - 40, player.x + Math.cos(a2) * d2));
      y = Math.max(40, Math.min(WORLD_H - 40, player.y + Math.sin(a2) * d2));
    }

    const baseHp = isKing ? 80 + t * 0.6 : 18 + t * 0.35;
    const baseSpd = isKing ? 38 : 48 + Math.min(40, t * 0.15);
    const dmg = isKing ? 18 : 8 + Math.min(10, t * 0.04);

    enemies.push({
      x, y,
      r: isKing ? 16 : 10,
      color,
      hp: baseHp, maxHp: baseHp,
      speed: baseSpd + Math.random() * 10,
      damage: dmg,
      frame: (Math.random() * 4) | 0,
      frameT: Math.random(),
      xp: isKing ? 12 : 2 + (color === 'purple' ? 1 : 0),
      isKing,
    });
  }

  function spawnBurst(n) {
    for (let i = 0; i < n; i++) spawnSlime(false);
  }

  // ---------- Combat ----------
  function fireAtNearest() {
    if (!enemies.length) return;
    let best = null, bestD = Infinity;
    for (const e of enemies) {
      const d = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    if (!best) return;
    const baseAng = Math.atan2(best.y - player.y, best.x - player.x);
    const count = player.multishot;
    const spread = count > 1 ? 0.22 : 0;
    for (let i = 0; i < count; i++) {
      const off = count === 1 ? 0 : (i - (count - 1) / 2) * spread;
      const ang = baseAng + off;
      projectiles.push({
        x: player.x, y: player.y - 4,
        vx: Math.cos(ang) * 260,
        vy: Math.sin(ang) * 260,
        life: 1.4,
        damage: player.damage,
        pierce: player.pierce,
        hit: new Set(),
      });
    }
    player.facing = Math.cos(baseAng) >= 0 ? 1 : -1;
    AudioFX.shoot();
  }

  function dropGem(x, y, value) {
    gems.push({ x, y, value, bob: Math.random() * Math.PI * 2 });
  }

  function addParticles(x, y, col, n = 6) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 80;
      particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.3 + Math.random() * 0.35, col, size: 1 + (Math.random() * 2) | 0,
      });
    }
  }

  function offerLevelUp() {
    const pool = UPGRADE_DEFS.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    upgradeChoices = pool.slice(0, 3);
    state = 'LEVELUP';
    AudioFX.levelUp();
    el.levelupTitle.textContent = 'LEVEL UP!  Lv ' + player.level;
    el.cards.innerHTML = '';
    upgradeChoices.forEach((u, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card';
      card.innerHTML =
        '<span class="card-num">' + (i + 1) + '</span>' +
        '<span class="card-name">' + u.name + '</span>' +
        '<span class="card-desc">' + u.desc + '</span>';
      card.addEventListener('click', () => pickUpgrade(i));
      el.cards.appendChild(card);
    });
    showOnly('levelup');
    syncHud();
  }

  function pickUpgrade(i) {
    if (state !== 'LEVELUP' || !upgradeChoices[i]) return;
    AudioFX.click();
    upgradeChoices[i].apply(player);
    upgradeChoices = [];
    state = 'PLAYING';
    showOnly('hud');
    syncHud();
  }

  function showEnd(won) {
    state = won ? 'WIN' : 'GAMEOVER';
    AudioFX.stopBgm(true);
    if (won) AudioFX.win(); else AudioFX.death();
    el.endTitle.textContent = won ? 'YOU SURVIVED!' : 'GAME OVER';
    el.endTitle.className = 'panel-title ' + (won ? 'win' : 'lose');
    const score = killCount * 10 + Math.floor(timeAlive) * 2 + player.level * 25;
    el.endStats.innerHTML =
      '<div>Time  ' + formatTime(timeAlive) + '</div>' +
      '<div>Kills  ' + killCount + '</div>' +
      '<div>Level  ' + player.level + '</div>' +
      '<div class="score">Score  ' + score + '</div>';
    showOnly('end');
    syncHud();
  }

  // ---------- Update ----------
  function update(dt) {
    animT += dt;
    menuPulse += dt;
    if (state === 'MENU' || state === 'LEVELUP' || state === 'PAUSED' || state === 'GAMEOVER' || state === 'WIN') return;

    timeAlive += dt;
    if (flashHurt > 0) flashHurt -= dt;
    if (player.invuln > 0) player.invuln -= dt;

    if (timeAlive >= WIN_TIME) {
      showEnd(true);
      return;
    }

    let mx = 0, my = 0;
    if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
    if (keys['KeyS'] || keys['ArrowDown']) my += 1;
    if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) mx += 1;
    mx += touchVec.x;
    my += touchVec.y;
    const mlen = Math.hypot(mx, my);
    player.moving = mlen > 0.08;
    if (player.moving) {
      mx /= mlen; my /= mlen;
      player.x += mx * player.speed * dt;
      player.y += my * player.speed * dt;
      if (mx !== 0) player.facing = mx > 0 ? 1 : -1;
      player.walkFrame += dt * 8;
    }
    player.x = Math.max(20, Math.min(WORLD_W - 20, player.x));
    player.y = Math.max(20, Math.min(WORLD_H - 20, player.y));
    resolveObstacleCircle(player, 7);
    player.x = Math.max(20, Math.min(WORLD_W - 20, player.x));
    player.y = Math.max(20, Math.min(WORLD_H - 20, player.y));

    const vw = viewWorldW(), vh = viewWorldH();
    cam.x = player.x - vw / 2;
    cam.y = player.y - vh / 2;
    cam.x = Math.max(0, Math.min(WORLD_W - vw, cam.x));
    cam.y = Math.max(0, Math.min(WORLD_H - vh, cam.y));

    player.fireCd -= dt;
    if (player.fireCd <= 0) {
      fireAtNearest();
      player.fireCd = player.fireCdMax;
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const density = 1 + Math.floor(timeAlive / 20);
      const n = Math.min(6, density + (Math.random() * 2) | 0);
      spawnBurst(n);
      const interval = Math.max(0.55, 1.8 - timeAlive * 0.008);
      spawnTimer = interval;
      if (enemies.length > 120) enemies.splice(0, enemies.length - 120);
    }

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) { projectiles.splice(i, 1); continue; }
      for (const e of enemies) {
        if (p.hit.has(e)) continue;
        const dx = e.x - p.x, dy = e.y - p.y;
        if (dx * dx + dy * dy < (e.r + 4) ** 2) {
          e.hp -= p.damage;
          p.hit.add(e);
          addParticles(p.x, p.y, '#ffe8a0', 4);
          AudioFX.hit();
          if (p.pierce <= 0) { projectiles.splice(i, 1); break; }
          p.pierce--;
        }
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.frameT += dt;
      if (e.frameT > 0.18) { e.frameT = 0; e.frame = (e.frame + 1) % 4; }

      if (e.hp <= 0) {
        dropGem(e.x, e.y, e.xp);
        addParticles(e.x, e.y, slimePalettes[e.color === 'king' ? 'mint' : e.color].mid, 10);
        enemies.splice(i, 1);
        killCount++;
        AudioFX.kill();
        continue;
      }

      const dx = player.x - e.x, dy = player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;
      resolveObstacleCircle(e, Math.max(5, e.r * 0.55));

      if (d < e.r + 8 && player.invuln <= 0) {
        player.hp -= e.damage;
        player.invuln = 0.7;
        flashHurt = 0.25;
        addParticles(player.x, player.y, '#ff6688', 8);
        AudioFX.hurt();
        if (player.hp <= 0) {
          player.hp = 0;
          showEnd(false);
          return;
        }
      }
    }

    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i];
      g.bob += dt * 4;
      const dx = player.x - g.x, dy = player.y - g.y;
      const d = Math.hypot(dx, dy);
      const pull = player.magnet;
      if (d < pull) {
        const pullSpd = 180 + (pull - d) * 2;
        g.x += (dx / (d || 1)) * pullSpd * dt;
        g.y += (dy / (d || 1)) * pullSpd * dt;
      }
      if (d < 12) {
        player.xp += g.value;
        gems.splice(i, 1);
        AudioFX.xp();
        while (player.xp >= player.xpNext) {
          player.xp -= player.xpNext;
          player.level++;
          player.xpNext = xpForLevel(player.level);
          player.hp = Math.min(player.maxHp, player.hp + 8);
          offerLevelUp();
          break;
        }
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.92; p.vy *= 0.92;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    syncHud();
  }

  // ---------- Draw (world only — UI is HTML) ----------
  function worldToScreen(x, y) {
    return { x: Math.round(x - cam.x), y: Math.round(y - cam.y) };
  }

  function drawNightGrass() {
    ctx.fillStyle = '#142018';
    ctx.fillRect(0, 0, W, H);
    const tile = 32;
    const ox = Math.floor(cam.x / tile);
    const oy = Math.floor(cam.y / tile);
    for (let iy = -1; iy < H / tile + 2; iy++) {
      for (let ix = -1; ix < W / tile + 2; ix++) {
        const wx = (ox + ix) * tile;
        const wy = (oy + iy) * tile;
        const sx = wx - cam.x;
        const sy = wy - cam.y;
        const hsh = ((wx * 73856093) ^ (wy * 19349663)) >>> 0;
        if ((hsh & 7) === 0) {
          ctx.fillStyle = '#101a14';
          ctx.fillRect(sx, sy, tile, tile);
        }
        ctx.fillStyle = '#1e3a28';
        const n = 2 + (hsh & 3);
        for (let k = 0; k < n; k++) {
          const gx = sx + ((hsh >> (k * 3)) & 28) + 2;
          const gy = sy + ((hsh >> (k * 5)) & 24) + 4;
          ctx.fillRect(gx, gy, 1, 3);
          ctx.fillStyle = '#2a5a38';
          ctx.fillRect(gx, gy, 1, 2);
          ctx.fillStyle = '#1e3a28';
        }
        if ((hsh & 31) === 3) {
          ctx.fillStyle = '#6a8cff';
          ctx.fillRect(sx + 10, sy + 14, 2, 2);
        }
        if ((hsh & 31) === 7) {
          ctx.fillStyle = '#c090ff';
          ctx.fillRect(sx + 18, sy + 8, 2, 2);
        }
      }
    }
    ctx.fillStyle = 'rgba(5,8,16,0.35)';
    ctx.fillRect(0, 0, W, 16);
    ctx.fillRect(0, H - 16, W, 16);
  }

  function drawPlayer() {
    const s = worldToScreen(player.x, player.y);
    let spr = heroFront;
    if (player.moving) {
      spr = ((player.walkFrame | 0) % 2 === 0) ? heroWalkA : heroWalkB;
    }
    ctx.save();
    if (player.facing < 0) {
      ctx.translate(s.x, s.y);
      ctx.scale(-1, 1);
      if (player.invuln > 0 && (animT * 20 | 0) % 2 === 0) ctx.globalAlpha = 0.45;
      blit(ctx, spr, -10, -22);
    } else {
      if (player.invuln > 0 && (animT * 20 | 0) % 2 === 0) ctx.globalAlpha = 0.45;
      blit(ctx, spr, s.x - 10, s.y - 22);
    }
    ctx.restore();
  }

  function drawEnemies() {
    for (const e of enemies) {
      const s = worldToScreen(e.x, e.y);
      if (s.x < -40 || s.y < -40 || s.x > W + 40 || s.y > H + 40) continue;
      const frames = slimeFrames[e.color] || slimeFrames.mint;
      const fr = frames[e.frame % frames.length];
      const ox = fr.width / 2;
      const oy = fr.height - 2;
      blit(ctx, fr, s.x - ox, s.y - oy);
      if (e.isKing || e.hp < e.maxHp) {
        const bw = e.isKing ? 22 : 14;
        ctx.fillStyle = '#1a1020';
        ctx.fillRect(s.x - bw / 2, s.y - oy - 5, bw, 3);
        ctx.fillStyle = e.isKing ? '#e8c84a' : '#7dcea0';
        ctx.fillRect(s.x - bw / 2, s.y - oy - 5, bw * (e.hp / e.maxHp), 3);
      }
    }
  }

  function drawOneObstacle(o) {
    const s = worldToScreen(o.x, o.y);
    if (s.x < -48 || s.y < -64 || s.x > W + 48 || s.y > H + 64) return;
    blit(ctx, o.spr, s.x - o.ox, s.y - o.oy);
  }

  function drawOneEnemy(e) {
    const s = worldToScreen(e.x, e.y);
    if (s.x < -40 || s.y < -40 || s.x > W + 40 || s.y > H + 40) return;
    const frames = slimeFrames[e.color] || slimeFrames.mint;
    const fr = frames[e.frame % frames.length];
    const ox = fr.width / 2;
    const oy = fr.height - 2;
    blit(ctx, fr, s.x - ox, s.y - oy);
    if (e.isKing || e.hp < e.maxHp) {
      const bw = e.isKing ? 22 : 14;
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(s.x - bw / 2, s.y - oy - 5, bw, 3);
      ctx.fillStyle = e.isKing ? '#e8c84a' : '#7dcea0';
      ctx.fillRect(s.x - bw / 2, s.y - oy - 5, bw * (e.hp / e.maxHp), 3);
    }
  }

  // Y-sort props with critters so characters walk in front of / behind trunks.
  function drawSortedWorld() {
    const items = [];
    for (const o of obstacles) items.push({ y: o.y, draw: () => drawOneObstacle(o) });
    for (const e of enemies) items.push({ y: e.y, draw: () => drawOneEnemy(e) });
    if (player) items.push({ y: player.y, draw: () => drawPlayer() });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.draw();
  }


  function drawProjectiles() {
    for (const p of projectiles) {
      const s = worldToScreen(p.x, p.y);
      blit(ctx, projSprite, s.x - 3, s.y - 3);
    }
  }

  function drawGems() {
    for (const g of gems) {
      const s = worldToScreen(g.x, g.y + Math.sin(g.bob) * 2);
      blit(ctx, gemSprite, s.x - 4, s.y - 4);
    }
  }

  function drawParticles() {
    for (const p of particles) {
      const s = worldToScreen(p.x, p.y);
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.col;
      ctx.fillRect(s.x, s.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }

  function drawMenuBackdrop() {
    ctx.fillStyle = '#0c121c';
    ctx.fillRect(0, 0, W, H);
    const cols = ['mint', 'pink', 'yellow', 'purple'];
    const decoCount = Math.max(10, Math.min(22, Math.round(10 * H / BASE_H)));
    const band = Math.max(60, (H - 100) / 3);
    for (let i = 0; i < decoCount; i++) {
      const c = cols[i % 4];
      const fr = slimeFrames[c][Math.floor(animT * 4 + i) % 4];
      const x = 30 + (i * 47) % (W - 40);
      const y = 40 + Math.sin(animT * 1.5 + i) * 8 + (i % 3) * band;
      ctx.globalAlpha = 0.55;
      blit(ctx, fr, x, y);
      ctx.globalAlpha = 1;
    }
    // Keep hero near the visual center of the taller playfield.
    const heroY = Math.max(70, Math.min(H - 120, Math.round(H * 0.26)));
    blit(ctx, heroFront, W / 2 - 20, heroY, 40, 56);
  }

  function draw() {
    // Scale world onto full canvas so ~25% less meadow is visible; UI stays CSS-sized.
    ctx.save();
    ctx.setTransform(VIEW_ZOOM, 0, 0, VIEW_ZOOM, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const savedW = W, savedH = H;
    W = savedW / VIEW_ZOOM;
    H = savedH / VIEW_ZOOM;
    try {
      if (state === 'MENU') {
        drawMenuBackdrop();
      } else {
        drawNightGrass();
        drawGems();
        drawSortedWorld();
        drawProjectiles(); // sparks pass through foliage; drawn above for readability
        drawParticles();
        if (flashHurt > 0) {
          ctx.fillStyle = `rgba(180,20,60,${flashHurt * 0.45})`;
          ctx.fillRect(0, 0, W, H);
        }
      }
    } finally {
      W = savedW;
      H = savedH;
      ctx.restore();
      ctx.imageSmoothingEnabled = false;
    }
  }

  // ---------- Loop ----------
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Init overlay state
  showOnly('menu');

  window.__slimeBarrage = {
    startGame,
    goMenu,
    getState: () => state,
    getCanvas: () => canvas,
    VERSION,
    VIEW_ZOOM,
    togglePause,
    forcePlaySeconds: (sec) => {
      startGame();
      for (let i = 0; i < 25; i++) spawnSlime(true);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        enemies.push({
          x: player.x + Math.cos(a) * (60 + (i % 3) * 28),
          y: player.y + Math.sin(a) * (60 + (i % 3) * 28),
          r: 10, color: ['mint','pink','yellow','purple'][i % 4],
          hp: 20, maxHp: 20, speed: 30, damage: 8,
          frame: i % 4, frameT: 0, xp: 2, isKing: false,
        });
      }
      enemies.push({
        x: player.x + 90, y: player.y - 40, r: 16, color: 'king',
        hp: 100, maxHp: 100, speed: 25, damage: 15,
        frame: 0, frameT: 0, xp: 12, isKing: true,
      });
      timeAlive = sec;
      player.level = 3;
      player.xp = 4;
      cam.x = player.x - viewWorldW() / 2;
      cam.y = player.y - viewWorldH() / 2;
      syncHud();
    },
    obstacleCount: () => obstacles.length,
    showLevelUpDemo: () => {
      if (state !== 'PLAYING') startGame();
      offerLevelUp();
    },
  };
})();
