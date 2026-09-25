# Slime Barrage v0.5

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

## What’s new in v0.5

- **Phone layout — width-fit + calmer UI (less cramped)**: portrait uses width-fit contain (`scale = vw/480`) so the full 480×270 playfield is visible with small letterbars top/bottom instead of cover-crop zoom. `--ui-scale` is clamped for readable (not giant) HUD/menu/logo; logo capped at ~85vw / 320px.
- Landscape keeps integer contain when it fits well, otherwise fractional contain; tiny cover only if crop &lt; ~4%.

## What’s new in v0.4

- **Neon blast logo** on the main menu (hero title art) plus favicon / apple-touch-icon (square crop of the crowned slime). Pixel-crisp `image-rendering`; responsive max-width for phones.
- **Portrait cover-fill** (superseded in v0.5): canvas stayed **480×270** with cover scaling that cropped left/right in portrait.

## What’s new in v0.3

- **Original Game Boy–inspired BGM** (“Moonlit Meadow”): procedural Web Audio sequencer in `game.js` — G major, 120 BPM, 16-bar loop. Lead 25% pulse, bass 50% pulse, light arpeggio, soft noise on beats 2/4. Style inspiration only; **no** Nintendo / Pokémon melodies and **no** Hololive / Holocure audio.
- BGM starts with each run, fades out on game over / win / menu; mute (M / 🔊) silences BGM + SFX together via master gain. Separate `bgmGain` bus (~0.15) keeps music under SFX.

## What’s new in v0.2

- **Crisp UI text**: canvas keeps pixel world sprites at fixed 480×270 with integer CSS scale + `image-rendering: pixelated`; menus, HUD, and level-up cards are HTML/CSS overlays (system fonts, no upscaled 8px canvas text).
- **Procedural SFX** via Web Audio API (shoot, hit, kill, XP, level-up, hurt, death, win, UI click). Mute toggle remembers preference in `localStorage`. No copyrighted Hololive/Holocure audio.

## Files

```
index.html   — shell + HTML overlays + favicons
style.css    — contain layout, logo cap, crisp UI, touch stick
game.js      — game + procedural sprites + SFX + BGM + fitCanvas width-fit
assets/      — logo, favicons, art references
README.md
preview-v02.png / preview-v05-phone.png
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
