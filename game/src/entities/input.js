// Keyboard edges and pointer-lock mouse motion are sampled by the fixed-step simulation.
export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let mouseX = 0;
  let mouseY = 0;
  let dragging = false;
  addEventListener('keydown', event => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    if (!event.repeat) pressed.add(event.code);
    held.add(event.code);
  });
  addEventListener('keyup', event => held.delete(event.code));
  addEventListener('blur', () => {
    held.clear();
    pressed.clear();
    dragging = false;
  });
  canvas.addEventListener('click', () => {
    if (!document.pointerLockElement) canvas.requestPointerLock()?.catch(() => {});
  });
  canvas.addEventListener('mousedown', () => { dragging = true; });
  addEventListener('mouseup', () => { dragging = false; });
  addEventListener('mousemove', event => {
    if (document.pointerLockElement === canvas || dragging) {
      mouseX += event.movementX;
      mouseY += event.movementY;
    }
  });
  return {
    held,
    down(code) { return held.has(code); },
    take(code) {
      const value = pressed.has(code);
      pressed.delete(code);
      return value;
    },
    mouse() {
      const value = { x: mouseX, y: mouseY };
      mouseX = mouseY = 0;
      return value;
    }
  };
}
