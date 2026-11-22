// The full-screen panels that sit over the play view: title, paused, caught
// and the getaway ledger. The play view is painted first (by render.js), so
// the hall lives behind every one of these.

import { VIEW_HEIGHT, VIEW_WIDTH } from '../config.js';
import { text } from './canvas-helpers.js';

export function drawTitle(ctx, state, best) {
  void state;
  ctx.fillStyle = 'rgba(5,6,12,0.62)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  // Title panel.
  ctx.fillStyle = 'rgba(8,9,15,0.94)';
  ctx.fillRect(280, 120, 720, 470);
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 3;
  ctx.strokeRect(280, 120, 720, 470);
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(280, 120, 720, 3);
  text(ctx, 'THE GILDED HOUR', 640, 186, 'bold 52px Georgia, serif', '#ffd76a', 'center');
  text(ctx, 'A NIGHT-MUSEUM HEIST IN THREE GALLERIES', 640, 218, 'bold 15px Georgia, serif', '#e8d9a8', 'center');
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(440, 234, 400, 1);
  const lines = [
    'You are Wren, cat burglar. Lift each gallery’s prime prize,',
    'then slip out the green door — unseen if you can.',
    '',
    'WASD / arrows — move      SHIFT — sneak      CLICK — walk there',
    'E — lift loot      C — coin decoy (−200, lures a warden)',
    'X — smoke vial (blinds every watcher)',
    'Q — EMP pulse (−300, kills Brass Eyes + lasers for 5s)',
    'TAB — the three routes, drawn on the floor      P — pause',
    '',
    'Wardens watch amber cones; Brass Eyes sweep blue and feed the',
    'alarm; laser gates blink — cross one LIVE and it trips. Cases',
    'and pillars block sight; deep shadow halves a watcher’s reach.',
  ];
  let y = 272;
  for (const line of lines) {
    text(ctx, line, 640, y, line === '' ? '12px Georgia, serif' : '14px Georgia, serif', '#e8e0c8', 'center');
    y += 22;
  }
  text(ctx, 'PRESS SPACE OR CLICK TO BEGIN', 640, 548, 'bold 17px Georgia, serif', '#5dff9d', 'center');
  if (best > 0) text(ctx, `Best run: ${best}`, 640, 576, '13px Georgia, serif', '#d8cfae', 'center');
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(5,6,12,0.6)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  text(ctx, 'PAUSED', 640, 330, 'bold 44px Georgia, serif', '#ffd76a', 'center');
  text(ctx, 'P to resume  ·  R to restart the run', 640, 372, '15px Georgia, serif', '#e8e0c8', 'center');
}

export function drawCaught(ctx, state) {
  ctx.fillStyle = 'rgba(40,4,4,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = 'rgba(12,4,4,0.95)';
  ctx.fillRect(330, 130, 620, 300);
  ctx.strokeStyle = '#ff5d3a';
  ctx.lineWidth = 3;
  ctx.strokeRect(330, 130, 620, 300);
  text(ctx, 'CAUGHT!', 640, 198, 'bold 52px Georgia, serif', '#ff5d3a', 'center');
  text(ctx, state.caughtReason, 640, 236, '15px Georgia, serif', '#f0d8d0', 'center');
  text(ctx, `Score ${state.score}   ·   Purse $${state.purse}   ·   Heist ${state.gallery + 1} of 3`, 640, 274, '14px Georgia, serif', '#e8e0c8', 'center');
  text(ctx, 'The wardens hand Wren to the night watch. The museum keeps its gold.', 640, 310, '13px Georgia, serif', 'rgba(232,224,200,0.8)', 'center');
  text(ctx, 'R — TRY AGAIN      SPACE — TITLE', 640, 370, 'bold 16px Georgia, serif', '#ffd76a', 'center');
}

export function drawGetaway(ctx, state) {
  ctx.fillStyle = 'rgba(4,10,6,0.55)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = 'rgba(8,14,9,0.96)';
  ctx.fillRect(300, 120, 680, 480);
  ctx.strokeStyle = '#5dff9d';
  ctx.lineWidth = 3;
  ctx.strokeRect(300, 120, 680, 480);
  text(ctx, 'CLEAN GETAWAY', 640, 182, 'bold 48px Georgia, serif', '#5dff9d', 'center');
  text(ctx, 'Three galleries. Three primes. Dawn breaks over an empty museum.', 640, 214, '14px Georgia, serif', '#d8e8d8', 'center');
  let y = 258;
  for (const summary of state.totals.galleries) {
    text(ctx, summary.gallery, 340, y, 'bold 14px Georgia, serif', '#e8e0c8');
    const bits = [];
    if (summary.ghost) bits.push(`Ghost +$${summary.ghostBonus}`);
    bits.push(`Time +$${summary.timeBonus} (${summary.seconds}s)`);
    text(ctx, bits.join('  ·  '), 940, y, '13px Georgia, serif', '#ffd76a', 'right');
    y += 28;
  }
  ctx.fillStyle = '#5dff9d';
  ctx.fillRect(340, y, 600, 1);
  y += 32;
  text(ctx, `LOOT PURSE  $${state.totals.purse}`, 340, y, 'bold 16px Georgia, serif', '#fff');
  y += 30;
  text(ctx, `FINAL SCORE  ${state.totals.score}`, 340, y, 'bold 20px Georgia, serif', '#ffd76a');
  y += 30;
  text(ctx, `Tools left: ${state.totals.coinsLeft} coins · ${state.totals.smokeLeft} smoke · ${state.totals.empLeft} EMP  ·  Run time ${state.totals.time}s`, 340, y, '13px Georgia, serif', '#d8e8d8');
  text(ctx, 'R — RUN IT AGAIN      SPACE — TITLE', 640, 556, 'bold 16px Georgia, serif', '#5dff9d', 'center');
}
