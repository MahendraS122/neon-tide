// Pause suspends the simulation and points players to the safehouse save service.
// This menu's active getter is the simulation's pause-state signal.
export function createPauseMenu({ canSave, save, openMap }) {
  const root = document.createElement('section');
  root.id = 'pause-menu';
  root.className = 'service-menu';
  root.hidden = true;
  root.innerHTML = `<small>NEON TIDE / PORT SOLARA</small><h2>On Hold</h2><div class="service-actions">
    <button>Resume</button><button>City atlas</button><button>Save at safehouse</button>
    </div><p role="status"></p><p>M Atlas · G Workshop · K Save · Q/E Radio · T Race</p>`;
  document.body.append(root);
  const [resume, map, store] = root.querySelectorAll('button');
  const status = root.querySelector('[role="status"]');
  const close = () => { root.hidden = true; };
  resume.onclick = close;
  map.onclick = () => { close(); openMap(); };
  store.onclick = () => {
    status.textContent = !canSave() ? 'Return to the Ocean Drive safehouse on foot with no wanted level.'
      : save() ? 'Safehouse slot updated.' : 'Browser storage unavailable.';
  };
  return { close, open() {
    if (document.pointerLockElement) document.exitPointerLock();
    status.textContent = '';
    root.hidden = false;
  }, get active() { return !root.hidden; } };
}
