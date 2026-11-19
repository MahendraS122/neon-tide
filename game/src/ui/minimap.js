// A heading-up local atlas draws roads, building footprints and tracked entities.
export function createMinimap(canvas, city, player) {
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  const scale = size / 225;
  function blip(position, color, radius) {
    if (position.distanceTo(player.position) > 99) return;
    ctx.beginPath();
    ctx.arc(position.x, position.z, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 1.3;
    ctx.strokeStyle = '#091826';
    ctx.stroke();
  }
  function draw(units, members, cars) {
    const p = player.position;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, center - 3, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#124052';
    ctx.fillRect(0, 0, size, size);
    ctx.translate(center, center);
    ctx.scale(scale, scale);
    ctx.rotate(player.heading + Math.PI);
    ctx.translate(-p.x, -p.z);
    ctx.fillStyle = '#506264';
    ctx.fillRect(city.bounds.minX, city.bounds.minZ, 353, 495);
    ctx.fillStyle = '#928b70';
    ctx.fillRect(109, city.bounds.minZ, 31, 495);
    ctx.fillStyle = '#b4bdb1';
    for (const x of city.roadX) ctx.fillRect(x - 7.6, -199, 15.2, 402);
    for (const z of city.roadZ) ctx.fillRect(-213, z - 7.6, 321, 15.2);
    ctx.fillStyle = '#293f48';
    for (const block of city.colliders) {
      if (block.height < 2) continue;
      ctx.fillRect(block.minX, block.minZ, block.maxX - block.minX, block.maxZ - block.minZ);
    }
    for (const car of cars) {
      if (car.root.visible && car !== player.vehicle && !car.service) blip(car.position, '#cce2dc', 2.35);
    }
    for (const unit of units) blip(unit.position, unit.status === 'ROADBLOCK' ? '#ffbd66' : '#79d6ff', 4);
    for (const member of members) {
      if (member.health && member.character.root.visible) blip(member.position, '#ff6279', 3.9);
    }
    const angle = player.heading;
    const northX = -Math.sin(angle) * 87;
    const northZ = -Math.cos(angle) * 87;
    ctx.restore();
    ctx.fillStyle = '#eaf9ec';
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', center + northX, center + northZ);
    ctx.beginPath();
    ctx.moveTo(center, center - 11);
    ctx.lineTo(center + 7, center + 8);
    ctx.lineTo(center, center + 4);
    ctx.lineTo(center - 7, center + 8);
    ctx.closePath();
    ctx.fillStyle = '#fefbea';
    ctx.fill();
    ctx.strokeStyle = '#173449';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  return { draw };
}
