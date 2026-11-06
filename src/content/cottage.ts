import type { Trial } from './scenes';

export const COTTAGE_INTERIOR_DOOR = { x: 452, y: 183, width: 43, height: 91 } as const;

export const ROOM_PROPS = [
  { id: 'roomCup', label: 'Inspect the blue cup', x: 169, y: 173, marker: '∪', trial: 'kitchen', before: 'An ordinary blue cup waits on the writing desk.', after: 'The blue cup catches the same light as Jen’s measuring vessels. The first room was here in miniature.' },
  { id: 'roomRecord', label: 'Inspect the little record', x: 207, y: 174, marker: '♫', trial: 'studio', before: 'A small record lies beside a worn paper sleeve.', after: 'Track Four. You recognize Alice’s record sleeve, though it never left this desk.' },
  { id: 'roomLamp', label: 'Inspect the desk lamp', x: 246, y: 170, marker: '♧', trial: 'cabin', before: 'A violet glass lamp. Its wick has been trimmed with unusual care.', after: 'The glass is the same shade as the spirit lamps. Agatha pretends not to notice you looking.' },
  { id: 'roomCards', label: 'Inspect the small card deck', x: 286, y: 174, marker: '▱', trial: 'tower', before: 'Five unlettered cards rest beside the window.', after: 'Five familiar cards. You remember the feel of the other chair, and Lilia holding the door.' },
  { id: 'roomKey', label: 'Inspect the brass key', x: 326, y: 174, marker: '⚿', trial: 'tower', before: 'A brass key with a round bow. It has no tag.', after: 'The key’s bow matches the card at Lilia’s table. The objects have been keeping your place.' },
  { id: 'roomFlower', label: 'Inspect the red flower', x: 365, y: 172, marker: '❀', trial: 'greenhouse', before: 'A red flower stands in a tiny glass vase.', after: 'Rio’s red flower. A beginning, an ending, and something that keeps growing.' },
] as const satisfies readonly { id: string; label: string; x: number; y: number; marker: string; trial: Trial; before: string; after: string }[];
export type RoomPropId = typeof ROOM_PROPS[number]['id'];
