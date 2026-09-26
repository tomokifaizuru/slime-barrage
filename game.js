/**
 * Slime Barrage v1.0
 * Original IP — casual pink-hair hoodie girl vs cute colorful slimes.
 * Canvas world sprites + HTML/CSS overlays for crisp UI text.
 * HTMLAudio BGM (Moonlit calm / Nightfall boss) with procedural fallback.
 * Mid-run Pink-Mint Monarch boss, floating touch stick, soft damage numbers.
 * Portrait/landscape world zoom, infinite meadow, Survival + Timed modes.
 * Orbit Guard, Pulse Laser (L6 gold), Omni Beam, Wipe skill, XP gem tiers.
 * Multishot max 7; mob pace ramp; local Survival|Timed rankings.
 */
(() => {
  'use strict';

  // ---------- Config ----------
  // Mutable view size: landscape stays classic 480×270; portrait grows taller
  // so width-fit scale fills the phone with no letterbars / no side crop.
  const BASE_W = 480, BASE_H = 270;
  let W = BASE_W, H = BASE_H;
  // Legacy finite meadow size kept only as a conceptual tile scale for props.
  const WORLD_W = 2400, WORLD_H = 2400;
  const WIN_TIME_TIMED = 360; // Timed mode: 6 minutes
  const VERSION = 'v1.0';
  const BOSS_SPAWN_AT = 150; // ~2:30 into Timed 6:00 / Survival from start
  const VIEW_H_MIN = 270;
  const VIEW_H_MAX = 1200;
  // World→screen zoom (mutable; recomputed on resize/orientation). UI stays CSS-sized.
  const VIEW_ZOOM_PORTRAIT = 1.55;
  const VIEW_ZOOM_LANDSCAPE = 1.05;
  let VIEW_ZOOM = VIEW_ZOOM_PORTRAIT;
  const MULTISHOT_MAX = 7;
  const LASER_MAX_LEVEL = 6;
  const OMNI_MAX_LEVEL = 3;
  const WIPE_COOLDOWN = 120;
  const MOB_SPEED_START = 0.85; // −15% at run start vs baseline
  const MOB_SPEED_RAMP = 0.01;  // +1% of baseline per minute → 100% at min 15
  const CLEANUP_DIST = 980;
  const PROP_CHUNK = 360;
  const PROP_KEEP_CHUNKS = 3; // ± chunks around player
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
    playSurvivalBtn: document.getElementById('playSurvivalBtn'),
    playTimedBtn: document.getElementById('playTimedBtn'),
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
    wipeBtn: document.getElementById('wipeBtn'),
    wipeCd: document.getElementById('wipeCd'),
    ranksBtn: document.getElementById('ranksBtn'),
    ranks: document.getElementById('ranks'),
    ranksBackBtn: document.getElementById('ranksBackBtn'),
    rankSurvivalList: document.getElementById('rankSurvivalList'),
    rankTimedList: document.getElementById('rankTimedList'),
    rankNameInput: document.getElementById('rankNameInput'),
    rankSaveNameBtn: document.getElementById('rankSaveNameBtn'),
    endRankNote: document.getElementById('endRankNote'),
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
    // Portrait: meadow feels larger (~1.55). Landscape: near-normal (~1.05).
    // Does NOT enlarge HUD/UI chrome (CSS --ui-scale stays independent).
    VIEW_ZOOM = isPortrait ? VIEW_ZOOM_PORTRAIT : VIEW_ZOOM_LANDSCAPE;

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

    // HTMLAudio tracks (preferred); procedural sequencer is fallback only.
    const HTML_BGM_GAIN = 0.42;
    const HTML_CROSSFADE = 0.55;
    let htmlTracks = { calm: null, nightfall: null };
    let htmlTrackName = 'calm';
    let htmlReady = false;
    let htmlFailed = false;
    let htmlUsing = false;
    let htmlFadeTimer = null;

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
    function htmlTargetVol() {
      if (muted || !bgmWanted) return 0;
      const duck = bgmDucked ? 0.12 : 1;
      return Math.max(0, Math.min(1, HTML_BGM_GAIN * musicVol * duck));
    }
    function applyHtmlVolumes(instant) {
      const target = htmlTargetVol();
      for (const name of Object.keys(htmlTracks)) {
        const a = htmlTracks[name];
        if (!a) continue;
        if (name === htmlTrackName && htmlUsing && bgmWanted) {
          if (instant) a.volume = target;
          // otherwise leave in-flight fades alone unless muted/zero
          else if (muted || target === 0) a.volume = target;
          else if (Math.abs(a.volume - target) > 0.02 && !htmlFadeTimer) a.volume = target;
        } else if (instant || muted || !bgmWanted) {
          if (name !== htmlTrackName || !htmlUsing) {
            // keep non-active at 0 unless mid-crossfade
          }
        }
      }
      const active = htmlTracks[htmlTrackName];
      if (active && htmlUsing && (instant || muted || !htmlFadeTimer)) {
        active.volume = target;
      }
      if (!htmlUsing) {
        for (const a of Object.values(htmlTracks)) {
          if (a) a.volume = 0;
        }
      }
    }
    function applyVolumes() {
      if (master) master.gain.value = muted ? 0 : 0.35;
      if (sfxGain) sfxGain.gain.value = sfxVol;
      if (bgmGain) {
        bgmGain.gain.cancelScheduledValues(ctxA ? ctxA.currentTime : 0);
        bgmGain.gain.setValueAtTime(Math.max(0.0001, effectiveBgmGain()), ctxA ? ctxA.currentTime : 0);
      }
      applyHtmlVolumes(false);
    }

    function ensureHtmlTracks() {
      if (htmlFailed) return false;
      if (htmlReady) return true;
      try {
        const calm = new Audio('assets/bgm-moonlit-calm.mp3');
        const night = new Audio('assets/bgm-nightfall.mp3');
        calm.loop = true; night.loop = true;
        calm.preload = 'auto'; night.preload = 'auto';
        calm.volume = 0; night.volume = 0;
        const fail = () => { htmlFailed = true; htmlUsing = false; };
        calm.addEventListener('error', fail);
        night.addEventListener('error', fail);
        htmlTracks.calm = calm;
        htmlTracks.nightfall = night;
        htmlReady = true;
        return true;
      } catch (_) {
        htmlFailed = true;
        return false;
      }
    }

    function clearHtmlFade() {
      if (htmlFadeTimer != null) {
        clearInterval(htmlFadeTimer);
        htmlFadeTimer = null;
      }
    }

    function fadeHtmlTo(audio, toVol, durSec, onDone) {
      clearHtmlFade();
      if (!audio) { if (onDone) onDone(); return; }
      const from = audio.volume;
      const steps = Math.max(8, Math.round(durSec * 30));
      let i = 0;
      htmlFadeTimer = setInterval(() => {
        i++;
        const t = i / steps;
        audio.volume = Math.max(0, Math.min(1, from + (toVol - from) * t));
        if (i >= steps) {
          clearHtmlFade();
          audio.volume = toVol;
          if (onDone) onDone();
        }
      }, (durSec * 1000) / steps);
    }

    function stopAllHtml(fade) {
      clearHtmlFade();
      const active = htmlTracks[htmlTrackName];
      const others = Object.values(htmlTracks).filter(a => a && a !== active);
      for (const a of others) {
        try { a.pause(); a.currentTime = 0; } catch (_) {}
        a.volume = 0;
      }
      if (active) {
        if (fade && active.volume > 0.01) {
          fadeHtmlTo(active, 0, 0.4, () => {
            try { active.pause(); } catch (_) {}
          });
        } else {
          try { active.pause(); } catch (_) {}
          active.volume = 0;
        }
      }
      htmlUsing = false;
    }

    function playHtmlTrack(name, restart, fadeIn) {
      if (!ensureHtmlTracks() || htmlFailed) return false;
      const next = htmlTracks[name];
      if (!next) return false;
      const prevName = htmlTrackName;
      const prev = htmlTracks[prevName];
      htmlTrackName = name;
      htmlUsing = true;
      const target = htmlTargetVol();
      try {
        if (restart || next.paused) {
          if (restart) {
            try { next.currentTime = 0; } catch (_) {}
          }
          const p = next.play();
          if (p && typeof p.then === 'function') {
            p.catch(() => {
              htmlFailed = true;
              htmlUsing = false;
              startProceduralBgm(true);
            });
          }
        }
      } catch (_) {
        htmlFailed = true;
        htmlUsing = false;
        return false;
      }
      if (fadeIn && prev && prev !== next && prevName !== name) {
        next.volume = 0;
        // crossfade
        clearHtmlFade();
        const steps = Math.max(8, Math.round(HTML_CROSSFADE * 30));
        let i = 0;
        const fromPrev = prev.volume;
        htmlFadeTimer = setInterval(() => {
          i++;
          const t = i / steps;
          next.volume = Math.max(0, Math.min(1, target * t));
          prev.volume = Math.max(0, fromPrev * (1 - t));
          if (i >= steps) {
            clearHtmlFade();
            next.volume = target;
            prev.volume = 0;
            try { prev.pause(); } catch (_) {}
          }
        }, (HTML_CROSSFADE * 1000) / steps);
      } else {
        if (prev && prev !== next) {
          try { prev.pause(); } catch (_) {}
          prev.volume = 0;
        }
        if (fadeIn) {
          next.volume = 0;
          fadeHtmlTo(next, target, 0.45);
        } else {
          next.volume = target;
        }
      }
      return true;
    }

    function setBgmTrack(name, fade) {
      if (name !== 'calm' && name !== 'nightfall') name = 'calm';
      if (!bgmWanted) { htmlTrackName = name; return; }
      if (htmlUsing || (!htmlFailed && ensureHtmlTracks())) {
        if (htmlTrackName === name && htmlUsing) {
          applyHtmlVolumes(true);
          return;
        }
        if (playHtmlTrack(name, false, fade !== false)) {
          stopBgmSchedulerOnly();
          return;
        }
      }
      // procedural has no separate tracks — keep playing if already
      htmlTrackName = name;
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
      ensureHtmlTracks();
      if (bgmWanted && !bgmPlaying && !htmlUsing) startBgm(true);
      else if (bgmWanted && htmlUsing) {
        const a = htmlTracks[htmlTrackName];
        if (a && a.paused) {
          try { a.play().catch(() => {}); } catch (_) {}
        }
      }
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

    function startProceduralBgm(restart) {
      if (!ensure() || !unlocked) return;
      if (ctxA.state === 'suspended') {
        ctxA.resume().then(() => { if (bgmWanted) startProceduralBgm(true); }).catch(() => {});
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

    function startBgm(restart) {
      bgmWanted = true;
      if (!unlocked) return;
      ensure();
      // Prefer HTMLAudio tracks; fall back to procedural GB meadow loop.
      if (!htmlFailed && ensureHtmlTracks()) {
        stopBgmSchedulerOnly();
        if (playHtmlTrack(htmlTrackName || 'calm', !!restart, true)) return;
      }
      stopAllHtml(false);
      startProceduralBgm(restart);
    }

    function stopBgm(fade) {
      bgmWanted = false;
      stopAllHtml(!!fade);
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
      getMusicVol, getSfxVol, setMusicVol, setSfxVol, setBgmDucked, setBgmTrack,
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
      AudioFX.unlock(); AudioFX.click(); startGame(playMode);
    }
    if ((state === 'GAMEOVER' || state === 'WIN') && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyR')) {
      AudioFX.click(); goMenu();
    }
    if (state === 'LEVELUP') {
      if (e.code === 'Digit1' || e.code === 'Numpad1') pickUpgrade(0);
      if (e.code === 'Digit2' || e.code === 'Numpad2') pickUpgrade(1);
      if (e.code === 'Digit3' || e.code === 'Numpad3') pickUpgrade(2);
    }
    if ((e.code === 'KeyQ' || e.code === 'KeyF') && state === 'PLAYING') {
      activateWipe();
      return;
    }
    if (e.code === 'KeyM') { AudioFX.unlock(); AudioFX.toggleMute(); }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (state === 'PLAYING') { e.preventDefault(); togglePause(true); }
      else if (state === 'PAUSED') { e.preventDefault(); togglePause(false); }
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  // Floating stick: hidden until the player first taps+drags on the playfield.
  touchPad.classList.add('hidden');
  let stickOrigin = { x: 0, y: 0 };
  let stickTouchId = null;
  const STICK_SIZE = () => Math.min(112, Math.max(72, Math.min(window.innerWidth, window.innerHeight) * 0.28));

  function isHudUiTarget(t) {
    if (!t || !t.closest) return false;
    return !!(
      t.closest('button') ||
      t.closest('input') ||
      t.closest('.panel') ||
      t.closest('.card') ||
      t.closest('.menu-audio') ||
      t.closest('.hud-btns')
    );
  }

  function showStickAt(clientX, clientY) {
    const size = STICK_SIZE();
    touchPad.style.width = size + 'px';
    touchPad.style.height = size + 'px';
    touchPad.style.left = clientX + 'px';
    touchPad.style.top = clientY + 'px';
    touchPad.style.bottom = 'auto';
    touchPad.style.right = 'auto';
    touchPad.classList.remove('hidden');
    stickOrigin.x = clientX;
    stickOrigin.y = clientY;
  }

  function stickFromOrigin(clientX, clientY) {
    const size = touchPad.offsetWidth || STICK_SIZE();
    const max = size / 2 - 10;
    let dx = clientX - stickOrigin.x, dy = clientY - stickOrigin.y;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    touchVec.x = dx / max;
    touchVec.y = dy / max;
  }
  function resetStick() {
    touchVec.x = 0; touchVec.y = 0;
    stickKnob.style.transform = 'translate(-50%, -50%)';
    touchPad.classList.add('hidden');
    stickTouchId = null;
    touchActive = false;
  }

  function onFloatTouchStart(e) {
    if (state !== 'PLAYING') return;
    if (stickTouchId != null) return;
    const t = e.changedTouches[0];
    if (!t) return;
    if (isHudUiTarget(e.target)) return;
    stickTouchId = t.identifier;
    touchActive = true;
    showStickAt(t.clientX, t.clientY);
    stickFromOrigin(t.clientX, t.clientY);
    e.preventDefault();
  }
  function onFloatTouchMove(e) {
    if (stickTouchId == null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === stickTouchId) {
        stickFromOrigin(t.clientX, t.clientY);
        e.preventDefault();
        break;
      }
    }
  }
  function onFloatTouchEnd(e) {
    if (stickTouchId == null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === stickTouchId) {
        resetStick();
        e.preventDefault();
        break;
      }
    }
  }

  const stageEl = document.getElementById('stage');
  if (isTouch && stageEl) {
    stageEl.addEventListener('touchstart', onFloatTouchStart, { passive: false });
    stageEl.addEventListener('touchmove', onFloatTouchMove, { passive: false });
    stageEl.addEventListener('touchend', onFloatTouchEnd, { passive: false });
    stageEl.addEventListener('touchcancel', onFloatTouchEnd, { passive: false });
  }

  function bindModeStart(btn, mode) {
    if (!btn) return;
    btn.addEventListener('click', () => {
      AudioFX.unlock();
      AudioFX.click();
      startGame(mode);
    });
  }
  bindModeStart(el.playSurvivalBtn, 'survival');
  bindModeStart(el.playTimedBtn, 'timed');
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

  if (el.wipeBtn) {
    el.wipeBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      AudioFX.unlock();
      activateWipe();
    });
  }
  if (el.ranksBtn) {
    el.ranksBtn.addEventListener('click', () => {
      AudioFX.unlock();
      openRanks();
    });
  }
  const endRanksBtn = document.getElementById('endRanksBtn');
  if (endRanksBtn) {
    endRanksBtn.addEventListener('click', () => {
      AudioFX.click();
      openRanks();
    });
  }
  if (el.ranksBackBtn) {
    el.ranksBackBtn.addEventListener('click', () => {
      AudioFX.click();
      goMenu();
    });
  }
  if (el.rankSaveNameBtn) {
    el.rankSaveNameBtn.addEventListener('click', () => {
      AudioFX.click();
      const n = ((el.rankNameInput && el.rankNameInput.value) || '').trim().slice(0, 16) || 'Player';
      playerName = n;
      try { localStorage.setItem('slimeBarragePlayerName', playerName); } catch (_) {}
      if (el.rankNameInput) el.rankNameInput.value = playerName;
    });
  }

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
  // Pink-Mint Monarch (draft C): pink jelly, mint frothy rim, gold crown + purple gems, cute-tough face.
  // Procedural pixel frames matching makeSlimeFrames style — not the concept PNG.
  function makeMonarchFrames(size = 48) {
    const pink = { mid: '#f5a0c0', dark: '#c06090', hi: '#ffe8f2', deep: '#a04070', spot: '#e878a8' };
    const mint = { mid: '#7dcea0', dark: '#4a9a6e', hi: '#c8f5d8', foam: '#a8e8c0' };
    const frames = [];
    const stretches = [
      { sy: 0, sh: 0 },
      { sy: -1, sh: 2 },
      { sy: 1, sh: -2 },
      { sy: 0, sh: 1 },
    ];
    for (const st of stretches) {
      frames.push(makeSprite(size + 10, size + 14, (g, w, h) => {
        const crownH = 10;
        const baseY = crownH + 2 + st.sy;
        const bh = size - 4 + st.sh;
        const bw = size - 2 - Math.floor(st.sh * 0.5);
        const bx = Math.floor((w - bw) / 2);
        const mid = Math.floor(bh / 2);
        // pink jelly body
        for (let y = 0; y < bh; y++) {
          const t = Math.abs(y - mid) / (mid || 1);
          const inset = Math.floor(t * t * (bw / 3.2));
          const col = y > bh * 0.72 ? pink.dark : (y < bh * 0.22 ? pink.hi : pink.mid);
          fillRect(g, bx + inset, baseY + y, bw - inset * 2, 1, col);
        }
        // deeper belly shade
        fillRect(g, bx + 4, baseY + bh - 6, bw - 8, 3, pink.deep);
        // glossy highlights
        fillRect(g, bx + Math.floor(bw * 0.18), baseY + 3, Math.max(3, Math.floor(bw * 0.22)), 3, pink.hi);
        fillRect(g, bx + Math.floor(bw * 0.62), baseY + 5, Math.max(2, Math.floor(bw * 0.12)), 2, '#fff5fa');
        px(g, bx + Math.floor(bw * 0.7), baseY + Math.floor(bh * 0.4), pink.spot, 2);
        // mint frothy base rim + side bubbles
        const foamY = baseY + bh - 5;
        fillRect(g, bx + 1, foamY, bw - 2, 4, mint.mid);
        fillRect(g, bx + 3, foamY + 2, bw - 6, 2, mint.dark);
        for (let i = 0; i < 5; i++) {
          const fx = bx + 2 + i * Math.floor((bw - 4) / 5);
          px(g, fx, foamY - 1 - (i % 2), mint.foam, 2);
          px(g, fx + 1, foamY + 1, mint.hi, 1);
        }
        fillRect(g, bx - 1, foamY - 2, 3, 3, mint.mid);
        fillRect(g, bx + bw - 2, foamY - 2, 3, 3, mint.mid);
        px(g, bx, foamY - 4, mint.foam, 2);
        px(g, bx + bw - 1, foamY - 3, mint.hi, 2);
        // cute-tough face: angled brows + purple eyes + small w mouth
        const cx = Math.floor(w / 2);
        const eyeY = baseY + Math.floor(bh * 0.38);
        fillRect(g, cx - 9, eyeY - 2, 5, 2, '#2a1830'); // brow L
        fillRect(g, cx + 4, eyeY - 2, 5, 2, '#2a1830'); // brow R
        fillRect(g, cx - 8, eyeY, 4, 4, '#6a3a9a');
        fillRect(g, cx + 4, eyeY, 4, 4, '#6a3a9a');
        px(g, cx - 7, eyeY + 1, '#ffffff');
        px(g, cx + 5, eyeY + 1, '#ffffff');
        px(g, cx - 6, eyeY + 2, '#1a1020');
        px(g, cx + 6, eyeY + 2, '#1a1020');
        // w mouth
        px(g, cx - 2, eyeY + 8, '#1a1020');
        px(g, cx - 1, eyeY + 9, '#1a1020');
        px(g, cx, eyeY + 8, '#1a1020');
        px(g, cx + 1, eyeY + 9, '#1a1020');
        px(g, cx + 2, eyeY + 8, '#1a1020');
        // gold crown with purple gems
        fillRect(g, cx - 8, 3, 16, 5, '#e8c84a');
        fillRect(g, cx - 8, 2, 3, 4, '#e8c84a');
        fillRect(g, cx - 1, 0, 3, 5, '#f0e070');
        fillRect(g, cx + 5, 2, 3, 4, '#e8c84a');
        fillRect(g, cx - 7, 5, 14, 2, '#c9a030');
        px(g, cx, 1, '#a855f7', 2);
        px(g, cx - 6, 4, '#a855f7');
        px(g, cx + 6, 4, '#a855f7');
        px(g, cx + 1, 0, '#d4a0ff');
        // soft ground shadow
        fillRect(g, bx + 4, baseY + bh, bw - 8, 2, 'rgba(0,0,0,0.28)');
      }));
    }
    return frames;
  }

  const slimeFrames = {
    mint: makeSlimeFrames(slimePalettes.mint, 16),
    pink: makeSlimeFrames(slimePalettes.pink, 16),
    yellow: makeSlimeFrames(slimePalettes.yellow, 16),
    purple: makeSlimeFrames(slimePalettes.purple, 16),
    king: makeSlimeFrames(slimePalettes.mint, 22, true),
    monarch: makeMonarchFrames(64),
  };

  const projSprite = makeSprite(6, 6, (g) => {
    fillRect(g, 2, 0, 2, 6, '#ffe8a0');
    fillRect(g, 0, 2, 6, 2, '#ffe8a0');
    fillRect(g, 2, 2, 2, 2, '#ffffff');
  });
  function makeGemSprite(c1, c2, c3, size = 8) {
    return makeSprite(size, size, (g) => {
      const mid = (size / 2) | 0;
      fillRect(g, mid - 1, 0, 2, size, c1);
      fillRect(g, 0, mid - 1, size, 2, c1);
      fillRect(g, mid - 2, 1, 4, size - 2, c2);
      fillRect(g, mid - 1, 2, 2, size - 4, c3);
    });
  }
  const gemSpriteBlue = makeGemSprite('#7cf0ff', '#40d8f0', '#e0ffff', 8);
  const gemSpritePurple = makeGemSprite('#d080ff', '#a040e8', '#f0d0ff', 12);
  const gemSpriteGold = makeGemSprite('#ffe060', '#e8c84a', '#fff8d0', 14);

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
  let dmgNums = [];
  let obstacles = [];
  let cam = { x: 0, y: 0 };
  let timeAlive = 0;
  let spawnTimer = 0;
  let killCount = 0;
  let upgradeChoices = [];
  let animT = 0;
  let flashHurt = 0;
  let menuPulse = 0;
  let bossSpawned = false;
  let bossAlive = false;
  let playMode = localStorage.getItem('slimeBarrageMode') === 'survival' ? 'survival' : 'timed';
  let lasers = []; // active beam visuals {x,y,ang,life,damage,hit,gold,omni}
  let bestSurvival = parseFloat(localStorage.getItem('slimeBarrageBestSurvival') || '0') || 0;
  let wipeCd = 0;
  let playerName = '';
  try { playerName = localStorage.getItem('slimeBarragePlayerName') || ''; } catch (_) {}


  const UPGRADE_DEFS = [
    { id: 'dmg', name: 'Sharp Spark', desc: '+25% projectile damage', apply: p => { p.damage = Math.round(p.damage * 1.25); } },
    { id: 'rate', name: 'Rapid Fire', desc: '+20% fire rate', apply: p => { p.fireCdMax = Math.max(0.12, p.fireCdMax * 0.8); } },
    { id: 'spd', name: 'Sneaker Boost', desc: '+15% move speed', apply: p => { p.speed *= 1.15; } },
    { id: 'hp', name: 'Hoodie Padding', desc: '+20 max HP & heal 20', apply: p => { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 20); } },
    { id: 'magnet', name: 'Gem Magnet', desc: '+40% pickup range', apply: p => { p.magnet *= 1.4; } },
    { id: 'multi', name: 'Multishot', desc: '+1 projectile (max 7)', apply: p => { p.multishot = Math.min(MULTISHOT_MAX, p.multishot + 1); } },
    { id: 'pierce', name: 'Pierce Shot', desc: 'Projectiles pierce +1', apply: p => { p.pierce += 1; } },
    { id: 'heal', name: 'Snack Break', desc: 'Restore 40 HP', apply: p => { p.hp = Math.min(p.maxHp, p.hp + 40); } },
    { id: 'orbit', name: 'Orbit Guard', desc: 'Shield orbs spin & smash', apply: p => {
      if (!p.orbitOrbs) { p.orbitOrbs = 2; p.orbitRadius = 44; }
      else { p.orbitOrbs += 1; p.orbitRadius = Math.min(78, p.orbitRadius + 6); }
    } },
    { id: 'laser', name: 'Pulse Laser', desc: 'Beam clock: 2.0s → 0.75s (max 6)', apply: p => {
      p.laserLevel = Math.min(LASER_MAX_LEVEL, (p.laserLevel || 0) + 1);
      // L1=2.0, L2=1.75 … L6=0.75
      p.laserCdMax = Math.max(0.75, 2.0 - (p.laserLevel - 1) * 0.25);
      p.laserDamage = 32 + p.laserLevel * 16 + (p.laserLevel >= LASER_MAX_LEVEL ? 24 : 0);
      if (p.laserCd <= 0) p.laserCd = 0.5;
    } },
    { id: 'omni', name: 'Omni Beam', desc: 'SPECIAL · 8-way ray burst', special: true, apply: p => {
      p.omniLevel = Math.min(OMNI_MAX_LEVEL, (p.omniLevel || 0) + 1);
      p.omniCdMax = Math.max(2.4, 5.0 - p.omniLevel * 0.6);
      p.omniDamage = 20 + p.omniLevel * 14;
      p.omniRays = p.omniLevel >= 3 ? 12 : 8;
      if (p.omniCd <= 0) p.omniCd = 1.0;
    } },
  ];

  function laserIntervalForLevel(lv) {
    if (lv <= 0) return 2.0;
    return Math.max(0.75, 2.0 - (Math.min(LASER_MAX_LEVEL, lv) - 1) * 0.25);
  }

  /** Mob chase-speed multiplier vs baseline: 85% at t=0 → 100% at minute 15. */
  function mobSpeedMul() {
    const mins = Math.floor(timeAlive / 60);
    return Math.min(1.0, MOB_SPEED_START + mins * MOB_SPEED_RAMP);
  }

  function resetPlayer() {
    return {
      x: 0, y: 0,
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
      orbitOrbs: 0,
      orbitRadius: 44,
      orbitAngle: 0,
      laserLevel: 0,
      laserCd: 0,
      laserCdMax: 2.0,
      laserDamage: 0,
      laserTelegraph: 0,
      laserAng: 0,
      omniLevel: 0,
      omniCd: 0,
      omniCdMax: 5.0,
      omniDamage: 0,
      omniRays: 8,
      omniTelegraph: 0,
    };
  }

  function showOnly(panel) {
    el.menu.classList.toggle('hidden', panel !== 'menu');
    el.hud.classList.toggle('hidden', panel !== 'hud' && panel !== 'levelup' && panel !== 'end' && panel !== 'pause');
    // Keep HUD visible under levelup/end/pause for context, but hide on menu
    if (panel === 'levelup' || panel === 'end' || panel === 'pause') el.hud.classList.remove('hidden');
    if (panel === 'menu' || panel === 'ranks') el.hud.classList.add('hidden');
    el.pause.classList.toggle('hidden', panel !== 'pause');
    el.levelup.classList.toggle('hidden', panel !== 'levelup');
    el.end.classList.toggle('hidden', panel !== 'end');
    if (el.ranks) el.ranks.classList.toggle('hidden', panel !== 'ranks');
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

  // Infinite meadow props: deterministic per-chunk layout, sliding window around player.
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function chunkSeed(cx, cy) {
    return ((cx * 73856093) ^ (cy * 19349663) ^ 0x5B07A7E) >>> 0;
  }

  function propsForChunk(cx, cy) {
    const rand = mulberry32(chunkSeed(cx, cy));
    const list = [];
    const baseX = cx * PROP_CHUNK;
    const baseY = cy * PROP_CHUNK;
    const count = 4 + ((rand() * 5) | 0);
    for (let i = 0; i < count; i++) {
      const isTree = rand() < 0.55;
      const x = baseX + 24 + rand() * (PROP_CHUNK - 48);
      const y = baseY + 24 + rand() * (PROP_CHUNK - 48);
      // Keep origin spawn open (first ~200 px).
      if (x * x + y * y < 200 * 200) continue;
      if (isTree) {
        const variant = (rand() * treeSprites.length) | 0;
        const r = 8 + (rand() * 3) | 0;
        list.push({
          kind: 'tree', x, y, r, cx, cy,
          spr: treeSprites[variant],
          ox: treeSprites[variant].width / 2,
          oy: treeSprites[variant].height - 2,
        });
      } else {
        const variant = (rand() * bushSprites.length) | 0;
        const r = 6 + (rand() * 2) | 0;
        list.push({
          kind: 'bush', x, y, r, cx, cy,
          spr: bushSprites[variant],
          ox: bushSprites[variant].width / 2,
          oy: bushSprites[variant].height - 2,
        });
      }
    }
    return list;
  }

  let propChunkCX = null, propChunkCY = null;
  function refreshPropsAround(px, py, force) {
    const cx = Math.floor(px / PROP_CHUNK);
    const cy = Math.floor(py / PROP_CHUNK);
    if (!force && propChunkCX === cx && propChunkCY === cy) return;
    propChunkCX = cx;
    propChunkCY = cy;
    const list = [];
    const k = PROP_KEEP_CHUNKS;
    for (let dy = -k; dy <= k; dy++) {
      for (let dx = -k; dx <= k; dx++) {
        list.push(...propsForChunk(cx + dx, cy + dy));
      }
    }
    obstacles = list;
  }
  refreshPropsAround(0, 0, true);

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

  function startGame(mode) {
    if (mode === 'survival' || mode === 'timed') playMode = mode;
    try { localStorage.setItem('slimeBarrageMode', playMode); } catch (_) {}
    player = resetPlayer();
    enemies = [];
    projectiles = [];
    gems = [];
    particles = [];
    dmgNums = [];
    lasers = [];
    timeAlive = 0;
    spawnTimer = 0.5;
    killCount = 0;
    flashHurt = 0;
    bossSpawned = false;
    bossAlive = false;
    wipeCd = 0;
    propChunkCX = null;
    propChunkCY = null;
    refreshPropsAround(player.x, player.y, true);
    cam.x = player.x - viewWorldW() / 2;
    cam.y = player.y - viewWorldH() / 2;
    resetStick();
    AudioFX.setBgmDucked(false);
    AudioFX.setBgmTrack('calm', false);
    state = 'PLAYING';
    showOnly('hud');
    syncHud();
    highlightModeButtons();
    for (let i = 0; i < 8; i++) spawnSlime(true);
    AudioFX.startBgm(true);
  }

  function highlightModeButtons() {
    if (el.playSurvivalBtn) el.playSurvivalBtn.classList.toggle('selected', playMode === 'survival');
    if (el.playTimedBtn) el.playTimedBtn.classList.toggle('selected', playMode === 'timed');
  }

  function goMenu() {
    AudioFX.setBgmDucked(false);
    AudioFX.setBgmTrack('calm', false);
    AudioFX.stopBgm(true);
    bossAlive = false;
    resetStick();
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
    if (playMode === 'survival') {
      el.timer.textContent = formatTime(timeAlive);
      el.timer.title = 'Time survived';
    } else {
      const remain = Math.max(0, WIN_TIME_TIMED - timeAlive);
      el.timer.textContent = formatTime(remain);
      el.timer.title = 'Time remaining';
    }
    el.kills.textContent = 'Kills ' + killCount;
    syncWipeBtn();
  }

  function syncWipeBtn() {
    if (!el.wipeBtn) return;
    const ready = wipeCd <= 0;
    el.wipeBtn.classList.toggle('ready', ready);
    el.wipeBtn.classList.toggle('cooling', !ready);
    el.wipeBtn.disabled = !ready || (state !== 'PLAYING' && state !== 'LEVELUP' && state !== 'PAUSED');
    if (el.wipeCd) {
      el.wipeCd.textContent = ready ? 'READY' : formatTime(Math.ceil(wipeCd));
    }
    el.wipeBtn.setAttribute('aria-label', ready ? 'Wipe all mobs' : 'Wipe cooldown ' + formatTime(Math.ceil(wipeCd)));
  }

  // ---------- Spawning ----------
  function difficultyScale() {
    // Survival ramps harder; Timed stays closer to the classic mild curve.
    if (playMode === 'survival') {
      return 1 + timeAlive / 160 + Math.max(0, timeAlive - 300) / 220;
    }
    return 1 + timeAlive / 420;
  }

  function spawnSlime(far = false) {
    const colors = ['mint', 'pink', 'yellow', 'purple'];
    const t = timeAlive;
    const scale = difficultyScale();
    const eliteChance = playMode === 'survival'
      ? 0.06 + Math.min(0.14, t / 420)
      : 0.06 + Math.min(0.08, t / 600);
    const isKing = t > 45 && Math.random() < eliteChance;
    const color = isKing ? 'king' : colors[(Math.random() * colors.length) | 0];
    const ang = Math.random() * Math.PI * 2;
    const dist = far ? 220 + Math.random() * 180 : 280 + Math.random() * 220;
    let x = player.x + Math.cos(ang) * dist;
    let y = player.y + Math.sin(ang) * dist;
    const spawnR = isKing ? 16 : 10;
    for (let tries = 0; tries < 8 && overlapsObstacle(x, y, spawnR); tries++) {
      const a2 = Math.random() * Math.PI * 2;
      const d2 = dist + tries * 24;
      x = player.x + Math.cos(a2) * d2;
      y = player.y + Math.sin(a2) * d2;
    }

    const baseHp = (isKing ? 80 + t * 0.6 : 18 + t * 0.35) * scale;
    const baseSpd = (isKing ? 38 : 48 + Math.min(40, t * 0.15)) * (1 + (scale - 1) * 0.35);
    const dmg = (isKing ? 18 : 8 + Math.min(10, t * 0.04)) * (1 + (scale - 1) * 0.45);
    const spd = baseSpd + Math.random() * 10;

    enemies.push({
      x, y,
      r: isKing ? 16 : 10,
      color,
      hp: baseHp, maxHp: baseHp,
      baseSpeed: spd,
      speed: spd * mobSpeedMul(),
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

  function spawnMonarchBoss() {
    const ang = Math.random() * Math.PI * 2;
    const dist = 280 + Math.random() * 90;
    let x = player.x + Math.cos(ang) * dist;
    let y = player.y + Math.sin(ang) * dist;
    const spawnR = 48;
    for (let tries = 0; tries < 10 && overlapsObstacle(x, y, spawnR); tries++) {
      const a2 = Math.random() * Math.PI * 2;
      const d2 = dist + tries * 30;
      x = player.x + Math.cos(a2) * d2;
      y = player.y + Math.sin(a2) * d2;
    }
    // Tougher + larger Pink-Mint Monarch (v0.9).
    const scale = difficultyScale();
    const hp = (2200 + timeAlive * 4.5) * (playMode === 'survival' ? scale : 1);
    const bossSpd = 26 + Math.random() * 4;
    enemies.push({
      x, y,
      r: 48,
      color: 'monarch',
      hp, maxHp: hp,
      baseSpeed: bossSpd,
      speed: bossSpd * mobSpeedMul(),
      damage: 34,
      frame: 0,
      frameT: 0,
      xp: 55,
      isKing: false,
      isBoss: true,
    });
    bossAlive = true;
    AudioFX.setBgmTrack('nightfall', true);
    addParticles(x, y, '#f5a0c0', 22);
    addParticles(x, y - 24, '#e8c84a', 12);
  }

  function spawnDmgNum(x, y, amount) {
    const n = Math.round(amount);
    if (n <= 0) return;
    dmgNums.push({
      x: x + (Math.random() * 10 - 5),
      y: y - 6,
      text: String(n),
      life: 0.75,
      maxLife: 0.75,
      vy: -38 - Math.random() * 12,
    });
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
    const count = Math.min(MULTISHOT_MAX, player.multishot);
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

  function dropGem(x, y, value, tier = 'blue') {
    const size = tier === 'gold' ? 14 : (tier === 'purple' ? 12 : 8);
    gems.push({
      x, y, value, tier, size,
      bob: Math.random() * Math.PI * 2,
    });
  }

  /** XP gem tiers: blue (+10% normals), purple (kings), gold×3 (Monarch). */
  function dropGemsForEnemy(e) {
    if (e.isBoss) {
      // Triple gold — largest XP dump in the game (~50 each = 150 total).
      const each = 50;
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + Math.random() * 0.4;
        dropGem(e.x + Math.cos(a) * 18, e.y + Math.sin(a) * 14, each, 'gold');
      }
      return;
    }
    if (e.isKing) {
      // Purple: ~2.5× a blue of similar tier (blue≈2–3 → purple≈22–30).
      const val = Math.max(22, Math.round((e.xp || 12) * 2.2));
      dropGem(e.x, e.y, val, 'purple');
      return;
    }
    const base = e.xp || 2;
    const val = Math.max(2, Math.round(base * 1.1));
    dropGem(e.x, e.y, val, 'blue');
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
    let pool = UPGRADE_DEFS.slice();
    if (player.multishot >= MULTISHOT_MAX) pool = pool.filter(u => u.id !== 'multi');
    if ((player.laserLevel || 0) >= LASER_MAX_LEVEL) pool = pool.filter(u => u.id !== 'laser');
    if ((player.omniLevel || 0) >= OMNI_MAX_LEVEL) pool = pool.filter(u => u.id !== 'omni');
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    upgradeChoices = pool.slice(0, Math.min(3, pool.length));
    state = 'LEVELUP';
    AudioFX.levelUp();
    el.levelupTitle.textContent = 'LEVEL UP!  Lv ' + player.level;
    el.cards.innerHTML = '';
    upgradeChoices.forEach((u, i) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'card' + (u.special ? ' card-special' : '');
      card.innerHTML =
        '<span class="card-num">' + (i + 1) + (u.special ? ' ★' : '') + '</span>' +
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

  // ---------- Ranking (local device boards; online-ready shape) ----------
  const LB_KEYS = {
    survival: 'slimeBarrageLbSurvival',
    timed: 'slimeBarrageLbTimed',
  };
  const LB_MAX = 10;

  function computeScore(mode, kills, time, level) {
    // Timed: kills/time/level blend. Survival: emphasize time survived + kills.
    if (mode === 'survival') {
      return Math.floor(timeAlive) * 5 + kills * 12 + level * 20;
    }
    return kills * 10 + Math.floor(time) * 2 + level * 25;
  }

  function loadBoard(mode) {
    try {
      const raw = localStorage.getItem(LB_KEYS[mode]);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function saveBoard(mode, arr) {
    try { localStorage.setItem(LB_KEYS[mode], JSON.stringify(arr.slice(0, LB_MAX))); } catch (_) {}
  }

  function getPlayerName() {
    return (playerName || '').trim() || 'Player';
  }

  function ensurePlayerName() {
    let n = (playerName || '').trim();
    if (!n) {
      try {
        n = (window.prompt('Enter your name for rankings:', 'Player') || '').trim();
      } catch (_) { n = ''; }
      if (!n) n = 'Player';
      playerName = n.slice(0, 16);
      try { localStorage.setItem('slimeBarragePlayerName', playerName); } catch (_) {}
      if (el.rankNameInput) el.rankNameInput.value = playerName;
    }
    return playerName;
  }

  function submitScore(mode, score, meta) {
    const name = ensurePlayerName();
    const entry = {
      name,
      score,
      kills: meta.kills | 0,
      time: meta.time || 0,
      level: meta.level | 0,
      at: Date.now(),
    };
    const board = loadBoard(mode);
    board.push(entry);
    board.sort((a, b) => b.score - a.score || b.time - a.time);
    saveBoard(mode, board);
    return { name, score, rank: board.findIndex(e => e === board.find(x => x.at === entry.at && x.score === entry.score)) + 1 };
  }

  function renderRankList(elList, mode) {
    if (!elList) return;
    const board = loadBoard(mode);
    if (!board.length) {
      elList.innerHTML = '<li class="rank-empty">No scores yet</li>';
      return;
    }
    elList.innerHTML = board.slice(0, LB_MAX).map((e, i) =>
      '<li><span class="rank-i">' + (i + 1) + '</span>' +
      '<span class="rank-name">' + escapeHtml(e.name) + '</span>' +
      '<span class="rank-score">' + e.score + '</span></li>'
    ).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
  }

  function refreshRanksUI() {
    renderRankList(el.rankSurvivalList, 'survival');
    renderRankList(el.rankTimedList, 'timed');
    if (el.rankNameInput && playerName) el.rankNameInput.value = playerName;
  }

  function openRanks() {
    AudioFX.click();
    refreshRanksUI();
    state = 'MENU';
    showOnly('ranks');
  }

  function showEnd(won) {
    state = won ? 'WIN' : 'GAMEOVER';
    AudioFX.stopBgm(true);
    if (won) AudioFX.win(); else AudioFX.death();
    const modeLabel = playMode === 'survival' ? 'Survival' : 'Timed';
    if (won) {
      el.endTitle.textContent = 'YOU SURVIVED!';
    } else if (playMode === 'survival') {
      el.endTitle.textContent = 'RUN ENDED';
    } else {
      el.endTitle.textContent = 'GAME OVER';
    }
    el.endTitle.className = 'panel-title ' + (won ? 'win' : 'lose');
    const score = computeScore(playMode, killCount, timeAlive, player.level);
    let bestLine = '';
    if (playMode === 'survival') {
      if (timeAlive > bestSurvival) {
        bestSurvival = timeAlive;
        try { localStorage.setItem('slimeBarrageBestSurvival', String(bestSurvival)); } catch (_) {}
      }
      bestLine = '<div>Best  ' + formatTime(bestSurvival) + '</div>';
    }
    const submitted = submitScore(playMode, score, {
      kills: killCount, time: timeAlive, level: player.level,
    });
    const formula = playMode === 'survival'
      ? 'Score = time×5 + kills×12 + lv×20'
      : 'Score = kills×10 + time×2 + lv×25';
    el.endStats.innerHTML =
      '<div>Mode  ' + modeLabel + '</div>' +
      '<div>Time  ' + formatTime(timeAlive) + '</div>' +
      bestLine +
      '<div>Kills  ' + killCount + '</div>' +
      '<div>Level  ' + player.level + '</div>' +
      '<div class="score">Score  ' + score + '</div>' +
      '<div class="rank-submit">Local rank #' + submitted.rank + ' · ' + escapeHtml(submitted.name) + '</div>' +
      '<div class="rank-formula">' + formula + ' · local device board</div>';
    if (el.endRankNote) {
      el.endRankNote.textContent = 'Saved to local ' + modeLabel + ' ranks (top 10).';
    }
    showOnly('end');
    syncHud();
  }

  // ---------- Update ----------
  function nearestEnemyAng() {
    let best = null, bestD = Infinity;
    for (const e of enemies) {
      const d = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    if (!best) return player.facing >= 0 ? 0 : Math.PI;
    return Math.atan2(best.y - player.y, best.x - player.x);
  }

  function beamHitscan(ox, oy, ang, len, dmg, hitR, sparkCol) {
    for (const e of enemies) {
      const dx = e.x - ox, dy = e.y - oy;
      const proj = dx * Math.cos(ang) + dy * Math.sin(ang);
      if (proj < 0 || proj > len) continue;
      const px = ox + Math.cos(ang) * proj;
      const py = oy + Math.sin(ang) * proj;
      const hx = e.x - px, hy = e.y - py;
      if (hx * hx + hy * hy < (e.r + hitR) ** 2) {
        e.hp -= dmg;
        spawnDmgNum(e.x, e.y - e.r, dmg);
        addParticles(e.x, e.y, sparkCol, 4);
      }
    }
  }

  function firePulseLaser() {
    const ang = nearestEnemyAng();
    player.laserAng = ang;
    player.facing = Math.cos(ang) >= 0 ? 1 : -1;
    const gold = (player.laserLevel || 0) >= LASER_MAX_LEVEL;
    const len = 220 + player.laserLevel * 18 + (gold ? 30 : 0);
    const dmg = player.laserDamage;
    lasers.push({
      x: player.x, y: player.y - 4,
      ang, len, life: gold ? 0.28 : 0.22, maxLife: gold ? 0.28 : 0.22,
      damage: dmg, width: 5 + player.laserLevel + (gold ? 2 : 0),
      gold, omni: false,
    });
    beamHitscan(player.x, player.y - 4, ang, len, dmg, gold ? 10 : 8, gold ? '#ffe8a0' : '#7cf0ff');
    AudioFX.shoot();
    addParticles(
      player.x + Math.cos(ang) * 20,
      player.y + Math.sin(ang) * 20,
      gold ? '#ffe060' : '#a0f0ff',
      gold ? 10 : 6
    );
    if (gold) {
      for (let i = 0; i < 6; i++) {
        const a = ang + (Math.random() - 0.5) * 0.5;
        const d = 30 + Math.random() * len * 0.6;
        addParticles(player.x + Math.cos(a) * d, player.y - 4 + Math.sin(a) * d, '#fff8d0', 2);
      }
    }
  }

  function fireOmniBeam() {
    const n = player.omniRays || 8;
    const len = 160 + (player.omniLevel || 1) * 20;
    const dmg = player.omniDamage;
    const ox = player.x, oy = player.y - 4;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + (player.orbitAngle || 0) * 0.15;
      lasers.push({
        x: ox, y: oy, ang, len,
        life: 0.2, maxLife: 0.2,
        damage: dmg, width: 4 + (player.omniLevel || 1),
        gold: false, omni: true,
      });
      beamHitscan(ox, oy, ang, len, dmg, 7, '#e0a0ff');
    }
    AudioFX.shoot();
    addParticles(ox, oy, '#d080ff', 14);
  }

  /** Wipe skill: clear all non-boss mobs; award XP gems for fairness. Boss stays. */
  function activateWipe() {
    if (state !== 'PLAYING' || wipeCd > 0) return;
    if (!enemies.length) {
      wipeCd = WIPE_COOLDOWN;
      syncWipeBtn();
      return;
    }
    const doomed = [];
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.isBoss) continue;
      doomed.push(e);
      enemies.splice(i, 1);
    }
    for (const e of doomed) {
      dropGemsForEnemy(e);
      const palKey = e.color === 'king' ? 'mint' : e.color;
      addParticles(e.x, e.y, (slimePalettes[palKey] || slimePalettes.mint).mid, 6);
      killCount++;
    }
    if (doomed.length) {
      addParticles(player.x, player.y, '#ffe8f0', 18);
      AudioFX.kill();
      AudioFX.levelUp();
    }
    wipeCd = WIPE_COOLDOWN;
    syncWipeBtn();
    syncHud();
  }

  function updateOrbitOrbs(dt) {
    if (!player.orbitOrbs) return;
    player.orbitAngle = (player.orbitAngle || 0) + dt * 2.6;
    const n = player.orbitOrbs;
    const rad = player.orbitRadius || 44;
    for (let i = 0; i < n; i++) {
      const a = player.orbitAngle + (i / n) * Math.PI * 2;
      const ox = player.x + Math.cos(a) * rad;
      const oy = player.y + Math.sin(a) * rad;
      for (const e of enemies) {
        const dx = e.x - ox, dy = e.y - oy;
        if (dx * dx + dy * dy < (e.r + 9) ** 2) {
          const tick = 18 + player.level * 0.6;
          // soft per-frame damage; throttle via orbHit timer on enemy
          if (!e._orbHit || e._orbHit <= 0) {
            e.hp -= tick;
            e._orbHit = 0.18;
            spawnDmgNum(e.x, e.y - e.r, tick);
            addParticles(ox, oy, '#c4b0e8', 3);
            AudioFX.hit();
          }
        }
      }
    }
    for (const e of enemies) {
      if (e._orbHit > 0) e._orbHit -= dt;
    }
  }

  function cleanupFarEntities() {
    const lim2 = CLEANUP_DIST * CLEANUP_DIST;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.isBoss) continue;
      const dx = e.x - player.x, dy = e.y - player.y;
      if (dx * dx + dy * dy > lim2) enemies.splice(i, 1);
    }
    for (let i = gems.length - 1; i >= 0; i--) {
      const g = gems[i];
      const dx = g.x - player.x, dy = g.y - player.y;
      if (dx * dx + dy * dy > lim2) gems.splice(i, 1);
    }
  }

  function update(dt) {
    animT += dt;
    menuPulse += dt;
    if (state === 'MENU' || state === 'LEVELUP' || state === 'PAUSED' || state === 'GAMEOVER' || state === 'WIN') return;

    timeAlive += dt;
    if (flashHurt > 0) flashHurt -= dt;
    if (player.invuln > 0) player.invuln -= dt;

    if (playMode === 'timed' && timeAlive >= WIN_TIME_TIMED) {
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
    // Infinite map: no world-edge clamps — only local prop collision.
    resolveObstacleCircle(player, 7);
    refreshPropsAround(player.x, player.y, false);

    const vw = viewWorldW(), vh = viewWorldH();
    cam.x = player.x - vw / 2;
    cam.y = player.y - vh / 2;
    // Camera follows freely (no finite WORLD clamp).

    player.fireCd -= dt;
    if (player.fireCd <= 0) {
      fireAtNearest();
      player.fireCd = player.fireCdMax;
    }

    // Pulse Laser: telegraph then beam (interval from laserCdMax: 2.0→0.75)
    if (player.laserLevel > 0) {
      if (player.laserTelegraph > 0) {
        player.laserTelegraph -= dt;
        player.laserAng = nearestEnemyAng();
        if (player.laserTelegraph <= 0) {
          firePulseLaser();
          player.laserCd = player.laserCdMax;
        }
      } else {
        player.laserCd -= dt;
        if (player.laserCd <= 0) {
          player.laserTelegraph = 0.35;
          player.laserAng = nearestEnemyAng();
        }
      }
    }
    // Omni Beam: brief telegraph then 8/12-way burst
    if (player.omniLevel > 0) {
      if (player.omniTelegraph > 0) {
        player.omniTelegraph -= dt;
        if (player.omniTelegraph <= 0) {
          fireOmniBeam();
          player.omniCd = player.omniCdMax;
        }
      } else {
        player.omniCd -= dt;
        if (player.omniCd <= 0) {
          player.omniTelegraph = 0.28;
        }
      }
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
      lasers[i].life -= dt;
      if (lasers[i].life <= 0) lasers.splice(i, 1);
    }
    if (wipeCd > 0) {
      wipeCd = Math.max(0, wipeCd - dt);
    }
    updateOrbitOrbs(dt);

    if (!bossSpawned && timeAlive >= BOSS_SPAWN_AT) {
      bossSpawned = true;
      spawnMonarchBoss();
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const scale = difficultyScale();
      const density = 1 + Math.floor(timeAlive / (playMode === 'survival' ? 14 : 20));
      const n = Math.min(playMode === 'survival' ? 8 : 6, density + (Math.random() * 2) | 0);
      spawnBurst(n);
      const baseInt = playMode === 'survival' ? 1.55 : 1.8;
      const ramp = playMode === 'survival' ? 0.012 : 0.008;
      const interval = Math.max(playMode === 'survival' ? 0.38 : 0.55, baseInt - timeAlive * ramp) / Math.min(1.6, scale);
      spawnTimer = interval;
      cleanupFarEntities();
      const cap = playMode === 'survival' ? 140 : 120;
      if (enemies.length > cap) {
        // Prefer dropping non-boss fodder so the Monarch is never culled.
        let need = enemies.length - cap;
        for (let i = 0; i < enemies.length && need > 0; ) {
          if (enemies[i].isBoss) { i++; continue; }
          enemies.splice(i, 1);
          need--;
        }
      }
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
          spawnDmgNum(e.x, e.y - e.r, p.damage);
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
        const wasBoss = !!e.isBoss;
        dropGemsForEnemy(e);
        const palKey = e.color === 'king' ? 'mint' : (e.color === 'monarch' ? 'pink' : e.color);
        addParticles(e.x, e.y, slimePalettes[palKey].mid, wasBoss ? 22 : 10);
        if (wasBoss) {
          addParticles(e.x, e.y - 16, '#e8c84a', 14);
          addParticles(e.x, e.y, '#7dcea0', 12);
          bossAlive = false;
          AudioFX.setBgmTrack('calm', true);
        }
        enemies.splice(i, 1);
        killCount++;
        AudioFX.kill();
        continue;
      }

      const dx = player.x - e.x, dy = player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const spd = (e.baseSpeed != null ? e.baseSpeed : e.speed) * mobSpeedMul();
      e.speed = spd;
      e.x += (dx / d) * spd * dt;
      e.y += (dy / d) * spd * dt;
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

    for (let i = dmgNums.length - 1; i >= 0; i--) {
      const d = dmgNums[i];
      d.y += d.vy * dt;
      d.life -= dt;
      if (d.life <= 0) dmgNums.splice(i, 1);
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
      if (e.isBoss || e.isKing || e.hp < e.maxHp) {
        const bw = e.isBoss ? 42 : (e.isKing ? 22 : 14);
        const bh = e.isBoss ? 5 : 3;
        const by = s.y - oy - (e.isBoss ? 8 : 5);
        ctx.fillStyle = '#1a1020';
        ctx.fillRect(s.x - bw / 2, by, bw, bh);
        ctx.fillStyle = e.isBoss ? '#f5a0c0' : (e.isKing ? '#e8c84a' : '#7dcea0');
        ctx.fillRect(s.x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), bh);
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
    if (s.x < -80 || s.y < -80 || s.x > W + 80 || s.y > H + 80) return;
    const frames = slimeFrames[e.color] || slimeFrames.mint;
    const fr = frames[e.frame % frames.length];
    const ox = fr.width / 2;
    const oy = fr.height - 2;
    blit(ctx, fr, s.x - ox, s.y - oy);
    if (e.isBoss || e.isKing || e.hp < e.maxHp) {
      const bw = e.isBoss ? 56 : (e.isKing ? 22 : 14);
      const bh = e.isBoss ? 5 : 3;
      const by = s.y - oy - (e.isBoss ? 10 : 5);
      ctx.fillStyle = '#1a1020';
      ctx.fillRect(s.x - bw / 2, by, bw, bh);
      ctx.fillStyle = e.isBoss ? '#f5a0c0' : (e.isKing ? '#e8c84a' : '#7dcea0');
      ctx.fillRect(s.x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), bh);
      if (e.isBoss) {
        ctx.fillStyle = 'rgba(255,232,240,0.85)';
        ctx.font = 'bold 8px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Monarch', s.x, by - 5);
      }
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


  function drawOrbitAndLaser() {
    if (player && player.orbitOrbs > 0) {
      const n = player.orbitOrbs;
      const rad = player.orbitRadius || 44;
      for (let i = 0; i < n; i++) {
        const a = (player.orbitAngle || 0) + (i / n) * Math.PI * 2;
        const wx = player.x + Math.cos(a) * rad;
        const wy = player.y + Math.sin(a) * rad;
        const s = worldToScreen(wx, wy);
        ctx.beginPath();
        ctx.fillStyle = '#c4b0e8';
        ctx.arc(s.x, s.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x - 1, s.y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(160,120,220,0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (player && player.laserTelegraph > 0) {
      const ang = player.laserAng || 0;
      const gold = (player.laserLevel || 0) >= LASER_MAX_LEVEL;
      const len = 200;
      const s0 = worldToScreen(player.x, player.y - 4);
      const s1 = worldToScreen(player.x + Math.cos(ang) * len, player.y - 4 + Math.sin(ang) * len);
      ctx.save();
      ctx.strokeStyle = gold ? 'rgba(255, 220, 100, 0.65)' : 'rgba(255, 120, 160, 0.55)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(s0.x, s0.y);
      ctx.lineTo(s1.x, s1.y);
      ctx.stroke();
      ctx.restore();
    }
    if (player && player.omniTelegraph > 0) {
      const n = player.omniRays || 8;
      const s0 = worldToScreen(player.x, player.y - 4);
      ctx.save();
      ctx.strokeStyle = 'rgba(220, 140, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2;
        const s1 = worldToScreen(player.x + Math.cos(ang) * 70, player.y - 4 + Math.sin(ang) * 70);
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(s1.x, s1.y);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const L of lasers) {
      const s0 = worldToScreen(L.x, L.y);
      const s1 = worldToScreen(L.x + Math.cos(L.ang) * L.len, L.y + Math.sin(L.ang) * L.len);
      const a = Math.max(0, L.life / L.maxLife);
      ctx.save();
      ctx.lineCap = 'round';
      if (L.gold) {
        ctx.strokeStyle = `rgba(255, 200, 60, ${0.3 + a * 0.55})`;
        ctx.lineWidth = L.width + 6;
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
        ctx.strokeStyle = `rgba(255, 248, 200, ${0.55 + a * 0.45})`;
        ctx.lineWidth = Math.max(2, L.width * 0.5);
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
        // sparkle ticks along beam
        for (let k = 0; k < 5; k++) {
          const t = (k + 1) / 6;
          const sx = s0.x + (s1.x - s0.x) * t;
          const sy = s0.y + (s1.y - s0.y) * t;
          ctx.fillStyle = `rgba(255,255,240,${0.4 + a * 0.5})`;
          ctx.fillRect(sx - 1, sy - 1, 2, 2);
        }
      } else if (L.omni) {
        ctx.strokeStyle = `rgba(200, 100, 255, ${0.3 + a * 0.5})`;
        ctx.lineWidth = L.width + 3;
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
        ctx.strokeStyle = `rgba(255, 220, 255, ${0.45 + a * 0.5})`;
        ctx.lineWidth = Math.max(1.5, L.width * 0.4);
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
      } else {
        ctx.strokeStyle = `rgba(120, 230, 255, ${0.35 + a * 0.55})`;
        ctx.lineWidth = L.width + 4;
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + a * 0.5})`;
        ctx.lineWidth = Math.max(2, L.width * 0.45);
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
      }
      ctx.restore();
    }
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
      const spr = g.tier === 'gold' ? gemSpriteGold
        : (g.tier === 'purple' ? gemSpritePurple : gemSpriteBlue);
      const half = spr.width / 2;
      blit(ctx, spr, s.x - half, s.y - half);
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

  function drawDmgNums() {
    ctx.save();
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const d of dmgNums) {
      const s = worldToScreen(d.x, d.y);
      const a = Math.max(0, Math.min(1, d.life / d.maxLife));
      ctx.globalAlpha = a * 0.75;
      ctx.fillStyle = 'rgba(20, 12, 28, 0.35)';
      ctx.fillText(d.text, s.x + 1, s.y + 1);
      ctx.fillStyle = '#ffe8f0';
      ctx.fillText(d.text, s.x, s.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
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
        drawOrbitAndLaser();
        drawProjectiles(); // sparks pass through foliage; drawn above for readability
        drawParticles();
        drawDmgNums();
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
  highlightModeButtons();

  window.__slimeBarrage = {
    startGame,
    goMenu,
    getState: () => state,
    getCanvas: () => canvas,
    get VERSION() { return VERSION; },
    get VIEW_ZOOM() { return VIEW_ZOOM; },
    get playMode() { return playMode; },
    BOSS_SPAWN_AT,
    WIN_TIME_TIMED,
    MULTISHOT_MAX,
    togglePause,
    spawnMonarchBoss,
    forcePlaySeconds: (sec, mode) => {
      startGame(mode || playMode);
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
      if (sec >= BOSS_SPAWN_AT && !bossSpawned) {
        bossSpawned = true;
        spawnMonarchBoss();
      }
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
    getDebug: () => player ? ({
      x: player.x, y: player.y,
      multishot: player.multishot,
      orbitOrbs: player.orbitOrbs,
      laserLevel: player.laserLevel,
      mode: playMode,
      timeAlive,
      enemies: enemies.length,
      boss: enemies.find(e => e.isBoss) ? { r: enemies.find(e => e.isBoss).r, hp: enemies.find(e => e.isBoss).hp, dmg: enemies.find(e => e.isBoss).damage } : null,
      cam: { x: cam.x, y: cam.y },
      zoom: VIEW_ZOOM,
      obstacles: obstacles.length,
    }) : null,
    applyUpgradeId: (id) => {
      const u = UPGRADE_DEFS.find(d => d.id === id);
      if (u && player) u.apply(player);
    },
    setPlayerPos: (x, y) => {
      if (!player) return;
      player.x = x; player.y = y;
      refreshPropsAround(x, y, true);
      cam.x = player.x - viewWorldW() / 2;
      cam.y = player.y - viewWorldH() / 2;
    },
    offerLevelUp,
  };
})();
