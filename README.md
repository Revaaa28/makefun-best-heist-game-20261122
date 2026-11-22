# The Gilded Hour

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Revaaa28/makefun-best-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Revaaa28/makefun-best-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A night-museum heist game for the [make.fun best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559). You are Wren, cat burglar: lift the prime prize of each of three galleries — The Sunbird Gallery, The Clockwork Hall, The Manuscript Vault — then slip out the green door, unseen if you can.

Wardens patrol dashed routes with amber vision cones that are genuinely blocked by display cases, pillars and shelves. Brass Eye cameras sweep blue cones and feed a staged alarm (CALM / SUSPICIOUS / ALARM). Deep shadow halves a watcher's reach. Tools cost: coin decoys (−200 score, lure the nearest warden) and smoke vials (blind every watcher). Ghost and time bonuses reward a clean run.

## Play

Serve `game/` with any static server and open `game/index.html` in desktop Chrome. No network, no build step, no assets — all art and sound are drawn and synthesised in code.

- **WASD / arrows** — move (click the floor to walk there)
- **Shift** — sneak (slower, quieter, harder to see)
- **E** — lift loot
- **C** — toss a coin decoy (−200 score)
- **X** — smoke vial
- **P** — pause, **R** — restart, **M** — mute

## Files

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `game/src/config.js` — numbers, galleries, loot, patrols
- `game/src/world.js` — the simulation (guards, cameras, alarm, tools, doors)
- `game/src/vision.js` — line of sight and occluded vision cones
- `game/src/render.js` — every pixel, drawn in code
- `game/src/input.js`, `game/src/audio.js`, `game/src/shots.js`, `game/src/main.js` — input, WebAudio bleeps, screenshot scenes, boot and loop
