// Portrait sheets depict Port Solara's original characters with locally drawn features.
const cast = {
  'Dex Navarro': { skin: '#bd805e', hair: '#241c25', shirt: '#258c88', style: 'crop' },
  'Mara Reyes': { skin: '#d89b73', hair: '#171d2b', shirt: '#d45067', style: 'wave' },
  'Nico Vale': { skin: '#a9694e', hair: '#31231d', shirt: '#d5a644', style: 'curl' },
  'Sera Sol': { skin: '#efc49b', hair: '#85434a', shirt: '#5593ac', style: 'bob' },
  'Luz Ortega': { skin: '#c58665', hair: '#24232c', shirt: '#8d5aa4', style: 'long' },
  'Captain Imani': { skin: '#875943', hair: '#161b26', shirt: '#54726f', style: 'close' }
};

export function portraitNames() {
  return Object.keys(cast);
}

export function drawPortrait(context, name, x, y, width, height) {
  const person = cast[name] ?? cast['Dex Navarro'];
  const scale = Math.min(width, height);
  context.save();
  context.translate(x, y);
  context.fillStyle = '#182b3b';
  context.fillRect(0, 0, width, height);
  const glow = context.createRadialGradient(width * 0.5, height * 0.32, 2,
    width * 0.5, height * 0.4, scale * 0.7);
  glow.addColorStop(0, '#367079');
  glow.addColorStop(1, '#162539');
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);
  context.fillStyle = person.shirt;
  context.beginPath();
  context.ellipse(width * 0.5, height * 1.04, width * 0.43, height * 0.38, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = person.skin;
  context.fillRect(width * 0.43, height * 0.62, width * 0.14, height * 0.2);
  context.beginPath();
  context.ellipse(width * 0.5, height * 0.43, width * 0.24, height * 0.29, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = person.hair;
  context.beginPath();
  context.ellipse(width * 0.5, height * 0.29, width * 0.26, height * 0.14, 0, Math.PI, Math.PI * 2);
  context.fill();
  if (person.style === 'long' || person.style === 'wave' || person.style === 'bob') {
    context.fillRect(width * 0.25, height * 0.28, width * 0.07, height * 0.36);
    context.fillRect(width * 0.68, height * 0.28, width * 0.07, height * 0.36);
  }
  for (const eyeX of [0.41, 0.59]) {
    context.fillStyle = '#332431';
    context.beginPath();
    context.ellipse(width * eyeX, height * 0.43, scale * 0.025, scale * 0.014, 0, 0, Math.PI * 2);
    context.fill();
  }
  context.strokeStyle = '#8b4c4b';
  context.lineWidth = Math.max(1, scale * 0.012);
  context.beginPath();
  context.moveTo(width * 0.44, height * 0.55);
  context.quadraticCurveTo(width * 0.5, height * 0.59, width * 0.56, height * 0.55);
  context.stroke();
  context.restore();
}
