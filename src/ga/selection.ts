import type { Goal } from './scoring.ts';

type Draw = () => number;
type Candidate = { chromosome: string; score: number; fitness: number };

// Mulberry32 gives a repeatable sequence without altering Math.random.
export function seededRandom(seed: number): Draw {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new RangeError('Use an unsigned 32-bit integer seed.');
  }

  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), state | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 2 ** 32;
  };
}

function readDraw(draw: Draw): number {
  const value = draw();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('Random draws must be in [0, 1).');
  }
  return value;
}

export function rouletteSlices(fitness: readonly number[]) {
  if (!fitness.length || fitness.some(value => !Number.isFinite(value) || value < 0)) {
    throw new RangeError('Roulette requires a nonempty list of finite, nonnegative fitness values.');
  }

  const total = fitness.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total)) throw new RangeError('Total fitness must be finite.');
  const lastViable = total === 0 ? fitness.length - 1 : fitness.reduce((last, value, index) => value > 0 ? index : last, -1);
  let end = 0;
  return fitness.map((value, index) => {
    const start = end;
    const probability = total === 0 ? 1 / fitness.length : value / total;
    end = index >= lastViable ? 1 : Math.min(1, start + probability);
    return { start, end, probability };
  });
}

export function selectRoulette(population: readonly Candidate[], draw: Draw) {
  const slices = rouletteSlices(population.map(candidate => candidate.fitness));
  const picks = population.map(() => {
    const roll = readDraw(draw);
    // Match the lecture's inclusive endpoints, ignoring zero-width slices.
    const winner = slices.findIndex(slice => slice.end > slice.start && roll <= slice.end);
    return { roll, winner, chromosome: population[winner].chromosome };
  });
  return { slices, picks };
}

export function selectTournament(population: readonly Candidate[], goal: Goal, draw: Draw) {
  if (!population.length || population.some(candidate => !Number.isFinite(candidate.score))) {
    throw new RangeError('Tournament selection requires a nonempty population with finite scores.');
  }
  return population.map(() => {
    const firstRoll = readDraw(draw);
    const secondRoll = readDraw(draw);
    const first = Math.floor(firstRoll * population.length);
    const second = Math.floor(secondRoll * population.length);
    const firstScore = population[first].score;
    const secondScore = population[second].score;
    const firstWins = goal === 'minimize' ? firstScore <= secondScore : firstScore >= secondScore;
    const winner = firstWins ? first : second;
    return { firstRoll, secondRoll, first, second, firstScore, secondScore, winner, chromosome: population[winner].chromosome };
  });
}
