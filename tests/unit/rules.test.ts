import { describe, expect, it } from 'vitest';
import { CARDS, EDGES, JUG_MOVES, cabinMatches, confirmationMatches, cut, edgeId, gardenSolution, greenhouseMatches, jugMove, jugSolution, quarrel, studioMatches, toggleMushroom, towerMatches, towerSolution, vineChoices, vineSolution, type Card, type JugState, type Node } from '../../src/puzzles/rules';

const permutations = <T,>(items: T[]): T[][] => items.length === 0 ? [[]] : items.flatMap((item, i) => permutations(items.filter((_, j) => i !== j)).map(rest => [item, ...rest]));

describe('Jen’s exact-volume system', () => {
  it('finds a shortest six-operation path from the authored start', () => {
    const path = jugSolution([0, 0]); expect(path).toHaveLength(6);
    expect(path.reduce(jugMove, [0, 0] as JugState)[1]).toBe(4);
    // Independent layer search proves no state at depths 0–5 reaches the goal.
    let layer: JugState[] = [[0, 0]];
    for (let depth = 0; depth < 6; depth++) { expect(layer.every(s => s[1] !== 4)).toBe(true); layer = layer.flatMap(s => JUG_MOVES.map(m => jugMove(s, m))); }
  });
  it('preserves bounds, integers and water conservation on every bounded state and pour', () => {
    for (let small = 0; small <= 3; small++) for (let large = 0; large <= 5; large++) for (const op of JUG_MOVES) {
      const next = jugMove([small, large], op);
      expect(next[0]).toBeGreaterThanOrEqual(0); expect(next[0]).toBeLessThanOrEqual(3);
      expect(next[1]).toBeGreaterThanOrEqual(0); expect(next[1]).toBeLessThanOrEqual(5);
      expect(next.every(Number.isInteger)).toBe(true);
      if (op.startsWith('pour')) { expect(next[0] + next[1]).toBe(small + large); expect(next[0] === 0 || next[1] === 0 || next[0] === 3 || next[1] === 5).toBe(true); }
      const solution = jugSolution(next); expect(solution.reduce(jugMove, next)[1]).toBe(4);
    }
  });
});

describe('uniqueness and perspective', () => {
  it('has exactly one recording number in the displayed domain', () => {
    expect(Array.from({ length: 100 }, (_, n) => n).filter(studioMatches)).toEqual([23]);
    for (const n of [-1, 100, 128, 23.5, NaN, Infinity]) expect(studioMatches(n)).toBe(false);
  });
  it('has exactly one lamp assignment across all 16 patterns', () => {
    const assignments = Array.from({ length: 16 }, (_, n) => [0, 1, 2, 3].map(i => (n >> i) & 1));
    expect(assignments.filter(cabinMatches)).toEqual([[1, 0, 1, 1]]);
    expect(cabinMatches([3, 2, 1, 1])).toBe(false);
  });
  it('selects a unique tarot arrangement from all 120 permutations', () => {
    const orders = permutations<Card>([...CARDS]); expect(orders).toHaveLength(120);
    expect(orders.filter(towerMatches)).toEqual([['Cup', 'Moon', 'Tower', 'Key', 'Door']]);
    expect(towerMatches(['Cup', 'Moon', 'Tower', 'Door', 'Door'])).toBe(false);
  });
  it('can reach the answer from every possible starting deck with legal moves', () => {
    for (const start of permutations<Card>([...CARDS])) {
      const result = towerSolution(start).reduce((cards, op) => op === 'cut' ? cut(cards) : quarrel(cards), start);
      expect(towerMatches(result)).toBe(true);
    }
  });
  it('applies the opposite-seat reversal exactly once', () => {
    const deck = [...CARDS]; expect(confirmationMatches([...deck].reverse(), deck)).toBe(true);
    expect(confirmationMatches(deck, deck)).toBe(false);
    expect(confirmationMatches([...deck].reverse().reverse(), deck)).toBe(false);
    expect(confirmationMatches(['Door'], deck)).toBe(false);
  });
});

describe('Rio’s graph', () => {
  it('accepts all legal Euler trails, not just the example', () => {
    const trails: Node[][] = [];
    const visit = (path: Node[], used: Set<string>) => {
      if (used.size === 7) { if (path.at(-1) === 'D') trails.push(path); return; }
      for (const edge of EDGES) {
        const [a, b] = edge.split('') as Node[]; const last = path.at(-1)!;
        if (!used.has(edge) && (a === last || b === last)) visit([...path, a === last ? b : a], new Set([...used, edge]));
      }
    };
    visit(['C'], new Set()); expect(trails.length).toBeGreaterThan(1);
    for (const route of trails) {
      expect(greenhouseMatches(route)).toBe(true);
      for (let end = 1; end < route.length; end++) expect(greenhouseMatches(vineSolution(route.slice(0, end))!)).toBe(true);
    }
  });
  it('rejects repeat edges, missing clauses and nonedges', () => {
    expect(greenhouseMatches(['C', 'B', 'A', 'C', 'D', 'E', 'A', 'D'])).toBe(true);
    expect(greenhouseMatches(['C', 'B', 'C', 'A', 'D', 'E', 'A', 'D'])).toBe(false);
    expect(greenhouseMatches(['C', 'D'])).toBe(false);
    expect(vineChoices(['C', 'B'])).not.toContain('C');
    expect(edgeId('C', 'A')).toBe(edgeId('A', 'C'));
  });
  it('identifies a legal dead-end prefix that manual undo can recover', () => {
    const route: Node[] = ['C', 'D', 'E', 'A', 'D']; expect(vineSolution(route)).toBeNull();
    expect(vineSolution(route.slice(0, -1))).not.toBeNull();
  });
});

describe('optional garden solvability', () => {
  it('solves every possible initial pattern and has 256 distinct toggle effects', () => {
    const effects = new Set<string>();
    for (let mask = 0; mask < 256; mask++) {
      const lights = Array.from({ length: 8 }, (_, i) => Boolean(mask & (1 << i)));
      const answer = gardenSolution(lights); expect(answer.reduce(toggleMushroom, lights).every(Boolean)).toBe(true);
      effects.add(Array.from({ length: 8 }, (_, i) => i).filter(i => mask & (1 << i)).reduce(toggleMushroom, Array(8).fill(false)).join(','));
    }
    expect(effects.size).toBe(256);
  });
  it('uses authored caps 3 and 7 and wraps from cap 8 to cap 1', () => {
    expect(gardenSolution([true, false, false, false, true, false, false, false])).toEqual([2, 6]);
    expect(toggleMushroom(Array(8).fill(false), 7)).toEqual([true, false, false, false, false, false, true, true]);
  });
});
