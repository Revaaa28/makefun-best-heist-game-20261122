// The heads-up layer: the top bar (title, objective, score, the staged alarm
// meter, ghost and time), the ON THE FLOOR panel naming every warden with
// his live state, the TOOLS panel with all three priced tools, the FIELD
// NOTES legend (cover frame only — it is illegible filler at small-cell
// size), the event banner, the scene caption bar, and the context prompt.

import {
  ALARM_ALARM_AT, EXIT, GALLERIES, VIEW_WIDTH,
} from '../config.js';
import { guardDisplayState } from '../guard-ai.js';
import { alarmStage } from '../world.js';
import { pill, roundRect, text } from './canvas-helpers.js';

export function drawHUD(ctx, state) {
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
  if (state.empTimer > 0) {
    text(ctx, `EMP ${state.empTimer.toFixed(1)}s`, 1106, 44, 'bold 11px Georgia, serif', '#9fd8ff');
  }
  drawFloorPanel(ctx, state);
  drawToolsPanel(ctx, state);
}

// ON THE FLOOR: every warden by name, with the state his own AI is in —
// fed by guard-ai.js straight from the simulation, never staged text.
function drawFloorPanel(ctx, state) {
  const x = 1006;
  const y = 64;
  const w = 258;
  const h = 104;
  ctx.fillStyle = 'rgba(8,9,15,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  text(ctx, 'ON THE FLOOR — THE WARDENS', x + 12, y + 20, 'bold 12px Georgia, serif', '#ffd76a');
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x + 12, y + 27, w - 24, 1);
  let ly = y + 48;
  for (const guard of state.guards) {
    const display = guardDisplayState(guard);
    ctx.fillStyle = display.color;
    ctx.beginPath(); ctx.arc(x + 18, ly - 4, 5, 0, Math.PI * 2); ctx.fill();
    text(ctx, guard.name, x + 30, ly, 'bold 12px Georgia, serif', '#e8e0c8');
    text(ctx, display.label, x + w - 12, ly, 'bold 11px Georgia, serif', display.color, 'right');
    ly += 22;
  }
}

// TOOLS: all three, finite and priced, with their keys — the cost is part
// of the game, so it is printed on the card.
function drawToolsPanel(ctx, state) {
  const x = 1006;
  const y = 176;
  const w = 258;
  const h = 124;
  ctx.fillStyle = 'rgba(8,9,15,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  text(ctx, 'TOOLS — EVERY ONE COSTS', x + 12, y + 20, 'bold 12px Georgia, serif', '#ffd76a');
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(x + 12, y + 27, w - 24, 1);
  const rows = [
    ['C', 'COIN DECOY', `×${state.coins}`, '−$200', state.coins > 0],
    ['X', 'SMOKE VIAL', `×${state.smoke}`, 'blinds all', state.smoke > 0],
    ['Q', 'EMP — BRASS BLIND', `×${state.emp}`, '−$300', state.emp > 0],
  ];
  let ly = y + 48;
  for (const [key, name, count, cost, left] of rows) {
    const dim = left ? '' : 'rgba(232,224,200,0.35)';
    ctx.strokeStyle = left ? '#c9a24a' : 'rgba(201,162,74,0.35)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x + 12, ly - 11, 15, 15);
    text(ctx, key, x + 19.5, ly, 'bold 11px Georgia, serif', left ? '#ffd76a' : 'rgba(255,215,106,0.35)', 'center');
    text(ctx, name, x + 34, ly, 'bold 11px Georgia, serif', dim || '#e8e0c8');
    text(ctx, count, x + 196, ly, 'bold 11px Georgia, serif', dim || '#ffd76a', 'right');
    text(ctx, cost, x + w - 12, ly, 'bold 11px Georgia, serif', dim || '#e8e0c8', 'right');
    ly += 22;
  }
  text(ctx, 'EMP kills eyes + lasers, 5s', x + 12, y + h - 8, '10px Georgia, serif', 'rgba(216,207,174,0.7)');
}

export function drawLegend(ctx, state) {
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
    ['laser', 'Laser gate — cross it LIVE, it trips'],
    ['block', 'Case / pillar / shelf — blocks sight'],
    ['shadow', 'Deep shadow — watcher reach halved'],
    ['coin', 'Coin −200 — lures the nearest warden'],
    ['smoke', 'Smoke vial — blinds all watchers'],
    ['emp', 'EMP −300 — eyes + lasers dark 5s'],
    ['loot', 'Loot — prime prize opens the green door'],
    ['exit', 'EXIT — green door, only after the prime'],
    ['dashes', 'Patrol route — wardens walk the dashes'],
  ];
  let ly = y + 48;
  for (const [icon, label] of lines) {
    const ix = x + 14;
    if (icon === 'cone-amber' || icon === 'cone-blue') {
      ctx.fillStyle = icon === 'cone-amber' ? 'rgba(245,176,65,0.75)' : 'rgba(70,150,255,0.75)';
      ctx.beginPath(); ctx.moveTo(ix, ly - 4); ctx.lineTo(ix + 16, ly + 3); ctx.lineTo(ix, ly + 10); ctx.closePath(); ctx.fill();
    } else if (icon === 'laser') {
      ctx.strokeStyle = '#ff5d3a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ix, ly + 3); ctx.lineTo(ix + 15, ly + 3); ctx.stroke();
      ctx.fillStyle = '#8a6a1e'; ctx.fillRect(ix - 1, ly - 2, 3, 10); ctx.fillRect(ix + 13, ly - 2, 3, 10);
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
    } else if (icon === 'emp') {
      ctx.strokeStyle = '#9fd8ff'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(ix + 9, ly - 5); ctx.lineTo(ix + 4, ly + 3); ctx.lineTo(ix + 8, ly + 3); ctx.lineTo(ix + 6, ly + 10); ctx.stroke();
    } else if (icon === 'loot') {
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath(); ctx.moveTo(ix + 7, ly - 5); ctx.lineTo(ix + 12, ly + 6); ctx.lineTo(ix + 2, ly + 6); ctx.closePath(); ctx.fill();
    } else if (icon === 'exit') {
      ctx.fillStyle = '#2f8f4f'; ctx.fillRect(ix, ly - 4, 14, 12);
      ctx.fillStyle = '#5dff9d'; ctx.fillRect(ix + 2, ly - 2, 10, 3);
    } else if (icon === 'dashes') {
      ctx.strokeStyle = 'rgba(245,176,65,0.9)'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(ix, ly + 2); ctx.lineTo(ix + 15, ly + 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    text(ctx, label, ix + 22, ly + 6, '11px Georgia, serif', '#e8e0c8');
    ly += 16;
  }
  text(ctx, `3 routes (Tab): ${def.routes}`, x + 12, y + h - 8, 'bold 11px Georgia, serif', '#ffd76a');
}

// The event banner: one bold line narrating the live moment, set by the
// world itself (a lift, a trip, a pulse) — never decoration.
export function drawBanner(ctx, state) {
  if (state.bannerT <= 0 || !state.banner) return;
  ctx.font = 'bold 18px Georgia, serif';
  const width = ctx.measureText(state.banner).width + 36;
  const alpha = Math.min(1, state.bannerT);
  ctx.globalAlpha = alpha;
  pill(ctx, VIEW_WIDTH / 2 - width / 2, 64, width, 32, 'rgba(10,10,16,0.88)', '#c9a24a');
  text(ctx, state.banner, VIEW_WIDTH / 2, 86, 'bold 18px Georgia, serif', '#ffd76a', 'center');
  ctx.globalAlpha = 1;
}

// The scene caption: a full-width bar along the south wall naming where
// Wren is and what the moment is. The world sets it on entering a gallery;
// the screenshot scenes hold it open with their scene's own line.
export function drawCaption(ctx, state) {
  if (state.captionT <= 0 || !state.caption) return;
  const alpha = Math.min(1, state.captionT);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(8,9,15,0.92)';
  ctx.fillRect(0, 678, VIEW_WIDTH, 42);
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(0, 678, VIEW_WIDTH, 2);
  text(ctx, state.caption, VIEW_WIDTH / 2, 706, 'bold 17px Georgia, serif', '#ffd76a', 'center');
  ctx.globalAlpha = 1;
}

export function drawPrompt(ctx, state, nearest) {
  if (nearest) {
    text(ctx, `E — LIFT ${nearest.name} ($${nearest.value})`, state.player.x, state.player.y - 34, 'bold 13px Georgia, serif', '#ffd76a', 'center');
  } else if (state.player.x > 1120 && Math.abs(state.player.y - EXIT.y) < 90 && !state.exitUnlocked) {
    text(ctx, 'LOCKED — lift the prime prize first', state.player.x - 40, state.player.y - 34, 'bold 12px Georgia, serif', '#ffb0a0', 'center');
  }
  if (state.player.sneaking) {
    text(ctx, 'SNEAK — quieter, harder to see', state.player.x, state.player.y + 46, '11px Georgia, serif', 'rgba(188,216,255,0.9)', 'center');
  }
}
