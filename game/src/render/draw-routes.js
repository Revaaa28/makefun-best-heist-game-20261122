// The route overlay (Tab in play): the gallery's three ways through, drawn
// on the floor in their own colours — A the carpet, B the shadow side,
// C the far aisle — with a letter badge where each route leaves the service
// door and its name where it reaches the loot. The paths are the gallery's
// real routePaths from config.js: every point is walkable floor a player
// can actually follow.

import { GALLERIES } from '../config.js';
import { text } from './canvas-helpers.js';

export function drawRoutes(ctx, state) {
  const def = GALLERIES[state.gallery];
  if (!def.routePaths) return;
  def.routePaths.forEach((route, routeIndex) => {
    ctx.strokeStyle = route.color;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 3.5;
    ctx.setLineDash([14, 9]);
    ctx.beginPath();
    route.points.forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    // Waypoint beads along the route.
    ctx.fillStyle = route.color;
    for (const [x, y] of route.points) {
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    // Letter badge at the route's first turn, offset per route so the three
    // badges fan out instead of stacking on the shared first steps.
    const [bx0, by0] = route.points[1];
    const bx = bx0 + (routeIndex - 1) * 30;
    const by = by0;
    ctx.fillStyle = route.color;
    ctx.beginPath(); ctx.arc(bx, by - 18, 11, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(8,9,15,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, route.id, bx, by - 13, 'bold 13px Georgia, serif', '#101018', 'center');
    // The route's name at the gallery's chosen label spot for this route.
    const [lx, ly] = route.labelAt || route.points[route.points.length - 3] || route.points[route.points.length - 1];
    ctx.font = 'bold 12px Georgia, serif';
    const label = `${route.id} — ${route.label}`;
    const width = ctx.measureText(label).width + 12;
    ctx.fillStyle = 'rgba(8,9,15,0.82)';
    ctx.fillRect(lx - width / 2, ly - 10, width, 19);
    ctx.strokeStyle = route.color;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(lx - width / 2, ly - 10, width, 19);
    text(ctx, label, lx, ly + 4, 'bold 12px Georgia, serif', route.color, 'center');
  });
}
