type Discovery = { title: string; description: string };

/** Stable save IDs and the captions shown only after a discovery has been found. */
export const DISCOVERIES = {
  'agatha.passwordPearls': { title: 'Password pearls', description: 'Agatha pocketed the dots from a perfectly disposable spell.' },
  'agatha.visibilityEye': { title: 'The looking eye', description: 'The little eye looked back when you showed the spell.' },
  'agatha.ribbonTrail': { title: 'Violet ribbon', description: 'A stolen dot left a violet thread leading to Agatha’s pocket.' },
  'agatha.unbinding': { title: 'Your own thread', description: 'Five stitches replaced Agatha’s binding on the cottage door.' },
  'agnes.caseDrawer': { title: 'The case of the borrowed name', description: 'Detective Agnes filed the alias on your own borrowing card.' },
  'teen.sigil': { title: 'A name beneath the sigil', description: 'The covered borrowing card briefly showed the name you chose.' },
  'sharon.greenThumb': { title: 'Sharon’s green thumb', description: 'A solemn leaf stamp recognized a perfectly ordinary gardener.' },
  'jen.timerMitt': { title: 'An oven mitt intervenes', description: 'A practical bit of kitchen magic hushed a stray oven chime.' },
  'jen.pumpkinWitness': { title: 'The pumpkin witness', description: 'Three pours earned you a very suspicious look from the pumpkin.' },
  'alice.backwardRecord': { title: 'Track Four in reverse', description: 'Alice let the record run backward and a spark followed its groove.' },
  'alice.protectionRefrain': { title: 'The protection refrain', description: 'The three rhythms settled into Alice’s protective tune.' },
  'evanora.possession': { title: 'The extra shadow', description: 'A shadow lifted its hand while Agatha kept hers folded.' },
  'lilia.futureNote': { title: 'A future appointment', description: 'The envelope remembered a question you had yet to ask.' },
  'lilia.towerInversion': { title: 'The tower turns', description: 'The room turned around Lilia’s table as you took the other perspective.' },
  'salem.windowVisitors': { title: 'Seven at the window', description: 'Seven shapes passed the séance cabin and vanished into the trees.' },
  'rio.sessionFlower': { title: 'A flower for an expired session', description: 'Rio marked the end of a session with a red flower. The Road kept your seals.' },
  'rio.gardenRecognition': { title: 'The garden remembers', description: 'The remembering lights turned toward your borrowing name.' },
  'rabbit.first': { title: 'Something behind the stone', description: 'Señor Scratchy darted out from the moonlit garden.' },
  'rabbit.second': { title: 'A print by the cupboard', description: 'A muddy paw print marked the rabbit’s second hiding place.' },
  'rabbit.third': { title: 'A paw on the borrowing card', description: 'The rabbit popped out behind the speaker and left its own stamp.' },
  'rabbit.clerkGlasses': { title: 'The clerk’s glasses', description: 'Señor Scratchy tried on the clerk’s spare spectacles.' },
  'wanda.toasterAd': { title: 'Two-factor toast', description: 'The sponsor promised a second factor for a reliably toasted breakfast.' },
  'wanda.recast': { title: 'A new face in the frame', description: 'The portrait changed between visits. Agatha called it the lighting.' },
  'wanda.standBy': { title: 'Please stand by', description: 'A hexagonal test card appeared between television channels.' },
  'vision.identityAnnex': { title: 'The diagnostic annex', description: 'The television opened onto Vision’s monochrome reader workshop.' },
  'vision.aiArgument': { title: 'A shared subscription', description: 'Four voices on the intercom disputed one household account.' },
  'volume.badKnob': { title: 'The misleading dial', description: 'The television’s apparent volume dial changed its caption size.' },
  'volume.speakerDoors': { title: 'A room for the sound', description: 'Alice’s speaker doors softened or opened up the recording.' },
  'road.rugMap': { title: 'The embroidered Road', description: 'The five familiar motifs turned out to trace the journey.' },
  'road.propsAlreadyHere': { title: 'They were always here', description: 'Ordinary objects on the cottage desk recalled the rooms of the Road.' },
  'road.returnSmoke': { title: 'Smoke finds its way home', description: 'The chimney smoke curled back toward the cottage on your return.' },
  'road.borrowingDate': { title: 'A very overdue date', description: 'The return-date stamp still read 1693, to the librarian’s irritation.' },
  'library.longReceipt': { title: 'The long receipt', description: 'A renewal receipt retraced the five rooms you walked.' },
  'library.finalStamp': { title: 'The final stamp', description: 'After renewal, the television signed off with a paper slip and a final stamp.' },
} as const satisfies Record<string, Discovery>;

export type DiscoveryId = keyof typeof DISCOVERIES;
export const DISCOVERY_IDS = Object.keys(DISCOVERIES) as DiscoveryId[];
