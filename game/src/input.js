// Keyboard and mouse: WASD/arrows to move, Shift to sneak, E to lift loot,
// C to toss a coin decoy, X for a smoke vial, P to pause, Space/Enter to confirm,
// R to restart, M to mute. Clicking the floor sets a walk target (mouse play).

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_RESTART = 4;
export const ACTION_MUTE = 8;

const MOVE_KEYS = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let sneak = false;
  let walkTarget = null;
  let actions = 0;

  function onKeyDown(event) {
    if (event.repeat) return;
    held.add(event.code);
    pressed.add(event.code);
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') sneak = true;
    if (event.code === 'Space' || event.code === 'Enter') actions |= ACTION_CONFIRM;
    if (event.code === 'KeyP') actions |= ACTION_PAUSE;
    if (event.code === 'KeyR') actions |= ACTION_RESTART;
    if (event.code === 'KeyM') actions |= ACTION_MUTE;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    held.delete(event.code);
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      sneak = held.has('ShiftLeft') || held.has('ShiftRight');
    }
  }

  function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    walkTarget = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);

  return {
    /** Normalised movement vector for this frame (keys, else the click target). */
    direction(player) {
      let dx = 0;
      let dy = 0;
      for (const code of held) {
        const move = MOVE_KEYS[code];
        if (move) { dx += move[0]; dy += move[1]; }
      }
      if (dx !== 0 || dy !== 0) {
        walkTarget = null;
        const length = Math.hypot(dx, dy);
        return { x: dx / length, y: dy / length };
      }
      if (walkTarget && player) {
        const tx = walkTarget.x - player.x;
        const ty = walkTarget.y - player.y;
        const distance = Math.hypot(tx, ty);
        if (distance < 10) { walkTarget = null; return { x: 0, y: 0 }; }
        return { x: tx / distance, y: ty / distance };
      }
      return { x: 0, y: 0 };
    },

    isSneaking() { return sneak; },

    /** True once when the key was pressed since the last call. */
    wasPressed(code) {
      if (pressed.has(code)) { pressed.delete(code); return true; }
      return false;
    },

    /** Edge-triggered actions (confirm / pause / restart / mute) since last call. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },

    clearWalkTarget() { walkTarget = null; },
  };
}
