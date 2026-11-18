// The HTML overlay, driven from game state: mission panel, SPD response list, cash and clock and
// stars, weapon slots, speedometer and radio, the dialogue box, floating text and full-screen
// banners. Every number is written here, so the DOM is the single source of what the player sees;
// nothing in this file decides gameplay.
import {
  HUD
}
from '../config.js';
import {
  drawPortrait, PORTRAITS
}
from './portraits.js';
const el = {
}
;
function q (id) {
  if (!el [id]) el [id] = document.getElementById (id);
  return el [id];
}
export function createHud () {
  const hud = document.getElementById ('hud');
  const state = {
    cash : HUD.startCash, stars : 0, searching : false, health : 100, armour : 0, district : 'Ocean Drive',
    time : '18:20', day : 1, weapon : 0, speed : 0, gear : 'P', nitro : 1, inCar : false, radio :
    {
      station : 'SUNSET FM 98.6', song : 'Chrome Palms'
    }
    ,
  }
  ;
  /** Write the mission panel: chapter, name, objective, timer and stage bar. */
  function setMission (mission) {
    const panel = q ('mission-panel');
    if (!mission) {
      panel.classList.add ('hidden');
      return;
    }
    panel.classList.remove ('hidden');
    q ('mp-chapter').textContent = mission.chapter ?? 'SIDE JOB';
    q ('mp-name').textContent = mission.name ?? '';
    q ('mp-objective').innerHTML = mission.objective ?? '';
    const timer = q ('mp-timer');
    if (mission.timeLeft == null) {
      timer.textContent = '--:--';
      timer.classList.remove ('urgent');
    }
    else {
      const t = Math.max (0, Math.ceil (mission.timeLeft));
      timer.textContent = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
      timer.classList.toggle ('urgent', t <= 10);
    }
    q ('mp-cash').textContent = mission.cashLabel ?? '';
    const stages = q ('mp-stages');
    const count = mission.stages ?? 0;
    if (stages.childElementCount !== count) {
      stages.innerHTML = '';
      for (let i = 0; i < count; i += 1) stages.appendChild (document.createElement ('i'));
    }
    [... stages.children].forEach ((node, i) => {
      node.className = i < (mission.stageIndex ?? 0) ? 'done' : i === (mission.stageIndex ?? 0) ?
      'on' : '';
    }
    );
  }
  /** The SPD list: one row per chasing unit with its distance and what it is doing. */
  function setPolice (units, {
    searching
  }
  ) {
    const panel = q ('spd-panel');
    if (!units || units.length === 0) {
      panel.classList.add ('hidden');
      return;
    }
    panel.classList.remove ('hidden');
    q ('spd-count').textContent = `${units.length} UNIT${units.length === 1 ? '' : 'S'}`;
    const list = q ('spd-list');
    while (list.childElementCount > units.length) list.removeChild (list.lastChild);
    while (list.childElementCount < units.length) {
      const li = document.createElement ('li');
      li.innerHTML = '<span class="unit"></span><span class="st"></span>';
      list.appendChild (li);
    }
    units.forEach ((unit, i) => {
      const li = list.children [i]; li.children [0].textContent = `${unit.label}  ${Math.round(unit.distance)}m`; const status =
      li.children [1]; status.textContent = unit.status; status.className = `st ${unit.status.toLowerCase()}`;
    }
    );
    q ('stars').classList.toggle ('searching', Boolean (searching));
  }
  function setStatus () {
    q ('cash').textContent = `$${state.cash.toLocaleString('en-US')}`;
    q ('clock').textContent = `${state.dayName ?? 'MON'} ${state.time} · DAY ${state.day}`;
    const stars = q ('stars');
    const filled = Math.round (state.stars);
    const children = stars.children;
    for (let i = 0; i < children.length; i += 1) {
      if (i < filled) children [i].innerHTML = '<b>&#9733;</b>';
      else children [i].innerHTML = '&#9733;';
    }
  }
  function setVitals (health, armour, district) {
    q ('health-bar').firstElementChild.style.width = `${Math.max(0, Math.min(100, health))}%`;
    q ('armour-bar').firstElementChild.style.width = `${Math.max(0, Math.min(100, armour))}%`;
    if (district && district !== state.district) {
      state.district = district;
      q ('district').textContent = district;
    }
  }
  /** Weapon slots: which is equipped and how much ammo each holds. */
  function setWeapons (slots, active) {
    const box = q ('weapons');
    if (box.childElementCount !== slots.length || !box.firstElementChild?.querySelector ('.wicon')) {
      box.innerHTML = '';
      for (const slot of slots) {
        const row = document.createElement ('div');
        row.className = 'wslot';
        row.innerHTML = `<canvas class="wicon" width="38" height="22"></canvas><span>${slot.key} ${slot.name}</span><span class="ammo"></span>`;
        box.appendChild (row);
      }
    }
    [... box.children].forEach ((row, i) => {
      row.classList.toggle ('on', i === active); const slot = slots [i]; row.querySelector ('.ammo').textContent =
      slot.ammo == null ? '–' : `${slot.ammo}`; const icon = row.querySelector ('.wicon'); const ctx =
      icon.getContext ('2d'); ctx.clearRect (0, 0, 38, 22); ctx.strokeStyle = i === active ? '#72ffed' :
      '#94a8c2'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2; ctx.lineCap = 'round'; if (i === 0) {
        ctx.beginPath (); ctx.arc (13, 6, 3, 0, Math.PI * 2); ctx.moveTo (13, 9); ctx.lineTo (13,
        17); ctx.moveTo (13, 12); ctx.lineTo (7, 15); ctx.moveTo (13, 12); ctx.lineTo (19, 15); ctx.moveTo (13,
        17); ctx.lineTo (9, 21); ctx.moveTo (13, 17); ctx.lineTo (18, 21); ctx.stroke ();
      }
      else {
        ctx.fillRect (7, 8, 20, i === 3 ? 5 : 4); ctx.fillRect (11, 12, 5, 7); ctx.strokeRect (24,
        8, 7, 4); if (i === 3) {
          ctx.beginPath (); ctx.moveTo (9, 7); ctx.lineTo (26, 7); ctx.stroke ();
        }
      }
    }
    );
  }
  function setDriving (speedKmh, gear, nitro) {
    q ('speedo').classList.toggle ('hidden', !state.inCar);
    q ('spd-kmh').innerHTML = `${Math.round(Math.abs(speedKmh))}<span> KM/H</span>`;
    q ('spd-gear').textContent = gear;
    q ('nitro-wrap').firstElementChild.style.width = `${Math.max(0, Math.min(1, nitro)) * 100}%`;
  }
  function setRadio (station, song) {
    state.radio = {
      station, song
    }
    ;
    q ('radio-station').textContent = station;
    q ('radio-song').textContent = song;
  }
  function setCash (value) {
    state.cash = value;
    setStatus ();
  }
  function setStars (value, searching) {
    state.stars = value;
    state.searching = searching;
    setStatus ();
    q ('stars').classList.toggle ('searching', Boolean (searching));
    let label = q ('wanted-state');
    if (!label) {
      label = document.createElement ('div');
      label.id = 'wanted-state';
      q ('stars').insertAdjacentElement ('afterend', label);
    }
    label.textContent = value > 0 ? (searching ? 'SEARCHING' : 'IN SIGHT') : '';
    label.className = searching ? 'searching' : '';
  }
  function setClock (day, dayName, time) {
    state.day = day;
    state.dayName = dayName;
    state.time = time;
    setStatus ();
  }
  /**
  * A line of dialogue. The name is matched against the cast so the right bust is painted, and an
  * unknown speaker falls back to a blank frame rather than the wrong face.
  */
  function showDialogue (name, text, portraitKey = null) {
    const box = q ('dialogue');
    box.classList.remove ('hidden');
    q ('dlg-name').textContent = name;
    q ('dlg-text').textContent = text;
    const canvas = q ('dlg-portrait');
    const key = portraitKey ?? findPortraitKey (name);
    if (key) drawPortrait (canvas, key, {
      size : 78
    }
    );
    else {
      const ctx = canvas.getContext ('2d');
      ctx.clearRect (0, 0, canvas.width, canvas.height);
    }
  }
  /** Match a speaker's display name ("MARA REYES") to their portrait key ("mara"). */
  function findPortraitKey (name) {
    const upper = String (name).toUpperCase ();
    for (const [key, look] of Object.entries (PORTRAITS)) {
      if (look.name.toUpperCase () === upper) return key;
      const first = look.name.split (' ').pop ();
      if (upper.includes (first)) return key;
    }
    return null;
  }
  function hideDialogue () {
    q ('dialogue').classList.add ('hidden');
  }
  /** Floating "+$50" / "DRIFT x3" text that rises and fades. */
  function float (text, tone = 'good') {
    const box = q ('floaters');
    const node = document.createElement ('div');
    node.className = `floater ${tone}`;
    node.textContent = text;
    box.appendChild (node);
    setTimeout (() => node.remove (), 1900);
    while (box.childElementCount > 5) box.removeChild (box.firstChild);
  }
  /** Full-screen words: WASTED, BUSTED, or a mission complete card. */
  function banner (big, sub, {
    pass = false, seconds = 2.6
  }
  = {
  }
  ) {
    const node = q ('banner');
    node.className = pass ? 'pass' : '';
    node.innerHTML = `<div class="big">${big}</div>${sub ? `<div class="sub">${sub}</div>` : ''}`;
    if (seconds > 0) setTimeout (() => node.classList.add ('hidden'), seconds * 1000);
  }
  function hideBanner () {
    q ('banner').classList.add ('hidden');
  }
  function showHud (show) {
    hud.classList.toggle ('hidden', !show);
  }
  function hideLoading () {
    const node = document.getElementById ('loading');
    if (node) node.classList.add ('hidden');
  }
  setStatus ();
  setVitals (state.health, state.armour, state.district);
  setRadio (state.radio.station, state.radio.song);
  return {
    state, setMission, setPolice, setVitals, setWeapons, setDriving, setRadio, setCash, setStars,
    setClock, showDialogue, hideDialogue, float, banner, hideBanner, showHud, hideLoading,
  }
  ;
}
