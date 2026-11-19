// Foundation HUD displays only live free-roam state; mission and police panels come later.
export function createHud(player, vehicleSystem, city) {
  const district = document.querySelector('#district');
  const speedometer = document.querySelector('#speedometer');
  const speed = document.querySelector('#speed');
  const name = document.querySelector('#car-name');
  const condition = document.querySelector('#condition');
  const hint = document.querySelector('#hint');
  const clock = document.querySelector('#clock');
  let elapsed = 0;
  let lastUpdate = 0;
  function update(dt, night) {
    elapsed += dt;
    if (elapsed - lastUpdate < 0.08) return;
    lastUpdate = elapsed;
    const position = player.position;
    district.textContent = city.districtAt(position.x, position.z);
    const vehicle = player.vehicle;
    speedometer.hidden = !vehicle;
    if (vehicle) {
      speed.textContent = Math.round(Math.abs(vehicle.speed) * 3.6);
      name.textContent = vehicle.spec.name.toUpperCase();
      condition.textContent = `CONDITION ${Math.round(vehicle.condition)}%`;
    }
    const minutes = 42 + Math.floor(elapsed / 4);
    const hour = (night ? 22 : 18) + Math.floor(minutes / 60);
    clock.textContent = `${String(hour % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')} / THU`;
    hint.textContent = vehicleSystem.nearestHint()
      || 'CLICK TO LOOK · WASD MOVE · SHIFT SPRINT · SPACE JUMP · F ENTER CAR · N NIGHT';
  }
  return { update };
}
