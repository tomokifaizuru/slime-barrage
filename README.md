# Slime Barrage v0.9

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

Sharp Spark (damage), Rapid Fire, Sneaker Boost (speed), Hoodie Padding (max HP), Gem Magnet, Multishot (**max 6** — removed from pool at cap), Pierce Shot, Snack Break (heal), **Orbit Guard** (spinning shield orbs), **Pulse Laser** (telegraphed interval beam).

## What’s new in v0.9

- **Portrait vs landscape world zoom**: portrait ~**1.55** (meadow feels larger on phone); landscape ~**1.05** (near-normal). Recomputed on resize/orientation. HUD/UI scale unchanged (no cover-fill chrome blow-up).
- **Tougher Pink-Mint Monarch**: larger (~r48, 64px frames), much more HP, slightly more contact damage. Still mid-run at ~150s.
- **Orbit Guard** + **Pulse Laser** upgrades; multishot hard-capped at **6**.
- **Infinite walkable meadow**: no world edges; tiled grass + sliding-window trees/bushes; camera follows without clamp; far entities cleaned up.
- **Survival** and **Timed 6:00** mode buttons on the menu.

## What’s new in v0.8

- **Pink-Mint Monarch mid-run boss** (~2:30): procedural pink jelly with mint froth + gold crown. Boss HP bar. King slime stays as small crowned elite.
- **BGM tracks**: early = Moonlit calm; while Monarch lives = Nightfall (crossfade). Procedural fallback if HTMLAudio fails.
- **Soft damage numbers** + **floating virtual stick**.

## What’s new in v0.7

- Trees & bushes (seeded layout). World zoom. Volumes + pause. 5:00 timer (superseded by Timed 6:00 in v0.9).

## Tech

- Pure HTML / CSS / Canvas 2D / Web Audio — no build step, no frameworks.
- GitHub Pages: https://tomokifaizuru.github.io/slime-barrage/
- Original IP only.

## License

All game code, art (procedural), and audio compositions in this repo are original for **Slime Barrage**.
