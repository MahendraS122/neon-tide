# NEON TIDE: Port Solara

Original coastal open-world game. Session A implements the rendering, city and movement foundation.
The game is plain static files under `game/`; no build or runtime internet access is required.

## Run and controls

Run `node serve.ts --port 8090` and open `http://localhost:8090/` in desktop Chrome.

- Click the game to capture the mouse. Escape releases it.
- WASD or arrow keys: walk or drive.
- Shift: sprint on foot.
- Space: jump on foot, handbrake in a vehicle.
- F: enter or steal a nearby vehicle; exit at low speed.
- N: toggle golden hour and night.

Dex starts on Ocean Drive, near the turquoise Solstice GT. The city includes beachfront hotels,
glass downtown blocks, Las Palmas homes, Reyes Park, Sunbreak Beach, Solara Pier and the cargo port.
Six vehicle types are available: sports coupe, muscle car, SUV, taxi, police cruiser and van.
The police cruiser is currently a vehicle model only, with no pursuit behavior.

## Architecture

`game/src/main.js` wires small independent gameplay modules before world and art imports.
Player and vehicle physics run at a fixed 60 Hz; the renderer interpolates the camera separately.
The city generator owns road axes, district names, signal locations and collision bounds.
Gameplay accepts character and vehicle model factories rather than importing large art modules.

- `entities/`: input, character animation, player movement, vehicle physics, traffic and pedestrians.
- `world/`: district generation, buildings, palms and furniture, ocean, port and pier landmarks.
- `render/`: ACES renderer, procedural sky, canvas textures, and moving-actor GPU instancing.
- `ui/`: a minimal live district, speed, condition, clock and control-hint HUD.

Repeated static geometry is instanced in spatial cells. Articulated actor parts are also instanced,
with a 105-meter draw radius. Resolution scales down on slow renderers. Shadows use a local sun volume.
All art is generated in code. The only third-party runtime file is the permitted three.js 0.160.0 build.

## Verification and remaining work

Chrome/SwiftShader checks cover walking, sprinting, jumping and landing, building collision,
entering and exiting, acceleration, handbrake slip, driver ejection, pedestrian fleeing and night mode.
The browser made no external requests and produced no console errors in those checks.
The optional `window.__game` object exposes live systems for integration and diagnostics.
`window.__shotReady` becomes true after three rendered frames; no staged shot scenes exist yet.

Items 4–7 remain: wanted/police/helicopter/roadblocks, weapons/gangs/health, the complete HUD/minimap,
and deterministic chase/on-foot scenes and submission screenshots. Story, activities, sound, menus,
and saving are also future work. The kit's old `shots.json` and submission screenshots still need
replacement during the screenshot session. Do not treat this foundation as a completed bounty entry.

Keep `vendor/makefun-game.ts`, `LICENSE` and `.makefun/owner.json` intact. `main.ts` retains the official
hand-in flow. Do not push or submit until the remaining sessions are complete.
