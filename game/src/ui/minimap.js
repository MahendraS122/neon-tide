// The circular minimap, drawn each frame on a small canvas: the roads in a rotated frame around
// the player, blocks as dark shapes, then blips for the mission target, police, the garage and the
// safehouse, and the player's own arrow at the centre. Rotating with the camera is what makes it
// readable while driving.
import { ROADS, PITCH, ROAD_HALF, CITY, BLOCK_HALF } from '../config.js';
const SIZE = 212;
/** How many metres across the minimap's circle. */
const VIEW = 210;
export function createMinimap(canvas) { const ctx = canvas.getContext('2d');
const state = { yaw: 0 };
const toMap =(dx, dz, rot) => {
  // Rotate by -yaw so "up" on the map is where the player is looking.
  const cos = Math.cos(- rot);
  const sin = Math.sin(- rot);
  const x = dx * cos - dz * sin;
  const y = dx * sin + dz * cos;
  const scale = SIZE / VIEW;
  return { x: SIZE / 2 + x * scale, y: SIZE / 2 + y * scale };
};
/**
* Draw one frame. `player` is { x, z, heading }, `yaw` the camera's yaw, `blips` a list of
* { x, z, kind } with kind in mission, police, garage, safehouse, collectible.
*/
function draw(player, yaw, blips) {
  state.yaw = yaw;
  const rot = yaw;
  ctx.clearRect(0, 0, SIZE, SIZE);
  // Sea to the west, so the beach edge reads at a glance.
  ctx.fillStyle = '#123a44';
  ctx.beginPath();
  const waterA = toMap(- CITY.waterX - player.x, - VIEW, rot);
  const waterB = toMap(- CITY.waterX - player.x, VIEW, rot);
  ctx.moveTo(waterA.x, waterA.y);
  ctx.lineTo(waterB.x, waterB.y);
  const farA = toMap(- 1600 - player.x, VIEW, rot);
  const farB = toMap(- 1600 - player.x, - VIEW, rot);
  ctx.lineTo(farA.x, farA.y);
  ctx.lineTo(farB.x, farB.y);
  ctx.closePath();
  ctx.fill();
  // Sand between the water and the promenade.
  ctx.fillStyle = '#5b5340';
  ctx.beginPath();
  const sandA = toMap(CITY.beachX - player.x, - VIEW, rot);
  const sandB = toMap(CITY.beachX - player.x, VIEW, rot);
  ctx.moveTo(sandA.x, sandA.y);
  ctx.lineTo(sandB.x, sandB.y);
  ctx.lineTo(waterA.x, waterA.y);
  ctx.lineTo(waterB.x, waterB.y);
  ctx.closePath();
  ctx.fill();
  // City ground.
  ctx.fillStyle = '#20242c';
  ctx.fillRect(0, 0, SIZE, SIZE);
  // Blocks, as slightly lighter slabs with the road gaps left dark.
  ctx.fillStyle = '#2f3540';
  for (const rx of ROADS) {
    for (const rz of ROADS) {
      const a = toMap(rx - BLOCK_HALF - player.x, rz - BLOCK_HALF - player.z, rot);
      const b = toMap(rx + BLOCK_HALF - player.x, rz + BLOCK_HALF - player.z, rot);
      ctx.fillRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    }
  }
  // Road centre lines.
  ctx.strokeStyle = 'rgba(236,222,180,.5)';
  ctx.lineWidth = 1.2;
  for (const road of ROADS) {
    const a = toMap(road - player.x, - VIEW, rot);
    const b = toMap(road - player.x, VIEW, rot);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    const c = toMap(- VIEW, road - player.z, rot);
    const d = toMap(VIEW, road - player.z, rot);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.stroke();
  }
  // Blips.
  for (const blip of blips ??[]) {
    const p = toMap(blip.x - player.x, blip.z - player.z, rot);
    const dx = p.x - SIZE / 2;
    const dy = p.y - SIZE / 2;
    const dist = Math.hypot(dx, dy);
    let x = p.x;
    let y = p.y;
    let clamped = false;
    if (dist > SIZE / 2 - 10) {
      const k =(SIZE / 2 - 10) / dist;
      x = SIZE / 2 + dx * k;
      y = SIZE / 2 + dy * k;
      clamped = true;
    }
    drawBlip(ctx, x, y, blip.kind, clamped);
  }
  // Player arrow at the centre, pointing where the camera looks (up is forward).
  ctx.save();
  ctx.translate(SIZE / 2, SIZE / 2);
  const playerYaw =(player.heading ?? 0) - rot;
  ctx.rotate(- playerYaw);
  ctx.beginPath();
  ctx.moveTo(0, - 8);
  ctx.lineTo(6, 7);
  ctx.lineTo(0, 4);
  ctx.lineTo(- 6, 7);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = 'rgba(0,0,0,.8)';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  // Vignette so the circle's edge is soft.
  const gradient = ctx.createRadialGradient(SIZE / 2, SIZE / 2, SIZE * 0.3, SIZE / 2, SIZE / 2,
  SIZE / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SIZE, SIZE);
}
function drawBlip(ctx, x, y, kind, clamped) {
  const colours = {
    mission: '#ffd166', police: '#5aa9ff', enemy: '#ff4b59', garage: '#ff7a2f', safehouse: '#25e6d0',
    collectible: '#66ff8f', race: '#ff4d9d',
  };
  const colour = colours[kind] ?? '#ffffff';
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'mission' || kind === 'race') {
    ctx.beginPath();
    ctx.moveTo(0, - 7);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 7);
    ctx.lineTo(- 7, 0);
    ctx.closePath();
  }
  else {
    ctx.beginPath();
    ctx.arc(0, 0, clamped ? 4: 5, 0, Math.PI * 2);
  }
  ctx.fillStyle = colour;
  ctx.shadowColor = colour;
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0,0,0,.7)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}
return { draw, canvas, SIZE };
}
