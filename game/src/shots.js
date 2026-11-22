// The four screenshot scenes behind ?shot=cover|hall|vault|caught.
// Each one is a real render of the game's own code: the world is reset, then
// posed into a genuine game state (positions, suspicion, alarm, loot) that a
// player could reach, and painted. All four are live play frames — thief,
// wardens with cones, cameras, loot and the alarm meter in every shot — so
// the contact sheet shows the whole run: Heist 1 mid-steal, Heist 2 in the
// Clockwork Hall, Heist 3 escaping the Vault, and the chase when it goes
// wrong. The same seed always gives the same frame.

import { SCREEN_PLAY } from './render.js';

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

/**
 * Pose the cover: the tensest fair moment of Heist 1. Wren mid-crossing on
 * the carpet junction between the two centre cases; Warden 1's amber cone
 * dead on her ("?", alarm climbing); Warden 2 lured off-route by her coin
 * ("WHAT WAS THAT?"); a Brass Eye's blue sweep on her too; the glowing
 * Sunbird Idol named in its rotunda; the service door and its chip at the
 * south-west; the green exit waiting at the east wall.
 */
function stageCover(world) {
  const state = world.state;
  world.reset();
  state.time = 38;
  // The astrolabe is already lifted: purse and score show real progress.
  const astrolabe = state.loot.find((item) => item.id === 'astrolabe');
  astrolabe.taken = true;
  state.score = 400;
  state.purse = 400;
  state.coins = 2; // One coin already spent — it is on the floor, doing its job.
  // Wren mid-crossing on the carpet junction.
  state.player.x = 640;
  state.player.y = 455;
  state.player.angle = Math.PI / 2;
  state.player.moving = true;
  // Warden 1: cone dead on Wren, suspicious stare.
  const first = state.guards[0];
  first.x = 575;
  first.y = 345;
  first.angle = angleTo(first.x, first.y, state.player.x, state.player.y);
  first.suspicion = 0.55;
  first.state = 'suspicious';
  first.callout = '?';
  first.calloutT = 99;
  // Warden 2: lured off his route by Wren's coin, frozen mid-callout.
  const second = state.guards[1];
  second.x = 905;
  second.y = 520;
  second.angle = angleTo(second.x, second.y, 905, 470);
  second.state = 'lured';
  second.luredX = 905;
  second.luredY = 520;
  second.luredT = 2.5;
  second.callout = 'WHAT WAS THAT?';
  second.calloutT = 99;
  state.coinsThrown.push({ x: 905, y: 520, ttl: 99 });
  // Warden 3: still walking his east loop.
  const third = state.guards[2];
  third.x = 1000;
  third.y = 380;
  third.angle = angleTo(third.x, third.y, 1150, 380);
  // Brass Eye 1 sweeping blue straight onto Wren.
  const eye = state.cameras[0];
  eye.angle = angleTo(eye.x, eye.y, state.player.x, state.player.y);
  eye.spotted = true;
  state.cameras[1].angle = angleTo(state.cameras[1].x, state.cameras[1].y, 760, 420);
  // Alarm mid-climb, SUSPICIOUS.
  state.alarm = 46;
  state.alarmPeak = 46;
  state.banner = '';
  state.bannerT = 0;
  return { screen: SCREEN_PLAY, best: 0 };
}

/**
 * Heist 2, live: the Clockwork Hall. The gear train is already in Wren's
 * sack and she is crossing the emerald carpet toward the Brass Orrery on its
 * table; Warden 1 has half-seen her ("?"), a Brass Eye's blue cone is on her
 * too, and the alarm sits at SUSPICIOUS. The other wardens walk their loops
 * past the workbenches, so the hall's whole machine is on show.
 */
function stageHall(world) {
  const state = world.state;
  world.reset();
  world.buildGallery(1);
  state.time = 118;
  state.score = 2350;
  state.purse = 2200;
  state.coins = 2;
  state.smoke = 2;
  // The Silver Gear Train is lifted; the orrery still waits on its table.
  const gears = state.loot.find((item) => item.id === 'gears');
  gears.taken = true;
  // Wren mid-crossing on the carpet, heading north for the orrery.
  state.player.x = 640;
  state.player.y = 452;
  state.player.angle = -Math.PI / 2;
  state.player.moving = true;
  // Warden 1: half-seen her from the west, stopped for a suspicious stare.
  const first = state.guards[0];
  first.x = 520;
  first.y = 318;
  first.angle = angleTo(first.x, first.y, state.player.x, state.player.y);
  first.suspicion = 0.5;
  first.state = 'suspicious';
  first.callout = '?';
  first.calloutT = 99;
  // Warden 2: walking his south-west rectangle past the workbench.
  const second = state.guards[1];
  second.x = 470;
  second.y = 615;
  second.angle = 0;
  // Warden 3: on his east loop, cone sweeping the east aisle.
  const third = state.guards[2];
  third.x = 990;
  third.y = 330;
  third.angle = angleTo(third.x, third.y, 1140, 380);
  // Brass Eye 1 has her; Eye 2 sweeps the centre.
  const eye = state.cameras[0];
  eye.angle = angleTo(eye.x, eye.y, state.player.x, state.player.y);
  eye.spotted = true;
  state.cameras[1].angle = angleTo(state.cameras[1].x, state.cameras[1].y, 700, 420);
  // Alarm mid-climb, SUSPICIOUS — the ghost bonus is still alive.
  state.alarm = 42;
  state.alarmPeak = 52;
  state.banner = '';
  state.bannerT = 0;
  return { screen: SCREEN_PLAY, best: 0 };
}

/**
 * Heist 3, live: the escape from the Manuscript Vault. Every prize is
 * lifted, the Codex is in the gold sack on Wren's back, the green door
 * stands open and she is three strides from it — with the alarm at ALARM,
 * a Brass Eye locked on her and Warden 3 in a full chase ("!") two rooms
 * behind. The run's whole stake in one frame.
 */
function stageVault(world) {
  const state = world.state;
  world.reset();
  world.buildGallery(2);
  state.time = 232;
  state.score = 5300;
  state.purse = 4800;
  state.coins = 1;
  state.smoke = 1;
  for (const item of state.loot) item.taken = true;
  state.exitUnlocked = true;
  state.player.hasPrime = true;
  // Wren at full stretch for the green door, prime on her back.
  state.player.x = 1104;
  state.player.y = 380;
  state.player.angle = 0;
  state.player.moving = true;
  // Warden 3: full chase down the east aisle, cone hot on her.
  const third = state.guards[2];
  third.x = 950;
  third.y = 392;
  third.angle = angleTo(third.x, third.y, state.player.x, state.player.y);
  third.suspicion = 1;
  third.state = 'chase';
  third.callout = '!';
  third.calloutT = 99;
  // Warden 1: mid-hall, staring after her.
  const first = state.guards[0];
  first.x = 640;
  first.y = 300;
  first.angle = angleTo(first.x, first.y, 830, 250);
  first.suspicion = 0.55;
  first.state = 'suspicious';
  first.callout = '?';
  first.calloutT = 99;
  // Warden 2: hurrying up the south aisle.
  const second = state.guards[1];
  second.x = 500;
  second.y = 520;
  second.angle = angleTo(second.x, second.y, 640, 600);
  // Brass Eye 2 locked onto the doorway; Eye 1 sweeps the shelves.
  const eye = state.cameras[1];
  eye.angle = angleTo(eye.x, eye.y, state.player.x, state.player.y);
  eye.spotted = true;
  state.cameras[0].angle = angleTo(state.cameras[0].x, state.cameras[0].y, 430, 330);
  // Alarm at ALARM — the ghost bonus is gone, the door is the only way out.
  state.alarm = 84;
  state.alarmPeak = 88;
  state.banner = 'THE GREEN DOOR STANDS OPEN — GO!';
  state.bannerT = 99;
  return { screen: SCREEN_PLAY, best: 0 };
}

/**
 * The chase, live: no end panel — the moment itself. Wren broke cover with
 * two prizes in her sack and Warden 1 is on her heels, cone gone red, "!"
 * up, a second warden closing from the west and a Brass Eye feeding the
 * alarm, which sits one breath from lockdown.
 */
function stageCaught(world) {
  const state = world.state;
  world.reset();
  state.time = 52;
  state.score = 700;
  state.purse = 700;
  const astrolabe = state.loot.find((item) => item.id === 'astrolabe');
  const chess = state.loot.find((item) => item.id === 'chess');
  astrolabe.taken = true;
  chess.taken = true;
  // Wren running north-east, caught in the open.
  state.player.x = 660;
  state.player.y = 470;
  state.player.angle = -0.55;
  state.player.moving = true;
  // Warden 1: on her heels, full chase.
  const first = state.guards[0];
  first.x = 596;
  first.y = 512;
  first.angle = angleTo(first.x, first.y, state.player.x, state.player.y);
  first.suspicion = 1;
  first.state = 'chase';
  first.callout = '!';
  first.calloutT = 99;
  // Warden 2: closing in from the west, suspicious stare.
  const second = state.guards[1];
  second.x = 420;
  second.y = 432;
  second.angle = angleTo(second.x, second.y, state.player.x, state.player.y);
  second.suspicion = 0.6;
  second.state = 'suspicious';
  second.callout = '?';
  second.calloutT = 99;
  // Warden 3: still walking his east loop.
  const third = state.guards[2];
  third.x = 1000;
  third.y = 380;
  third.angle = angleTo(third.x, third.y, 1150, 380);
  // Brass Eye 1 has her too.
  const eye = state.cameras[0];
  eye.angle = angleTo(eye.x, eye.y, state.player.x, state.player.y);
  eye.spotted = true;
  state.cameras[1].angle = angleTo(state.cameras[1].x, state.cameras[1].y, 760, 420);
  // Alarm one breath from lockdown.
  state.alarm = 97;
  state.alarmPeak = 100;
  state.banner = 'SPOTTED — THE CHASE IS ON';
  state.bannerT = 99;
  return { screen: SCREEN_PLAY, best: 0 };
}

/** Set `world` to the named scene and return the screen to draw over it. */
export function stageShot(name, world) {
  if (name === 'cover') return stageCover(world);
  if (name === 'hall') return stageHall(world);
  if (name === 'vault') return stageVault(world);
  if (name === 'caught') return stageCaught(world);
  return stageCover(world);
}
