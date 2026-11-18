// Keyboard and mouse. Held keys answer "is this down right now", one-shot presses are queued so a
// tap between two frames is never lost and never counted twice, and the mouse's movement is
// gathered per frame for the chase camera. Clicking the canvas asks for pointer lock, which is
// what makes the mouse turn the view instead of the cursor leaving the window.
const MOVE_FORWARD = new Set (['KeyW', 'ArrowUp']);
const MOVE_BACK = new Set (['KeyS', 'ArrowDown']);
const MOVE_LEFT = new Set (['KeyA', 'ArrowLeft']);
const MOVE_RIGHT = new Set (['KeyD', 'ArrowRight']);
const SPRINT = new Set (['ShiftLeft', 'ShiftRight']);
const JUMP = new Set (['Space']);
export function createInput (canvas) {
  const held = new Set ();
  const pressed = new Set ();
  let mouseX = 0;
  let mouseY = 0;
  let clicked = false;
  let wheel = 0;
  let locked = false;
  window.addEventListener ('keydown', (event) => {
    if (event.code === 'Tab' || event.code === 'F1') return; if (!event.repeat) pressed.add (event.code); held.add (event.code); if (MOVE_FORWARD.has (event.code) ||
    MOVE_BACK.has (event.code) || JUMP.has (event.code)) event.preventDefault ();
  }
  );
  window.addEventListener ('keyup', (event) => {
    held.delete (event.code);
  }
  );
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener ('blur', () => held.clear ());
  canvas.addEventListener ('mousedown', (event) => {
    clicked = true; if (event.button === 0) held.add ('Mouse0'); if (!locked) canvas.requestPointerLock?.(); if (event.button === 2) held.add ('Mouse2');
  }
  );
  window.addEventListener ('mouseup', (event) => {
    if (event.button === 0) held.delete ('Mouse0'); if (event.button === 2) held.delete ('Mouse2');
  }
  );
  canvas.addEventListener ('contextmenu', (event) => event.preventDefault ());
  window.addEventListener ('mousemove', (event) => {
    if (!locked) return; mouseX += event.movementX; mouseY += event.movementY;
  }
  );
  document.addEventListener ('pointerlockchange', () => {
    locked = document.pointerLockElement === canvas;
  }
  );
  canvas.addEventListener ('wheel', (event) => {
    wheel += Math.sign (event.deltaY); event.preventDefault ();
  }
  , {
    passive : false
  }
  );
  return {
    /** True while the key is held (CSS key code, e.g. "KeyW"). */
    down : (code) => held.has (code),
    /** True once for a press since the last frame. */
    pressed : (code) => pressed.has (code), forward : () => (heldOn (held, MOVE_FORWARD) ? 1 : 0) - (heldOn (held,
    MOVE_BACK) ? 1 : 0), strafe : () => (heldOn (held, MOVE_RIGHT) ? 1 : 0) - (heldOn (held, MOVE_LEFT) ?
    1 : 0), sprint : () => heldOn (held, SPRINT), jump : () => heldOn (held, JUMP), mouseLook () {
      const delta = {
        x : mouseX, y : mouseY
      }
      ;
      mouseX = 0;
      mouseY = 0;
      return delta;
    }
    , takeWheel () {
      const value = wheel;
      wheel = 0;
      return value;
    }
    , takeClick () {
      const value = clicked;
      clicked = false;
      return value;
    }
    , get locked () {
      return locked;
    }
    ,
    /** Called once at the end of each frame: forgets the presses already answered. */
    endFrame () {
      pressed.clear ();
    }
    ,
  }
  ;
}
function heldOn (held, codes) {
  for (const code of codes) if (held.has (code)) return true;
  return false;
}
