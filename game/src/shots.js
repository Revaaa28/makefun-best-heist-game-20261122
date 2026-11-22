// The four screenshot scenes behind ?shot=cover|title|getaway|caught.
// Each one is a real render of the game's own code: the world is reset, then
// posed into a genuine game state (positions, suspicion, alarm, loot) that a
// player could reach, and painted. The same seed always gives the same frame.

import { STEP } from './config.js';
import { SCREEN_CAUGHT, SCREEN_GETAWAY, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

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
  first.x = 600;
  first.y = 320;
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

/** Title: the living hall behind the panel — wardens on patrol, cones sweeping. */
function stageTitle(world) {
  world.reset();
  for (let i = 0; i < 3 / STEP; i += 1) {
    world.step(STEP, { x: 0, y: 0 }, false, false, false, false);
  }
  return { screen: SCREEN_TITLE, best: 0 };
}

/** Getaway: the final gallery's exit, the run totalled. */
function stageGetaway(world) {
  world.reset();
  world.buildGallery(2);
  const state = world.state;
  state.time = 246;
  state.score = 5750;
  state.purse = 4800;
  state.coins = 1;
  state.smoke = 1;
  for (const item of state.loot) item.taken = true;
  state.exitUnlocked = true;
  state.player.hasPrime = true;
  state.player.x = 1180;
  state.player.y = 380;
  state.player.angle = 0;
  state.summaries = [
    { gallery: 'THE SUNBIRD GALLERY', ghost: true, ghostBonus: 300, timeBonus: 410, seconds: 38 },
    { gallery: 'THE CLOCKWORK HALL', ghost: false, ghostBonus: 0, timeBonus: 190, seconds: 82 },
    { gallery: 'THE MANUSCRIPT VAULT', ghost: true, ghostBonus: 300, timeBonus: 60, seconds: 108 },
  ];
  state.totals = {
    purse: 4800,
    score: 5750,
    time: 246,
    coinsLeft: 1,
    smokeLeft: 1,
    galleries: state.summaries.slice(),
  };
  state.getaway = true;
  state.alarm = 12;
  state.alarmPeak = 64;
  return { screen: SCREEN_GETAWAY, best: 5750 };
}

/** Caught: a warden on top of Wren, the alarm full red. */
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
  state.player.x = 640;
  state.player.y = 470;
  state.player.angle = Math.PI / 2;
  const first = state.guards[0];
  first.x = 648;
  first.y = 452;
  first.angle = angleTo(first.x, first.y, state.player.x, state.player.y);
  first.suspicion = 1;
  first.state = 'chase';
  first.callout = '!';
  first.calloutT = 99;
  state.guards[1].x = 420;
  state.guards[1].y = 520;
  state.guards[1].angle = angleTo(420, 520, state.player.x, state.player.y);
  state.guards[1].suspicion = 0.6;
  state.guards[1].state = 'suspicious';
  state.guards[1].callout = '?';
  state.guards[1].calloutT = 99;
  state.cameras[0].angle = angleTo(state.cameras[0].x, state.cameras[0].y, state.player.x, state.player.y);
  state.cameras[0].spotted = true;
  state.alarm = 100;
  state.alarmPeak = 100;
  state.caught = true;
  state.caughtReason = 'A warden caught Wren in the open.';
  return { screen: SCREEN_CAUGHT, best: 0 };
}

/** Set `world` to the named scene and return the screen to draw over it. */
export function stageShot(name, world) {
  if (name === 'cover') return stageCover(world);
  if (name === 'title') return stageTitle(world);
  if (name === 'getaway') return stageGetaway(world);
  if (name === 'caught') return stageCaught(world);
  return stageCover(world);
}
