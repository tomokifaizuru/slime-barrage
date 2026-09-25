# Slime Barrage v0.4

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
3. Click **PLAY** (or press Enter / Space). Audio unlocks on that first gesture.

### Controls

| Input | Action |
|-------|--------|
| **WASD** or **Arrow keys** | Move |
| *(automatic)* | Fire at nearest slime |
| **1 / 2 / 3** or tap cards | Pick level-up upgrade |
| **Enter / Space / R** | Confirm on menu / game over |
| **M** or 🔊 button | Mute / unmute (saved) |
| On-screen stick (touch) | Move on mobile |

### Goal

- Survive until the timer hits **0:00** → win screen.
- Or die from slime contact → game over with score (`kills×10 + time×2 + level×25`).

### Upgrades (pick 1 of 3 on level up)

Sharp Spark (damage), Rapid Fire, Sneaker Boost (speed), Hoodie Padding (max HP), Gem Magnet, Multishot, Pierce Shot, Snack Break (heal).

## What’s new in v0.4

- **Neon blast logo** on the main menu (hero title art) plus favicon / apple-touch-icon (square crop of the crowned slime). Pixel-crisp `image-rendering`; responsive max-width for phones.
- **Portrait cover-fill**: canvas stays **480×270** with `image-rendering: pixelated`; CSS size scales up to cover the viewport (crops left/right in portrait). Black letterbars gone when playing vertically; HTML `#ui` overlays still track `#gameBox`.

## What’s new in v0.3

- **Original Game Boy–inspired BGM** (“Moonlit Meadow”): procedural Web Audio sequencer in `game.js` — G major, 120 BPM, 16-bar loop. Lead 25% pulse, bass 50% pulse, light arpeggio, soft noise on beats 2/4. Style inspiration only; **no** Nintendo / Pokémon melodies and **no** Hololive / Holocure audio.
- BGM starts with each run, fades out on game over / win / menu; mute (M / 🔊) silences BGM + SFX together via master gain. Separate `bgmGain` bus (~0.15) keeps music under SFX.

## What’s new in v0.2

- **Crisp UI text**: canvas keeps pixel world sprites at fixed 480×270 with integer CSS scale + `image-rendering: pixelated`; menus, HUD, and level-up cards are HTML/CSS overlays (system fonts, no upscaled 8px canvas text).
- **Procedural SFX** via Web Audio API (shoot, hit, kill, XP, level-up, hurt, death, win, UI click). Mute toggle remembers preference in `localStorage`. No copyrighted Hololive/Holocure audio.

## Files

```
index.html   — shell + HTML overlays + favicons
style.css    — cover-fill layout, logo, crisp UI, touch stick
game.js      — game + procedural sprites + SFX + BGM + fitCanvas cover
assets/      — logo, favicons, art references
README.md
preview-v02.png
```

Sprites are drawn procedurally in canvas (hoodie girl + mint/pink/yellow/purple slimes + crowned king slime) for a tiny footprint.

## Known limits (later)

- Single weapon type (spark projectiles)
- No map props / obstacles
- Enemy AI is chase-only
- No save / meta progression
- Win timer fixed at 3 minutes

## License / IP

Original characters and title for this project. Do not ship Hololive / Holocure assets with it.

## Play online

https://tomokifaizuru.github.io/slime-barrage/
