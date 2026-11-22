// The Gilded Hour — every pixel the player sees, drawn in code on one canvas:
// themed floors, raised walls, carpets, doors, crafted wardens and Wren,
// vision cones, the HUD, the FIELD NOTES legend and the end panels.

import {
  ALARM_ALARM_AT, ALARM_SUSPICIOUS_AT, CAMERA_HALF_ANGLE, CAMERA_RANGE,
  ENTRY, EXIT, GALLERIES, GUARD_HALF_ANGLE, GUARD_RANGE, PLAYER_START,
  ROOM, VIEW_HEIGHT, VIEW_WIDTH, WALL,
} from './config.js';
import { conePolygon } from './vision.js';
import { createRandom, range } from './random.js';
import { alarmStage } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_GETAWAY = 'getaway';

const CARPET_COLORS = {
  crimson: { fill: '#5d1f26', edge: '#c9a24a', stitch: '#d8b25e' },
  emerald: { fill: '#1e4d38', edge: '#c9a24a', stitch: '#d8b25e' },
  navy: { fill: '#22335c', edge: '#c9a24a', stitch: '#d8b25e' },
};

const LOOT_ICONS = {
  idol: 'idol', astrolabe: 'astrolabe', chess: 'chess',
  orrery: 'orrery', gears: 'gears', pendulum: 'pendulum',
  codex: 'codex', draft: 'draft', letters: 'letters',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, font, color, align = 'left', baseline = 'alphabetic') {
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function pill(ctx, x, y, w, h, fill, stroke) {
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

/** Build one gallery's floor texture (1280×720 offscreen): themed floor, dark surround. */
function makeFloorTexture(def) {
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
    ctx.fillStyle = '#3c414e';
    ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
    // Large marble tiles with soft tonal shifts.
    for (let ty = 0; ty < 4; ty += 1) {
      for (let tx = 0; tx < 8; tx += 1) {
        const shade = 0.95 + random() * 0.25;
        ctx.fillStyle = `rgb(${Math.floor(60 * shade)},${Math.floor(65 * shade)},${Math.floor(78 * shade)})`;
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
    ctx.strokeStyle = 'rgba(0,0,0,0.28)';
    ctx.lineWidth = 1;
    for (let tx = 1; tx < 8; tx += 1) {
      ctx.beginPath(); ctx.moveTo(floor.x + tx * 153, floor.y); ctx.lineTo(floor.x + tx * 153, floor.y + floor.h); ctx.stroke();
    }
    for (let ty = 1; ty < 4; ty += 1) {
      ctx.beginPath(); ctx.moveTo(floor.x, floor.y + ty * 163); ctx.lineTo(floor.x + floor.w, floor.y + ty * 163); ctx.stroke();
    }
  } else if (def.floor === 'wood') {
    ctx.fillStyle = '#4a3421';
    ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
    // Planks with grain: alternating tones, seams and grain strokes.
    const plankH = 46;
    for (let row = 0; row * plankH < floor.h; row += 1) {
      const shade = 0.85 + random() * 0.35;
      ctx.fillStyle = `rgb(${Math.floor(96 * shade)},${Math.floor(68 * shade)},${Math.floor(40 * shade)})`;
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
    ctx.fillStyle = '#3b3a36';
    ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
    const tile = 122;
    for (let ty = 0; ty * tile < floor.h; ty += 1) {
      for (let tx = 0; tx * tile < floor.w; tx += 1) {
        const shade = 0.88 + random() * 0.24;
        const x = floor.x + tx * tile;
        const y = floor.y + ty * tile;
        ctx.fillStyle = `rgb(${Math.floor(66 * shade)},${Math.floor(63 * shade)},${Math.floor(56 * shade)})`;
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
  warm.addColorStop(0, 'rgba(255,196,110,0.10)');
  warm.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  const vignette = ctx.createRadialGradient(640, 380, 260, 640, 380, 760);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  return canvas;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;
  const textures = GALLERIES.map((def) => makeFloorTexture(def));

  // --- walls: thick, raised, with a lit top cap and a drop shadow on the floor.
  function drawWalls(def) {
    // Drop shadow the walls throw onto the floor.
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(ROOM.x + 5, ROOM.y + 7, ROOM.w, ROOM.h);
    // Wall body: a thick border around the room, with a gap for each door.
    ctx.fillStyle = '#232733';
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
      ctx.fillStyle = '#2a2e3c';
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
    void def;
  }

  function drawCarpet(def) {
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

  function drawShadowZone(def) {
    const zone = def.shadow;
    // Crisp double-trim border, then the dark itself.
    ctx.strokeStyle = 'rgba(140,170,255,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.lineWidth = 1;
    ctx.strokeRect(zone.x + 5, zone.y + 5, zone.w - 10, zone.h - 10);
    ctx.fillStyle = 'rgba(8,10,24,0.42)';
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    text(ctx, zone.label, zone.x + zone.w / 2, zone.y + 16, 'bold 11px Georgia, serif', 'rgba(170,190,255,0.85)', 'center');
    text(ctx, 'watcher reach halved', zone.x + zone.w / 2, zone.y + 32, '10px Georgia, serif', 'rgba(170,190,255,0.6)', 'center');
  }

  function drawEntryTrail() {
    // Wren's way in: pale cool dots from the service door to her starting point.
    ctx.fillStyle = 'rgba(200,220,255,0.9)';
    const from = { x: ENTRY.x, y: ENTRY.y - 18 };
    const to = { x: PLAYER_START.x, y: PLAYER_START.y };
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

  function drawPatrols(state) {
    ctx.strokeStyle = 'rgba(245,176,65,0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    for (const guard of state.guards) {
      ctx.beginPath();
      guard.path.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // Waypoint dots.
    ctx.fillStyle = 'rgba(245,176,65,0.9)';
    for (const guard of state.guards) {
      for (const point of guard.path) {
        ctx.beginPath(); ctx.arc(point.x, point.y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  }

  function drawFurniture(def) {
    for (const piece of [...def.blockers, ...def.low]) {
      // Base shadow so furniture stands ON the floor.
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(piece.x + 4, piece.y + 5, piece.w, piece.h);
      if (piece.kind === 'case') {
        ctx.fillStyle = '#171a24';
        ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
        ctx.fillStyle = '#2c3345';
        ctx.fillRect(piece.x + 4, piece.y + 4, piece.w - 8, piece.h - 8);
        // Glass top with a lit rim and a glint.
        ctx.fillStyle = 'rgba(150,190,230,0.20)';
        ctx.fillRect(piece.x + 6, piece.y + 6, piece.w - 12, piece.h - 12);
        ctx.strokeStyle = 'rgba(255,214,140,0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(piece.x + 2, piece.y + 2, piece.w - 4, piece.h - 4);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(piece.x + 10, piece.y + piece.h - 10); ctx.lineTo(piece.x + piece.w / 2, piece.y + 8); ctx.stroke();
      } else if (piece.kind === 'pillar') {
        ctx.fillStyle = '#3d3a33';
        ctx.beginPath(); ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, piece.w / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#57503f';
        ctx.beginPath(); ctx.arc(piece.x + piece.w / 2 - 3, piece.y + piece.h / 2 - 3, piece.w / 2 - 5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,214,140,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(piece.x + piece.w / 2, piece.y + piece.h / 2, piece.w / 2 - 2, 0, Math.PI * 2); ctx.stroke();
      } else if (piece.kind === 'statue') {
        // The rotunda plinth: stepped stone with a gold rim.
        ctx.fillStyle = '#4a4238';
        ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
        ctx.fillStyle = '#5d5344';
        ctx.fillRect(piece.x + 5, piece.y + 5, piece.w - 10, piece.h - 10);
        ctx.strokeStyle = 'rgba(201,162,74,0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(piece.x + 2, piece.y + 2, piece.w - 4, piece.h - 4);
      } else if (piece.kind === 'shelf') {
        ctx.fillStyle = '#2c2118';
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
        ctx.fillStyle = '#3a2a18';
        ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
        ctx.fillStyle = '#54401f';
        ctx.fillRect(piece.x + 4, piece.y + 4, piece.w - 8, piece.h - 8);
        ctx.strokeStyle = 'rgba(255,214,140,0.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(piece.x + 2, piece.y + 2, piece.w - 4, piece.h - 4);
        // Drawer lines.
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.moveTo(piece.x + piece.w / 2, piece.y + 4); ctx.lineTo(piece.x + piece.w / 2, piece.y + piece.h - 4); ctx.stroke();
      } else if (piece.kind === 'bench') {
        ctx.fillStyle = '#4a2f1d';
        ctx.fillRect(piece.x, piece.y, piece.w, piece.h);
        ctx.fillStyle = '#6b4526';
        ctx.fillRect(piece.x + 3, piece.y + 3, piece.w - 6, piece.h - 6);
        ctx.strokeStyle = 'rgba(255,214,140,0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(piece.x + 1, piece.y + 1, piece.w - 2, piece.h - 2);
      }
    }
  }

  function drawLootIcon(kind, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffd76a';
    ctx.strokeStyle = '#8a6a1e';
    ctx.lineWidth = 1.5;
    if (kind === 'idol') {
      // A small winged sunbird.
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(7, 2); ctx.lineTo(0, 8); ctx.lineTo(-7, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-16, -8); ctx.lineTo(-12, 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(16, -8); ctx.lineTo(12, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ff5d3a';
      ctx.beginPath(); ctx.arc(0, -13, 3, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'astrolabe' || kind === 'gears') {
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.stroke();
      for (let t = 0; t < 8; t += 1) {
        const a = (t / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
        ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
        ctx.stroke();
      }
    } else if (kind === 'chess') {
      ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-5, -6); ctx.lineTo(-9, -10); ctx.lineTo(-3, -6); ctx.lineTo(0, -12); ctx.lineTo(3, -6); ctx.lineTo(9, -10); ctx.lineTo(5, -6); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (kind === 'orrery') {
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(11, -4, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-14, 8, 2, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'pendulum') {
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 4); ctx.stroke();
      ctx.fillStyle = '#c96a7a';
      ctx.beginPath(); ctx.arc(0, 9, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else if (kind === 'codex') {
      ctx.fillStyle = '#5d2e8a';
      ctx.fillRect(-10, -8, 20, 16);
      ctx.strokeStyle = '#ffd76a';
      ctx.strokeRect(-10, -8, 20, 16);
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (kind === 'draft') {
      ctx.fillStyle = '#e8dcc0';
      ctx.fillRect(-9, -11, 18, 22);
      ctx.strokeStyle = '#8a6a1e';
      ctx.strokeRect(-9, -11, 18, 22);
      ctx.strokeStyle = '#4a3a20';
      for (let l = 0; l < 4; l += 1) {
        ctx.beginPath(); ctx.moveTo(-6, -6 + l * 4); ctx.lineTo(6, -6 + l * 4); ctx.stroke();
      }
    } else if (kind === 'letters') {
      ctx.fillStyle = '#d9c9a0';
      ctx.fillRect(-11, -7, 22, 14);
      ctx.strokeStyle = '#8a6a1e';
      ctx.strokeRect(-11, -7, 22, 14);
      ctx.beginPath(); ctx.moveTo(-11, -7); ctx.lineTo(0, 2); ctx.lineTo(11, -7); ctx.stroke();
      ctx.fillStyle = '#a3332e';
      ctx.beginPath(); ctx.arc(0, 2, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawLoot(state, time) {
    for (const item of state.loot) {
      if (item.taken) continue;
      const pulse = 0.75 + Math.sin(time * 3 + item.x) * 0.25;
      const glow = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 46);
      glow.addColorStop(0, `rgba(255,205,90,${0.5 * pulse})`);
      glow.addColorStop(1, 'rgba(255,205,90,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(item.x, item.y, 46, 0, Math.PI * 2); ctx.fill();
      // A little gold plinth under the prize.
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(item.x, item.y + 12, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
      drawLootIcon(LOOT_ICONS[item.id] || 'idol', item.x, item.y, item.prime ? 1.5 : 1.15);
      // Named label, dark-backed so it reads over any floor.
      const label = item.prime ? `★ ${item.name} — $${item.value}` : `${item.name} — $${item.value}`;
      ctx.font = 'bold 13px Georgia, serif';
      const width = ctx.measureText(label).width + 14;
      pill(ctx, item.x - width / 2, item.y - 46, width, 20, 'rgba(10,10,16,0.82)', 'rgba(201,162,74,0.9)');
      text(ctx, label, item.x, item.y - 32, 'bold 13px Georgia, serif', '#ffd76a', 'center');
    }
  }

  function drawDoors(state) {
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

  function drawCamera(camera, blind) {
    // Brass Eye on a brass pole mount from the ceiling: a brass dome, a glass
    // lens, a small sweep arc.
    ctx.strokeStyle = '#6a5320';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(camera.x, camera.y - 10); ctx.lineTo(camera.x, ROOM.y + 2); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(camera.x, camera.y + 8, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6a1e';
    ctx.beginPath(); ctx.arc(camera.x, camera.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9a24a';
    ctx.beginPath(); ctx.arc(camera.x, camera.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = blind ? '#555' : '#7fd4ff';
    ctx.beginPath(); ctx.arc(camera.x, camera.y, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(camera.x - 1.5, camera.y - 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'BRASS EYE', camera.x, camera.y - 18, 'bold 10px Georgia, serif', blind ? '#888' : '#9fdcff', 'center');
  }

  function drawCone(points, color, edgeColor) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawCones(state) {
    const blind = state.smokeTimer > 0;
    const blockers = state.guards.length ? GALLERIES[state.gallery].blockers : [];
    for (const camera of state.cameras) {
      const points = conePolygon(camera.x, camera.y, camera.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, blockers);
      drawCone(points, blind ? 'rgba(120,120,120,0.10)' : 'rgba(70,150,255,0.16)', blind ? 'rgba(150,150,150,0.35)' : 'rgba(120,190,255,0.55)');
    }
    for (const guard of state.guards) {
      const points = conePolygon(guard.x, guard.y, guard.angle, GUARD_RANGE, GUARD_HALF_ANGLE, blockers);
      const hot = guard.suspicion >= 0.75;
      drawCone(points, blind ? 'rgba(120,120,120,0.10)' : hot ? 'rgba(255,80,40,0.22)' : 'rgba(245,176,65,0.17)', blind ? 'rgba(150,150,150,0.35)' : hot ? 'rgba(255,110,70,0.7)' : 'rgba(245,190,90,0.6)');
    }
  }

  function drawGuard(guard, time) {
    const suspicious = guard.suspicion >= 0.35 && guard.suspicion < 0.75;
    const alert = guard.suspicion >= 0.75;
    const lured = guard.state === 'lured';
    const lean = alert ? 4 : 0;
    const lx = guard.x + Math.cos(guard.angle) * lean;
    const ly = guard.y + Math.sin(guard.angle) * lean;
    const bob = Math.sin(guard.walkPhase) * 1.5;

    // Soft shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath(); ctx.ellipse(guard.x, guard.y + 16, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
    // Lantern light pool on the floor (under the raised lantern).
    const lanternX = lx + Math.cos(guard.angle - 0.9) * 16;
    const lanternY = ly - 6 + Math.sin(guard.angle - 0.9) * 16;
    const pool = ctx.createRadialGradient(lanternX, lanternY + 14, 2, lanternX, lanternY + 14, 34);
    pool.addColorStop(0, 'rgba(255,190,90,0.28)');
    pool.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = pool;
    ctx.beginPath(); ctx.ellipse(lanternX, lanternY + 14, 34, 14, 0, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.translate(lx, ly + bob * 0.4);
    ctx.rotate(suspicious ? 0.12 : 0);
    // Long coat with collar and gold trim.
    ctx.fillStyle = '#1d2436';
    ctx.beginPath();
    ctx.moveTo(-9, -8); ctx.lineTo(9, -8); ctx.lineTo(12, 14); ctx.lineTo(-12, 14); ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Gold trim at the hem and collar.
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-11, 12); ctx.lineTo(11, 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(-10, -13); ctx.moveTo(7, -8); ctx.lineTo(10, -13); ctx.stroke();
    // Brass buttons, belt with brass buckle, epaulettes.
    ctx.fillStyle = '#c9a24a';
    for (let b = 0; b < 3; b += 1) { ctx.beginPath(); ctx.arc(0, -2 + b * 5, 1.6, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(-10, 4, 20, 4);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(-3, 3, 6, 6);
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(-12, -10, 6, 3);
    ctx.fillRect(6, -10, 6, 3);
    // Boots.
    ctx.fillStyle = '#101018';
    ctx.fillRect(-9, 14, 7, 4);
    ctx.fillRect(2, 14, 7, 4);
    // Key ring at the belt.
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(12, 8, 3.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 11); ctx.lineTo(14, 16); ctx.moveTo(12, 11); ctx.lineTo(10, 16); ctx.stroke();
    // Raised arm holding the brass lantern, with rim light on the coat edge.
    const armAngle = guard.angle - 0.9;
    ctx.strokeStyle = '#1d2436';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(6 + Math.cos(armAngle) * 14, -6 + Math.sin(armAngle) * 14); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,205,120,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(9, -8); ctx.lineTo(11, 10); ctx.stroke();
    // Lantern: brass cage, warm glow.
    const glow = ctx.createRadialGradient(lanternX - lx, lanternY - ly, 1, lanternX - lx, lanternY - ly, 16);
    glow.addColorStop(0, 'rgba(255,200,100,0.75)');
    glow.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(lanternX - lx, lanternY - ly, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6a1e';
    ctx.fillRect(lanternX - lx - 4, lanternY - ly - 6, 8, 12);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(lanternX - lx - 2, lanternY - ly - 4, 4, 8);
    // Head: face shaded under the peaked cap's brim.
    ctx.fillStyle = '#c89b72';
    ctx.beginPath(); ctx.arc(0, -16, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.arc(0, -15, 6.5, 0, Math.PI); ctx.fill();
    // Peaked cap with brim and badge glint.
    ctx.fillStyle = '#141824';
    ctx.beginPath(); ctx.arc(0, -18, 7.5, Math.PI, 0); ctx.fill();
    ctx.fillRect(-7.5, -19, 15, 3);
    ctx.beginPath(); ctx.ellipse(0, -12.5, 8.5, 2.5, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(0, -19, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Suspicion bubble: "?" when staring, "!" when chasing.
    if (guard.callout) {
      const bubbleY = guard.y - 38;
      if (guard.callout === '!' || guard.callout === '?') {
        ctx.fillStyle = alert ? '#ff5d3a' : '#ffd76a';
        ctx.beginPath(); ctx.arc(guard.x, bubbleY, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#101018';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        text(ctx, guard.callout, guard.x, bubbleY + 5, 'bold 13px Georgia, serif', '#101018', 'center');
      } else {
        // A speech callout ("WHAT WAS THAT?") centred above the warden, so it
        // never hides behind a panel or another actor.
        ctx.font = 'bold 12px Georgia, serif';
        const width = ctx.measureText(guard.callout).width + 16;
        pill(ctx, guard.x - width / 2, bubbleY - 26, width, 20, 'rgba(245,240,220,0.95)', '#c9a24a');
        text(ctx, guard.callout, guard.x, bubbleY - 12, 'bold 12px Georgia, serif', '#3a2a10', 'center');
      }
    }
    // Guard roster tag under the warden.
    text(ctx, `WARDEN ${guard.id}`, guard.x, guard.y + 30, '9px Georgia, serif', 'rgba(220,200,160,0.75)', 'center');
    void time;
    void lured;
  }

  function drawWren(player) {
    const stride = player.moving ? Math.sin(player.x * 0.12 + player.y * 0.12) * 2 : 0;
    // Soft shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.ellipse(player.x, player.y + 15, 13, 5, 0, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.translate(player.x, player.y);
    // Layered cloak with a torn pointed hem trailing against her stride.
    const hemTrail = player.moving ? -Math.cos(player.angle) * 5 : 0;
    ctx.fillStyle = '#232a3d';
    ctx.beginPath();
    ctx.moveTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.lineTo(11 + hemTrail, 12);
    ctx.lineTo(5 + hemTrail, 8);
    ctx.lineTo(0 + hemTrail, 14);
    ctx.lineTo(-5 + hemTrail, 8);
    ctx.lineTo(-11 + hemTrail, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Cool rim light on the cloak edge.
    ctx.strokeStyle = 'rgba(140,190,255,0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-11 + hemTrail, 12); ctx.stroke();
    // Belted tunic with a pouch.
    ctx.fillStyle = '#2e2118';
    ctx.fillRect(-7, -2, 14, 4);
    ctx.fillStyle = '#ffd76a';
    ctx.fillRect(-2, -3, 4, 5);
    ctx.fillStyle = '#4a3421';
    ctx.fillRect(6, 2, 6, 7);
    // Gloves.
    ctx.fillStyle = '#14141c';
    ctx.beginPath(); ctx.arc(-9, 2 + stride * 0.3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(9, 2 - stride * 0.3, 3, 0, Math.PI * 2); ctx.fill();
    // Deep hood with fold creases, shadowed face, black domino mask, two pale eyes.
    ctx.fillStyle = '#1a2030';
    ctx.beginPath(); ctx.arc(0, -14, 9, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,140,180,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-5, -20); ctx.quadraticCurveTo(-3, -14, -6, -8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -20); ctx.quadraticCurveTo(3, -14, 6, -8); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath(); ctx.arc(0, -13, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(-6, -16, 12, 4);
    ctx.fillStyle = '#e8f2ff';
    ctx.beginPath(); ctx.arc(-3, -14, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, -14, 1.4, 0, Math.PI * 2); ctx.fill();
    // Cool rim light on the hood.
    ctx.strokeStyle = 'rgba(150,200,255,0.9)';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(0, -14, 9, Math.PI * 1.15, Math.PI * 1.75); ctx.stroke();
    // Gold sack with stitched seam and coin bulge, once the prize is lifted.
    if (player.hasPrime) {
      ctx.fillStyle = '#c9a24a';
      ctx.beginPath(); ctx.arc(-13, 8, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a1e';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-16, 5); ctx.lineTo(-10, 11); ctx.stroke();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(-11, 4, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    text(ctx, 'WREN', player.x, player.y + 30, '9px Georgia, serif', 'rgba(200,220,255,0.8)', 'center');
  }

  function drawCoinsThrown(state) {
    for (const coin of state.coinsThrown) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath(); ctx.ellipse(coin.x, coin.y + 3, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a1e';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawFloaters(state) {
    for (const floater of state.floaters) {
      ctx.globalAlpha = Math.max(0, Math.min(1, floater.ttl));
      text(ctx, floater.text, floater.x, floater.y, 'bold 15px Georgia, serif', '#ffd76a', 'center');
      ctx.globalAlpha = 1;
    }
  }

  function drawCallouts(state) {
    for (const callout of state.callouts) {
      ctx.globalAlpha = Math.max(0, Math.min(1, callout.ttl));
      ctx.font = 'bold 12px Georgia, serif';
      const width = ctx.measureText(callout.text).width + 16;
      pill(ctx, callout.x - width / 2, callout.y - 24, width, 20, 'rgba(245,240,220,0.95)', '#c9a24a');
      text(ctx, callout.text, callout.x, callout.y - 10, 'bold 12px Georgia, serif', '#3a2a10', 'center');
      ctx.globalAlpha = 1;
    }
  }

  function drawHUD(state, extras) {
    const def = GALLERIES[state.gallery];
    // Top bar.
    ctx.fillStyle = 'rgba(8,9,15,0.94)';
    ctx.fillRect(0, 0, VIEW_WIDTH, 54);
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(0, 54, VIEW_WIDTH, 2);
    text(ctx, 'THE GILDED HOUR', 16, 22, 'bold 20px Georgia, serif', '#ffd76a');
    text(ctx, `HEIST ${state.gallery + 1} OF 3 — ${def.name}`, 16, 42, 'bold 12px Georgia, serif', '#e8d9a8');
    const objective = state.exitUnlocked
      ? 'Prime lifted — reach the green EXIT door'
      : `Lift ${def.prime} — then reach the green door`;
    text(ctx, objective, 330, 22, '13px Georgia, serif', '#d8cfae');
    text(ctx, `Routes: ${def.routes}`, 330, 42, '11px Georgia, serif', 'rgba(216,207,174,0.7)');
    text(ctx, `SCORE ${state.score}`, 640, 22, 'bold 14px Georgia, serif', '#fff');
    text(ctx, `PURSE $${state.purse}`, 640, 42, 'bold 12px Georgia, serif', '#ffd76a');
    // Alarm meter: staged, with segments and a label.
    const stage = alarmStage(state.alarm);
    const stageColor = stage === 'ALARM' ? '#ff5d3a' : stage === 'SUSPICIOUS' ? '#f5b041' : '#5ddc7a';
    // Ghost + time bonus, live.
    const ghost = state.alarmPeak < ALARM_ALARM_AT;
    text(ctx, ghost ? 'GHOST ✓' : 'GHOST ✗', 770, 22, 'bold 12px Georgia, serif', ghost ? '#5ddc7a' : 'rgba(255,93,58,0.85)');
    text(ctx, `TIME ${Math.floor(state.time)}s`, 770, 42, '11px Georgia, serif', 'rgba(216,207,174,0.8)');
    text(ctx, 'ALARM', 860, 16, 'bold 11px Georgia, serif', stageColor);
    text(ctx, stage, 860, 40, 'bold 13px Georgia, serif', stageColor);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, 930, 12, 170, 14, 7); ctx.fill();
    ctx.fillStyle = stageColor;
    if (state.alarm > 0) { roundRect(ctx, 930, 12, Math.max(8, 170 * (state.alarm / 100)), 14, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(930 + 51, 12); ctx.lineTo(930 + 51, 26); ctx.moveTo(930 + 119, 12); ctx.lineTo(930 + 119, 26); ctx.stroke();
    text(ctx, `${Math.round(state.alarm)}%`, 1106, 24, 'bold 12px Georgia, serif', stageColor);
    // Tools, finite and priced.
    text(ctx, `COIN ×${state.coins} (−200)`, 1150, 20, 'bold 12px Georgia, serif', state.coins > 0 ? '#ffd76a' : 'rgba(255,215,106,0.35)');
    text(ctx, `SMOKE ×${state.smoke}`, 1150, 40, 'bold 12px Georgia, serif', state.smoke > 0 ? '#bcd8ff' : 'rgba(188,216,255,0.35)');
  }

  function drawLegend(state) {
    const def = GALLERIES[state.gallery];
    const x = 936;
    const y = 478;
    const w = 316;
    const h = 228;
    ctx.fillStyle = 'rgba(8,9,15,0.88)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    text(ctx, 'FIELD NOTES — READ BEFORE YOU MOVE', x + 12, y + 20, 'bold 12px Georgia, serif', '#ffd76a');
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(x + 12, y + 28, w - 24, 1);
    const lines = [
      ['cone-amber', 'Warden cone — seen = suspicion rises'],
      ['cone-blue', 'Brass Eye camera — feeds the alarm'],
      ['block', 'Case / pillar / shelf — blocks sight'],
      ['shadow', 'Deep shadow — watcher reach halved'],
      ['coin', 'Coin −200 — lures the nearest warden'],
      ['smoke', 'Smoke vial — blinds all watchers'],
      ['loot', 'Loot — prime prize opens the green door'],
      ['exit', 'EXIT — green door, only after the prime'],
      ['dots', 'Entry trail — service door, south-west'],
      ['dashes', 'Patrol route — wardens walk the dashes'],
    ];
    let ly = y + 48;
    for (const [icon, label] of lines) {
      const ix = x + 14;
      if (icon === 'cone-amber' || icon === 'cone-blue') {
        ctx.fillStyle = icon === 'cone-amber' ? 'rgba(245,176,65,0.75)' : 'rgba(70,150,255,0.75)';
        ctx.beginPath(); ctx.moveTo(ix, ly - 4); ctx.lineTo(ix + 16, ly + 3); ctx.lineTo(ix, ly + 10); ctx.closePath(); ctx.fill();
      } else if (icon === 'block') {
        ctx.fillStyle = '#2c3345'; ctx.fillRect(ix, ly - 4, 14, 12);
        ctx.strokeStyle = 'rgba(255,214,140,0.8)'; ctx.lineWidth = 1.5; ctx.strokeRect(ix, ly - 4, 14, 12);
      } else if (icon === 'shadow') {
        ctx.fillStyle = 'rgba(20,26,60,0.9)'; ctx.fillRect(ix, ly - 4, 14, 12);
        ctx.strokeStyle = 'rgba(140,170,255,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(ix, ly - 4, 14, 12);
      } else if (icon === 'coin') {
        ctx.fillStyle = '#ffd76a'; ctx.beginPath(); ctx.arc(ix + 7, ly + 2, 6, 0, Math.PI * 2); ctx.fill();
      } else if (icon === 'smoke') {
        ctx.fillStyle = 'rgba(188,216,255,0.8)';
        ctx.beginPath(); ctx.arc(ix + 4, ly + 2, 4, 0, Math.PI * 2); ctx.arc(ix + 10, ly, 5, 0, Math.PI * 2); ctx.fill();
      } else if (icon === 'loot') {
        ctx.fillStyle = '#ffd76a';
        ctx.beginPath(); ctx.moveTo(ix + 7, ly - 5); ctx.lineTo(ix + 12, ly + 6); ctx.lineTo(ix + 2, ly + 6); ctx.closePath(); ctx.fill();
      } else if (icon === 'exit') {
        ctx.fillStyle = '#2f8f4f'; ctx.fillRect(ix, ly - 4, 14, 12);
        ctx.fillStyle = '#5dff9d'; ctx.fillRect(ix + 2, ly - 2, 10, 3);
      } else if (icon === 'dots') {
        ctx.fillStyle = 'rgba(200,220,255,0.95)';
        for (let d = 0; d < 4; d += 1) { ctx.beginPath(); ctx.arc(ix + 2 + d * 4, ly + 2, 2, 0, Math.PI * 2); ctx.fill(); }
      } else if (icon === 'dashes') {
        ctx.strokeStyle = 'rgba(245,176,65,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(ix, ly + 2); ctx.lineTo(ix + 15, ly + 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      text(ctx, label, ix + 22, ly + 6, '11px Georgia, serif', '#e8e0c8');
      ly += 17.5;
    }
    text(ctx, `3 routes: ${def.routes}`, x + 12, y + h - 8, 'bold 11px Georgia, serif', '#ffd76a');
  }

  function drawBanner(state) {
    if (state.bannerT <= 0 || !state.banner) return;
    ctx.font = 'bold 18px Georgia, serif';
    const width = ctx.measureText(state.banner).width + 36;
    const alpha = Math.min(1, state.bannerT);
    ctx.globalAlpha = alpha;
    pill(ctx, VIEW_WIDTH / 2 - width / 2, 64, width, 32, 'rgba(10,10,16,0.88)', '#c9a24a');
    text(ctx, state.banner, VIEW_WIDTH / 2, 86, 'bold 18px Georgia, serif', '#ffd76a', 'center');
    ctx.globalAlpha = 1;
  }

  function drawPrompt(state, nearest) {
    if (nearest) {
      text(ctx, `E — LIFT ${nearest.name} ($${nearest.value})`, state.player.x, state.player.y - 34, 'bold 13px Georgia, serif', '#ffd76a', 'center');
    } else if (state.player.x > 1120 && Math.abs(state.player.y - EXIT.y) < 90 && !state.exitUnlocked) {
      text(ctx, 'LOCKED — lift the prime prize first', state.player.x - 40, state.player.y - 34, 'bold 12px Georgia, serif', '#ffb0a0', 'center');
    }
    if (state.player.sneaking) {
      text(ctx, 'SNEAK — quieter, harder to see', state.player.x, state.player.y + 46, '11px Georgia, serif', 'rgba(188,216,255,0.9)', 'center');
    }
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(5,6,12,0.62)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    // Title panel.
    ctx.fillStyle = 'rgba(8,9,15,0.94)';
    ctx.fillRect(280, 130, 720, 440);
    ctx.strokeStyle = '#c9a24a';
    ctx.lineWidth = 3;
    ctx.strokeRect(280, 130, 720, 440);
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(280, 130, 720, 3);
    text(ctx, 'THE GILDED HOUR', 640, 196, 'bold 52px Georgia, serif', '#ffd76a', 'center');
    text(ctx, 'A NIGHT-MUSEUM HEIST IN THREE GALLERIES', 640, 228, 'bold 15px Georgia, serif', '#e8d9a8', 'center');
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(440, 244, 400, 1);
    const lines = [
      'You are Wren, cat burglar. Lift each gallery’s prime prize,',
      'then slip out the green door — unseen if you can.',
      '',
      'WASD / arrows — move      SHIFT — sneak      CLICK — walk there',
      'E — lift loot      C — coin decoy (−200, lures a warden)',
      'X — smoke vial (blinds every watcher)      P — pause',
      '',
      'Wardens watch amber cones. Brass Eye cameras sweep blue cones',
      'and feed the alarm. Cases and pillars block sight; deep shadow',
      'halves a watcher’s reach. Ghost bonus for never raising ALARM.',
    ];
    let y = 282;
    for (const line of lines) {
      text(ctx, line, 640, y, line === '' ? '12px Georgia, serif' : '14px Georgia, serif', '#e8e0c8', 'center');
      y += 22;
    }
    text(ctx, 'PRESS SPACE OR CLICK TO BEGIN', 640, 528, 'bold 17px Georgia, serif', '#5dff9d', 'center');
    if (best > 0) text(ctx, `Best run: ${best}`, 640, 556, '13px Georgia, serif', '#d8cfae', 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(5,6,12,0.6)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    text(ctx, 'PAUSED', 640, 330, 'bold 44px Georgia, serif', '#ffd76a', 'center');
    text(ctx, 'P to resume  ·  R to restart the run', 640, 372, '15px Georgia, serif', '#e8e0c8', 'center');
  }

  function drawCaught(state) {
    ctx.fillStyle = 'rgba(40,4,4,0.55)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = 'rgba(12,4,4,0.95)';
    ctx.fillRect(330, 130, 620, 300);
    ctx.strokeStyle = '#ff5d3a';
    ctx.lineWidth = 3;
    ctx.strokeRect(330, 130, 620, 300);
    text(ctx, 'CAUGHT!', 640, 198, 'bold 52px Georgia, serif', '#ff5d3a', 'center');
    text(ctx, state.caughtReason, 640, 236, '15px Georgia, serif', '#f0d8d0', 'center');
    text(ctx, `Score ${state.score}   ·   Purse $${state.purse}   ·   Heist ${state.gallery + 1} of 3`, 640, 274, '14px Georgia, serif', '#e8e0c8', 'center');
    text(ctx, 'The wardens hand Wren to the night watch. The museum keeps its gold.', 640, 310, '13px Georgia, serif', 'rgba(232,224,200,0.8)', 'center');
    text(ctx, 'R — TRY AGAIN      SPACE — TITLE', 640, 370, 'bold 16px Georgia, serif', '#ffd76a', 'center');
  }

  function drawGetaway(state) {
    ctx.fillStyle = 'rgba(4,10,6,0.55)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.fillStyle = 'rgba(8,14,9,0.96)';
    ctx.fillRect(300, 120, 680, 480);
    ctx.strokeStyle = '#5dff9d';
    ctx.lineWidth = 3;
    ctx.strokeRect(300, 120, 680, 480);
    text(ctx, 'CLEAN GETAWAY', 640, 182, 'bold 48px Georgia, serif', '#5dff9d', 'center');
    text(ctx, 'Three galleries. Three primes. Dawn breaks over an empty museum.', 640, 214, '14px Georgia, serif', '#d8e8d8', 'center');
    let y = 258;
    for (const summary of state.totals.galleries) {
      text(ctx, summary.gallery, 340, y, 'bold 14px Georgia, serif', '#e8e0c8');
      const bits = [];
      if (summary.ghost) bits.push(`Ghost +$${summary.ghostBonus}`);
      bits.push(`Time +$${summary.timeBonus} (${summary.seconds}s)`);
      text(ctx, bits.join('  ·  '), 940, y, '13px Georgia, serif', '#ffd76a', 'right');
      y += 28;
    }
    ctx.fillStyle = '#5dff9d';
    ctx.fillRect(340, y, 600, 1);
    y += 32;
    text(ctx, `LOOT PURSE  $${state.totals.purse}`, 340, y, 'bold 16px Georgia, serif', '#fff');
    y += 30;
    text(ctx, `FINAL SCORE  ${state.totals.score}`, 340, y, 'bold 20px Georgia, serif', '#ffd76a');
    y += 30;
    text(ctx, `Tools left: ${state.totals.coinsLeft} coins · ${state.totals.smokeLeft} smoke  ·  Run time ${state.totals.time}s`, 340, y, '13px Georgia, serif', '#d8e8d8');
    text(ctx, 'R — RUN IT AGAIN      SPACE — TITLE', 640, 556, 'bold 16px Georgia, serif', '#5dff9d', 'center');
  }

  function drawPlay(state, extras, screen) {
    const def = GALLERIES[state.gallery];
    ctx.drawImage(textures[state.gallery], 0, 0);
    drawShadowZone(def);
    drawCarpet(def);
    drawEntryTrail();
    drawPatrols(state);
    drawFurniture(def);
    drawLoot(state, state.time);
    drawCoinsThrown(state);
    drawCones(state);
    for (const camera of state.cameras) drawCamera(camera, state.smokeTimer > 0);
    drawWalls(def);
    drawDoors(state);
    if (screen === SCREEN_CAUGHT) {
      // On the caught screen the catching warden is drawn over Wren.
      drawWren(state.player);
      for (const guard of state.guards) drawGuard(guard, state.time);
    } else {
      for (const guard of state.guards) drawGuard(guard, state.time);
      drawWren(state.player);
    }
    drawFloaters(state);
    drawCallouts(state);
    drawHUD(state, extras);
    drawLegend(state);
    drawBanner(state);
    drawPrompt(state, extras.nearest);
    if (state.smokeTimer > 0) {
      text(ctx, `SMOKE — watchers blind ${state.smokeTimer.toFixed(1)}s`, 640, 108, 'bold 14px Georgia, serif', '#bcd8ff', 'center');
    }
  }

  return {
    draw(state, screen, extras = {}) {
      ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      if (screen === SCREEN_TITLE) {
        drawPlay(state, extras, screen);
        drawTitle(state, extras.best || 0);
        return;
      }
      drawPlay(state, extras, screen);
      if (screen === SCREEN_PAUSED) drawPaused();
      else if (screen === SCREEN_CAUGHT) drawCaught(state);
      else if (screen === SCREEN_GETAWAY) drawGetaway(state);
    },
  };
}
