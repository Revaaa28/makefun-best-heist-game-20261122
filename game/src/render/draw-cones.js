// Sight made visible: the wardens' amber cones and the Brass Eyes' blue
// cones (both clipped by real cover through vision.js), the patrol-route
// dashes the wardens walk, and the Brass Eye cameras themselves. A watcher
// blinded by smoke or an EMP pulse draws grey and sees nothing.

import {
  CAMERA_HALF_ANGLE, CAMERA_RANGE, GALLERIES, GUARD_HALF_ANGLE, GUARD_RANGE, ROOM,
} from '../config.js';
import { conePolygon } from '../vision.js';
import { text } from './canvas-helpers.js';

export function drawPatrols(ctx, state) {
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

function drawCone(ctx, points, color, edgeColor) {
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

export function drawCones(ctx, state) {
  const blind = state.smokeTimer > 0 || state.empTimer > 0;
  const blockers = state.guards.length ? GALLERIES[state.gallery].blockers : [];
  for (const camera of state.cameras) {
    const points = conePolygon(camera.x, camera.y, camera.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE, blockers);
    drawCone(ctx, points, blind ? 'rgba(120,120,120,0.10)' : 'rgba(70,150,255,0.21)', blind ? 'rgba(150,150,150,0.35)' : 'rgba(120,190,255,0.6)');
  }
  for (const guard of state.guards) {
    const points = conePolygon(guard.x, guard.y, guard.angle, GUARD_RANGE, GUARD_HALF_ANGLE, blockers);
    const hot = guard.suspicion >= 0.75;
    drawCone(ctx, points, state.smokeTimer > 0 ? 'rgba(120,120,120,0.10)' : hot ? 'rgba(255,80,40,0.28)' : 'rgba(245,176,65,0.22)', state.smokeTimer > 0 ? 'rgba(150,150,150,0.35)' : hot ? 'rgba(255,110,70,0.75)' : 'rgba(245,190,90,0.65)');
  }
}

export function drawCamera(ctx, camera, blind) {
  // Brass Eye on a brass pole mount from the ceiling: a brass dome, a glass
  // lens, a small sweep arc.
  ctx.strokeStyle = '#6a5320';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(camera.x, camera.y - 10); ctx.lineTo(camera.x, ROOM.y + 2); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(camera.x, camera.y + 8, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a6a1e';
  ctx.beginPath(); ctx.arc(camera.x, camera.y, 13.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9a24a';
  ctx.beginPath(); ctx.arc(camera.x, camera.y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = blind ? '#555' : '#7fd4ff';
  ctx.beginPath(); ctx.arc(camera.x, camera.y, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(camera.x - 1.5, camera.y - 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
  text(ctx, 'BRASS EYE', camera.x, camera.y - 18, 'bold 10px Georgia, serif', blind ? '#888' : '#9fdcff', 'center');
}
