// The wardens' minds, read from the outside: one place that turns a warden's
// real simulation state (patrol path, suspicion meter, lure, chase) into the
// label the HUD's ON THE FLOOR panel shows. The simulation itself lives in
// world.js; this file only names what it is already doing, so the panel can
// never claim a state the warden is not in.

import { CHASE_AT, SUSPICIOUS_AT } from './config.js';

/**
 * The display state of one warden: { label, color }.
 * CHASING at chase suspicion, SUSPICIOUS n% while the stare builds, LURED
 * while a coin holds him, SCANNING while he dwells at a waypoint, else PATROL.
 */
export function guardDisplayState(guard) {
  if (guard.state === 'lured') return { label: 'LURED — COIN', color: '#ffd76a' };
  if (guard.suspicion >= CHASE_AT || guard.state === 'chase') return { label: 'CHASING', color: '#ff5d3a' };
  if (guard.suspicion >= SUSPICIOUS_AT || guard.state === 'suspicious') {
    return { label: `SUSPICIOUS ${Math.round(guard.suspicion * 100)}%`, color: '#f5b041' };
  }
  if (guard.dwellT > 0) return { label: 'SCANNING', color: '#9fd8ff' };
  return { label: 'PATROL', color: '#5ddc7a' };
}
