# Slime Barrage v1.11

A tiny **2D pixel-art auto-survivor** (original IP). Move a casual pink-hair hoodie girl across an **infinite night grass meadow** while she **auto-fires** sparks at cute colorful slime blobs. Collect XP gems, level up, pick upgrades, and either **defeat the Amber Colossus King** (Survival) or **win Timed at 6:00**.

Inspired by the *feel* of Holocure / Vampire Survivors — **no Hololive names, logos, characters, assets, or music**.

> **v1.11** — portrait mobile gameplay FOV widened ~30% (`VIEW_ZOOM_PORTRAIT=0.769`); landscape and all other gameplay/balance/UI unchanged. Cache-bust `?v=1.11`.

## How to play

1. Open `index.html` in a modern browser (Chrome / Firefox / Edge / Safari).
2. Or serve locally:
   ```bash
   cd slime-barrage
   python3 -m http.server 8080
   # then visit http://localhost:8080
   ```
3. Pick **SURVIVAL** or **TIMED 6:00** (or press Enter / Space for last mode). Audio unlocks on that first gesture.

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
| Music / SFX sliders | Separate volumes (saved) |
| On-screen stick (touch) | Move on mobile (floating) |

### Modes

| Mode | Goal |
|------|------|
| **Survival** | Defeat **Amber Colossus King** (3rd Big King @ **12:00**, then every set) to **win**. Difficulty starts at **68%**, ramps **+2.5%/min** to **200%**; mob spawn rate shares that scale (starts **68%**). Each minute normal+elite gain **+1% speed & damage**. HUD shows time survived. |
| **Timed** | Survive **6:00** to win. Milder difficulty curve. |

Last mode is remembered in `localStorage`.

### Upgrades (pick 1 of 3 on level up)

Sharp Spark (**max 8**), Rapid Fire (**max 8**), Sneaker Boost (**max 6**, move trails), Hoodie Padding (max HP **cap 200**), Gem Magnet, Multishot (**max 8**, gold/yellow sparks), Pierce Shot (**max 6**), Snack Break (heal), **Orbit Guard** (**max 10**), **Orbiting Fairy** (max level **8** / up to **5** on screen, gold auras L6–8), **Pulse Laser** (L1–10), **Omni Beam** (8/12-way burst — **only after Laser 6**), **Barrier Shield** (**+50 shield** each pick, absorb before HP, **cap 200**, additive).

Maxed skills still appear as **dimmed / unclickable** cards; the pool prefers available upgrades first. Level-up cards + in-run **HUD chips** (left side) show an **icon** plus current weapon/skill levels (incl. Shield).

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

**Global / online** Survival | Timed boards (top 10 each) via HighScore API (`api-leaderboard.qulyubis.biz.id`). Fresh gameIds (**18** Survival / **19** Timed) — **not** Tomo Crossroad (17). Old local keys (`slimeBarrageLbSurvival` / `slimeBarrageLbTimed`) are cleared on load; new cache keys are `slimeBarrageV11bLb*`.

Scoring:

- **Survival:** `time×5 + kills×12 + lv×20`
- **Timed:** `kills×10 + time×2 + lv×25`

## What’s new in v1.11

- Survival difficulty **68% → +2.5%/min → 200%**; spawn-rate scale shares that curve (starts **68%**).
- Each minute: normal + elite mobs gain **+1% speed and +1% damage** (stacking, separate from difficulty).
- Survival **Big Kings** every **4 minutes from 4:00** (Frostmint → Crown Jelly → Amber, then next sets). Later sets **+1/3 HP & speed** vs prior set (×4/3 per set). **Defeating Amber = WIN**.
- Elite purple slime first eligible after **60s**.
- Portrait gameplay FOV widened ~30% with `VIEW_ZOOM_PORTRAIT=0.769`; landscape remains `VIEW_ZOOM_LANDSCAPE=1` with optional 2× buffer on retina.
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
