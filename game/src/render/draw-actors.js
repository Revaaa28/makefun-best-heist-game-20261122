// The actors and the prizes: Wren, the named wardens (painted at 1.5× so
// they read at screenshot scale), the glowing loot with its priced labels,
// thrown coins, score floaters and speech callouts.

import { pill, text } from './canvas-helpers.js';

// Actors are painted larger than their collision circles: at screenshot
// scale a 26 px figure vanishes, so Wren and the wardens draw at 1.5×.
const ACTOR_SCALE = 1.5;

const LOOT_ICONS = {
  idol: 'idol', astrolabe: 'astrolabe', chess: 'chess',
  orrery: 'orrery', gears: 'gears', pendulum: 'pendulum',
  codex: 'codex', draft: 'draft', letters: 'letters',
};

function drawLootIcon(ctx, kind, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#ffd76a';
  ctx.strokeStyle = '#8a6a1e';
  ctx.lineWidth = 1.5;
  if (kind === 'idol') {
    // A small winged sunbird.
    ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(7, 2); ctx.lineTo(0, 8); ctx.lineTo(-7, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-16, -8); ctx.lineTo(-12, 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -2); ctx.lineTo(16, -8); ctx.lineTo(12, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff5d3a';
    ctx.beginPath(); ctx.arc(0, -13, 3, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'astrolabe' || kind === 'gears') {
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.stroke();
    for (let t = 0; t < 8; t += 1) {
      const a = (t / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.stroke();
    }
  } else if (kind === 'chess') {
    ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-5, -6); ctx.lineTo(-9, -10); ctx.lineTo(-3, -6); ctx.lineTo(0, -12); ctx.lineTo(3, -6); ctx.lineTo(9, -10); ctx.lineTo(5, -6); ctx.lineTo(8, 8); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (kind === 'orrery') {
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(11, -4, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-14, 8, 2, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'pendulum') {
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 4); ctx.stroke();
    ctx.fillStyle = '#c96a7a';
    ctx.beginPath(); ctx.arc(0, 9, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else if (kind === 'codex') {
    ctx.fillStyle = '#5d2e8a';
    ctx.fillRect(-10, -8, 20, 16);
    ctx.strokeStyle = '#ffd76a';
    ctx.strokeRect(-10, -8, 20, 16);
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (kind === 'draft') {
    ctx.fillStyle = '#e8dcc0';
    ctx.fillRect(-9, -11, 18, 22);
    ctx.strokeStyle = '#8a6a1e';
    ctx.strokeRect(-9, -11, 18, 22);
    ctx.strokeStyle = '#4a3a20';
    for (let l = 0; l < 4; l += 1) {
      ctx.beginPath(); ctx.moveTo(-6, -6 + l * 4); ctx.lineTo(6, -6 + l * 4); ctx.stroke();
    }
  } else if (kind === 'letters') {
    ctx.fillStyle = '#d9c9a0';
    ctx.fillRect(-11, -7, 22, 14);
    ctx.strokeStyle = '#8a6a1e';
    ctx.strokeRect(-11, -7, 22, 14);
    ctx.beginPath(); ctx.moveTo(-11, -7); ctx.lineTo(0, 2); ctx.lineTo(11, -7); ctx.stroke();
    ctx.fillStyle = '#a3332e';
    ctx.beginPath(); ctx.arc(0, 2, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawLoot(ctx, state, time) {
  for (const item of state.loot) {
    if (item.taken) continue;
    const pulse = 0.75 + Math.sin(time * 3 + item.x) * 0.25;
    const glow = ctx.createRadialGradient(item.x, item.y, 2, item.x, item.y, 54);
    glow.addColorStop(0, `rgba(255,205,90,${0.62 * pulse})`);
    glow.addColorStop(1, 'rgba(255,205,90,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(item.x, item.y, 54, 0, Math.PI * 2); ctx.fill();
    // A little gold plinth under the prize.
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(item.x, item.y + 12, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
    drawLootIcon(ctx, LOOT_ICONS[item.id] || 'idol', item.x, item.y, item.prime ? 1.65 : 1.3);
    // Named label, dark-backed so it reads over any floor.
    const label = item.prime ? `★ ${item.name} — $${item.value}` : `${item.name} — $${item.value}`;
    ctx.font = 'bold 13px Georgia, serif';
    const width = ctx.measureText(label).width + 14;
    pill(ctx, item.x - width / 2, item.y - 46, width, 20, 'rgba(10,10,16,0.82)', 'rgba(201,162,74,0.9)');
    text(ctx, label, item.x, item.y - 32, 'bold 13px Georgia, serif', '#ffd76a', 'center');
  }
}

export function drawGuard(ctx, guard, time) {
  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.scale(ACTOR_SCALE, ACTOR_SCALE);
  ctx.translate(-guard.x, -guard.y);
  drawGuardFigure(ctx, guard, time);
  ctx.restore();
}

function drawGuardFigure(ctx, guard, time) {
  const suspicious = guard.suspicion >= 0.35 && guard.suspicion < 0.75;
  const alert = guard.suspicion >= 0.75;
  const lean = alert ? 4 : 0;
  const lx = guard.x + Math.cos(guard.angle) * lean;
  const ly = guard.y + Math.sin(guard.angle) * lean;
  const bob = Math.sin(guard.walkPhase) * 1.5;

  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath(); ctx.ellipse(guard.x, guard.y + 16, 15, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Lantern light pool on the floor (under the raised lantern).
  const lanternX = lx + Math.cos(guard.angle - 0.9) * 16;
  const lanternY = ly - 6 + Math.sin(guard.angle - 0.9) * 16;
  const pool = ctx.createRadialGradient(lanternX, lanternY + 14, 2, lanternX, lanternY + 14, 34);
  pool.addColorStop(0, 'rgba(255,190,90,0.28)');
  pool.addColorStop(1, 'rgba(255,190,90,0)');
  ctx.fillStyle = pool;
  ctx.beginPath(); ctx.ellipse(lanternX, lanternY + 14, 34, 14, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(lx, ly + bob * 0.4);
  ctx.rotate(suspicious ? 0.12 : 0);
  // Long coat with collar and gold trim.
  ctx.fillStyle = '#27324c';
  ctx.beginPath();
  ctx.moveTo(-9, -8); ctx.lineTo(9, -8); ctx.lineTo(12, 14); ctx.lineTo(-12, 14); ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Gold trim at the hem and collar.
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-11, 12); ctx.lineTo(11, 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(-10, -13); ctx.moveTo(7, -8); ctx.lineTo(10, -13); ctx.stroke();
  // Brass buttons, belt with brass buckle, epaulettes.
  ctx.fillStyle = '#c9a24a';
  for (let b = 0; b < 3; b += 1) { ctx.beginPath(); ctx.arc(0, -2 + b * 5, 1.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#3a2a18';
  ctx.fillRect(-10, 4, 20, 4);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(-3, 3, 6, 6);
  ctx.fillStyle = '#c9a24a';
  ctx.fillRect(-12, -10, 6, 3);
  ctx.fillRect(6, -10, 6, 3);
  // Boots.
  ctx.fillStyle = '#101018';
  ctx.fillRect(-9, 14, 7, 4);
  ctx.fillRect(2, 14, 7, 4);
  // Key ring at the belt.
  ctx.strokeStyle = '#c9a24a';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(12, 8, 3.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, 11); ctx.lineTo(14, 16); ctx.moveTo(12, 11); ctx.lineTo(10, 16); ctx.stroke();
  // Raised arm holding the brass lantern, with rim light on the coat edge.
  const armAngle = guard.angle - 0.9;
  ctx.strokeStyle = '#27324c';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(6 + Math.cos(armAngle) * 14, -6 + Math.sin(armAngle) * 14); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,205,120,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(9, -8); ctx.lineTo(11, 10); ctx.stroke();
  // Lantern: brass cage, warm glow.
  const glow = ctx.createRadialGradient(lanternX - lx, lanternY - ly, 1, lanternX - lx, lanternY - ly, 16);
  glow.addColorStop(0, 'rgba(255,200,100,0.75)');
  glow.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(lanternX - lx, lanternY - ly, 16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a6a1e';
  ctx.fillRect(lanternX - lx - 4, lanternY - ly - 6, 8, 12);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(lanternX - lx - 2, lanternY - ly - 4, 4, 8);
  // Head: face shaded under the peaked cap's brim.
  ctx.fillStyle = '#c89b72';
  ctx.beginPath(); ctx.arc(0, -16, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.arc(0, -15, 6.5, 0, Math.PI); ctx.fill();
  // Peaked cap with brim and badge glint.
  ctx.fillStyle = '#141824';
  ctx.beginPath(); ctx.arc(0, -18, 7.5, Math.PI, 0); ctx.fill();
  ctx.fillRect(-7.5, -19, 15, 3);
  ctx.beginPath(); ctx.ellipse(0, -12.5, 8.5, 2.5, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath(); ctx.arc(0, -19, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Suspicion bubble: "?" when staring, "!" when chasing.
  if (guard.callout) {
    const bubbleY = guard.y - 38;
    if (guard.callout === '!' || guard.callout === '?') {
      ctx.fillStyle = alert ? '#ff5d3a' : '#ffd76a';
      ctx.beginPath(); ctx.arc(guard.x, bubbleY, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#101018';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      text(ctx, guard.callout, guard.x, bubbleY + 5, 'bold 13px Georgia, serif', '#101018', 'center');
    } else {
      // A speech callout ("WHAT WAS THAT?") centred above the warden, so it
      // never hides behind a panel or another actor.
      ctx.font = 'bold 12px Georgia, serif';
      const width = ctx.measureText(guard.callout).width + 16;
      pill(ctx, guard.x - width / 2, bubbleY - 26, width, 20, 'rgba(245,240,220,0.95)', '#c9a24a');
      text(ctx, guard.callout, guard.x, bubbleY - 12, 'bold 12px Georgia, serif', '#3a2a10', 'center');
    }
  }
  // The warden's name under him — the floor knows its own.
  text(ctx, guard.name, guard.x, guard.y + 30, 'bold 9px Georgia, serif', 'rgba(220,200,160,0.8)', 'center');
  void time;
}

export function drawWren(ctx, player) {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(ACTOR_SCALE, ACTOR_SCALE);
  ctx.translate(-player.x, -player.y);
  drawWrenFigure(ctx, player);
  ctx.restore();
}

function drawWrenFigure(ctx, player) {
  const stride = player.moving ? Math.sin(player.x * 0.12 + player.y * 0.12) * 2 : 0;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 15, 13, 5, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(player.x, player.y);
  // Layered cloak with a torn pointed hem trailing against her stride.
  const hemTrail = player.moving ? -Math.cos(player.angle) * 5 : 0;
  ctx.fillStyle = '#2e3852';
  ctx.beginPath();
  ctx.moveTo(-8, -10);
  ctx.lineTo(8, -10);
  ctx.lineTo(11 + hemTrail, 12);
  ctx.lineTo(5 + hemTrail, 8);
  ctx.lineTo(0 + hemTrail, 14);
  ctx.lineTo(-5 + hemTrail, 8);
  ctx.lineTo(-11 + hemTrail, 12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Cool rim light on the cloak edge.
  ctx.strokeStyle = 'rgba(140,190,255,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-11 + hemTrail, 12); ctx.stroke();
  // Belted tunic with a pouch.
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(-7, -2, 14, 4);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(-2, -3, 4, 5);
  ctx.fillStyle = '#4a3421';
  ctx.fillRect(6, 2, 6, 7);
  // Gloves.
  ctx.fillStyle = '#14141c';
  ctx.beginPath(); ctx.arc(-9, 2 + stride * 0.3, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(9, 2 - stride * 0.3, 3, 0, Math.PI * 2); ctx.fill();
  // Deep hood with fold creases, shadowed face, black domino mask, two pale eyes.
  ctx.fillStyle = '#232e47';
  ctx.beginPath(); ctx.arc(0, -14, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(120,140,180,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-5, -20); ctx.quadraticCurveTo(-3, -14, -6, -8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(5, -20); ctx.quadraticCurveTo(3, -14, 6, -8); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.beginPath(); ctx.arc(0, -13, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(-6, -16, 12, 4);
  ctx.fillStyle = '#e8f2ff';
  ctx.beginPath(); ctx.arc(-3, -14, 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3, -14, 1.4, 0, Math.PI * 2); ctx.fill();
  // Cool rim light on the hood.
  ctx.strokeStyle = 'rgba(150,200,255,0.9)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, -14, 9, Math.PI * 1.15, Math.PI * 1.75); ctx.stroke();
  // Gold sack with stitched seam and coin bulge, once the prize is lifted.
  if (player.hasPrime) {
    ctx.fillStyle = '#c9a24a';
    ctx.beginPath(); ctx.arc(-13, 8, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6a1e';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16, 5); ctx.lineTo(-10, 11); ctx.stroke();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(-11, 4, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  text(ctx, 'WREN', player.x, player.y + 30, '9px Georgia, serif', 'rgba(200,220,255,0.8)', 'center');
}

export function drawCoinsThrown(ctx, state) {
  for (const coin of state.coinsThrown) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(coin.x, coin.y + 3, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a6a1e';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

export function drawFloaters(ctx, state) {
  for (const floater of state.floaters) {
    ctx.globalAlpha = Math.max(0, Math.min(1, floater.ttl));
    text(ctx, floater.text, floater.x, floater.y, 'bold 15px Georgia, serif', '#ffd76a', 'center');
    ctx.globalAlpha = 1;
  }
}

export function drawCallouts(ctx, state) {
  for (const callout of state.callouts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, callout.ttl));
    ctx.font = 'bold 12px Georgia, serif';
    const width = ctx.measureText(callout.text).width + 16;
    pill(ctx, callout.x - width / 2, callout.y - 24, width, 20, 'rgba(245,240,220,0.95)', '#c9a24a');
    text(ctx, callout.text, callout.x, callout.y - 10, 'bold 12px Georgia, serif', '#3a2a10', 'center');
    ctx.globalAlpha = 1;
  }
}
