// Twenty-four persistent tide tokens reward exploration along roads, parks and the shore.
import * as THREE from 'three';
export const TOKEN_POINTS = [
  [-315, 310], [-318, 220], [-318, 125], [-318, -30], [-318, -140], [-318, -280],
  [-188, 310], [-94, 310], [0, 310], [94, 310], [188, 310], [282, 310],
  [310, 235], [310, 140], [310, 45], [310, -50], [310, -140], [310, -280],
  [188, -310], [94, -310], [0, -310], [-94, -310], [-188, -310], [-282, -310],
];

export function createCollectibles(game) {
  const root = new THREE.Group();
  game.view.scene.add(root);
  const material = new THREE.MeshStandardMaterial({ color: 0x55ffe1, emissive: 0x19bca4,
    emissiveIntensity: 1.4, metalness: 0.7, roughness: 0.25 });
  const geometry = new THREE.TorusGeometry(0.52, 0.16, 6, 16);
  const tokens = TOKEN_POINTS.map(([x, z], id) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, game.world.groundHeight(x, z) + 1.1, z);
    root.add(mesh);
    return { id, x, z, mesh };
  });
  let time = 0;

  function reset() {
    tokens.forEach(token => { token.mesh.visible = !game.stats.tokens.includes(token.id); });
  }

  function remaining() {
    return tokens.filter(token => !game.stats.tokens.includes(token.id)).map(({ id, x, z }) => ({ id, x, z }));
  }

  function update(dt) {
    time += dt;
    const p = game.playerRig.player.position;
    for (const token of tokens) {
      if (!token.mesh.visible) continue;
      token.mesh.rotation.y += dt * 1.8;
      token.mesh.position.y = 1.2 + Math.sin(time * 2 + token.id) * 0.18;
      if (Math.hypot(p.x - token.x, p.z - token.z) < 2.5) {
        token.mesh.visible = false;
        game.stats.tokens.push(token.id);
        game.stats.respect += 25;
        game.cash += 250;
        game.hud.setCash(game.cash);
        game.hud.float(`TIDE TOKEN ${game.stats.tokens.length} / 24 · +$250`, 'cash');
        if (game.stats.tokens.length === 24) {
          game.cash += 10000;
          game.hud.banner('TIDE MASTER', '24 / 24 TOKENS · +$10,000', { pass: true });
        }
        game.save.autosave();
      }
    }
  }
  reset();
  return { reset, remaining, update };
}
