// Port Solara's eight original jobs trace Dex's return and the rising tide of trouble.
export const chapters = [
  { number: 1, name: 'Fresh Start', range: [0, 1] },
  { number: 2, name: 'Cash & Concrete', range: [2, 3] },
  { number: 3, name: 'Hot Wire', range: [4, 5] },
  { number: 4, name: 'High Tide', range: [6, 7] }
];

export const storyMissions = [
  { id: 'first-light', chapter: 1, title: 'First Light', reward: 3500,
    brief: 'Take the marked Solstice GT from Ocean Drive.', contact: 'Mara Reyes' },
  { id: 'cash-current', chapter: 1, title: 'Cash Current', reward: 3500,
    brief: 'Make three timed cash drops before the courier clock runs out.', contact: 'Nico Vale' },
  { id: 'dockside', chapter: 2, title: 'Concrete Undertow', reward: 3500,
    brief: 'Clear the Lavado crew from the south cargo docks.', contact: 'Mara Reyes' },
  { id: 'blue-light', chapter: 2, title: 'Blue Light Special', reward: 3500,
    brief: 'Take the marked Solara Police interceptor and get clear.', contact: 'Sera Sol' },
  { id: 'hot-wire', chapter: 3, title: 'Hot Wire', reward: 3500,
    brief: 'Win the four-gate street race through Glasswater.', contact: 'Nico Vale' },
  { id: 'long-way-home', chapter: 3, title: 'Long Way Home', reward: 3500,
    brief: 'Shake the SPD pursuit and reach Mara at the marina.', contact: 'Mara Reyes' },
  { id: 'boat-yard', chapter: 4, title: 'Boat Yard Blues', reward: 3500,
    brief: 'Survive the boat-yard ambush and find the safe exit.', contact: 'Luz Ortega' },
  { id: 'high-tide', chapter: 4, title: 'High Tide', reward: 3500,
    brief: 'End the Lavado feud at the Glasswater overlook.', contact: 'Captain Imani' }
];

export const storyDialogue = [
  [
    ['Mara Reyes', 'You came back to Solara with empty pockets and a long list. Start with wheels.'],
    ['Dex Navarro', 'I know this coastline. I just need one clean run.']
  ],
  [['Nico Vale', 'Three drops, three corners. The clock is already moving.']],
  [['Mara Reyes', 'The cargo crew took the south dock. Make it quiet enough to hear the tide.']],
  [['Sera Sol', 'That interceptor has my name on it. Keep it in one piece, Dex.']],
  [['Nico Vale', 'Four gates, no shortcuts. Bring the Solstice home first.']],
  [['Mara Reyes', 'They have every bridge watched. Lose the lights, then take the marina road.']],
  [['Luz Ortega', 'The yard is a trap. I marked a way through the boats. Keep moving.']],
  [['Captain Imani', 'This city does not need another king. It needs the last gun put down.']]
];

export function chapterForMission(index) {
  return chapters.find(chapter => index >= chapter.range[0] && index <= chapter.range[1]) ?? chapters[3];
}
