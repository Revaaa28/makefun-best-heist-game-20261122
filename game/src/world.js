// The Gilded Hour — the simulation: Wren, three wardens per gallery on patrol,
// sweeping Brass Eye cameras, a staged alarm, priced tools, loot and doors.
// Everything the renderer draws comes from this state, and nothing here draws.

import {
  ALARM_ALARM_AT, ALARM_CAMERA_RATE, ALARM_CHASE_RATE, ALARM_DECAY,
  ALARM_SUSPICIOUS_AT, ALARM_SUSPICIOUS_RATE, CAMERA_HALF_ANGLE, CAMERA_RANGE,
  CHASE_AT, COIN_COST, COIN_COUNT, COIN_LURE_RADIUS, EMP_COST, EMP_COUNT,
  EMP_SECONDS, ENTRY, EXIT, GALLERIES,
  GHOST_BONUS, GUARD_CHASE_SPEED, GUARD_HALF_ANGLE, GUARD_RANGE, GUARD_SPEED,
  LASER_ALARM,
  LOOT_RADIUS, PLAYER_RADIUS, PLAYER_SNEAK_SPEED, PLAYER_SPEED, PLAYER_START,
  ROOM, SMOKE_COUNT, SMOKE_SECONDS, SNEAK_SIGHT_FACTOR, SHADOW_RANGE_FACTOR,
  STEP, SUSPICIOUS_AT, SUSPICION_DECAY, SUSPICION_FILL_CLOSE, SUSPICION_FILL_FAR,
  SUSPICION_FILL_MID, TIME_BONUS_PER_SECOND, TIME_BONUS_WINDOW, WALL,
} from './config.js';
import { canSee, pointInRect } from './vision.js';
import { buildLasers, crossedLiveLaser } from './laser-grid.js';

export const EVENT_CAUGHT = 1;
export const EVENT_GALLERY = 2;
export const EVENT_GETAWAY = 4;
export const EVENT_LOOT = 8;
export const EVENT_PRIME = 16;

/** Alarm stage label for a 0–100 alarm value. */
export function alarmStage(alarm) {
  if (alarm >= ALARM_ALARM_AT) return 'ALARM';
  if (alarm >= ALARM_SUSPICIOUS_AT) return 'SUSPICIOUS';
  return 'CALM';
}

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function turnToward(angle, target, maxStep) {
  let delta = target - angle;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  if (Math.abs(delta) <= maxStep) return target;
  return angle + Math.sign(delta) * maxStep;
}

export function createWorld(random) {
  const state = {
    gallery: 0,
    score: 0,
    purse: 0,
    coins: COIN_COUNT,
    smoke: SMOKE_COUNT,
    smokeTimer: 0,
    emp: EMP_COUNT,
    empTimer: 0,
    lasers: [],
    showRoutes: false,
    alarm: 0,
    alarmPeak: 0,
    time: 0,
    galleryTime: 0,
    exitUnlocked: false,
    caught: false,
    caughtReason: '',
    getaway: false,
    ghost: false,
    player: { x: PLAYER_START.x, y: PLAYER_START.y, angle: -Math.PI / 2, moving: false, sneaking: false, hasPrime: false },
    guards: [],
    cameras: [],
    loot: [],
    coinsThrown: [],
    callouts: [],
    floaters: [],
    banner: '',
    bannerT: 0,
    caption: '',
    captionT: 0,
    summaries: [],
    totals: null,
    seenCount: 0,
  };

  let audio = null;

  function galleryDef() { return GALLERIES[state.gallery]; }

  function allSolids() {
    const def = galleryDef();
    return def.blockers.concat(def.low);
  }

  function sightBlockers() { return galleryDef().blockers; }

  function buildGallery(index) {
    const def = GALLERIES[index];
    state.gallery = index;
    state.exitUnlocked = false;
    state.alarm = 0;
    state.alarmPeak = 0;
    state.galleryTime = 0;
    state.smokeTimer = 0;
    state.empTimer = 0;
    state.lasers = buildLasers(def);
    state.coinsThrown = [];
    state.callouts = [];
    state.floaters = [];
    state.banner = '';
    state.bannerT = 0;
    // A location caption names the room as Wren enters it; it fades in play
    // and the screenshot scenes hold it open.
    state.caption = `HEIST ${index + 1} OF 3 — ${def.name}`;
    state.captionT = 3.5;
    state.player.x = PLAYER_START.x;
    state.player.y = PLAYER_START.y;
    state.player.angle = -Math.PI / 2;
    state.player.hasPrime = false;
    state.loot = def.loot.map((item) => ({ ...item, taken: false }));
    state.cameras = def.cameras.map((camera) => ({ ...camera, angle: camera.base, spotted: false }));
    state.guards = def.patrols.map((path, i) => {
      const start = path[0];
      return {
        id: i + 1,
        name: def.names[i],
        path,
        wp: 1,
        x: start.x,
        y: start.y,
        angle: angleTo(start.x, start.y, path[1].x, path[1].y),
        state: 'patrol',
        suspicion: 0,
        dwellT: 0,
        scanT: random() * 2,
        luredX: 0,
        luredY: 0,
        luredT: 0,
        luredTotal: 0,
        loseT: 0,
        walkPhase: random() * 6,
        callout: '',
        calloutT: 0,
        wasSuspicious: false,
        wasChase: false,
      };
    });
  }

  function playerInShadow() {
    const zone = galleryDef().shadow;
    return pointInRect(state.player.x, state.player.y, zone);
  }

  function watcherRange(base) {
    return playerInShadow() ? base * SHADOW_RANGE_FACTOR : base;
  }

  function moveCircle(entity, dx, dy, radius) {
    const solids = allSolids();
    const inner = {
      x: ROOM.x + WALL + radius,
      y: ROOM.y + WALL + radius,
      w: ROOM.w - 2 * (WALL + radius),
      h: ROOM.h - 2 * (WALL + radius),
    };
    let nx = entity.x + dx;
    let ny = entity.y + dy;
    nx = Math.max(inner.x, Math.min(inner.x + inner.w, nx));
    ny = Math.max(inner.y, Math.min(inner.y + inner.h, ny));
    // Axis-separated slide against furniture.
    let testX = nx;
    let testY = entity.y;
    for (const solid of solids) {
      if (circleHitsRect(testX, testY, radius, solid)) { testX = entity.x; break; }
    }
    entity.x = testX;
    testX = entity.x;
    testY = ny;
    for (const solid of solids) {
      if (circleHitsRect(testX, testY, radius, solid)) { testY = entity.y; break; }
    }
    entity.y = testY;
  }

  function circleHitsRect(cx, cy, radius, rect) {
    const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function addCallout(text, x, y, seconds) {
    state.callouts.push({ text, x, y, ttl: seconds });
  }

  function addFloater(text, x, y) {
    state.floaters.push({ text, x, y, ttl: 1.6 });
  }

  function setBanner(text, seconds) {
    state.banner = text;
    state.bannerT = seconds;
  }

  function catchPlayer(reason) {
    if (state.caught || state.getaway) return EVENT_CAUGHT;
    state.caught = true;
    state.caughtReason = reason;
    if (audio) audio.caught();
    return EVENT_CAUGHT;
  }

  function liftLoot() {
    const player = state.player;
    let best = null;
    let bestDistance = LOOT_RADIUS;
    for (const item of state.loot) {
      if (item.taken) continue;
      const distance = Math.hypot(item.x - player.x, item.y - player.y);
      if (distance < bestDistance) { best = item; bestDistance = distance; }
    }
    if (!best) return 0;
    best.taken = true;
    state.score += best.value;
    state.purse += best.value;
    addFloater(`+$${best.value}`, best.x, best.y - 26);
    if (best.prime) {
      state.exitUnlocked = true;
      player.hasPrime = true;
      setBanner('THE GREEN DOOR STANDS OPEN — GO!', 3.5);
      if (audio) audio.prime();
      if (audio) audio.door();
      return EVENT_LOOT | EVENT_PRIME;
    }
    if (audio) audio.lift();
    return EVENT_LOOT;
  }

  function throwCoin() {
    if (state.coins <= 0) return 0;
    const player = state.player;
    state.coins -= 1;
    state.score -= COIN_COST;
    const coinX = player.x + Math.cos(player.angle) * 95;
    const coinY = player.y + Math.sin(player.angle) * 95;
    const clampedX = Math.max(ROOM.x + WALL + 20, Math.min(ROOM.x + ROOM.w - WALL - 20, coinX));
    const clampedY = Math.max(ROOM.y + WALL + 20, Math.min(ROOM.y + ROOM.h - WALL - 20, coinY));
    state.coinsThrown.push({ x: clampedX, y: clampedY, ttl: 6 });
    if (audio) audio.coin();
    let nearest = null;
    let nearestDistance = COIN_LURE_RADIUS;
    for (const guard of state.guards) {
      const distance = Math.hypot(guard.x - clampedX, guard.y - clampedY);
      if (distance < nearestDistance) { nearest = guard; nearestDistance = distance; }
    }
    if (nearest) {
      nearest.state = 'lured';
      nearest.luredX = clampedX;
      nearest.luredY = clampedY;
      nearest.luredTotal = 0;
      nearest.suspicion = 0;
      nearest.wasSuspicious = false;
      nearest.wasChase = false;
    }
    return 0;
  }

  function useSmoke() {
    if (state.smoke <= 0) return 0;
    state.smoke -= 1;
    state.smokeTimer = SMOKE_SECONDS;
    if (audio) audio.smoke();
    return 0;
  }

  // The EMP "Brass Blind": a priced pulse that kills every Brass Eye and
  // laser gate for EMP_SECONDS. Wardens are flesh and blood — it does
  // nothing to them.
  function useEmp() {
    if (state.emp <= 0 || state.empTimer > 0) return 0;
    state.emp -= 1;
    state.score -= EMP_COST;
    state.empTimer = EMP_SECONDS;
    setBanner('EMP — EYES AND LASERS DARK', 2.5);
    if (audio) audio.emp();
    return 0;
  }

  function finishGallery() {
    const ghost = state.alarmPeak < ALARM_ALARM_AT;
    const timeBonus = Math.max(0, Math.round((TIME_BONUS_WINDOW - state.galleryTime) * TIME_BONUS_PER_SECOND));
    const ghostBonus = ghost ? GHOST_BONUS : 0;
    state.score += ghostBonus + timeBonus;
    state.summaries.push({
      gallery: GALLERIES[state.gallery].name,
      ghost,
      ghostBonus,
      timeBonus,
      seconds: Math.round(state.galleryTime),
    });
    return { ghost, ghostBonus, timeBonus };
  }

  function tryExit() {
    if (!state.exitUnlocked) return 0;
    const player = state.player;
    if (!pointInRect(player.x, player.y, EXIT.zone)) return 0;
    const result = finishGallery();
    if (state.gallery >= GALLERIES.length - 1) {
      state.getaway = true;
      state.ghost = result.ghost;
      state.totals = {
        purse: state.purse,
        score: state.score,
        time: Math.round(state.time),
        coinsLeft: state.coins,
        smokeLeft: state.smoke,
        empLeft: state.emp,
        galleries: state.summaries.slice(),
      };
      if (audio) audio.getaway();
      return EVENT_GETAWAY;
    }
    buildGallery(state.gallery + 1);
    setBanner(`HEIST ${state.gallery + 1} OF 3 — ${GALLERIES[state.gallery].name}`, 3);
    if (audio) audio.door();
    return EVENT_GALLERY;
  }

  function stepGuard(guard, dt) {
    const player = state.player;
    const blockers = sightBlockers();
    const blind = state.smokeTimer > 0;

    // Perception: a watcher that can see Wren fills suspicion; otherwise it drains.
    let sees = false;
    if (!blind && guard.state !== 'lured') {
      const range = watcherRange(GUARD_RANGE);
      sees = canSee(guard.x, guard.y, guard.angle, range, GUARD_HALF_ANGLE, player.x, player.y, blockers);
    }
    if (sees) {
      const distance = Math.hypot(player.x - guard.x, player.y - guard.y);
      let rate = distance < 120 ? SUSPICION_FILL_CLOSE : distance < 180 ? SUSPICION_FILL_MID : SUSPICION_FILL_FAR;
      if (player.sneaking) rate *= SNEAK_SIGHT_FACTOR;
      guard.suspicion = Math.min(1, guard.suspicion + rate * dt);
      guard.loseT = 0;
    } else if (guard.state !== 'lured') {
      guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt);
      if (guard.state === 'chase') guard.loseT += dt;
    }

    const wasSuspicious = guard.suspicion >= SUSPICIOUS_AT;
    const wasChase = guard.suspicion >= CHASE_AT;
    if (wasSuspicious && !guard.wasSuspicious && audio) audio.suspicious();
    if (wasChase && !guard.wasChase && audio) audio.chase();
    guard.wasSuspicious = wasSuspicious;
    guard.wasChase = wasChase;

    // Alarm pressure from a guard that has Wren in sight.
    if (sees && guard.suspicion >= SUSPICIOUS_AT) {
      state.alarm = Math.min(100, state.alarm + (guard.suspicion >= CHASE_AT ? ALARM_CHASE_RATE : ALARM_SUSPICIOUS_RATE) * dt);
    }

    // Behaviour.
    if (guard.state === 'lured') {
      guard.luredTotal += dt;
      const dx = guard.luredX - guard.x;
      const dy = guard.luredY - guard.y;
      const distance = Math.hypot(dx, dy);
      if (guard.luredTotal > 8) {
        // The coin is somewhere unreachable (behind a case): give up and patrol.
        guard.state = 'patrol';
        guard.callout = '';
        guard.luredTotal = 0;
        return;
      }
      if (distance > 8) {
        guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), 6 * dt);
        moveCircle(guard, (dx / distance) * GUARD_SPEED * dt, (dy / distance) * GUARD_SPEED * dt, 13);
        guard.walkPhase += dt * 9;
      } else if (guard.luredT <= 0) {
        guard.luredT = 2.5;
        guard.callout = 'WHAT WAS THAT?';
        guard.calloutT = 2.5;
      } else {
        guard.luredT -= dt;
        guard.angle += Math.sin(state.time * 2.2 + guard.id) * 0.02;
        if (guard.luredT <= 0) {
          guard.state = 'patrol';
          guard.callout = '';
          // Resume at the nearest waypoint.
          let best = 0;
          let bestDistance = Infinity;
          for (let i = 0; i < guard.path.length; i += 1) {
            const d = Math.hypot(guard.path[i].x - guard.x, guard.path[i].y - guard.y);
            if (d < bestDistance) { best = i; bestDistance = d; }
          }
          guard.wp = (best + 1) % guard.path.length;
        }
      }
      return;
    }

    if (blind) {
      guard.callout = '';
      return; // Smoke blinds every watcher: they hold still and see nothing.
    }

    if (wasChase) {
      guard.state = 'chase';
      guard.callout = '!';
      guard.calloutT = 0.4;
      const dx = player.x - guard.x;
      const dy = player.y - guard.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 20) return; // Caught — handled by the caller.
      guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), 7 * dt);
      moveCircle(guard, (dx / distance) * GUARD_CHASE_SPEED * dt, (dy / distance) * GUARD_CHASE_SPEED * dt, 13);
      guard.walkPhase += dt * 11;
      if (guard.loseT > 2.5) {
        guard.state = 'patrol';
        guard.suspicion = 0.4;
        guard.callout = '';
        guard.loseT = 0;
      }
      return;
    }

    if (wasSuspicious) {
      guard.state = 'suspicious';
      guard.callout = '?';
      guard.calloutT = 0.4;
      guard.angle = turnToward(guard.angle, angleTo(guard.x, guard.y, player.x, player.y), 5 * dt);
      return; // A suspicious warden stops and stares.
    }

    if (guard.state === 'suspicious' || guard.state === 'chase') {
      guard.state = 'patrol';
      guard.callout = '';
    }

    // Patrol: walk the dashed route, dwell and scan at each waypoint.
    if (guard.dwellT > 0) {
      guard.dwellT -= dt;
      guard.scanT += dt;
      const target = guard.path[guard.wp];
      const base = angleTo(guard.x, guard.y, target.x, target.y);
      guard.angle = base + Math.sin(guard.scanT * 2.4) * 0.9;
      return;
    }
    const target = guard.path[guard.wp];
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 6) {
      guard.wp = (guard.wp + 1) % guard.path.length;
      guard.dwellT = 1.4;
      guard.scanT = 0;
      return;
    }
    guard.angle = turnToward(guard.angle, Math.atan2(dy, dx), 6 * dt);
    moveCircle(guard, (dx / distance) * GUARD_SPEED * dt, (dy / distance) * GUARD_SPEED * dt, 13);
    guard.walkPhase += dt * 9;
  }

  function stepCamera(camera, dt) {
    camera.angle = camera.base + Math.sin(state.time * camera.speed + camera.phase) * camera.sweep;
    camera.spotted = false;
    if (state.smokeTimer > 0 || state.empTimer > 0) return;
    const player = state.player;
    const range = watcherRange(CAMERA_RANGE);
    if (canSee(camera.x, camera.y, camera.angle, range, CAMERA_HALF_ANGLE, player.x, player.y, sightBlockers())) {
      camera.spotted = true;
      state.alarm = Math.min(100, state.alarm + ALARM_CAMERA_RATE * dt);
    }
  }

  /**
   * Advance the world one fixed step. `move` is {x,y} (normalised), `sneak` a
   * boolean, and lift/coin/smoke/emp are edge-triggered flags for this step.
   * Returns an event bitmask (EVENT_*).
   */
  function step(dt, move, sneak, lift, coin, smoke, emp) {
    if (state.caught || state.getaway) return 0;
    state.time += dt;
    state.galleryTime += dt;
    if (state.smokeTimer > 0) state.smokeTimer = Math.max(0, state.smokeTimer - dt);
    if (state.empTimer > 0) state.empTimer = Math.max(0, state.empTimer - dt);
    if (state.bannerT > 0) state.bannerT -= dt;
    if (state.captionT > 0) state.captionT -= dt;
    for (const laser of state.lasers) {
      if (laser.coolT > 0) laser.coolT -= dt;
      if (laser.flashT > 0) laser.flashT -= dt;
    }
    for (const callout of state.callouts) callout.ttl -= dt;
    state.callouts = state.callouts.filter((c) => c.ttl > 0);
    for (const floater of state.floaters) { floater.ttl -= dt; floater.y -= 22 * dt; }
    state.floaters = state.floaters.filter((f) => f.ttl > 0);
    for (const thrown of state.coinsThrown) thrown.ttl -= dt;
    state.coinsThrown = state.coinsThrown.filter((c) => c.ttl > 0);

    const player = state.player;
    const speed = sneak ? PLAYER_SNEAK_SPEED : PLAYER_SPEED;
    player.sneaking = sneak;
    player.moving = move.x !== 0 || move.y !== 0;
    const stepFromX = player.x;
    const stepFromY = player.y;
    if (player.moving) {
      player.angle = Math.atan2(move.y, move.x);
      moveCircle(player, move.x * speed * dt, move.y * speed * dt, PLAYER_RADIUS);
      // Laser gates: a LIVE beam crossed mid-step trips it, once per crossing.
      const tripped = crossedLiveLaser(state.lasers, stepFromX, stepFromY, player.x, player.y, state.time, state.empTimer);
      if (tripped) {
        tripped.coolT = 1.2;
        tripped.flashT = 0.8;
        state.alarm = Math.min(100, state.alarm + LASER_ALARM);
        setBanner('LASER TRIPPED — THE HALL KNOWS', 2.5);
        if (audio) audio.laser();
      }
    }

    let events = 0;
    if (lift) events |= liftLoot();
    if (coin) events |= throwCoin();
    if (smoke) events |= useSmoke();
    if (emp) events |= useEmp();

    let anyoneSees = false;
    for (const guard of state.guards) {
      stepGuard(guard, dt);
      if (guard.calloutT > 0) guard.calloutT -= dt;
      else if (guard.state !== 'lured') guard.callout = '';
      const distance = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (guard.state === 'chase' && distance < 20) {
        state.seenCount += 1;
        return events | catchPlayer('A warden caught Wren in the open.');
      }
      if (guard.suspicion >= SUSPICIOUS_AT) anyoneSees = true;
    }
    for (const camera of state.cameras) {
      stepCamera(camera, dt);
      if (camera.spotted) anyoneSees = true;
    }
    if (!anyoneSees) {
      state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
    }
    state.alarmPeak = Math.max(state.alarmPeak, state.alarm);
    if (state.alarm >= 100) {
      return events | catchPlayer('Lockdown — the alarm hit full and the hall sealed.');
    }
    events |= tryExit();
    return events;
  }

  function reset() {
    state.score = 0;
    state.purse = 0;
    state.coins = COIN_COUNT;
    state.smoke = SMOKE_COUNT;
    state.emp = EMP_COUNT;
    state.showRoutes = false;
    state.time = 0;
    state.caught = false;
    state.caughtReason = '';
    state.getaway = false;
    state.ghost = false;
    state.summaries = [];
    state.totals = null;
    state.seenCount = 0;
    buildGallery(0);
    setBanner('HEIST 1 OF 3 — THE SUNBIRD GALLERY', 3);
  }

  buildGallery(0);
  setBanner('HEIST 1 OF 3 — THE SUNBIRD GALLERY', 3);

  return {
    state,
    reset,
    step,
    buildGallery,
    alarmStage: () => alarmStage(state.alarm),
    playerInShadow,
    galleryDef,
    sightBlockers,
    allSolids,
    setAudio(sound) { audio = sound; },
    /** Nearest loot Wren can lift right now, or null. */
    nearestLiftable() {
      let best = null;
      let bestDistance = LOOT_RADIUS;
      for (const item of state.loot) {
        if (item.taken) continue;
        const distance = Math.hypot(item.x - state.player.x, item.y - state.player.y);
        if (distance < bestDistance) { best = item; bestDistance = distance; }
      }
      return best;
    },
    /** Room seconds left for the time bonus, for the HUD. */
    timeBonusNow() {
      return Math.max(0, Math.round((TIME_BONUS_WINDOW - state.galleryTime) * TIME_BONUS_PER_SECOND));
    },
  };
}
