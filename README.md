# The Gilded Hour

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/Revaaa28/makefun-best-heist-game-20261122/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/Revaaa28/makefun-best-heist-game-20261122/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A night-museum heist game for the [make.fun best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559). You are Wren, cat burglar: lift the prime prize of each of three galleries — The Sunbird Gallery, The Clockwork Hall, The Manuscript Vault — then slip out the green door, unseen if you can.

Named wardens patrol dashed routes with amber vision cones that are genuinely blocked by display cases, pillars and shelves; the HUD's ON THE FLOOR panel reads each warden's live state from the simulation. Brass Eye cameras sweep blue cones and feed a staged alarm (CALM / SUSPICIOUS / ALARM). A timed laser gate guards one chokepoint per gallery — cross it LIVE and it trips. Deep shadow halves a watcher's reach. Tools cost: coin decoys (−200 score, lure the nearest warden), smoke vials (blind every watcher) and EMP pulses (−300 score, kill the Brass Eyes and laser gates for 5 s). Ghost and time bonuses reward a clean run.

## Play

Serve `game/` with any static server and open `game/index.html` in desktop Chrome. No network, no build step, no assets — all art and sound are drawn and synthesised in code.

- **WASD / arrows** — move (click the floor to walk there)
- **Shift** — sneak (slower, quieter, harder to see)
- **E** — lift loot
- **C** — toss a coin decoy (−200 score)
- **X** — smoke vial
- **Q** — EMP pulse (−300 score; Brass Eyes and laser gates dark for 5 s)
- **Tab** — the three routes through the gallery, drawn on the floor
- **P** — pause, **R** — restart, **M** — mute

## Files

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `game/src/config.js` — numbers, galleries, loot, patrols, laser gates, routes
- `game/src/world.js` — the simulation (guards, cameras, alarm, tools, doors)
- `game/src/vision.js` — line of sight and occluded vision cones
- `game/src/laser-grid.js` — the laser gates: timing, trip test, painting
- `game/src/guard-ai.js` — each warden's display state, read from the simulation
- `game/src/render.js` — the frame orchestrator; the painting itself lives in
  `game/src/render/` — `draw-room.js` (floors, walls, furniture, doors),
  `draw-cones.js` (vision cones, patrols, cameras), `draw-actors.js` (Wren,
  wardens, loot), `draw-routes.js` (the route overlay), `draw-hud.js` (top
  bar, warden and tool panels, legend, banner, caption), `draw-screens.js`
- `game/src/input.js`, `game/src/audio.js`, `game/src/shots.js`, `game/src/main.js` — input, WebAudio bleeps, screenshot scenes, boot and loop
