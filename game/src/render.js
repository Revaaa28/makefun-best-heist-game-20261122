// The Gilded Hour — the renderer: an orchestrator only. Each visual job
// lives in its own module under render/ (room, cones, actors, routes, HUD,
// screens) and the laser grid in laser-grid.js; this file builds the floor
// textures once and paints a frame by calling them in layer order.

import { GALLERIES, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { drawLaserGates } from './laser-grid.js';
import { drawCallouts, drawCoinsThrown, drawFloaters, drawGuard, drawLoot, drawWren } from './render/draw-actors.js';
import { drawCamera, drawCones, drawPatrols } from './render/draw-cones.js';
import { drawBanner, drawCaption, drawHUD, drawLegend, drawPrompt } from './render/draw-hud.js';
import { drawCarpet, drawDecor, drawDoors, drawEntryTrail, drawFurniture, drawShadowZone, drawWalls, makeFloorTexture } from './render/draw-room.js';
import { drawRoutes } from './render/draw-routes.js';
import { drawCaught, drawGetaway, drawPaused, drawTitle } from './render/draw-screens.js';
import { text } from './render/canvas-helpers.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_GETAWAY = 'getaway';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_WIDTH;
  canvas.height = VIEW_HEIGHT;
  const textures = GALLERIES.map((def) => makeFloorTexture(def));

  function drawPlay(state, extras, screen) {
    const def = GALLERIES[state.gallery];
    ctx.drawImage(textures[state.gallery], 0, 0);
    drawShadowZone(ctx, def);
    drawCarpet(ctx, def);
    drawEntryTrail(ctx);
    drawPatrols(ctx, state);
    if (state.showRoutes) drawRoutes(ctx, state);
    drawFurniture(ctx, def);
    drawDecor(ctx, def);
    drawLoot(ctx, state, state.time);
    drawCoinsThrown(ctx, state);
    drawCones(ctx, state);
    for (const camera of state.cameras) drawCamera(ctx, camera, state.smokeTimer > 0 || state.empTimer > 0);
    drawLaserGates(ctx, state);
    drawWalls(ctx);
    drawDoors(ctx, state);
    if (screen === SCREEN_CAUGHT) {
      // On the caught screen the catching warden is drawn over Wren.
      drawWren(ctx, state.player);
      for (const guard of state.guards) drawGuard(ctx, guard, state.time);
    } else {
      for (const guard of state.guards) drawGuard(ctx, guard, state.time);
      drawWren(ctx, state.player);
    }
    drawFloaters(ctx, state);
    drawCallouts(ctx, state);
    drawHUD(ctx, state);
    if (extras.legend !== false) drawLegend(ctx, state);
    drawBanner(ctx, state);
    drawCaption(ctx, state);
    drawPrompt(ctx, state, extras.nearest);
    if (state.smokeTimer > 0) {
      text(ctx, `SMOKE — watchers blind ${state.smokeTimer.toFixed(1)}s`, 640, 108, 'bold 14px Georgia, serif', '#bcd8ff', 'center');
    }
    if (state.empTimer > 0) {
      text(ctx, `EMP — EYES AND LASERS DARK ${state.empTimer.toFixed(1)}s`, 640, 130, 'bold 14px Georgia, serif', '#9fd8ff', 'center');
    }
  }

  return {
    draw(state, screen, extras = {}) {
      ctx.clearRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      if (screen === SCREEN_TITLE) {
        drawPlay(state, extras, screen);
        drawTitle(ctx, state, extras.best || 0);
        return;
      }
      drawPlay(state, extras, screen);
      if (screen === SCREEN_PAUSED) drawPaused(ctx);
      else if (screen === SCREEN_CAUGHT) drawCaught(ctx, state);
      else if (screen === SCREEN_GETAWAY) drawGetaway(ctx, state);
    },
  };
}
