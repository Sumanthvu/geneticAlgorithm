import { singleVariableMinimum, twoVariableMinimum, twoVariableTournament, threeVariableMinimum } from './problems.ts';
import type { Problem } from './scoring.ts';
import { runSimulation, type SimulationEvent } from './simulation.ts';

interface Lesson {
  problem: Problem;
  equation: string;
  substitute: (...values: string[]) => string;
}

export const lessons: readonly Lesson[] = [
  {
    problem: singleVariableMinimum,
    equation: 'x² − 8x + 20',
    substitute: x => `(${x})² − 8 × (${x}) + 20`,
  },
  {
    problem: {
      ...singleVariableMinimum, id: 'negative-minimum', title: 'Minimize across zero',
      variables: [{ name: 'x', min: -8, max: 7, bits: 4 }],
      objective: ([x]) => (x + 1) ** 2 + 2, objectiveFloor: 2,
    },
    equation: '(x + 1)² + 2',
    substitute: x => `(${x} + 1)² + 2`,
  },
  {
    problem: {
      ...singleVariableMinimum, id: 'positive-maximum', title: 'Find the maximum',
      goal: 'maximize', objective: ([x]) => x * (15 - x), objectiveFloor: 0,
    },
    equation: 'x(15 − x)',
    substitute: x => `(${x}) × (15 − (${x}))`,
  },
  {
    problem: {
      ...singleVariableMinimum, id: 'negative-maximum', title: 'Maximize with negative scores',
      variables: [{ name: 'x', min: -8, max: 7, bits: 4 }],
      goal: 'maximize', objective: ([x]) => 51 - (x - 1) ** 2, objectiveFloor: -30,
    },
    equation: '51 − (x − 1)²',
    substitute: x => `51 − (${x} − 1)²`,
  },
  {
    problem: twoVariableMinimum,
    equation: '(x₁ − 3)² + (x₂ − 5)² + 2',
    substitute: (x, y) => `(${x} − 3)² + (${y} − 5)² + 2`,
  },
  {
    problem: {
      ...twoVariableMinimum, id: 'two-variable-negative-minimum', title: 'Minimize a pair across zero',
      variables: twoVariableTournament.variables,
      objective: ([x, y]) => (x + 1) ** 2 + (y - 2) ** 2 + 5, objectiveFloor: 5,
    },
    equation: '(x₁ + 1)² + (x₂ − 2)² + 5',
    substitute: (x, y) => `(${x} + 1)² + (${y} − 2)² + 5`,
  },
  {
    problem: {
      ...twoVariableMinimum, id: 'two-variable-maximum', title: 'Maximize a pair',
      goal: 'maximize', objective: ([x, y]) => x * (15 - x) + y * (15 - y), objectiveFloor: 0,
    },
    equation: 'x₁(15 − x₁) + x₂(15 − x₂)',
    substitute: (x, y) => `${x}(15 − (${x})) + ${y}(15 − (${y}))`,
  },
  {
    problem: twoVariableTournament,
    equation: '50 − (x₁ − 1)² − (x₂ + 2)²',
    substitute: (x, y) => `50 − (${x} − 1)² − (${y} + 2)²`,
  },
  {
    problem: threeVariableMinimum,
    equation: '(x₁ − 2)² + (x₂ − 4)² + (x₃ − 6)²',
    substitute: (x, y, z) => `(${x} − 2)² + (${y} − 4)² + (${z} − 6)²`,
  },
];

export const workedInitial = ['0111', '1010', '0001', '1000'];

export function workedExample() {
  const draws = [
    0.921, 0.694, 0.437, 0.995,
    0.771, 0.4, 0.616, 0,
    0.9, 0.9, 0.9, 0.9,
    0.9, 0.023, 0.9, 0.9,
    0.9, 0.020, 0.9, 0.9,
    0.9, 0.9, 0.9, 0.9,
  ].values();

  return runSimulation(singleVariableMinimum, workedInitial, {
    limit: 1, count: 'reproduction-rounds', crossoverProbability: 0.8, mutationProbability: 0.05, elitism: false,
  }, () => {
    const next = draws.next();
    if (next.done) throw new Error('The worked example exhausted its draws.');
    return next.value;
  });
}

export function workedCheck(event: SimulationEvent) {
  const expected = {
    evaluate: event.generation === 1 ? '13, 40, 13, 20' : '29, 4, 68, 40',
    select: '4, 3, 2, 4',
    crossover: '1001, 0000, 1000, 1010',
    mutate: '1001, 0100, 1100, 1010',
    replace: '1001, 0100, 1100, 1010',
    stop: '0100 · x = 4 · f = 4',
  }[event.type];

  switch (event.type) {
    case 'evaluate': return { label: 'Objective scores', expected, actual: event.population.map(candidate => candidate.score).join(', ') };
    case 'select': return { label: 'Selected slots', expected, actual: event.selection.picks.map(pick => pick.winner + 1).join(', ') };
    case 'crossover': return { label: 'Children after crossover', expected, actual: event.children.join(', ') };
    case 'mutate': return { label: 'Children after mutation', expected, actual: event.children.map(child => child.after).join(', ') };
    case 'replace': return { label: 'New population', expected, actual: event.population.map(candidate => candidate.chromosome).join(', ') };
    case 'stop': return { label: 'Final winner', expected, actual: `${event.bestFinal.chromosome} · x = ${event.bestFinal.values[0]} · f = ${event.bestFinal.score}` };
  }
}
