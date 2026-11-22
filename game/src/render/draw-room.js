// The room itself: floor textures (marble, wood, stone — one per gallery),
// raised walls, the carpet junction, the deep-shadow zone, furniture and
// dressing, the entry trail, and the two doors. Nothing here moves; the
// actors and watchers are painted over this by the other render modules.

import {
  ENTRY, EXIT, ROOM, VIEW_HEIGHT, VIEW_WIDTH, WALL,
} from '../config.js';
import { createRandom, range } from '../random.js';
import { pill, text } from './canvas-helpers.js';

const CARPET_COLORS = {
  crimson: { fill: '#8e2f3c', edge: '#c9a24a', stitch: '#d8b25e' },
  emerald: { fill: '#2a7a54', edge: '#c9a24a', stitch: '#d8b25e' },
  navy: { fill: '#33508c', edge: '#c9a24a', stitch: '#d8b25e' },
};

/** Build one gallery's floor texture (1280×720 offscreen): themed floor, dark surround. */
export function makeFloorTexture(def) {
  const canvas = document.createElement('canvas');
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;
  const ctx = canvas.getContext('2d');
  const random = createRandom(def.floorSeed);

  // The night outside the room: near-black with a faint pattern.
  ctx.fillStyle = '#0b0d13';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < 260; i += 1) {
    ctx.fillRect(random() * VIEW_WIDTH, random() * VIEW_HEIGHT, 2, 2);
  }

  const floor = { x: ROOM.x, y: ROOM.y, w: ROOM.w, h: ROOM.h };
  if (def.floor === 'marble') {
    ctx.fillStyle = '#525b74';
    ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
    // Large marble tiles with soft tonal shifts.
    for (let ty = 0; ty < 4; ty += 1) {
      for (let tx = 0; tx < 8; tx += 1) {
        const shade = 0.95 + random() * 0.25;
        ctx.fillStyle = `rgb(${Math.floor(100 * shade)},${Math.floor(108 * shade)},${Math.floor(132 * shade)})`;
        ctx.fillRect(floor.x + tx * 153, floor.y + ty * 163, 153, 163);
      }
    }
    // Veins: wandering pale lines across the marble.
    ctx.lineWidth = 1.4;
    for (let v = 0; v < 46; v += 1) {
      let x = floor.x + random() * floor.w;
      let y = floor.y + random() * floor.h;
      ctx.strokeStyle = `rgba(190,200,220,${0.07 + random() * 0.14})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 5; s += 1) {
        x += range(random, -90, 90);
        y += range(random, -60, 60);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Tile seams.
    ctx.strokeStyle = 'rgba(0,0,0,0.20)';
    ctx.lineWidth = 1;
    for (let tx = 1; tx < 8; tx += 1) {
      ctx.beginPath(); ctx.moveTo(floor.x + tx * 153, floor.y); ctx.lineTo(floor.x + tx * 153, floor.y + floor.h); ctx.stroke();
    }
    for (let ty = 1; ty < 4; ty += 1) {
      ctx.beginPath(); ctx.moveTo(floor.x, floor.y + ty * 163); ctx.lineTo(floor.x + floor.w, floor.y + ty * 163); ctx.stroke();
    }
  } else if (def.floor === 'wood') {
    ctx.fillStyle = '#6b4a2c';
    ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
    // Planks with grain: alternating tones, seams and grain strokes.
    const plankH = 46;
    for (let row = 0; row * plankH < floor.h; row += 1) {
      const shade = 0.85 + random() * 0.35;
      ctx.fillStyle = `rgb(${Math.floor(146 * shade)},${Math.floor(106 * shade)},${Math.floor(62 * shade)})`;
      ctx.fillRect(floor.x, floor.y + row * plankH, floor.w, plankH);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(floor.x, floor.y + row * plankH); ctx.lineTo(floor.x + floor.w, floor.y + row * plankH); ctx.stroke();
      // Grain: a few wavy darker lines per plank.
      ctx.strokeStyle = 'rgba(40,24,10,0.35)';
      ctx.lineWidth = 1;
      for (let g = 0; g < 5; g += 1) {
        const gy = floor.y + row * plankH + 8 + random() * (plankH - 16);
        ctx.beginPath();
        ctx.moveTo(floor.x, gy);
        for (let x = floor.x; x <= floor.x + floor.w; x += 90) {
          ctx.lineTo(x, gy + Math.sin(x * 0.01 + g) * 3 + range(random, -2, 2));
        }
        ctx.stroke();
      }
      // Plank end seams, staggered.
      const seamX = floor.x + ((row * 397) % 900) + 180;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.moveTo(seamX, floor.y + row * plankH); ctx.lineTo(seamX, floor.y + (row + 1) * plankH); ctx.stroke();
    }
    // Brass gear inlays on the floor.
    ctx.strokeStyle = 'rgba(201,162,74,0.35)';
    ctx.lineWidth = 2;
    for (const [gx, gy, gr] of [[330, 470, 46], [950, 470, 46], [640, 600, 30]]) {
      ctx.beginPath(); ctx.arc(gx, gy, gr, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(gx, gy, gr * 0.55, 0, Math.PI * 2); ctx.stroke();
      for (let t = 0; t < 8; t += 1) {
        const a = (t / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(gx + Math.cos(a) * gr * 0.55, gy + Math.sin(a) * gr * 0.55);
        ctx.lineTo(gx + Math.cos(a) * gr, gy + Math.sin(a) * gr);
        ctx.stroke();
      }
    }
  } else {
    // Bevelled stone: large flags with lit top edges and dark bottoms.
    ctx.fillStyle = '#57534a';
    ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
    const tile = 122;
    for (let ty = 0; ty * tile < floor.h; ty += 1) {
      for (let tx = 0; tx * tile < floor.w; tx += 1) {
        const shade = 0.88 + random() * 0.24;
        const x = floor.x + tx * tile;
        const y = floor.y + ty * tile;
        ctx.fillStyle = `rgb(${Math.floor(106 * shade)},${Math.floor(100 * shade)},${Math.floor(88 * shade)})`;
        ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.fillRect(x + 2, y + 2, tile - 4, 3);
        ctx.fillRect(x + 2, y + 2, 3, tile - 4);
        ctx.fillStyle = 'rgba(0,0,0,0.30)';
        ctx.fillRect(x + 2, y + tile - 5, tile - 4, 3);
        ctx.fillRect(x + tile - 5, y + 2, 3, tile - 4);
        // Speckle.
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let s = 0; s < 6; s += 1) ctx.fillRect(x + 6 + random() * (tile - 14), y + 6 + random() * (tile - 14), 2, 2);
      }
    }
  }

  // Warm lamplight pools and a cool vignette so the room reads at a glance.
  const warm = ctx.createRadialGradient(640, 330, 60, 640, 330, 620);
  warm.addColorStop(0, 'rgba(255,196,110,0.16)');
  warm.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  const vignette = ctx.createRadialGradient(640, 380, 260, 640, 380, 760);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.20)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  return canvas;
}

// --- walls: thick, raised, with a lit top cap and a drop shadow on the floor.
export function drawWalls(ctx) {
  // Drop shadow the walls throw onto the floor.
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(ROOM.x + 5, ROOM.y + 7, ROOM.w, ROOM.h);
  // Wall body: a thick border around the room, with a gap for each door.
  ctx.fillStyle = '#303747';
  const gaps = [
    { x: ENTRY.x - 38, y: ROOM.y + ROOM.h - WALL, w: 76, h: WALL }, // service door (south)
    { x: ROOM.x + ROOM.w - WALL, y: EXIT.y - 48, w: WALL, h: 96 }, // exit (east)
  ];
  ctx.fillRect(ROOM.x - WALL, ROOM.y - WALL, ROOM.w + 2 * WALL, WALL); // north
  ctx.fillRect(ROOM.x - WALL, ROOM.y + ROOM.h, ROOM.w + 2 * WALL, WALL); // south, minus gap
  ctx.fillRect(ROOM.x - WALL, ROOM.y, WALL, ROOM.h); // west
  ctx.fillRect(ROOM.x + ROOM.w, ROOM.y, WALL, ROOM.h); // east, minus gap
  // Cut the door gaps back to floor colour.
  for (const gap of gaps) {
    ctx.fillStyle = '#39415a';
    ctx.fillRect(gap.x, gap.y, gap.w, gap.h);
  }
  // Lit top cap along the inner edge, and a gold picture rail on the north wall.
  ctx.fillStyle = 'rgba(255,214,140,0.55)';
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.w, 3);
  ctx.fillRect(ROOM.x, ROOM.y, 3, ROOM.h);
  ctx.fillStyle = 'rgba(201,162,74,0.5)';
  ctx.fillRect(ROOM.x, ROOM.y + 18, ROOM.w, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(ROOM.x, ROOM.y + ROOM.h - 3, ROOM.w, 3);
  ctx.fillRect(ROOM.x + ROOM.w - 3, ROOM.y, 3, ROOM.h);
}

export function drawCarpet(ctx, def) {
  const colors = CARPET_COLORS[def.carpet];
  // One junction: a vertical runner and a horizontal runner crossing at centre.
  const runners = [
    { x: 590, y: 200, w: 100, h: 460 },
    { x: 300, y: 400, w: 680, h: 70 },
  ];
  for (const runner of runners) {
    // Base shadow so the carpet sits ON the floor.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(runner.x + 3, runner.y + 4, runner.w, runner.h);
    ctx.fillStyle = colors.fill;
    ctx.fillRect(runner.x, runner.y, runner.w, runner.h);
    // Woven stitch lines along both long edges.
    ctx.strokeStyle = colors.stitch;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(runner.x + 7, runner.y + 7, runner.w - 14, runner.h - 14);
    ctx.setLineDash([]);
    // Gold border.
    ctx.strokeStyle = colors.edge;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(runner.x + 2, runner.y + 2, runner.w - 4, runner.h - 4);
    // Fringe at the short ends.
    ctx.strokeStyle = '#d9c48a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (runner.w < runner.h) {
      for (let x = runner.x + 6; x < runner.x + runner.w; x += 8) {
        ctx.moveTo(x, runner.y); ctx.lineTo(x, runner.y - 9);
        ctx.moveTo(x, runner.y + runner.h); ctx.lineTo(x, runner.y + runner.h + 9);
      }
    } else {
      for (let y = runner.y + 6; y < runner.y + runner.h; y += 8) {
        ctx.moveTo(runner.x, y); ctx.lineTo(runner.x - 9, y);
        ctx.moveTo(runner.x + runner.w, y); ctx.lineTo(runner.x + runner.w + 9, y);
      }
    }
    ctx.stroke();
  }
  // Rotunda double trim around the prime plinth.
  ctx.strokeStyle = 'rgba(201,162,74,0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(640, 250, 104, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(640, 250, 96, 0, Math.PI * 2); ctx.stroke();
}

export function drawShadowZone(ctx, def) {
  const zone = def.shadow;
  // Crisp double-trim border, then the dark itself.
  ctx.strokeStyle = 'rgba(140,170,255,0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
  ctx.lineWidth = 1;
  ctx.strokeRect(zone.x + 5, zone.y + 5, zone.w - 10, zone.h - 10);
  ctx.fillStyle = 'rgba(8,10,24,0.36)';
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  text(ctx, zone.label, zone.x + zone.w / 2, zone.y + 16, 'bold 11px Georgia, serif', 'rgba(170,190,255,0.85)', 'center');
  text(ctx, 'watcher reach halved', zone.x + zone.w / 2, zone.y + 32, '10px Georgia, serif', 'rgba(170,190,255,0.6)', 'center');
}

export function drawEntryTrail(ctx) {
  // Wren's way in: pale cool dots from the service door to her starting point.
  ctx.fillStyle = 'rgba(200,220,255,0.9)';
  const from = { x: ENTRY.x, y: ENTRY.y - 18 };
  const to = { x: 305, y: 585 };
  const steps = 26;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = from.x + (to.x - from.x) * t + Math.sin(t * 9) * 6;
    const y = from.y + (to.y - from.y) * t;
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Worn path under the dots.
  ctx.strokeStyle = 'rgba(190,170,130,0.16)';
  ctx.lineWidth = 16;
  ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
}

export function drawFurniture(ctx, def) {
  for (const piece of [...def.blockers, ...def.low]) {
    // Base shadow so furniture stands ON the floor.
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(piece.x + 4, piece.y + 5, piece.w, piece.h);
    if (piece.kind === 'case') {
      ctx.fillStyle = '#252b3d';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = '#414c66';
      ctx.fillRect(piece.x + 4, piece.y + 4, piece.w - 8, piece.h - 8);
      // Glass top with a lit rim and a glint.
      ctx.fillStyle = 'rgba(160,200,240,0.30)';
      ctx.fillRect(piece.x + 6, piece.y + 6, piece.w - 12, piece.h - 12);
      ctx.strokeStyle = 'rgba(255,214,140,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(piece.x + 2, piece.y + 2, piece.w - 4, piece.h - 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(piece.x + 10, piece.y + piece.h - 10); ctx.lineTo(piece.x + piece.w / 2, piece.y + 8); ctx.stroke();
    } else if (piece.kind === 'pillar') {
      ctx.fillStyle = '#50493c';
      ctx.beginPath(); ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, piece.w / 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6e6350';
      ctx.beginPath(); ctx.arc(piece.x + piece.w / 2 - 3, piece.y + piece.h / 2 - 3, piece.w / 2 - 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,214,140,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, piece.w / 2 - 2, 0, Math.PI * 2); ctx.stroke();
    } else if (piece.kind === 'statue') {
      // The rotunda plinth: stepped stone with a gold rim.
      ctx.fillStyle = '#5d5344';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = '#71634e';
      ctx.fillRect(piece.x + 5, piece.y + 5, piece.w - 10, piece.h - 10);
      ctx.strokeStyle = 'rgba(201,162,74,0.9)';
      ctx.lineWidth = 2;
      ctx.strokeRect(piece.x + 2, piece.y + 2, piece.w - 4, piece.h - 4);
    } else if (piece.kind === 'shelf') {
      ctx.fillStyle = '#40301f';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      // Book spines in rows.
      const colors = ['#7a3b2e', '#2e5d4a', '#31456b', '#6b5a2e', '#5d2e4a'];
      for (let row = 0; row < 4; row += 1) {
        const y = piece.y + 8 + row * ((piece.h - 16) / 4);
        let x = piece.x + 5;
        let i = 0;
        while (x < piece.x + piece.w - 8) {
          const bw = 6 + ((i * 7 + row * 3) % 9);
          ctx.fillStyle = colors[(i + row) % colors.length];
          ctx.fillRect(x, y, bw, (piece.h - 16) / 4 - 4);
          x += bw + 1;
          i += 1;
        }
      }
      ctx.strokeStyle = 'rgba(255,214,140,0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(piece.x + 1, piece.y + 1, piece.w - 2, piece.h - 2);
    } else if (piece.kind === 'desk') {
      ctx.fillStyle = '#4e3820';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = '#6f522c';
      ctx.fillRect(piece.x + 4, piece.y + 4, piece.w - 8, piece.h - 8);
      ctx.strokeStyle = 'rgba(255,214,140,0.6)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(piece.x + 2, piece.y + 2, piece.w - 4, piece.h - 4);
      // Drawer lines.
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.moveTo(piece.x + piece.w / 2, piece.y + 4); ctx.lineTo(piece.x + piece.w / 2, piece.y + piece.h - 4); ctx.stroke();
    } else if (piece.kind === 'bench') {
      ctx.fillStyle = '#634226';
      ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
      ctx.fillStyle = '#8a5f31';
      ctx.fillRect(piece.x + 3, piece.y + 3, piece.w - 6, piece.h - 6);
      ctx.strokeStyle = 'rgba(255,214,140,0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(piece.x + 1, piece.y + 1, piece.w - 2, piece.h - 2);
    }
  }
}

// Dressing from the gallery's decor list: a gold floor medallion, empty
// plinths waiting for their next treasure, leafy planters in the corners and
// stanchion ropes sagging in front of the cases. Pure paint — the simulation
// never sees any of it, so sight-lines and patrols are untouched.
export function drawDecor(ctx, def) {
  const decor = def.decor;
  if (!decor) return;
  if (decor.medallion) {
    const { x, y, r } = decor.medallion;
    ctx.strokeStyle = 'rgba(201,162,74,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r * 0.68, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(201,162,74,0.4)';
    for (let t = 0; t < 8; t += 1) {
      const a = (t / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.68, y + Math.sin(a) * r * 0.68);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(201,162,74,0.4)';
      ctx.stroke();
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.84, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  }
  for (const plinth of decor.plinths) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(plinth.x + 4, plinth.y + 5, plinth.w, plinth.h);
    ctx.fillStyle = '#5d5344';
    ctx.fillRect(plinth.x, plinth.y, plinth.w, plinth.h);
    ctx.fillStyle = '#71634e';
    ctx.fillRect(plinth.x + 4, plinth.y + 4, plinth.w - 8, plinth.h - 8);
    // An empty velvet cushion on top, waiting for a prize.
    ctx.fillStyle = '#6e2430';
    ctx.fillRect(plinth.x + 8, plinth.y + 8, plinth.w - 16, plinth.h - 16);
    ctx.strokeStyle = 'rgba(201,162,74,0.75)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(plinth.x + 2, plinth.y + 2, plinth.w - 4, plinth.h - 4);
  }
  for (const plant of decor.plants) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(plant.x, plant.y + 8, 17, 6, 0, 0, Math.PI * 2); ctx.fill();
    // Terracotta pot with a brass rim, then layered foliage.
    ctx.fillStyle = '#8a4a2a';
    ctx.beginPath(); ctx.arc(plant.x, plant.y + 3, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(plant.x, plant.y + 3, 10, 0, Math.PI * 2); ctx.stroke();
    const leaves = [[0, -6, 11], [-8, -1, 8], [8, -2, 8], [-4, -11, 7], [5, -10, 7], [0, 1, 8]];
    for (const [dx, dy, r] of leaves) {
      ctx.fillStyle = '#2e6b3e';
      ctx.beginPath(); ctx.arc(plant.x + dx, plant.y + dy, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(90,180,110,0.5)';
      ctx.beginPath(); ctx.arc(plant.x + dx - 2, plant.y + dy - 2, r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const rope of decor.ropes) {
    // Two brass posts and the crimson rope sagging between them.
    ctx.strokeStyle = '#7c2934';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(rope.x1, rope.y);
    ctx.quadraticCurveTo((rope.x1 + rope.x2) / 2, rope.y + 13, rope.x2, rope.y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,150,150,0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(rope.x1, rope.y - 1.5);
    ctx.quadraticCurveTo((rope.x1 + rope.x2) / 2, rope.y + 11, rope.x2, rope.y - 1.5);
    ctx.stroke();
    for (const px of [rope.x1, rope.x2]) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(px, rope.y + 7, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#8a6a1e';
      ctx.fillRect(px - 1.8, rope.y - 8, 3.6, 15);
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(px, rope.y - 10, 3.4, 0, Math.PI * 2); ctx.fill();
    }
  }
}

export function drawDoors(ctx, state) {
  // ENTRY — service door, south-west: a real leaf slightly ajar, warm amber
  // corridor light spilling in, a lit blade sign, an in-frame chip.
  const spill = ctx.createLinearGradient(ENTRY.x, ENTRY.y, ENTRY.x, ENTRY.y - 130);
  spill.addColorStop(0, 'rgba(255,176,80,0.34)');
  spill.addColorStop(1, 'rgba(255,176,80,0)');
  ctx.fillStyle = spill;
  ctx.beginPath();
  ctx.moveTo(ENTRY.x - 40, ENTRY.y);
  ctx.lineTo(ENTRY.x + 40, ENTRY.y);
  ctx.lineTo(ENTRY.x + 62, ENTRY.y - 130);
  ctx.lineTo(ENTRY.x - 62, ENTRY.y - 130);
  ctx.closePath();
  ctx.fill();
  // The door leaf, ajar: a parallelogram leaning into the room.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(ENTRY.x - 42, ENTRY.y - 8, 84, 10);
  ctx.save();
  ctx.translate(ENTRY.x - 34, ENTRY.y - 4);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#6b4a26';
  ctx.fillRect(0, -46, 12, 46);
  ctx.fillStyle = '#8a6234';
  ctx.fillRect(2, -44, 8, 42);
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath(); ctx.arc(9, -24, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,214,140,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ENTRY.x - 38, ENTRY.y - 2, 76, 4);
  // Lit blade sign on the wall above the door.
  pill(ctx, ENTRY.x - 52, ENTRY.y + 4, 104, 18, 'rgba(20,14,6,0.95)', '#ffb050');
  text(ctx, 'SERVICE DOOR', ENTRY.x, ENTRY.y + 17, 'bold 10px Georgia, serif', '#ffb050', 'center');
  // In-frame chip label.
  pill(ctx, ENTRY.chipX - 8, ENTRY.chipY - 11, 148, 22, 'rgba(10,10,16,0.85)', 'rgba(255,176,80,0.95)');
  text(ctx, 'IN — SERVICE DOOR', ENTRY.chipX + 66, ENTRY.chipY + 4, 'bold 12px Georgia, serif', '#ffc27a', 'center');

  // EXIT — east wall: framed double door, glowing EXIT sign, green spill.
  const green = ctx.createLinearGradient(EXIT.x - 150, EXIT.y, EXIT.x, EXIT.y);
  green.addColorStop(0, 'rgba(60,220,120,0)');
  green.addColorStop(1, 'rgba(60,220,120,0.30)');
  ctx.fillStyle = green;
  ctx.fillRect(EXIT.x - 150, EXIT.y - 48, 150, 96);
  const open = state.exitUnlocked;
  ctx.fillStyle = open ? '#1d5c33' : '#14291c';
  ctx.fillRect(EXIT.x - 24, EXIT.y - 48, 24, 96);
  ctx.fillStyle = open ? '#2f8f4f' : '#1d3a26';
  ctx.fillRect(EXIT.x - 24, EXIT.y - 48, 11, 96);
  ctx.fillRect(EXIT.x - 12, EXIT.y + 0, 11, 48);
  ctx.strokeStyle = open ? '#5dff9d' : '#3a7a52';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(EXIT.x - 24, EXIT.y - 48, 24, 96);
  // Frame + sign.
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x - 28, EXIT.y - 54, 32, 108);
  const signGlow = open ? 'rgba(80,255,140,0.95)' : 'rgba(80,200,120,0.5)';
  pill(ctx, EXIT.x - 78, EXIT.y - 78, 72, 22, 'rgba(6,20,10,0.95)', signGlow);
  text(ctx, 'EXIT', EXIT.x - 42, EXIT.y - 63, 'bold 13px Georgia, serif', open ? '#5dff9d' : '#7ac98f', 'center');
  if (!open) {
    text(ctx, 'LOCKED — lift the prime', EXIT.x - 130, EXIT.y + 66, '11px Georgia, serif', 'rgba(200,220,200,0.75)', 'center');
  } else {
    text(ctx, 'THE GREEN DOOR STANDS OPEN', EXIT.x - 130, EXIT.y + 66, 'bold 11px Georgia, serif', '#5dff9d', 'center');
  }
}
