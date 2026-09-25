# Slime Barrage v0.8

A tiny **2D pixel-art auto-survivor** (original IP). Move a casual pink-hair hoodie girl across a night grass field while she **auto-fires** sparks at cute colorful slime blobs. Collect XP gems, level up, pick upgrades, and survive **5:00**.

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
| **Esc / P** or ⏸ button | Pause / resume |
| Music / SFX sliders | Separate volumes (saved) |
| On-screen stick (touch) | Move on mobile |

### Goal

- Survive until the timer hits **0:00** → win screen.
- Or die from slime contact → game over with score (`kills×10 + time×2 + level×25`).

### Upgrades (pick 1 of 3 on level up)

Sharp Spark (damage), Rapid Fire, Sneaker Boost (speed), Hoodie Padding (max HP), Gem Magnet, Multishot, Pierce Shot, Snack Break (heal).

## What’s new in v0.8

- **Pink-Mint Monarch mid-run boss** (~2:30 into the 5:00 timer): huge procedural pink jelly with mint froth rim + gold crown (draft C look, not a PNG blit). High HP, bigger radius, stronger contact damage, slow chase. Boss HP bar labeled above it. King slime stays as the small crowned elite.
- **BGM tracks**: early/normal = Moonlit calm (`assets/bgm-moonlit-calm.mp3`); while the Monarch lives = Nightfall (`assets/bgm-nightfall.mp3`) with crossfade. Falls back to the procedural GB meadow loop if HTMLAudio fails. Mute + Music/SFX sliders still apply.
- **Soft damage numbers**: semi-transparent floating digits on hit (fade + rise).
- **Floating virtual stick**: on phones the stick appears where you first press-drag on the playfield; hides on finger-up. Pause/mute HUD taps are ignored. WASD still works on desktop.

## What’s new in v0.7


- **Trees & bushes** scatter across the 2400×2400 meadow (seeded/deterministic layout, clear radius around spawn). Procedural pixel sprites; solid trunk/bush-core circles block the player and slimes. Projectiles pass through foliage. Props Y-sort with entities so you walk in front of / behind them.

- **~25% world zoom-in** (`VIEW_ZOOM = 1.25`): camera shows less meadow so characters/slimes appear larger. Canvas CSS size + HUD/menu `--ui-scale` clamps / pads / touch stick from v0.6 stay the same (no UI blow-up).
- **Text title** on the main menu: bold bordered **SLIME BARRAGE** (pixel/arcade CSS) replaces the neon-blast logo image. Favicons unchanged.
- **Music + SFX volume** sliders (0–100), persisted in `localStorage`, wired to `bgmGain` / `sfxGain`. Mute still zeros master while keeping slider values. Controls on main menu + pause panel.
- **Pause button** in the HUD (Esc / P on desktop). Freezes the run and ducks BGM; resume via button / Esc / P. Level-up choice pause unchanged.
- **Survive 5:00** (`WIN_TIME = 300`; was 3:00).

## What’s new in v0.6

- **Portrait map fills the screen (taller playfield, same calm UI)**: internal view grows with phone aspect (`viewW = 480`, `viewH = clamp(round(480·vh/vw), 270, 1200)`). Width-fit scale then full-bleeds — no letterbars, no side crop. Camera shows more world vertically. `--ui-scale` clamp + logo max from v0.5 stay so HUD/logo stay calm (not the old cover-crop zoom that made UI huge).
- Landscape stays classic **480×270** for stability.

## What’s new in v0.5

- **Phone layout — width-fit + calmer UI (less cramped)**: portrait used width-fit contain (`scale = vw/480`) so the full 480×270 playfield was visible with small letterbars top/bottom instead of cover-crop zoom. `--ui-scale` clamped for readable (not giant) HUD/menu/logo; logo capped at ~85vw / 320px. (Superseded for the letterbars by v0.6’s taller playfield; UI clamp kept.)
- Landscape keeps integer contain when it fits well, otherwise fractional contain; tiny cover only if crop &lt; ~4%.

## What’s new in v0.4

- **Neon blast logo** on the main menu (hero title art) plus favicon / apple-touch-icon (square crop of the crowned slime). Pixel-crisp `image-rendering`; responsive max-width for phones.
- **Portrait cover-fill** (superseded in v0.5): canvas stayed **480×270** with cover scaling that cropped left/right in portrait.

## What’s new in v0.3

- **Original Game Boy–inspired BGM** (“Moonlit Meadow”): procedural Web Audio sequencer in `game.js` — G major, 120 BPM, 16-bar loop. Lead 25% pulse, bass 50% pulse, light arpeggio, soft noise on beats 2/4. Style inspiration only; **no** Nintendo / Pokémon melodies and **no** Hololive / Holocure audio.
- BGM starts with each run, fades out on game over / win / menu; mute (M / 🔊) silences BGM + SFX together via master gain. Separate `bgmGain` bus (~0.15) keeps music under SFX.

## What’s new in v0.2

- **Crisp UI text**: canvas keeps pixel world sprites at view resolution (480×270 landscape; taller in portrait) with CSS scale + `image-rendering: pixelated`; menus, HUD, and level-up cards are HTML/CSS overlays (system fonts, no upscaled 8px canvas text).
- **Procedural SFX** via Web Audio API (shoot, hit, kill, XP, level-up, hurt, death, win, UI click). Mute toggle remembers preference in `localStorage`. No copyrighted Hololive/Holocure audio.

## Files

```
index.html   — shell + HTML overlays + favicons
style.css    — contain layout, title border, volume rows, crisp UI, touch stick
game.js      — game + procedural sprites (trees/bushes + Monarch boss) + SFX + HTML/procedural BGM + zoom + pause + volumes + dmg nums + floating stick
assets/      — favicons, art references, bgm-moonlit-calm.mp3, bgm-nightfall.mp3
README.md
preview-v02.png / preview-v05-phone.png / preview-v06-phone.png
```

Sprites are drawn procedurally in canvas (hoodie girl + mint/pink/yellow/purple slimes + crowned king slime) for a tiny footprint.

## Known limits (later)

- Single weapon type (spark projectiles)
- Enemy AI is chase-only
- No save / meta progression
- Win timer fixed at 5 minutes

## License / IP

Original characters and title for this project. Do not ship Hololive / Holocure assets with it.

## Play online

https://tomokifaizuru.github.io/slime-barrage/
