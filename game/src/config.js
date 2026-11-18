// Every tuning number for NEON TIDE: Port Solara in one place: the city's road grid, the
// golden-hour sun, how fast Dex walks and drives, how the chase camera trails him, and the
// palette the canvas-drawn textures are painted with. Units are metres and seconds throughout.

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;
/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
export const MAX_FRAME = 0.25;

/**
 * The city is a square grid of blocks with roads between them. Road centres sit at ROADS on both
 * axes, so the outermost roads ring the city and Ocean Drive runs along the beach to the west.
 * Blocks fill the gaps: their centres are BLOCK_CENTERS, and a block is PITCH - 2*ROAD_HALF wide.
 */
export const ROADS = [-282, -188, -94, 0, 94, 188, 282];
export const PITCH = 94;
export const ROAD_HALF = 11;
/** Centres of the six blocks along each axis. */
export const BLOCK_CENTERS = [-235, -141, -47, 47, 141, 235];
/** A block runs from -(PITCH/2 - ROAD_HALF) to +(PITCH/2 - ROAD_HALF) around its centre: 72 m. */
export const BLOCK_HALF = 36;
/** Buildings are set back from the block edge; the ring between is walkable sidewalk. */
export const LOT_HALF = 27;
export const CURB_HEIGHT = 0.16;

export const CITY = {
  /** Half the width of the whole built-up area, for ground planes and map framing. */
  extent: 340,
  /** The promenade slab between Ocean Drive and the sand. */
  promenadeX: -318,
  promenadeHalf: 25,
  /** Sand from here to the promenade; water from here out to the horizon. */
  beachX: -368,
  beachHalf: 52,
  waterX: -424,
  waterWidth: 1500,
  /** The pier, its deck at promenade height, and the Ferris wheel at its end. */
  pierX: -318,
  pierLength: 236,
  pierWidth: 18,
  pierZ: 58,
  ferrisWheelX: -540,
  ferrisWheelY: 8,
};

/** Surface height by where you are: the pavement is a step up from the asphalt. */
export const GROUND = { road: 0, walk: CURB_HEIGHT };

/** Golden hour: a low sun out over the water, so shadows rake long across Ocean Drive. */
export const SUN = {
  /** Degrees above the horizon. */
  elevation: 8.5,
  /** Degrees around from +X toward +Z: 152 puts the sun low over the sea, west of Ocean Drive. */
  azimuth: 152,
  distance: 1100,
  color: 0xffc07a,
  intensity: 3.4,
  /** The shadow camera is a box this many metres across, kept centred just ahead of the player. */
  shadowSize: 78,
  shadowMap: 2048,
  fogColor: 0xf2b489,
  fogNear: 170,
  fogFar: 700,
};

export const SKY = {
  zenith: 0x24457f,
  upper: 0x6d8fc9,
  horizon: 0xffb877,
  glow: 0xffe0ae,
  sunDisc: 0xfff6e0,
};

export const PLAYER = {
  height: 1.82,
  radius: 0.44,
  walk: 4.2,
  run: 7.8,
  accel: 34,
  jump: 5.8,
  gravity: 21,
  health: 100,
  armour: 0,
  /** How close to a car Dex must be to press F. */
  reach: 3.1,
};

export const VEHICLE = {
  accel: 14.5,
  brake: 26,
  reverseMax: 11,
  topSpeed: 46,
  drag: 0.36,
  /** Radians per second of steering at full lock, before speed scaling. */
  steer: 1.75,
  grip: 0.9,
  handbrakeGrip: 0.35,
  halfWidth: 1.02,
  halfLength: 2.24,
  wheelRadius: 0.36,
  /** Mass-ish multiplier: the difference between a hatchback and a muscle car. */
  mass: 1,
};

export const CAMERA = {
  fov: 58,
  near: 0.25,
  far: 1800,
  footDistance: 5.2,
  footHeight: 2.1,
  footLookHeight: 1.4,
  carDistance: 10.4,
  carHeight: 4.9,
  carLookHeight: 1.6,
  sensitivity: 0.0026,
  pitchMin: -0.38,
  pitchMax: 0.85,
  /** How quickly the camera catches up with its target, per second. */
  follow: 7.5,
};

/** Palette the canvas texture painters draw with. */
export const PALETTE = {
  asphalt: '#3b3b42',
  asphaltGrain: '#34343a',
  lane: '#e9dcb4',
  walk: '#cdc1ad',
  walkLine: '#b3a693',
  sand: '#e8cf9d',
  sandDark: '#cdae78',
  grass: '#5b8c46',
  water: '#1c6f80',
  deco: ['#f4cec4', '#a9dedb', '#f7e4b4', '#cde1be', '#f2c3a6', '#c3d5ee', '#e9bcae'],
  glass: ['#6f9fc4', '#7fb4ae', '#5d86a8', '#93b5c9', '#6b8fc0'],
  concrete: ['#b9b2a6', '#a8a49b', '#c6bfb2'],
  neon: ['#25e6d0', '#ff4d9d', '#ffb03a', '#8f6bff', '#66ff8f', '#ff7a2f'],
};

export const HUD = { startCash: 500 };

/** Where the save lives between visits (this browser only). */
export const SAVE_KEY = 'neon-tide.save.v1';
