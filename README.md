# Slime Barrage v1.0 (rebuild)

A tiny **2D pixel-art auto-survivor** (original IP). Move a casual pink-hair hoodie girl across an **infinite night grass meadow** while she **auto-fires** sparks at cute colorful slime blobs. Collect XP gems, level up, pick upgrades, and either **survive as long as you can** or **win Timed at 6:00**.

Inspired by the *feel* of Holocure / Vampire Survivors — **no Hololive names, logos, characters, assets, or music**.

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
| **Survival** | No win timer — last as long as you can. Difficulty **ramps** (spawn rate, HP/speed/damage, elite chance). HUD shows time survived; end screen shows best time + kills. |
| **Timed** | Survive **6:00** to win. Milder difficulty curve. |

Last mode is remembered in `localStorage`.

### Upgrades (pick 1 of 3 on level up)

Sharp Spark (damage), Rapid Fire, Sneaker Boost (speed), Hoodie Padding (max HP **cap 200**), Gem Magnet, Multishot (**max 7**), Pierce Shot (**max 6**), Snack Break (heal), **Orbit Guard**, **Orbiting Fairy** (max 5), **Pulse Laser** (2.0s→0.75s, **L6 gold glitter**), **Omni Beam** (special 8/12-way burst — **only after Laser 6**).

Maxed skills still appear as **dimmed / unclickable** cards; the pool prefers available upgrades first. Level-up panel shows current weapon/skill levels above the cards.

### XP gems

| Tier | Color | Source | Notes |
|------|-------|--------|-------|
| Blue | cyan | Normal slimes | +10% vs prior normal XP |
| Purple | violet | King / elites | Larger pickup, ~2–3× a blue |
| Gold ×3 | gold | Pink-Mint Monarch | Biggest dump (~150 XP total) |

### Rankings

Local **Survival | Timed** boards (top 10 each) on the menu **RANKINGS** panel and after each run. Name is stored in `localStorage`. Scoring:

- **Survival:** `time×5 + kills×12 + lv×20`
- **Timed:** `kills×10 + time×2 + lv×25`

Online shared boards can plug in later; v1.0 ships solid **local device** ranks.

## What’s new in v1.0 (rebuild)

- Omni Beam **gated** until Pulse Laser is level 6; Omni still stacks after unlock (max 3).
- New skill: **Orbiting Fairy** (cute orbiting sprite, low-dmg single-target snipes, max 5).
- Level-up HUD chips show Multi / Pierce / Laser / Orbit / Omni / Fairy / HP.
- Start **100 HP**, max HP upgrades cap at **200**; **+1 HP regen every 2s** while playing.
- Pierce hard cap **6**; maxed cards **dimmed but still appear** (prefer fill with available).
- Wipe starts on **full 120s cooldown** (not ready at run start).
- Monarch **bigger** (r=72, 96px frames) and **HP ×10**.
- Mob pace / XP gem tiers / Multishot 7 / Laser L6 gold / local rankings from prior v1.0.

## What’s new in v0.9

- Portrait vs landscape world zoom; tougher Monarch; Orbit Guard + Pulse Laser; infinite meadow; Survival + Timed modes.

## Tech

- Pure HTML / CSS / Canvas 2D / Web Audio — no build step, no frameworks.
- GitHub Pages: https://tomokifaizuru.github.io/slime-barrage/
- Original IP only.

## License

All game code, art (procedural), and audio compositions in this repo are original for **Slime Barrage**.
