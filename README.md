# Slime Barrage v1.20

A tiny **2D pixel-art auto-survivor** (original IP). Move a casual pink-hair hoodie girl across an **infinite night grass meadow** while she **auto-fires** sparks at cute colorful slime blobs. Collect XP gems, level up, pick upgrades, and **defeat the Amber Colossus King** to win (endless Continue? after).

Inspired by the *feel* of Holocure / Vampire Survivors — **no Hololive names, logos, characters, assets, or music**.

> **v1.20** — New title menu, Options panel, **Gold Big Shot** evolution, **Zeus Hammer** + **Ice Grenades** skills, King off-screen arrows, mob speed ramp from 4:00, Rapid/Spark rebalance, Timed mode removed. Cache-bust `?v=1.20`.

## How to play

1. Open `index.html` in a modern browser (Chrome / Firefox / Edge / Safari).
2. Or serve locally:
   ```bash
   cd slime-barrage
   python3 -m http.server 8080
   # then visit http://localhost:8080
   ```
3. Tap **PLAY** (or press Enter / Space). Audio unlocks on that first gesture. **Rankings**, **Options** (Music / SFX / Zoom / mute) and **How to Play** sit under PLAY.

### Controls

| Input | Action |
|-------|--------|
| **WASD** or **Arrow keys** | Move |
| *(automatic)* | Fire at nearest slime |
| **1 / 2 / 3** or tap cards | Pick level-up upgrade |
| **Q / F** or **WIPE** button | Clear all non-boss mobs (120s cooldown) |
| **Enter / Space / R** | Confirm on menu / game over |
| **M** or 🔊 button | Mute / unmute (saved) |
| **Esc / P** or ⏸ button | Pause / resume |
| **Options** (title menu / Pause) | Music + SFX volume, portrait Zoom Far↔Close, mute (all saved) |
| On-screen stick (touch) | Move on mobile (floating) |

### Modes

| Mode | Goal |
|------|------|
| **Survival** | Defeat **Amber Colossus King** (3rd Big King @ **12:00**, then every set) to **win**. Difficulty holds at **68%** through **1:00**, then ramps **+2.5% per minute** to **200%**; mob spawn rate shares that scale (starts **68%**). Normal + elite spawn at **85%** of the prior rate. Each minute normal+elite gain **+1% speed & damage**; from **4:00** they also gain **+2.5% speed per full minute** (4:00 +2.5%, 5:00 +5% …, bosses excluded). From **9:00**, normal+elite spawn rate gains **+2% per full minute** (additive; mob cap scales too). HUD shows time survived. |

*Timed 6:00 mode was removed in v1.20.*

### Upgrades (pick 1 of 3 on level up)

Sharp Spark (**+7%** dmg, **max 8**), Rapid Fire (**−10%** fire cooldown, **max 8**), Sneaker Boost (**max 6**, move trails), Hoodie Padding (max HP **cap 200**), Gem Magnet (**+10% pickup range**, **max 8** — then leaves the pool), Multishot (**max 5**) → **Gold Big Shot** evolution (Multi 5 + Lv 15: one big gold shot, damage ×5, keeps pierce + Rapid cadence), **Zeus Hammer** (max 8: sky lightning, L1 4.0s / 8 dmg / 1 bolt → L8 2.25s / 22 dmg / 8 bolts + glow), **Ice Grenades** (max 8: every 8s, freezes mobs within ~45px for 1.0s → 2.05s; bosses half), Pierce Shot (**max 6**), Snack Break (heal), **Orbit Guard** (**max 10**), **Orbiting Fairy** (max level **8** / up to **5** on screen, gold auras L6–8), **Pulse Laser** (L1–10), **Omni Beam** (8/12-way burst — **only after Laser 6**), **Barrier Shield** (**+50 shield** each pick, absorb before HP, **cap 200**, additive).

Maxed skills still appear as **dimmed / unclickable** cards (except Gem Magnet after 8 picks, Multishot after the Gold Big Shot evolution, and the one-time evolution card itself); the pool prefers available upgrades first. Level-up cards + in-run **HUD chips** (left side) show an **icon** plus current weapon/skill levels (incl. Shield).

### XP gems (hardcoded totals)

| Tier | Color | Source | Total XP |
|------|-------|--------|----------|
| Blue | cyan | Normal mint/pink/yellow | **1** |
| Blue | cyan | Purple-tinted normal | **2** |
| Purple | violet | Elite King slime | **13** |
| Gold ×3 | gold | Pink-Mint Monarch | **75** (3×25) |
| Gold ×5 | gold | Frostmint Regent | **175** (5×35) |
| Gold ×5 | gold | Crown Jelly Sovereign | **212** (43+43+42+42+42) |
| Gold ×5 | gold | Amber Colossus King | **250** (5×50) |

### Rankings

**Global / online** Survival board (top 10) via HighScore API (`api-leaderboard.qulyubis.biz.id`), gameId **18** — **not** Tomo Crossroad (17). The Timed board (19) is no longer used by the game (server untouched).

Scoring: `time×5 + kills×12 + lv×20`

## What’s new in v1.20

- **Title menu redesign:** neon logo card, big gold **PLAY**, then Rankings / Options / How to Play; drifting background slimes; small version label. Portrait (412×915) and landscape layouts.
- **Options panel** (title + Pause): Music, SFX, Zoom, mute — same localStorage keys as before.
- **Timed 6:00 removed** (menu, code paths, rankings UI shows Survival only).
- **Rapid Fire:** fire cooldown ×0.9 per pick (was ×0.8). **Sharp Spark:** +7% per pick (was +25%).
- **Multishot max 5** → **Gold Big Shot** evolution card at Multi 5 + Lv 15 (one-time). Single big gold projectile, damage = spark damage × 5, keeps pierce, fires at Rapid cadence. HUD chip "Gold".
- **Zeus Hammer** (new, max 8) and **Ice Grenades** (new, max 8) with HUD chips + stats.
- **King off-screen arrows** in each King's colors (Frostmint mint/ice, Crown Jelly purple/gold, Amber orange).
- **Mob speed ramp:** normal+elite +2.5% speed per full minute from 4:00 (stacks with +1%/min).
- Cache-bust `?v=1.20`.

## What’s new in v1.19

- **Big Kings half size:** body sprite + collision radius halved — Frostmint Regent r **120 → 60** (frame 160 → 80), Crown Jelly Sovereign r **136 → 68** (176 → 88), Amber Colossus King r **152 → 76** (192 → 96). Contact damage range and projectile hit detection use the new radius; HP bar / label sit above the smaller sprite. HP, speed, pass-through unchanged. Monarchs unchanged.
- **King blast orb** restored to v1.17 size (radius **22**, same drawn visual); damage stays **35**.
- Cache-bust `?v=1.19`.

## What’s new in v1.18

- **Late difficulty ramp:** from **9:00** (t ≥ 540s) normal + elite spawn rate ×`1 + 0.02 × (floor((t−540)/60) + 1)` → 9:00 ×1.02, 10:00 ×1.04, … (additive). Enemy cap (Survival 140 / Timed 120) scales by the same factor so it doesn't block the increase. Other ramps unchanged.
- **Gem Magnet:** **+10%** pickup range per pick (was +40%), **max 8 picks**; removed from level-up choices once maxed.
- **Global Rank live:** end screen shows your real **Global Rank #** after the score POST succeeds (was a local-cache rank). Rankings panel shows the server board as-is when online (local cache only used offline).
- **Big King blasts** (Frostmint Regent / Crown Jelly Sovereign / Amber Colossus King): **35 damage** (was 12). Monarch blast unchanged (10 dmg). *(v1.18 also halved the King orb radius — reverted in v1.19.)*
- **Boss pass-through:** Monarchs and Big Kings ignore tree/bush collisions (same speed). Player / normal / elite mobs unchanged.
- Cache-bust `?v=1.18`.

## What’s new in v1.17

- **Live stat column** right of the left run chips (one line per chip, aligned to its row, with a thin level-progress meter). Updates live as upgrades are picked:
  - **Multi** (main spark): `dmg` = spark damage · `/s` = sparks per second (multishot ÷ fire cooldown).
  - **Pierce**: enemies each spark can hit.
  - **Laser**: beam damage · beams/s (1 ÷ (cooldown + 0.35s telegraph)).
  - **Orbit**: orb tick damage (18 + 0.6×player level) · max hits/s per enemy (0.18s throttle).
  - **Omni**: ray damage ×rays · bursts/s (1 ÷ (cooldown + 0.28s telegraph)).
  - **Fairy**: shot damage · total fairy shots/s (fairies ÷ fire cooldown).
  - **Spark** damage · **Rapid** volleys/s · **Sneak** move speed · **HP** regen.
  - Weapon lines appear once owned (main spark always). Level-up screen chips unchanged.
- Cache-bust `?v=1.17`. Balance unchanged.

## What’s new in v1.16

- Boss **ranged blasts**: every **5 seconds** while alive, each Pink-Mint Monarch fires a slow **large** pink-mint orb, and each Frostmint Regent / Crown Jelly Sovereign / Amber Colossus King fires a slow large orb matching its mint / purple / yellow skin. Monarch orbs deal **10 damage**; Big King orbs deal **12 damage**. Barrier Shield + invuln are respected like body hits; body contact damage is unchanged. Orbs destroy on hit or when far off-map.
- Cache-bust `?v=1.16b`.

## What’s new in v1.15

- Survival difficulty holds at **68%** through **1:00**, then ramps **+2.5% per minute** to **200%**; spawn-rate scale shares that curve. Normal + elite spawn rate is **−15%** (boss schedules unchanged).
- Each minute: normal + elite mobs gain **+1% speed and +1% damage** (stacking, separate from difficulty).
- Survival **Big Kings** every **4 minutes from 4:00** (Frostmint → Crown Jelly → Amber, then next sets). Later sets **+1/3 HP & speed** vs prior set (×4/3 per set). **Defeating Amber = WIN**.
- Elite purple slime first eligible after **90s**.
- **Zoom** slider (Menu + Pause): Far **1.0** … Close **4.0**, default **1.76** (`localStorage` `slimeBarrageZoom`); live-applies portrait `VIEW_ZOOM` only; landscape stays `VIEW_ZOOM_LANDSCAPE=1`. HUD/`--ui-scale` unchanged. Cache `?v=1.15`.
- Survival Amber kill shows **Continue?** (endless) or **End run** (claim victory).
- Pink-Mint Monarch size **−20%**; **off-screen location arrow** when Monarch is outside the view.
- XP gem totals halved (1 / 2 / 13 / 75 / 175 / 212 / 250).
- Sneaker Boost max **6**; Multishot stays gold/yellow sparks (no blue fireball).
- Level-up cards + HUD chips show **skill icons**.
- New skill: **Barrier Shield** (+50 absorb shield, additive, cap 200; HUD bar + chip + cyan ring).
- **Global rankings** fresh boards (gameId 18/19); side-by-side Survival / Timed.
- Monarchs: **2 every 3 minutes**; Nightfall BGM while any Monarch alive; **Throne Breakers** while a King is alive.
- Cap raises: Sharp Spark / Rapid Fire / Multishot **8**; Sneaker **6**; Orbit Guard **10**; Pulse Laser **10**; Fairy level **8**.
- Timed win-at-6:00 unchanged.

## What’s new in v1.0 (rebuild)

- Omni Beam **gated** until Pulse Laser is level 6; Omni still stacks after unlock (max 3).
- New skill: **Orbiting Fairy** (cute orbiting sprite, low-dmg single-target snipes, max 5).
- Level-up HUD chips show Multi / Pierce / Laser / Orbit / Omni / Fairy / HP.
- Start **100 HP**, max HP upgrades cap at **200**; **+1 HP regen every 2s** while playing.
- Pierce hard cap **6**; maxed cards **dimmed but still appear** (prefer fill with available).
- Wipe starts on **full 120s cooldown** (not ready at run start).
- Monarch **bigger** (r=72, 96px frames) and **HP ×10**.

## Tech

- Pure HTML / CSS / Canvas 2D / Web Audio — no build step, no frameworks.
- GitHub Pages: https://tomokifaizuru.github.io/slime-barrage/
- Original IP only.

## License

All game code, art (procedural), and audio compositions in this repo are original for **Slime Barrage**.
