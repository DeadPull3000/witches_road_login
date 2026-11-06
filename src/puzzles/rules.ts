export const CARDS = ['Cup', 'Moon', 'Tower', 'Key', 'Door'] as const;
export type Card = typeof CARDS[number];
export const INITIAL_DECK: Card[] = ['Key', 'Door', 'Cup', 'Tower', 'Moon'];
export const NODES = ['A', 'B', 'C', 'D', 'E'] as const;
export type Node = typeof NODES[number];
export const NODE_LABELS: Record<Node, string> = { A: 'Memory', B: 'Breath', C: 'Seed', D: 'Bloom', E: 'Earth' };
export const EDGES = ['AB', 'BC', 'AC', 'AD', 'DE', 'AE', 'CD'] as const;
export type JugState = [number, number];
export type JugMove = 'fill-small' | 'fill-large' | 'empty-small' | 'empty-large' | 'pour-small' | 'pour-large';
export const JUG_MOVES: JugMove[] = ['fill-small', 'fill-large', 'empty-small', 'empty-large', 'pour-small', 'pour-large'];
export const JUG_LABELS: Record<JugMove, string> = {
  'fill-small': 'Fill 3-cup jug', 'fill-large': 'Fill 5-cup jug',
  'empty-small': 'Empty 3-cup jug', 'empty-large': 'Empty 5-cup jug',
  'pour-small': 'Pour 3-cup into 5-cup', 'pour-large': 'Pour 5-cup into 3-cup',
};

export function jugMove([small, large]: JugState, move: JugMove): JugState {
  switch (move) {
    case 'fill-small': return [3, large];
    case 'fill-large': return [small, 5];
    case 'empty-small': return [0, large];
    case 'empty-large': return [small, 0];
    case 'pour-small': { const amount = Math.min(small, 5 - large); return [small - amount, large + amount]; }
    case 'pour-large': { const amount = Math.min(large, 3 - small); return [small + amount, large - amount]; }
  }
}

export function jugSolution(start: JugState): JugMove[] {
  const queue: { state: JugState; path: JugMove[] }[] = [{ state: start, path: [] }];
  const seen = new Set([start.join(',')]);
  for (let index = 0; index < queue.length; index++) {
    const { state, path } = queue[index];
    if (state[1] === 4) return path;
    for (const move of JUG_MOVES) {
      const next = jugMove(state, move); const key = next.join(',');
      if (!seen.has(key)) { seen.add(key); queue.push({ state: next, path: [...path, move] }); }
    }
  }
  return [];
}

export const STUDIO_CLUES = [{ divisor: 3, remainder: 2 }, { divisor: 5, remainder: 3 }, { divisor: 7, remainder: 2 }];
export const studioMatches = (n: number) => Number.isInteger(n) && n >= 0 && n <= 99 && STUDIO_CLUES.every(c => n % c.divisor === c.remainder);
export function lampStatements([a, b, c, d]: number[]): boolean[] {
  return [(a ^ b) === 1, (b ^ c) === 1, (c ^ d) === 0, (a ^ c ^ d) === 1];
}
export const cabinMatches = (lamps: number[]) => lamps.length === 4 && lamps.every(n => n === 0 || n === 1) && lampStatements(lamps).every(Boolean);
export function towerMatches(cards: readonly Card[]): boolean {
  if (cards.length !== 5 || new Set(cards).size !== 5) return false;
  const at = (card: Card) => cards.indexOf(card);
  return at('Tower') === at('Moon') + 1 && Math.abs(at('Moon') - at('Door')) === 3 && at('Cup') < at('Key') && at('Key') < at('Door');
}
export const cut = (cards: Card[]): Card[] => [...cards.slice(1), cards[0]];
export const quarrel = (cards: Card[]): Card[] => [cards[1], cards[0], ...cards.slice(2)];
export const confirmationMatches = (display: Card[], canonical: Card[]) => display.length === 5 && [...display].reverse().every((card, i) => card === canonical[i]);

export function towerSolution(start: Card[]): ('cut' | 'quarrel')[] {
  const queue: { deck: Card[]; path: ('cut' | 'quarrel')[] }[] = [{ deck: start, path: [] }];
  const seen = new Set([start.join(',')]);
  for (let index = 0; index < queue.length; index++) {
    const { deck, path } = queue[index];
    if (towerMatches(deck)) return path;
    for (const move of ['cut', 'quarrel'] as const) {
      const next = move === 'cut' ? cut(deck) : quarrel(deck); const key = next.join(',');
      if (!seen.has(key)) { seen.add(key); queue.push({ deck: next, path: [...path, move] }); }
    }
  }
  return [];
}

export const edgeId = (a: Node, b: Node) => [a, b].sort().join('');
export function vineChoices(route: Node[]): Node[] {
  const last = route.at(-1)!;
  const used = new Set(route.slice(1).map((node, i) => edgeId(route[i], node)));
  return NODES.filter(node => EDGES.includes(edgeId(last, node) as typeof EDGES[number]) && !used.has(edgeId(last, node)));
}
export function greenhouseMatches(route: Node[]): boolean {
  if (route.length !== 8 || route[0] !== 'C' || route.at(-1) !== 'D') return false;
  const edges = route.slice(1).map((node, i) => edgeId(route[i], node));
  return new Set(edges).size === EDGES.length && edges.every(edge => EDGES.includes(edge as typeof EDGES[number]));
}
export function vineSolution(prefix: Node[]): Node[] | null {
  if (greenhouseMatches(prefix)) return prefix;
  if (prefix.length >= 8) return null;
  for (const next of vineChoices(prefix)) { const result = vineSolution([...prefix, next]); if (result) return result; }
  return null;
}
export function toggleMushroom(lights: boolean[], index: number): boolean[] {
  return lights.map((lit, i) => [index, (index + 7) % 8, (index + 1) % 8].includes(i) ? !lit : lit);
}
export function gardenSolution(lights: boolean[]): number[] {
  for (let mask = 0; mask < 256; mask++) {
    const moves = Array.from({ length: 8 }, (_, i) => i).filter(i => mask & (1 << i));
    const result = moves.reduce(toggleMushroom, lights);
    if (result.every(Boolean)) return moves;
  }
  return [];
}
