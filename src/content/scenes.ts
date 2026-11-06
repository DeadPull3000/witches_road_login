export const TRIALS = ['kitchen', 'studio', 'cabin', 'tower', 'greenhouse'] as const;
export type Trial = typeof TRIALS[number];
export const SCENES = ['cottage', 'threshold', 'kitchen', 'studio', 'cabin', 'tower', 'greenhouse', 'garden', 'account', 'vision'] as const;
export type SceneId = typeof SCENES[number];
export const SCENE_INFO: Record<SceneId, { title: string; subtitle: string; character: string; line: string }> = {
  cottage: { title: 'A very ordinary cottage.', subtitle: 'WESTVIEW · JUST BEFORE DUSK', character: 'Agatha', line: 'A library card? How quaint. Let’s see if the door remembers you.' },
  threshold: { title: 'Some assembly required.', subtitle: 'THE COVEN THRESHOLD', character: 'Agatha', line: 'Every coven needs a specialty. Even gardening apparently counts.' },
  kitchen: { title: 'A measure of trust.', subtitle: 'TRIAL I · RECOVERY', character: 'Jen', line: 'Four cups. Two jugs. No guessing, and absolutely no half pours.' },
  studio: { title: 'Something in the static.', subtitle: 'TRIAL II · VERIFICATION', character: 'Alice', line: 'Track Four is the one. Three rhythms, one recording number.' },
  cabin: { title: 'Only human. Probably.', subtitle: 'TRIAL III · THE SPIRIT TEST', character: 'Agatha', line: 'The spirits have four opinions. For once, they agree on an answer.' },
  tower: { title: 'You’ve been here before.', subtitle: 'TRIAL IV · SET YOUR PASSWORD', character: 'Lilia', line: 'The cards know their places. You merely have to remember them.' },
  greenhouse: { title: 'Everything returns to earth.', subtitle: 'TRIAL V · TERMS OF PASSAGE', character: 'Rio', line: 'One continuous signature. Every vine once. Seed to bloom.' },
  garden: { title: 'A little remembrance.', subtitle: 'THE GARDEN · OPTIONAL', character: 'Agatha', line: 'Light every cap, if you want the cottage to remember this visit.' },
  account: { title: 'Welcome back, wanderer.', subtitle: 'WESTVIEW PUBLIC LIBRARY', character: 'The librarian', line: 'You went all that way to renew one book. We appreciate your dedication.' },
  vision: { title: 'An identity in four parts.', subtitle: 'WESTVIEW DIAGNOSTIC SERVICE · OPTIONAL', character: 'Vision', line: 'Two readers remember the same card. The library kept the paperwork.' },
};
export const COVEN = [
  { id: 'jen', name: 'Jen', affinity: 'Potions', symbol: '⚗' },
  { id: 'alice', name: 'Alice', affinity: 'Protection', symbol: '✹' },
  { id: 'lilia', name: 'Lilia', affinity: 'Divination', symbol: '☾' },
  { id: 'agatha', name: 'Agatha', affinity: 'Spirit', symbol: '✧' },
  { id: 'sharon', name: 'Sharon', affinity: 'Gardening', symbol: '❧' },
] as const;
