# Slime Barrage v0.1

A tiny **2D pixel-art auto-survivor** (original IP). Move a casual pink-hair hoodie girl across a night grass field while she **auto-fires** sparks at cute colorful slime blobs. Collect XP gems, level up, pick upgrades, and survive **3:00**.

Inspired by the *feel* of Holocure / Vampire Survivors — **no Hololive names, logos, characters, assets, or music**.

## How to play

1. Open `index.html` in a modern browser (Chrome / Firefox / Edge / Safari).
2. Or serve locally:
   ```bash
   cd slime-barrage
   python3 -m http.server 8080
   # then visit http://localhost:8080
   ```
3. Click **PLAY** (or press Enter / Space).

### Controls

| Input | Action |
|-------|--------|
| **WASD** or **Arrow keys** | Move |
| *(automatic)* | Fire at nearest slime |
| **1 / 2 / 3** or click | Pick level-up upgrade |
| **Enter / Space / R** | Confirm on menu / game over |
| On-screen stick (touch) | Move on mobile |

### Goal

- Survive until the timer hits **0:00** → win screen.
- Or die from slime contact → game over with score (`kills×10 + time×2 + level×25`).

### Upgrades (pick 1 of 3 on level up)

Sharp Spark (damage), Rapid Fire, Sneaker Boost (speed), Hoodie Padding (max HP), Gem Magnet, Multishot, Pierce Shot, Snack Break (heal).

## Files

```
index.html   — shell
style.css    — layout + touch stick
game.js      — game + procedural pixel sprites
assets/      — art references (not required at runtime)
README.md
```

Sprites are drawn procedurally in canvas (hoodie girl + mint/pink/yellow/purple slimes + crowned king slime) for a tiny footprint.

## v0.1 known limits (next version)

- No sound / BGM yet
- Single weapon type (spark projectiles)
- No map props / obstacles
- Enemy AI is chase-only
- Touch pad is basic; no on-screen fire needed (auto)
- No save / meta progression
- Win timer fixed at 3 minutes

## License / IP

Original characters and title for this project. Do not ship Hololive / Holocure assets with it.

## Play online

https://tomokifaizuru.github.io/slime-barrage/
