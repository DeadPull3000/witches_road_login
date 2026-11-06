export const ALICE_REACTIONS = {
  listening: 'I’ll mind the levels.',
  speaking: 'Mum left a ward in the music.',
  missed: 'The line’s gone quiet.',
  accepted: 'There. It’s through.',
} as const;

export type AliceReaction = keyof typeof ALICE_REACTIONS;
