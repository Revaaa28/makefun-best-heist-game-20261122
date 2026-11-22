// The Gilded Hour — every number the game runs on: canvas, timings, tools and the
// three galleries (their loot, furniture, patrols, cameras and shadow corners).
// One gallery per heist; lifting a gallery's prime prize unlocks its green door.

export const STEP = 1 / 60;
export const BEST_KEY = 'gilded-hour-best';
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;
export const HUD_HEIGHT = 54;

// The walkable room inside the walls (canvas coordinates).
export const ROOM = { x: 30, y: 62, w: 1220, h: 652 };
export const WALL = 12;

// Movement and watcher tuning.
export const PLAYER_SPEED = 150;
export const PLAYER_SNEAK_SPEED = 84;
export const PLAYER_RADIUS = 13;
export const GUARD_SPEED = 96;
export const GUARD_CHASE_SPEED = 168;
export const GUARD_RANGE = 215;
export const GUARD_HALF_ANGLE = 0.56; // ~32 degrees each side
export const CAMERA_RANGE = 340;
export const CAMERA_HALF_ANGLE = 0.45; // ~26 degrees each side
export const LOOT_RADIUS = 42;

// Suspicion: 0 calm, 0.35 "?" suspicious stare, 0.75 "!" chase.
export const SUSPICIOUS_AT = 0.35;
export const CHASE_AT = 0.75;
export const SUSPICION_FILL_CLOSE = 0.62;
export const SUSPICION_FILL_MID = 0.38;
export const SUSPICION_FILL_FAR = 0.22;
export const SUSPICION_DECAY = 0.24;
export const SNEAK_SIGHT_FACTOR = 0.55;
export const SHADOW_RANGE_FACTOR = 0.5;

// Alarm: 0–100, CALM below 30, SUSPICIOUS 30–70, ALARM above 70, 100 is lockdown.
export const ALARM_SUSPICIOUS_AT = 30;
export const ALARM_ALARM_AT = 70;
export const ALARM_CAMERA_RATE = 15;
export const ALARM_SUSPICIOUS_RATE = 4;
export const ALARM_CHASE_RATE = 10;
export const ALARM_DECAY = 6;

// Tools: finite and priced.
export const COIN_COUNT = 3;
export const COIN_COST = 200;
export const COIN_LURE_RADIUS = 430;
export const SMOKE_COUNT = 2;
export const SMOKE_SECONDS = 4;

// Bonuses paid at each green door.
export const GHOST_BONUS = 300;
export const TIME_BONUS_PER_SECOND = 5;
export const TIME_BONUS_WINDOW = 120;

// Where Wren slips in (south-west service door) and where she leaves (east wall).
export const ENTRY = { x: 165, y: 694, chipX: 118, chipY: 636 };
export const PLAYER_START = { x: 305, y: 585 };
export const EXIT = { x: 1238, y: 380, zone: { x: 1186, y: 336, w: 52, h: 92 } };

// A furniture piece: { x, y, w, h, kind }.
// kind 'case' | 'pillar' | 'statue' | 'shelf' | 'desk' blocks sight and movement;
// kind 'bench' | 'rope' blocks movement only (low enough to see over).
export const GALLERIES = [
  {
    name: 'THE SUNBIRD GALLERY',
    floor: 'marble',
    floorSeed: 101,
    carpet: 'crimson',
    prime: 'The Sunbird Idol',
    routes: 'carpet · shadow west · east aisle',
    blockers: [
      { x: 604, y: 208, w: 72, h: 64, kind: 'statue' }, // Sunbird rotunda plinth
      { x: 260, y: 210, w: 110, h: 52, kind: 'case' }, // astrolabe case
      { x: 910, y: 210, w: 110, h: 52, kind: 'case' }, // chess queen case
      { x: 470, y: 360, w: 100, h: 50, kind: 'case' }, // centre case west
      { x: 710, y: 360, w: 100, h: 50, kind: 'case' }, // centre case east
      { x: 170, y: 140, w: 44, h: 44, kind: 'pillar' },
      { x: 1066, y: 140, w: 44, h: 44, kind: 'pillar' },
      { x: 170, y: 560, w: 44, h: 44, kind: 'pillar' },
      { x: 1066, y: 560, w: 44, h: 44, kind: 'pillar' },
    ],
    low: [
      { x: 420, y: 92, w: 120, h: 26, kind: 'bench' },
      { x: 740, y: 92, w: 120, h: 26, kind: 'bench' },
      { x: 560, y: 640, w: 160, h: 26, kind: 'bench' },
    ],
    loot: [
      { id: 'idol', name: 'The Sunbird Idol', value: 1000, prime: true, x: 640, y: 302 },
      { id: 'astrolabe', name: 'Astrolabe', value: 400, prime: false, x: 315, y: 292 },
      { id: 'chess', name: 'Chess Queen', value: 300, prime: false, x: 965, y: 292 },
    ],
    shadow: { x: 56, y: 400, w: 190, h: 260, label: 'DEEP SHADOW' },
    cameras: [
      { x: 520, y: 150, base: 1.57, sweep: 0.85, speed: 0.55, phase: 0 },
      { x: 760, y: 150, base: 1.57, sweep: 0.85, speed: 0.55, phase: 2.1 },
    ],
    patrols: [
      [{ x: 640, y: 150 }, { x: 830, y: 250 }, { x: 640, y: 350 }, { x: 450, y: 250 }],
      [{ x: 400, y: 480 }, { x: 880, y: 480 }, { x: 880, y: 580 }, { x: 400, y: 580 }],
      [{ x: 1000, y: 200 }, { x: 1150, y: 380 }, { x: 1000, y: 560 }, { x: 880, y: 380 }],
    ],
  },
  {
    name: 'THE CLOCKWORK HALL',
    floor: 'wood',
    floorSeed: 202,
    carpet: 'emerald',
    prime: 'The Brass Orrery',
    routes: 'carpet · shadow east · west aisle',
    blockers: [
      { x: 580, y: 200, w: 120, h: 60, kind: 'desk' }, // orrery table
      { x: 280, y: 220, w: 100, h: 50, kind: 'case' }, // gear train case
      { x: 900, y: 220, w: 100, h: 50, kind: 'case' }, // pendulum case
      { x: 640, y: 120, w: 90, h: 44, kind: 'case' }, // clock case north
      { x: 300, y: 560, w: 140, h: 40, kind: 'desk' }, // workbench west
      { x: 840, y: 560, w: 140, h: 40, kind: 'desk' }, // workbench east
      { x: 170, y: 140, w: 44, h: 44, kind: 'pillar' },
      { x: 1066, y: 140, w: 44, h: 44, kind: 'pillar' },
      { x: 1066, y: 420, w: 44, h: 44, kind: 'pillar' },
    ],
    low: [
      { x: 420, y: 92, w: 120, h: 26, kind: 'bench' },
      { x: 740, y: 92, w: 120, h: 26, kind: 'bench' },
      { x: 560, y: 660, w: 160, h: 26, kind: 'bench' },
    ],
    loot: [
      { id: 'orrery', name: 'The Brass Orrery', value: 1200, prime: true, x: 640, y: 292 },
      { id: 'gears', name: 'Silver Gear Train', value: 450, prime: false, x: 330, y: 302 },
      { id: 'pendulum', name: 'Jeweled Pendulum', value: 350, prime: false, x: 950, y: 302 },
    ],
    shadow: { x: 1004, y: 420, w: 190, h: 240, label: 'DEEP SHADOW' },
    cameras: [
      { x: 520, y: 150, base: 1.57, sweep: 0.8, speed: 0.6, phase: 1.0 },
      { x: 760, y: 150, base: 1.57, sweep: 0.8, speed: 0.6, phase: 3.4 },
    ],
    patrols: [
      [{ x: 640, y: 150 }, { x: 820, y: 330 }, { x: 640, y: 470 }, { x: 460, y: 330 }],
      [{ x: 300, y: 420 }, { x: 520, y: 420 }, { x: 520, y: 620 }, { x: 300, y: 620 }],
      [{ x: 980, y: 180 }, { x: 1140, y: 380 }, { x: 980, y: 600 }, { x: 830, y: 380 }],
    ],
  },
  {
    name: 'THE MANUSCRIPT VAULT',
    floor: 'stone',
    floorSeed: 303,
    carpet: 'navy',
    prime: 'The Illuminated Codex',
    routes: 'carpet · shadow north · south aisle',
    blockers: [
      { x: 600, y: 210, w: 80, h: 60, kind: 'desk' }, // codex lectern
      { x: 120, y: 180, w: 60, h: 240, kind: 'shelf' }, // west bookshelves
      { x: 1100, y: 180, w: 60, h: 240, kind: 'shelf' }, // east bookshelves
      { x: 300, y: 300, w: 120, h: 50, kind: 'desk' }, // draft desk
      { x: 860, y: 300, w: 120, h: 50, kind: 'desk' }, // letters desk
      { x: 170, y: 560, w: 44, h: 44, kind: 'pillar' },
      { x: 1066, y: 560, w: 44, h: 44, kind: 'pillar' },
      { x: 480, y: 480, w: 90, h: 46, kind: 'case' }, // relic case
      { x: 710, y: 480, w: 90, h: 46, kind: 'case' }, // relic case
    ],
    low: [
      { x: 420, y: 92, w: 120, h: 26, kind: 'bench' },
      { x: 740, y: 92, w: 120, h: 26, kind: 'bench' },
      { x: 560, y: 640, w: 160, h: 26, kind: 'bench' },
    ],
    loot: [
      { id: 'codex', name: 'The Illuminated Codex', value: 1500, prime: true, x: 640, y: 302 },
      { id: 'draft', name: "Poet's First Draft", value: 500, prime: false, x: 360, y: 382 },
      { id: 'letters', name: 'Sealed Royal Letters', value: 400, prime: false, x: 920, y: 382 },
    ],
    shadow: { x: 56, y: 120, w: 180, h: 220, label: 'DEEP SHADOW' },
    cameras: [
      { x: 520, y: 150, base: 1.57, sweep: 0.9, speed: 0.65, phase: 0.5 },
      { x: 760, y: 150, base: 1.57, sweep: 0.9, speed: 0.65, phase: 2.6 },
    ],
    patrols: [
      [{ x: 640, y: 150 }, { x: 830, y: 250 }, { x: 640, y: 350 }, { x: 450, y: 250 }],
      [{ x: 280, y: 480 }, { x: 640, y: 600 }, { x: 1000, y: 480 }, { x: 640, y: 420 }],
      [{ x: 1000, y: 180 }, { x: 1140, y: 380 }, { x: 1000, y: 560 }, { x: 880, y: 380 }],
    ],
  },
];
