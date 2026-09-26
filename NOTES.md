# Slime Barrage — Battle/Trance Preview

**File:** `moonlit-nights-inspired-preview.mp3`  
**BPM:** 175  
**Key:** A minor (with E-phrygian color / Bb flashes)  
**Duration:** ~87.7 s (56 bars + FluidSynth release tail; body ~76.8 s)  
**Palette:** FluidR3 GM — Synth Bass 1, Saw Lead, Square Lead, Warm Pad, Crystal arp, Synth Brass stabs, Channel 10 drums

## Vibe
Fast driving trance/eurobeat-ish battle energy: rolling 16th crystal arps, punchy synth bass, staccato saw lead hook, 4-on-floor with breakbeat-ish climax sections. Built for a mobile bullet-hell drop — intense but loopable-friendly.

## Structure
| Section    | Bars  | Feel |
|------------|-------|------|
| Intro      | 0–7   | Filtered arp + kick tease → snare roll into drop |
| Main       | 8–23  | Full groove, arp + lead hook + brass stabs |
| Breakdown  | 24–27 | Sparse pad/arp, snare build |
| Climax     | 28–51 | Hotter lead/arp, alternating 4-on-floor / breakish drums |
| Loop tail  | 52–55 | Main-groove phrase end (loops cleanly back toward main) |

## Originality
Original notes and hooks only. Inspired by *Touhou-energy feel* (fast arps, bright trance drive) — **not** a recreation or cover of Night of Nights, any ZUN/Touhou melody, or Hololive audio. No sampled audio.

## Tech
- Compose: `compose_slime_barrage.py` → `slime-barrage-preview.mid` (MIDIUtil)
- Render: `fluidsynth -ni FluidR3_GM.sf2 … -F …wav -r 44100`
- Export: `ffmpeg -codec:a libmp3lame -qscale:a 2`

---

# Slime Barrage — Calm Early/Normal Remix

**Files:** `moonlit-nights-calm-preview.mp3` / `.wav`  
**Script:** `compose_slime_barrage_calm.py` (sibling; battle version untouched)  
**BPM:** 148 (vs battle 175)  
**Key:** A minor (same E-phrygian color / Bb flashes as battle theme)  
**Duration:** ~88.6 s (48 bars + FluidSynth release tail; body ~77.8 s)  
**Sample rate:** 44100 Hz stereo  
**Palette:** FluidR3 GM — Synth Bass 1 (softer), Saw Lead (lower vel / longer tails), Warm Pad (more present), thin Crystal arp, soft pad chord hits (no brass), Square echo (quieter), light Channel 10 drums

## Vibe
Early-game meadow remix of the same theme family: recognizable hooks + crystal arp motifs, but softer kick, sparse hats, no breakbeat climax, pad-forward, gentler builds. Game-like mid-tempo walk, not lullaby.

## Structure
| Section    | Bars  | Feel |
|------------|-------|------|
| Intro      | 0–7   | Soft pad + thin arp, kick tease (no snare-roll drop) |
| Main       | 8–23  | Soft 4-on-floor, lead hook at reduced velocity, thin arp |
| Bridge     | 24–27 | Pad-forward, sparse arp, gentle half-note snare lift |
| Soft lift  | 28–43 | Slightly brighter (same hooks) — not boss-drop intensity |
| Loop tail  | 44–47 | Softer main-groove phrase for clean loop back |

## Originality
Same original notes/hooks as battle preview — **not** Night of Nights / ZUN / Hololive. No sampled audio.

## Tech
- Compose: `compose_slime_barrage_calm.py` → `moonlit-nights-calm-preview.mid`
- Render: `fluidsynth -ni FluidR3_GM.sf2 … -F …wav -r 44100`
- Normalize: `ffmpeg -af volume=4.0dB` (max ~−12.6 dB after)
- Export: `ffmpeg -codec:a libmp3lame -qscale:a 2`


---

# v0.8 ship notes (2026-09-26)

- Boss look locked: Pink-Mint Monarch (draft C) — procedural frames in `makeMonarchFrames`, concept PNG is reference only.
- BGM: calm early = `assets/bgm-moonlit-calm.mp3`; boss = `assets/bgm-nightfall.mp3`; procedural fallback if HTMLAudio fails.
- Mid-run boss at `BOSS_SPAWN_AT = 150` (once per run). Nightfall while alive, calm after defeat/end.
- Floating stick + soft damage numbers.


---

# v0.9 ship notes (2026-09-26)

- Portrait zoom `VIEW_ZOOM_PORTRAIT = 1.55`, landscape `VIEW_ZOOM_LANDSCAPE = 1.05` (live `VIEW_ZOOM` on resize).
- Infinite map: chunk props (`PROP_CHUNK = 360`), no player/cam world clamps, `CLEANUP_DIST` cull.
- Modes: Survival (ramp) + Timed (`WIN_TIME_TIMED = 360`). `localStorage` key `slimeBarrageMode`.
- Boss: Monarch frames 64px, r=48, HP ~2200+, damage 34; spawn still `BOSS_SPAWN_AT = 150`.
- Upgrades: Orbit Guard, Pulse Laser; Multishot capped at 6 (filtered from pool).
- Keep floating stick, soft dmg nums, calm/Nightfall BGM from v0.8. No portrait cover-fill UI zoom.


---

# v1.0 ship notes (2026-09-26)

- Mob chase speed starts at **85%** of v0.9 baseline; every minute +1% of baseline; caps at 100% (minute 15). Applies to normal / king / boss (`baseSpeed * mobSpeedMul()`).
- XP gems: blue (+10% normals), purple (kings, larger), triple gold on Monarch (~50×3). Wipe awards gems for fairness.
- `MULTISHOT_MAX = 7`; Pulse Laser intervals 2.0→0.75 (L6 gold glitter + damage bump); Omni Beam special (8→12 rays); both capped out of pool.
- Wipe HUD button (side) + Q/F; 120s cooldown; skips boss.
- Rankings: localStorage `slimeBarrageLbSurvival` / `slimeBarrageLbTimed` + player name; side-by-side UI; submit on end. No Tomo Crossroad API reuse.
- `VERSION = 'v1.0'`, cache-bust `?v=v10`.


---

# v1.0 rebuild (2026-09-26)

- Omni only in pool when `laserLevel >= 6`; Omni max 3.
- Orbiting Fairy (max 5): 1–3 fairies, modest DPS auto-snipes.
- Level-up status chips; maxed cards `card-maxed` (dimmed, not pickable); prefer available then pad maxed.
- Caps: Multi 7, Pierce 6, Laser 6, HP 200, Orbit 8 orbs, Fairy 5, Omni 3.
- HP regen +1 / 2s in PLAYING only. Wipe starts at full 120s CD.
- Monarch: frames 96, r=72, HP formula ×10.
- `VERSION = 'v1.0'`, cache-bust `?v=v10b`.
