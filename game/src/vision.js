// Geometry for sight: whether a watcher can see a point, and the polygon a
// vision cone really covers once display cases, pillars and shelves cut it.
// Cover genuinely blocks sight — a cone stops at the first blocker it meets.

/** True when the point is inside the rectangle (edges inclusive). */
export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** Distance from a point to a segment, used for cone-edge grazing checks. */
export function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Slab test: distance along the ray to the first hit with a rectangle, or Infinity.
function rayRectDistance(ox, oy, dx, dy, rect) {
  let tMin = 0;
  let tMax = Infinity;
  if (dx === 0) {
    if (ox < rect.x || ox > rect.x + rect.w) return Infinity;
  } else {
    let t1 = (rect.x - ox) / dx;
    let t2 = (rect.x + rect.w - ox) / dx;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return Infinity;
  }
  if (dy === 0) {
    if (oy < rect.y || oy > rect.y + rect.h) return Infinity;
  } else {
    let t1 = (rect.y - oy) / dy;
    let t2 = (rect.y + rect.h - oy) / dy;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return Infinity;
  }
  return tMin;
}

/** True when any blocker rectangle cuts the segment from (x1,y1) to (x2,y2). */
export function segmentBlocked(x1, y1, x2, y2, blockers) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length === 0) return false;
  const ux = dx / length;
  const uy = dy / length;
  for (let i = 0; i < blockers.length; i += 1) {
    const hit = rayRectDistance(x1, y1, ux, uy, blockers[i]);
    if (hit !== Infinity && hit < length) return true;
  }
  return false;
}

const CONE_RAYS = 26;

/**
 * The polygon a vision cone covers from (ox,oy) facing `angle`, out to `range`
 * and `halfAngle` each side, with each ray stopped by the first blocker it hits.
 * Returns the points in order, origin first, for a canvas path.
 */
export function conePolygon(ox, oy, angle, range, halfAngle, blockers) {
  const points = [{ x: ox, y: oy }];
  for (let i = 0; i <= CONE_RAYS; i += 1) {
    const a = angle - halfAngle + (2 * halfAngle * i) / CONE_RAYS;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let reach = range;
    for (let b = 0; b < blockers.length; b += 1) {
      const hit = rayRectDistance(ox, oy, dx, dy, blockers[b]);
      if (hit !== Infinity && hit < reach) reach = hit;
    }
    points.push({ x: ox + dx * reach, y: oy + dy * reach });
  }
  return points;
}

/**
 * Whether a watcher at (wx,wy) facing `angle` with `range` and `halfAngle`
 * can see the target point: inside the cone and no blocker on the line.
 */
export function canSee(wx, wy, angle, range, halfAngle, tx, ty, blockers) {
  const dx = tx - wx;
  const dy = ty - wy;
  const distance = Math.hypot(dx, dy);
  if (distance > range || distance < 1) return distance < 1;
  let delta = Math.atan2(dy, dx) - angle;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  if (Math.abs(delta) > halfAngle) return false;
  return !segmentBlocked(wx, wy, tx, ty, blockers);
}
