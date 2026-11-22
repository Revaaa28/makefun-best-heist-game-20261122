// The laser grid — everything about the laser gates, in one place: how a
// gallery's beams are built, when a beam is LIVE, whether a step crossed one,
// and how the beams are painted. A beam blinks on its own clock (onTime of
// every period, offset by phase); an EMP pulse holds every beam dark while
// it lasts. The beams are real geometry in the world: world.js trips them
// through crossedLiveLaser, the renderer paints them through drawLaserGates.

import { pill, text } from './render/canvas-helpers.js';
import { segmentsCross } from './vision.js';

/** Fresh runtime beams for a gallery definition (each with its trip cooldown). */
export function buildLasers(def) {
  return (def.lasers || []).map((laser) => ({ ...laser, coolT: 0, flashT: 0 }));
}

/** True when the beam is LIVE at world time `time` (EMP holds all beams dark). */
export function laserIsLive(laser, time, empTimer) {
  if (empTimer > 0) return false;
  const phase = (time + laser.phase) % laser.period;
  return phase < laser.onTime;
}

/** Seconds until the beam next changes state, for its in-world label. */
export function laserSecondsToFlip(laser, time) {
  const phase = (time + laser.phase) % laser.period;
  return phase < laser.onTime ? laser.onTime - phase : laser.period - phase;
}

/**
 * The first LIVE beam the step from (x1,y1) to (x2,y2) crosses, or null.
 * A tripped beam cools down briefly so standing in it trips it once.
 */
export function crossedLiveLaser(lasers, x1, y1, x2, y2, time, empTimer) {
  for (const laser of lasers) {
    if (laser.coolT > 0) continue;
    if (!laserIsLive(laser, time, empTimer)) continue;
    if (segmentsCross(x1, y1, x2, y2, laser.x1, laser.y1, laser.x2, laser.y2)) return laser;
  }
  return null;
}

/** Paint every beam: brass emitter posts at both ends, the beam itself, its label. */
export function drawLaserGates(ctx, state) {
  for (const laser of state.lasers) {
    const live = laserIsLive(laser, state.time, state.empTimer);
    const tripped = laser.flashT > 0;
    // Emitter posts: squat brass boxes the beam is strung between.
    for (const [ex, ey] of [[laser.x1, laser.y1], [laser.x2, laser.y2]]) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(ex - 6, ey - 3, 13, 12);
      ctx.fillStyle = '#8a6a1e';
      ctx.fillRect(ex - 6, ey - 7, 12, 12);
      ctx.fillStyle = '#c9a24a';
      ctx.fillRect(ex - 4, ey - 5, 8, 8);
      ctx.fillStyle = tripped ? '#ffffff' : live ? '#ff3b30' : '#3ddc74';
      ctx.beginPath(); ctx.arc(ex, ey - 1, 2.6, 0, Math.PI * 2); ctx.fill();
    }
    if (live || tripped) {
      // The beam: a hot core with a red glow, flashing white the moment it trips.
      const core = tripped ? 'rgba(255,255,255,0.95)' : 'rgba(255,70,50,0.9)';
      const glow = tripped ? 'rgba(255,120,90,0.5)' : 'rgba(255,60,40,0.30)';
      ctx.strokeStyle = glow;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(laser.x1, laser.y1); ctx.lineTo(laser.x2, laser.y2); ctx.stroke();
      ctx.strokeStyle = core;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(laser.x1, laser.y1); ctx.lineTo(laser.x2, laser.y2); ctx.stroke();
    } else {
      // Dark beam: a faint dotted line so the gate still reads while it sleeps.
      ctx.strokeStyle = 'rgba(255,90,70,0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 7]);
      ctx.beginPath(); ctx.moveTo(laser.x1, laser.y1); ctx.lineTo(laser.x2, laser.y2); ctx.stroke();
      ctx.setLineDash([]);
    }
    // In-world label at the beam's middle: LASER — LIVE, or its off-countdown.
    const midX = (laser.x1 + laser.x2) / 2;
    const midY = (laser.y1 + laser.y2) / 2;
    const label = state.empTimer > 0
      ? 'LASER — DARK (EMP)'
      : live ? 'LASER — LIVE' : `LASER — OFF ${Math.ceil(laserSecondsToFlip(laser, state.time))}s`;
    ctx.font = 'bold 11px Georgia, serif';
    const width = ctx.measureText(label).width + 14;
    pill(ctx, midX - width / 2, midY - 26, width, 19, 'rgba(10,10,16,0.85)', live || tripped ? '#ff5d3a' : 'rgba(120,220,150,0.8)');
    text(ctx, label, midX, midY - 12, 'bold 11px Georgia, serif', live || tripped ? '#ff8a70' : '#9fe8b0', 'center');
  }
}
