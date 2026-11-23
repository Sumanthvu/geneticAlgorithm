import { readDraw, type Draw } from './selection.ts';

export interface CrossoverPair {
  parentSlots: readonly [number, number];
  parents: readonly [string, string];
  roll: number;
  cutRoll: number | null;
  cut: number | null;
  children: readonly [string, string];
}

function validateProbability(probability: number): void {
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError('Probabilities must be in [0, 1].');
  }
}

export function crossPopulation(parents: readonly string[], probability: number, draw: Draw) {
  validateProbability(probability);
  const length = parents[0]?.length ?? 0;
  if (!length || parents.some(parent => parent.length !== length || /[^01]/.test(parent))) {
    throw new RangeError('Crossover requires nonempty binary chromosomes of equal length.');
  }

  const pairs: CrossoverPair[] = [];
  const children: string[] = [];
  for (let index = 0; index + 1 < parents.length; index += 2) {
    const first = parents[index];
    const second = parents[index + 1];
    const roll = readDraw(draw);
    const cutRoll = roll < probability && length > 1 ? readDraw(draw) : null;
    const cut = cutRoll === null ? null : 1 + Math.floor(cutRoll * (length - 1));
    const offspring: [string, string] = cut === null
      ? [first, second]
      : [first.slice(0, cut) + second.slice(cut), second.slice(0, cut) + first.slice(cut)];

    pairs.push({ parentSlots: [index, index + 1], parents: [first, second], roll, cutRoll, cut, children: offspring });
    children.push(...offspring);
  }

  const unpaired = parents.length % 2 ? parents.length - 1 : null;
  if (unpaired !== null) children.push(parents[unpaired]);
  return { pairs, children, unpaired };
}

export function mutatePopulation(children: readonly string[], probability: number, draw: Draw) {
  validateProbability(probability);
  if (children.some(child => !child.length || /[^01]/.test(child))) {
    throw new RangeError('Mutation requires nonempty binary chromosomes.');
  }

  return children.map(before => {
    const bits = Array.from(before, (bit, index) => {
      const roll = readDraw(draw);
      const flipped = roll < probability;
      const after = flipped ? (bit === '0' ? '1' : '0') : bit;
      return { index, before: bit, after, roll, flipped };
    });
    return { before, after: bits.map(bit => bit.after).join(''), bits };
  });
}
