/**
 * Slime Barrage v0.1
 * Original IP — casual pink-hair hoodie girl vs cute colorful slimes.
 * Vanilla Canvas 2D auto-survivor.
 */
(() => {
  'use strict';

  // ---------- Config ----------
  const W = 480, H = 270;
  const WORLD_W = 2400, WORLD_H = 2400;
  const PIXEL = 1;
  const WIN_TIME = 180; // 3 minutes
  const VERSION = 'v0.1';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Scale canvas to integer multiple of internal res
  function fitCanvas() {
    const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
    canvas.style.width = (W * scale) + 'px';
    canvas.style.height = (H * scale) + 'px';
  }
  window.addEventListener('resize', fitCanvas);
  fitCanvas();

  // ---------- Input ----------
  const keys = Object.create(null);
  const touchPad = document.getElementById('touchPad');
  const stickKnob = document.getElementById('stickKnob');
  let touchVec = { x: 0, y: 0 };
  let touchActive = false;

  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    if (state === 'MENU' && (e.code === 'Enter' || e.code === 'Space')) startGame();
    if ((state === 'GAMEOVER' || state === 'WIN') && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyR')) goMenu();
    if (state === 'LEVELUP') {
      if (e.code === 'Digit1' || e.code === 'Numpad1') pickUpgrade(0);
      if (e.code === 'Digit2' || e.code === 'Numpad2') pickUpgrade(1);
      if (e.code === 'Digit3' || e.code === 'Numpad3') pickUpgrade(2);
    }
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  // Detect touch devices
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

  // Mouse click for menus / upgrades
  canvas.addEventListener('pointerdown', e => {
    const rect = canvas.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    const sy = (e.clientY - rect.top) * (H / rect.height);
    handleClick(sx, sy);
  });

  // ---------- Pixel sprite helpers ----------
  function makeSprite(w, h, drawFn) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    drawFn(g, w, h);
    return c;
  }
  function px(g, x, y, col, s = 1) {
    g.fillStyle = col;
    g.fillRect(x, y, s, s);
  }
  function fillRect(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  }

  // Hero: pink bob, lavender hoodie, denim shorts, white sneakers (front + side)
  function drawHeroFront(g) {
    // backpack
    fillRect(g, 3, 10, 3, 8, '#6b4f9a');
    fillRect(g, 14, 10, 3, 8, '#6b4f9a');
    // legs / denim
    fillRect(g, 6, 18, 3, 5, '#3a4a78');
    fillRect(g, 11, 18, 3, 5, '#3a4a78');
    // fray holes
    px(g, 7, 20, '#c8d4f0'); px(g, 12, 19, '#c8d4f0');
    // socks
    fillRect(g, 6, 23, 3, 2, '#f5f5f5');
    fillRect(g, 11, 23, 3, 2, '#f5f5f5');
    // sneakers
    fillRect(g, 5, 25, 4, 2, '#ffffff');
    fillRect(g, 10, 25, 4, 2, '#ffffff');
    px(g, 5, 25, '#f7a8c8'); px(g, 10, 25, '#f7a8c8');
    // hoodie body
    fillRect(g, 5, 10, 10, 9, '#c4b0e8');
    fillRect(g, 6, 14, 8, 4, '#b39ddb'); // pocket
    // drawstrings
    px(g, 8, 11, '#ffffff'); px(g, 8, 12, '#ffffff');
    px(g, 11, 11, '#ffffff'); px(g, 11, 12, '#ffffff');
    // arms
    fillRect(g, 3, 11, 2, 6, '#c4b0e8');
    fillRect(g, 15, 11, 2, 6, '#c4b0e8');
    // hands
    fillRect(g, 3, 16, 2, 2, '#f0c4b0');
    fillRect(g, 15, 16, 2, 2, '#f0c4b0');
    // neck
    fillRect(g, 8, 8, 4, 2, '#f0c4b0');
    // head
    fillRect(g, 6, 2, 8, 7, '#f0c4b0');
    // pink hair bob
    fillRect(g, 5, 1, 10, 4, '#f7a0c0');
    fillRect(g, 4, 3, 2, 5, '#f7a0c0');
    fillRect(g, 14, 3, 2, 5, '#f7a0c0');
    // white tips
    fillRect(g, 4, 7, 2, 1, '#ffe8f0');
    fillRect(g, 14, 7, 2, 1, '#ffe8f0');
    fillRect(g, 6, 1, 2, 1, '#ffe8f0');
    // bangs
    fillRect(g, 7, 3, 2, 2, '#f7a0c0');
    fillRect(g, 11, 3, 2, 2, '#f7a0c0');
    // x clip
    px(g, 14, 3, '#ffffff'); px(g, 15, 4, '#ffffff');
    px(g, 15, 3, '#ffffff'); px(g, 14, 4, '#ffffff');
    // eyes (purple)
    fillRect(g, 7, 5, 2, 2, '#7b4fb8');
    fillRect(g, 11, 5, 2, 2, '#7b4fb8');
    px(g, 7, 5, '#ffffff'); px(g, 11, 5, '#ffffff');
    // smile
    px(g, 9, 8, '#d08090'); px(g, 10, 8, '#d08090');
  }

  function drawHeroSide(g) {
    // backpack
    fillRect(g, 4, 10, 5, 8, '#6b4f9a');
    // denim
    fillRect(g, 9, 18, 4, 5, '#3a4a78');
    px(g, 10, 20, '#c8d4f0');
    fillRect(g, 9, 23, 4, 2, '#f5f5f5');
    fillRect(g, 8, 25, 5, 2, '#ffffff');
    px(g, 8, 25, '#f7a8c8');
    // hoodie
    fillRect(g, 7, 10, 8, 9, '#c4b0e8');
    fillRect(g, 8, 14, 5, 3, '#b39ddb');
    // arm forward
    fillRect(g, 13, 12, 4, 2, '#c4b0e8');
    fillRect(g, 16, 12, 2, 2, '#f0c4b0');
    // head
    fillRect(g, 8, 2, 7, 7, '#f0c4b0');
    fillRect(g, 7, 1, 9, 4, '#f7a0c0');
    fillRect(g, 6, 3, 2, 5, '#f7a0c0');
    fillRect(g, 6, 7, 2, 1, '#ffe8f0');
    fillRect(g, 14, 1, 2, 1, '#ffe8f0');
    // eye
    fillRect(g, 12, 5, 2, 2, '#7b4fb8');
    px(g, 12, 5, '#ffffff');
    // clip
    px(g, 7, 3, '#ffffff'); px(g, 8, 4, '#ffffff');
  }

  const heroFront = makeSprite(20, 28, (g) => drawHeroFront(g));
  const heroSide = makeSprite(20, 28, (g) => drawHeroSide(g));

  // Walking bob variants (leg offset)
  const heroWalkA = makeSprite(20, 28, (g) => {
    drawHeroFront(g);
    // shift one leg
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

  // Slime palette factory
  function makeSlimeFrames(colors, size = 16, crowned = false) {
    const frames = [];
    const stretches = [
      { sy: 0, sh: 0 },   // neutral
      { sy: -1, sh: 1 },  // stretch up
      { sy: 1, sh: -2 },  // squash
      { sy: 0, sh: 0 },
    ];
    for (const st of stretches) {
      frames.push(makeSprite(size + (crowned ? 8 : 2), size + (crowned ? 10 : 2), (g, w, h) => {
        const baseY = (crowned ? 8 : 1) + st.sy;
        const bh = size - 2 + st.sh;
        const bw = size - 2 - st.sh; // squash wider
        const bx = Math.floor((w - bw) / 2);
        // body ellipse via stacked rects
        const mid = Math.floor(bh / 2);
        for (let y = 0; y < bh; y++) {
          const t = Math.abs(y - mid) / (mid || 1);
          const inset = Math.floor(t * t * (bw / 3));
          const yy = baseY + y;
          fillRect(g, bx + inset, yy, bw - inset * 2, 1, colors.mid);
        }
        // outline-ish darker bottom
        fillRect(g, bx + 2, baseY + bh - 2, bw - 4, 2, colors.dark);
        // highlight
        fillRect(g, bx + Math.floor(bw * 0.25), baseY + 2, Math.max(2, Math.floor(bw * 0.3)), 2, colors.hi);
        // spot
        px(g, bx + Math.floor(bw * 0.6), baseY + Math.floor(bh * 0.45), colors.spot, 2);
        // face
        const eyeY = baseY + Math.floor(bh * 0.4);
        const cx = Math.floor(w / 2);
        fillRect(g, cx - 4, eyeY, 2, 2, '#1a1020');
        fillRect(g, cx + 2, eyeY, 2, 2, '#1a1020');
        // smile
        px(g, cx - 1, eyeY + 3, '#1a1020');
        px(g, cx, eyeY + 4, '#1a1020');
        px(g, cx + 1, eyeY + 3, '#1a1020');
        if (crowned) {
          // gold crown
          fillRect(g, cx - 5, 2, 10, 4, '#e8c84a');
          fillRect(g, cx - 5, 1, 2, 3, '#e8c84a');
          fillRect(g, cx - 1, 0, 2, 3, '#e8c84a');
          fillRect(g, cx + 3, 1, 2, 3, '#e8c84a');
          px(g, cx - 4, 3, '#a855f7');
          px(g, cx, 2, '#a855f7');
          px(g, cx + 4, 3, '#a855f7');
          // leafy sprouts
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

  // Projectile spark
  const projSprite = makeSprite(6, 6, (g) => {
    fillRect(g, 2, 0, 2, 6, '#ffe8a0');
    fillRect(g, 0, 2, 6, 2, '#ffe8a0');
    fillRect(g, 2, 2, 2, 2, '#ffffff');
  });

  // XP gem
  const gemSprite = makeSprite(8, 8, (g) => {
    fillRect(g, 3, 0, 2, 8, '#7cf0ff');
    fillRect(g, 0, 3, 8, 2, '#7cf0ff');
    fillRect(g, 2, 1, 4, 6, '#40d8f0');
    fillRect(g, 3, 2, 2, 4, '#e0ffff');
  });

  // ---------- Game state ----------
  let state = 'MENU'; // MENU PLAYING LEVELUP GAMEOVER WIN
  let player, enemies, projectiles, gems, particles;
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
    state = 'PLAYING';
    for (let i = 0; i < 8; i++) spawnSlime(true);
  }

  function goMenu() { state = 'MENU'; }

  function xpForLevel(lv) {
    return Math.floor(8 + (lv - 1) * 5 + Math.pow(lv, 1.35));
  }

  // ---------- Spawning ----------
  function spawnSlime(far = false) {
    const colors = ['mint', 'pink', 'yellow', 'purple'];
    const t = timeAlive;
    const isKing = t > 45 && Math.random() < 0.06 + Math.min(0.08, t / 600);
    const color = isKing ? 'king' : colors[(Math.random() * colors.length) | 0];
    const ang = Math.random() * Math.PI * 2;
    const dist = far
      ? 220 + Math.random() * 180
      : 280 + Math.random() * 220;
    let x = player.x + Math.cos(ang) * dist;
    let y = player.y + Math.sin(ang) * dist;
    x = Math.max(40, Math.min(WORLD_W - 40, x));
    y = Math.max(40, Math.min(WORLD_H - 40, y));

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
    // shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    upgradeChoices = pool.slice(0, 3);
    state = 'LEVELUP';
  }

  function pickUpgrade(i) {
    if (state !== 'LEVELUP' || !upgradeChoices[i]) return;
    upgradeChoices[i].apply(player);
    upgradeChoices = [];
    state = 'PLAYING';
  }

  function handleClick(sx, sy) {
    if (state === 'MENU') {
      // Play button approx
      if (sx > W / 2 - 50 && sx < W / 2 + 50 && sy > H / 2 + 20 && sy < H / 2 + 48) startGame();
      return;
    }
    if (state === 'LEVELUP') {
      const cardW = 120, gap = 12;
      const total = 3 * cardW + 2 * gap;
      const startX = (W - total) / 2;
      const cardY = 78;
      for (let i = 0; i < 3; i++) {
        const x = startX + i * (cardW + gap);
        if (sx >= x && sx <= x + cardW && sy >= cardY && sy <= cardY + 110) {
          pickUpgrade(i);
          return;
        }
      }
      return;
    }
    if (state === 'GAMEOVER' || state === 'WIN') {
      goMenu();
    }
  }

  // ---------- Update ----------
  function update(dt) {
    animT += dt;
    menuPulse += dt;
    if (state === 'MENU') return;
    if (state === 'LEVELUP' || state === 'GAMEOVER' || state === 'WIN') return;

    timeAlive += dt;
    if (flashHurt > 0) flashHurt -= dt;
    if (player.invuln > 0) player.invuln -= dt;

    // Win check
    if (timeAlive >= WIN_TIME) {
      state = 'WIN';
      return;
    }

    // Movement
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

    // Camera
    cam.x = player.x - W / 2;
    cam.y = player.y - H / 2;
    cam.x = Math.max(0, Math.min(WORLD_W - W, cam.x));
    cam.y = Math.max(0, Math.min(WORLD_H - H, cam.y));

    // Auto fire
    player.fireCd -= dt;
    if (player.fireCd <= 0) {
      fireAtNearest();
      player.fireCd = player.fireCdMax;
    }

    // Spawn waves — ramp up
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const density = 1 + Math.floor(timeAlive / 20);
      const n = Math.min(6, density + (Math.random() * 2) | 0);
      spawnBurst(n);
      const interval = Math.max(0.55, 1.8 - timeAlive * 0.008);
      spawnTimer = interval;
      // Cap enemies
      if (enemies.length > 120) enemies.splice(0, enemies.length - 120);
    }

    // Projectiles
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
          if (p.pierce <= 0) { projectiles.splice(i, 1); break; }
          p.pierce--;
        }
      }
    }

    // Enemies chase + contact
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.frameT += dt;
      if (e.frameT > 0.18) { e.frameT = 0; e.frame = (e.frame + 1) % 4; }

      if (e.hp <= 0) {
        dropGem(e.x, e.y, e.xp);
        addParticles(e.x, e.y, slimePalettes[e.color === 'king' ? 'mint' : e.color].mid, 10);
        enemies.splice(i, 1);
        killCount++;
        continue;
      }

      const dx = player.x - e.x, dy = player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.x += (dx / d) * e.speed * dt;
      e.y += (dy / d) * e.speed * dt;

      // Contact damage
      if (d < e.r + 8 && player.invuln <= 0) {
        player.hp -= e.damage;
        player.invuln = 0.7;
        flashHurt = 0.25;
        addParticles(player.x, player.y, '#ff6688', 8);
        if (player.hp <= 0) {
          player.hp = 0;
          state = 'GAMEOVER';
          return;
        }
      }
    }

    // Gems
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
        while (player.xp >= player.xpNext) {
          player.xp -= player.xpNext;
          player.level++;
          player.xpNext = xpForLevel(player.level);
          // small heal on level
          player.hp = Math.min(player.maxHp, player.hp + 8);
          offerLevelUp();
          break; // one upgrade screen at a time
        }
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.92; p.vy *= 0.92;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  // ---------- Draw ----------
  function worldToScreen(x, y) {
    return { x: Math.round(x - cam.x), y: Math.round(y - cam.y) };
  }

  function drawNightGrass() {
    // Base night field
    ctx.fillStyle = '#142018';
    ctx.fillRect(0, 0, W, H);

    // Tiled grass tufts relative to camera
    const tile = 32;
    const ox = Math.floor(cam.x / tile);
    const oy = Math.floor(cam.y / tile);
    for (let iy = -1; iy < H / tile + 2; iy++) {
      for (let ix = -1; ix < W / tile + 2; ix++) {
        const wx = (ox + ix) * tile;
        const wy = (oy + iy) * tile;
        const sx = wx - cam.x;
        const sy = wy - cam.y;
        // pseudo-random from position
        const h = ((wx * 73856093) ^ (wy * 19349663)) >>> 0;
        // darker patches
        if ((h & 7) === 0) {
          ctx.fillStyle = '#101a14';
          ctx.fillRect(sx, sy, tile, tile);
        }
        // grass blades
        ctx.fillStyle = '#1e3a28';
        const n = 2 + (h & 3);
        for (let k = 0; k < n; k++) {
          const gx = sx + ((h >> (k * 3)) & 28) + 2;
          const gy = sy + ((h >> (k * 5)) & 24) + 4;
          ctx.fillRect(gx, gy, 1, 3);
          ctx.fillStyle = '#2a5a38';
          ctx.fillRect(gx, gy, 1, 2);
          ctx.fillStyle = '#1e3a28';
        }
        // tiny flowers / dew
        if ((h & 31) === 3) {
          ctx.fillStyle = '#6a8cff';
          ctx.fillRect(sx + 10, sy + 14, 2, 2);
        }
        if ((h & 31) === 7) {
          ctx.fillStyle = '#c090ff';
          ctx.fillRect(sx + 18, sy + 8, 2, 2);
        }
      }
    }

    // soft vignette via darker edges (cheap)
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
    // use side when moving horizontally strongly — keep simple front/walk for top-down readability
    ctx.save();
    if (player.facing < 0) {
      ctx.translate(s.x, s.y);
      ctx.scale(-1, 1);
      if (player.invuln > 0 && (animT * 20 | 0) % 2 === 0) ctx.globalAlpha = 0.45;
      ctx.drawImage(spr, -10, -22);
    } else {
      if (player.invuln > 0 && (animT * 20 | 0) % 2 === 0) ctx.globalAlpha = 0.45;
      ctx.drawImage(spr, s.x - 10, s.y - 22);
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
      ctx.drawImage(fr, s.x - ox, s.y - oy);
      // tiny hp bar for kings / hurt
      if (e.isKing || e.hp < e.maxHp) {
        const bw = e.isKing ? 22 : 14;
        ctx.fillStyle = '#1a1020';
        ctx.fillRect(s.x - bw / 2, s.y - oy - 5, bw, 3);
        ctx.fillStyle = e.isKing ? '#e8c84a' : '#7dcea0';
        ctx.fillRect(s.x - bw / 2, s.y - oy - 5, bw * (e.hp / e.maxHp), 3);
      }
    }
  }

  function drawProjectiles() {
    for (const p of projectiles) {
      const s = worldToScreen(p.x, p.y);
      ctx.drawImage(projSprite, s.x - 3, s.y - 3);
    }
  }

  function drawGems() {
    for (const g of gems) {
      const s = worldToScreen(g.x, g.y + Math.sin(g.bob) * 2);
      ctx.drawImage(gemSprite, s.x - 4, s.y - 4);
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

  function drawUI() {
    // HP bar
    ctx.fillStyle = 'rgba(10,14,22,0.7)';
    ctx.fillRect(8, 8, 120, 14);
    ctx.fillStyle = '#3a2030';
    ctx.fillRect(10, 10, 116, 10);
    const hpw = 116 * (player.hp / player.maxHp);
    ctx.fillStyle = player.hp / player.maxHp < 0.3 ? '#ff5577' : '#f0a0c0';
    ctx.fillRect(10, 10, hpw, 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px monospace';
    ctx.fillText('HP ' + Math.ceil(player.hp) + '/' + player.maxHp, 12, 18);

    // XP / level
    ctx.fillStyle = 'rgba(10,14,22,0.7)';
    ctx.fillRect(8, 26, 120, 10);
    ctx.fillStyle = '#1a3040';
    ctx.fillRect(10, 28, 116, 6);
    ctx.fillStyle = '#7cf0ff';
    ctx.fillRect(10, 28, 116 * Math.min(1, player.xp / player.xpNext), 6);
    ctx.fillStyle = '#c8e8ff';
    ctx.fillText('Lv ' + player.level, 132, 34);

    // Timer
    const remain = Math.max(0, WIN_TIME - timeAlive);
    const m = Math.floor(remain / 60);
    const sec = Math.floor(remain % 60);
    const tstr = m + ':' + String(sec).padStart(2, '0');
    ctx.fillStyle = 'rgba(10,14,22,0.7)';
    const tw = 56;
    ctx.fillRect(W / 2 - tw / 2, 8, tw, 16);
    ctx.fillStyle = '#ffe8a0';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tstr, W / 2, 20);
    ctx.textAlign = 'left';

    // Kills
    ctx.fillStyle = 'rgba(10,14,22,0.7)';
    ctx.fillRect(W - 78, 8, 70, 16);
    ctx.fillStyle = '#d0c0ff';
    ctx.font = '8px monospace';
    ctx.fillText('Kills ' + killCount, W - 72, 19);

    if (flashHurt > 0) {
      ctx.fillStyle = `rgba(180,20,60,${flashHurt * 0.45})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawMenu() {
    // night bg
    ctx.fillStyle = '#0c121c';
    ctx.fillRect(0, 0, W, H);
    // decorative slimes
    const cols = ['mint', 'pink', 'yellow', 'purple'];
    for (let i = 0; i < 10; i++) {
      const c = cols[i % 4];
      const fr = slimeFrames[c][Math.floor(animT * 4 + i) % 4];
      const x = 30 + (i * 47) % (W - 40);
      const y = 40 + Math.sin(animT * 1.5 + i) * 8 + (i % 3) * 60;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(fr, x, y);
      ctx.globalAlpha = 1;
    }
    // hero showcase
    ctx.drawImage(heroFront, W / 2 - 20, 48, 40, 56);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f7a0c0';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('SLIME BARRAGE', W / 2, 36);

    ctx.fillStyle = '#a090c8';
    ctx.font = '9px monospace';
    ctx.fillText('auto-survivor  ·  original IP', W / 2, 118);

    // Play button
    const pulse = 1 + Math.sin(menuPulse * 3) * 0.04;
    const bw = 100 * pulse, bh = 28;
    ctx.fillStyle = '#c4b0e8';
    ctx.fillRect(W / 2 - bw / 2, H / 2 + 20, bw, bh);
    ctx.fillStyle = '#2a1840';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('PLAY', W / 2, H / 2 + 38);

    ctx.fillStyle = '#8090a8';
    ctx.font = '8px monospace';
    ctx.fillText(VERSION + '  ·  WASD / Arrows to move  ·  auto-fires', W / 2, H - 28);
    ctx.fillText('Survive 3:00  ·  level up & pick upgrades', W / 2, H - 16);
    ctx.textAlign = 'left';
  }

  function drawLevelUp() {
    ctx.fillStyle = 'rgba(8,10,20,0.72)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe8a0';
    ctx.font = 'bold 14px monospace';
    ctx.fillText('LEVEL UP!  Lv ' + player.level, W / 2, 36);
    ctx.fillStyle = '#a0b0c8';
    ctx.font = '8px monospace';
    ctx.fillText('Pick an upgrade  (1 / 2 / 3 or click)', W / 2, 52);

    const cardW = 120, gap = 12;
    const total = 3 * cardW + 2 * gap;
    const startX = (W - total) / 2;
    const cardY = 78;
    const accents = ['#f7a0c0', '#7dcea0', '#c0a0e8'];
    for (let i = 0; i < 3; i++) {
      const u = upgradeChoices[i];
      const x = startX + i * (cardW + gap);
      ctx.fillStyle = '#1a2230';
      ctx.fillRect(x, cardY, cardW, 110);
      ctx.strokeStyle = accents[i];
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 1, cardY + 1, cardW - 2, 108);
      ctx.fillStyle = accents[i];
      ctx.font = 'bold 10px monospace';
      ctx.fillText((i + 1) + '. ' + u.name, x + cardW / 2, cardY + 28);
      ctx.fillStyle = '#c8d0e0';
      ctx.font = '8px monospace';
      wrapText(u.desc, x + cardW / 2, cardY + 55, cardW - 16, 11);
    }
    ctx.textAlign = 'left';
  }

  function wrapText(text, x, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let yy = y;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, x, yy);
        line = w;
        yy += lineH;
      } else line = test;
    }
    if (line) ctx.fillText(line, x, yy);
  }

  function drawEnd(won) {
    ctx.fillStyle = 'rgba(8,10,20,0.78)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? '#7dcea0' : '#f7a0c0';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(won ? 'YOU SURVIVED!' : 'GAME OVER', W / 2, 80);
    ctx.fillStyle = '#e0e8ff';
    ctx.font = '10px monospace';
    const score = killCount * 10 + Math.floor(timeAlive) * 2 + player.level * 25;
    ctx.fillText('Time  ' + formatTime(timeAlive), W / 2, 110);
    ctx.fillText('Kills  ' + killCount, W / 2, 126);
    ctx.fillText('Level  ' + player.level, W / 2, 142);
    ctx.fillStyle = '#ffe8a0';
    ctx.fillText('Score  ' + score, W / 2, 168);
    ctx.fillStyle = '#a0b0c8';
    ctx.font = '8px monospace';
    ctx.fillText('Enter / click  —  back to menu', W / 2, 210);
    ctx.textAlign = 'left';
  }

  function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function draw() {
    if (state === 'MENU') {
      drawMenu();
      return;
    }
    drawNightGrass();
    drawGems();
    drawEnemies();
    drawProjectiles();
    drawPlayer();
    drawParticles();
    drawUI();
    if (state === 'LEVELUP') drawLevelUp();
    if (state === 'GAMEOVER') drawEnd(false);
    if (state === 'WIN') drawEnd(true);
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

  // Auto-start helper for screenshot mode
  window.__slimeBarrage = {
    startGame,
    getState: () => state,
    getCanvas: () => canvas,
    forcePlaySeconds: (sec) => {
      // advance simulated play for screenshots
      startGame();
      // spawn a bunch so screenshot looks busy
      for (let i = 0; i < 25; i++) spawnSlime(true);
      timeAlive = sec;
      player.level = 3;
      player.xp = 4;
    },
  };
})();
