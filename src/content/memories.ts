/** Authored game fragments, encountered out of chronological order. */
export const MEMORIES = [
  { id: 'key', time: 'LATER · THE THRESHOLD', title: 'An appointment kept', text: 'An older hand closes the appointment book. The last candle is still warm. “I knew you would come back.”' },
  { id: 'moon', time: 'EARLIER · A WINDOW', title: 'A lesson in candlelight', text: 'A young reader watches moonlight cross a stone sill. Someone gently straightens a card. “Again. Take your time.”' },
  { id: 'cup', time: 'NOW · THIS TABLE', title: 'The cup is still warm', text: 'Lilia reaches for a cup and laughs at a joke you have not told yet. For a moment, every chair is occupied.' },
  { id: 'distance', time: 'BETWEEN · AN EMPTY ROOM', title: 'Two chairs apart', text: 'The room is quiet. A coat hangs on the other chair. She leaves a place at the table anyway.' },
] as const;
export type MemoryId = typeof MEMORIES[number]['id'];
