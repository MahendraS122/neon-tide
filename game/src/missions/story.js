// Original campaign: Dex's return exposes a police protection racket at the port.
export const CHAPTERS =['Fresh Start', 'Cash & Concrete', 'Hot Wire', 'High Tide'];
export const STORY =[{ name: 'Borrowed Freedom', contact: 'mara', reward: 1500, start:[- 282, 270],
dialogue:[['mara', 'Six years inside, Dex. Solara kept your debts warm.'],['dex', 'I came back for a fresh start.'],
['mara', 'Then borrow Lavado\'s red Vanta. Garza has a buyer. No bodies.'],], stages:[{ type: 'steal',
at:[- 282, 188], text: 'Steal the red Vanta GT on Ocean Drive.', car: 'sport' }, { type: 'drive',
at:[- 188, 282], text: 'Deliver the Vanta to Garza. Keep it in one piece.' },], }, {
  name: 'Small Bills', contact: 'garza', reward: 2200, start:[- 188, 282], timer: 210, dialogue:
  [['garza', 'Cash buys freedom. Three envelopes. Three corners. Before sundown.'],['dex', 'Whose money?'],
  ['garza', 'Hollis takes a cut of everything. Today we take his.'],], stages:[{ type: 'drop', at:
  [- 282, 94], text: 'Collect the first cash envelope.' }, { type: 'drop', at:[- 188, 0], text:
  'Collect the second envelope on Neon Row.' }, { type: 'drop', at:[0, 0], text: 'Collect the last envelope. The clock is running.' },
  { type: 'drive', at:[- 188, 282], text: 'Bring the cash back to Victor.' },],
}, {
  name: 'Salt in the Wound', contact: 'mara', reward: 3500, start:[188, - 188], dialogue:[['mara',
  'Lavado is moving guns through Crane Port under police escort.'],['tavo', 'Calloway. You should have stayed gone.'],
  ['dex', 'And you should have paid your dockhands.'],], stages:[{ type: 'combat', at:[282, - 188],
  text: 'Clear the Lavado dock crew.', enemies: 4 }, { type: 'reach', at:[282, - 94], text: 'Recover the shipping ledger.' },
  { type: 'reach', at:[188, - 188], text: 'Return the ledger to Mara.' },],
}, {
  name: 'Badge of Dishonour', contact: 'garza', reward: 4200, start:[0, 94], dialogue:[['garza',
  'Hollis keeps the port codes in a marked cruiser. Bring it intact.'],['hollis', 'Every street in this city belongs to me, Calloway.'],
  ['dex', 'Then you can afford to lose one car.'],], stages:[{ type: 'steal', at:[94, 94], text:
  'Steal Hollis\'s marked police cruiser.', car: 'police' }, { type: 'escape', at:[94, 94], text:
  'Lose the police. Keep the cruiser.' }, { type: 'drive', at:[- 188, 188], text: 'Deliver the cruiser to the chop shop.' },
  ],
}, {
  name: 'Pink Slip Sunset', contact: 'nina', reward: 5000, start:[- 282, - 94], timer: 170, dialogue:
  [['nina', 'Win my sunset circuit and I will get you inside the boat yard.'],['dex', 'You always negotiate at a hundred miles an hour?'],
  ['nina', 'Only when I like someone. Beat my crew.'],], stages:[{ type: 'steal', at:[- 282, - 110],
  text: 'Get in Nina\'s turquoise Solara V8.', car: 'muscle' }, { type: 'race', at:[- 282, - 188],
  text: 'Win the sunset circuit against Nina\'s crew.' },],
}, {
  name: 'Running the Block', contact: 'mara', reward: 6500, start:[- 188, - 188], timer: 240, dialogue:
  [['mara', 'The ledger names Hollis. He has every unit looking for you.'],['hollis', 'Roadblocks are up. You have nowhere left to run.'],
  ['dex', 'Good thing I drive.'],], stages:[{ type: 'steal', at:[- 188, - 170], text: 'Take Mara\'s getaway car.',
  car: 'sport' }, { type: 'drive', at:[188, 0], text: 'Break through to 5th Avenue.' }, { type:
  'escape', at:[188, 0], text: 'Shake the pursuit and the helicopter.' }, { type: 'drive', at:[- 282,
  282], text: 'Reach the safe street on Ocean Drive.' },],
}, {
  name: 'Dead in the Water', contact: 'nina', reward: 8000, start:[188, 188], dialogue:[['nina',
  'The boat yard is a trap. Tavo sold us to Hollis.'],['tavo', 'Nothing personal. The captain pays on time.'],
  ['dex', 'Then let us settle the account.'],], stages:[{ type: 'reach', at:[282, 188], text: 'Enter the boat yard.' },
  { type: 'combat', at:[282, 188], text: 'Survive Lavado\'s ambush.', enemies: 6 }, { type: 'reach',
  at:[188, 188], text: 'Get Nina out with the evidence.' },],
}, {
  name: 'High Tide', contact: 'mara', reward: 15000, start:[188, - 282], dialogue:[['mara', 'The evidence is live. One last meeting at the port. End this.'],
  ['hollis', 'Without me, this city drowns.'],['dex', 'Then learn to swim.'],], stages:[{ type:
  'combat', at:[282, - 282], text: 'Defeat Hollis and the Lavado enforcers.', enemies: 7 }, { type:
  'reach', at:[188, - 282], text: 'Send the final evidence to Mara.' }, { type: 'escape', at:[188,
  - 282], text: 'Leave the port and lose the last pursuit.' }, { type: 'reach', at:[- 282, 282],
  text: 'Meet Mara at sunrise. Your city. Your freedom.' },],
},];
