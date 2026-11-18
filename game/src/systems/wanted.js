export function createWanted () {
  const state = {
    level : 0, heat : 0, cooldown : 0, searching : false, lineOfSight : false, flash : 0, units :
    []
  }
  ;
  function crime (type = 'assault', weight = 1) {
    const values = {
      assault : 1, vehicleTheft : 1, weapon : 1, hitOfficer : 2, kill : 2, explosion : 3, carjacking :
      2
    }
    ;
    state.heat = Math.min (100, state.heat + (values [type] ?? 1) * weight * 14);
    state.level = Math.min (5, Math.max (state.level, Math.ceil (state.heat / 20)));
    state.cooldown = 0;
    state.searching = false;
    return state.level;
  }
  function update (dt, player, policeUnits = [], heli = null) {
    state.units = [... policeUnits, ... (heli ? [heli] : [])];
    state.lineOfSight = state.level > 0 && state.units.some (unit => !unit.dead && !unit.occluded &&
    Math.hypot (unit.position.x - player.x, unit.position.z - player.z) < unit.sightRange);
    if (!state.level) return;
    state.cooldown = state.lineOfSight ? 0 : state.cooldown + dt;
    state.searching = state.cooldown > 3;
    if (state.cooldown >= 10 + state.level * 2) {
      state.level --;
      state.heat = state.level * 18;
      state.cooldown = state.level ? 3.1 : 0;
      state.searching = state.level > 0;
    }
  }
  function clear () {
    state.level = 0;
    state.heat = 0;
    state.cooldown = 0;
    state.searching = false;
  }
  function bust (hud) {
    hud.banner ('BUSTED', 'Port Solara SPD · booking desk', {
      seconds : 2.6
    }
    );
    clear ();
  }
  function wasted (hud) {
    hud.banner ('WASTED', 'The night takes another name', {
      seconds : 2.6
    }
    );
  }
  return {
    state, crime, update, clear, bust, wasted
  }
  ;
}
