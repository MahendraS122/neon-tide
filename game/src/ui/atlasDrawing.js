// Draw the street atlas directly from Solara's world coordinates.

export function drawAtlas(canvas, city, player, sites, route) {
  const context = canvas.getContext('2d');
  const { clientWidth: width, clientHeight: height } = canvas;
  if (!width || !height) return;
  const ratio = Math.min(devicePixelRatio, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  const sea = context.createLinearGradient(width * .52, 0, width, height);
  sea.addColorStop(0, '#226873');
  sea.addColorStop(1, '#0b263d');
  context.fillStyle = sea;
  context.fillRect(0, 0, width, height);
  const bounds = city.bounds;
  const scale = Math.min((width - 28) / 465, (height - 28) / 515);
  const x = value => width / 2 + (value + 19) * scale;
  const y = value => height / 2 + (value - 23) * scale;

  function line(points, color, size = 1, fill = false) {
    context.beginPath();
    points.forEach(([a, b], i) => context[i ? 'lineTo' : 'moveTo'](x(a), y(b)));
    context.lineJoin = 'round';
    context.lineCap = 'round';
    if (fill) {
      context.fillStyle = color;
      context.fill();
    } else {
      context.strokeStyle = color;
      context.lineWidth = size;
      context.stroke();
    }
  }

  const shore = [[135, -231], [142, -171], [133, -115], [147, -64], [145, -8],
    [141, 43], [150, 98], [138, 157], [129, 194], [76, 218], [39, 263]];
  const west = [[-248, 260], [-248, -231]];
  for (const offset of [27, 48, 78, 112]) {
    line(shore.map(([a, b]) => [a + offset, b + offset * .16]), '#89c6d32a');
  }
  line([...west, ...shore], '#c9ad79', 0, true);
  line([...west, ...shore.map(([a, b], i) => [a - (i < 8 ? 21 : 6), b])], '#293e49', 0, true);
  const districts = [
    [-245, -221, -155, 193, '#295451', 'LAS PALMAS', -193, -63],
    [-155, -221, 82, 39, '#42465d', 'GLASSWATER', -55, -175],
    [-155, 40, 82, 116, '#355547', 'REYES PARK', -49, 68],
    [-155, 117, 82, 192, '#525044', 'LITTLE SOL', -45, 161],
    [82, -220, 115, 191, '#574755', 'OCEAN DRIVE', 99, -84],
    [-234, 194, 38, 251, '#3f5055', 'CONTAINER PORT', -125, 229]
  ];
  for (const [a, b, c, d, tint] of districts) {
    context.fillStyle = tint;
    context.fillRect(x(a), y(b), (c - a) * scale, (d - b) * scale);
  }
  for (const a of city.roadX) {
    line([[a, -196], [a, 200]], '#71818b', 12 * scale);
    line([[a, -196], [a, 200]], '#aeac9d70', 2 * scale);
  }
  for (const b of city.roadZ) {
    line([[city.roadX[0] - 8, b], [city.roadX.at(-1) + 8, b]], '#71818b', 12 * scale);
    line([[city.roadX[0] - 8, b], [city.roadX.at(-1) + 8, b]], '#aeac9d70', 2 * scale);
  }
  for (const box of city.colliders) {
    if (!Number.isFinite(box.minX) || box.maxX > bounds.maxX) continue;
    context.fillStyle = '#aebac826';
    context.fillRect(x(box.minX), y(box.minZ), (box.maxX - box.minX) * scale, (box.maxZ - box.minZ) * scale);
  }
  line([[115, -115], [188, -115]], '#ccb792', 8 * scale);
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#f0e7d2';
  context.font = 'bold 29px system-ui';
  context.fillText('☸', x(180), y(-117));
  for (const a of [-176, -91, -19]) {
    line([[a, 217], [a, 203], [a + 19, 203], [a + 19, 211]], '#d29e73', 2);
  }
  context.font = `800 ${Math.max(9, scale * 13)}px system-ui`;
  for (const [, , , , , label, a, b] of districts) {
    context.fillStyle = '#e7e6d5b8';
    context.fillText(label, x(a), y(b));
  }
  context.fillStyle = '#a6d7de99';
  context.fillText('SOLARA BAY', x(155), y(104));
  context.fillText('N ↑', width - 27, 25);
  if (route.length > 1) {
    line(route, '#081d29', 10);
    line(route, '#60ffda', 5);
  }
  for (const site of sites) {
    const radius = site.icon === '◆' ? 4 : 9;
    context.fillStyle = '#142a39';
    context.strokeStyle = site.color;
    context.lineWidth = 1.4;
    context.beginPath();
    context.arc(x(site.x), y(site.z), radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    if (radius < 5) continue;
    context.fillStyle = site.color;
    context.font = 'bold 11px system-ui';
    context.fillText(site.icon, x(site.x), y(site.z));
  }
  const actor = player.vehicle ?? player;
  context.save();
  context.translate(x(actor.position.x), y(actor.position.z));
  context.rotate(Math.PI - actor.yaw);
  context.beginPath();
  context.moveTo(0, -12);
  context.lineTo(8, 9);
  context.lineTo(0, 5);
  context.lineTo(-8, 9);
  context.closePath();
  context.fillStyle = '#fff9df';
  context.strokeStyle = '#132537';
  context.lineWidth = 2;
  context.fill();
  context.stroke();
  context.restore();
}

export function roadRoute(city, from, target) {
  const closest = (values, point) => values.reduce((a, b) => Math.abs(b - point) < Math.abs(a - point) ? b : a);
  const join = point => {
    const a = closest(city.roadX, point.x);
    const b = closest(city.roadZ, point.z);
    return Math.abs(a - point.x) < Math.abs(b - point.z) ? [[a, point.z], [a, b]] : [[point.x, b], [a, b]];
  };
  const start = join(from);
  const end = join(target);
  return [[from.x, from.z], ...start, [end[1][0], start[1][1]], ...end.reverse(), [target.x, target.z]];
}
