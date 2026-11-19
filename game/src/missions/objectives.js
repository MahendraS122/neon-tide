// Objective locations and pressure limits keep every Solara contract readable and replayable.
export const objectivePlans = [
  { position: [94, -12], kind: 'vehicle', target: 'Solstice GT' },
  { position: [50, 47], kind: 'drops', timer: 150, drops: [[50, 47], [100, 112], [-52, 116]] },
  { position: [-100, 207], kind: 'shootout', timer: 180 },
  { position: [100, 75], kind: 'heist', timer: 120 },
  { position: [24, -112], kind: 'race', timer: 115,
    checkpoints: [[100, -112], [100, -36], [24, -36], [24, 40]] },
  { position: [100, 148], kind: 'chase', timer: 180 },
  { position: [-100, 208], kind: 'ambush', timer: 200 },
  { position: [24, -36], kind: 'showdown', timer: 240 }
];

export const stageLabels = {
  vehicle: ['Find the marked Solstice GT', 'Drive to Mara at the marina'],
  drops: ['Deliver the first envelope', 'Make the second drop', 'Make the final drop'],
  shootout: ['Clear the dockside crew'],
  heist: ['Take the marked SPD interceptor', 'Get clear of the patrol'],
  race: ['Reach race gate 1', 'Reach race gate 2', 'Reach race gate 3', 'Reach race gate 4'],
  chase: ['Shake the SPD pursuit', 'Reach the marina safe zone'],
  ambush: ['Survive the boat-yard ambush', 'Reach the yard exit'],
  showdown: ['Defeat the Lavado leaders']
};
