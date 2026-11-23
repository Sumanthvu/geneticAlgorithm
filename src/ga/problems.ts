import type { Problem } from './scoring.ts';

export const singleVariableMinimum = {
  id: 'single-variable-minimum',
  title: 'Find the minimum',
  variables: [{ name: 'x', min: 0, max: 15, bits: 4 }],
  goal: 'minimize',
  selection: 'roulette',
  objective: ([x]) => x ** 2 - 8 * x + 20,
  objectiveFloor: 4,
} satisfies Problem;

export const twoVariableMinimum = {
  id: 'two-variable-minimum',
  title: 'Find a pair',
  variables: [
    { name: 'x₁', min: 0, max: 15, bits: 4 },
    { name: 'x₂', min: 0, max: 15, bits: 4 },
  ],
  goal: 'minimize',
  selection: 'roulette',
  objective: ([x, y]) => (x - 3) ** 2 + (y - 5) ** 2 + 2,
  objectiveFloor: 2,
} satisfies Problem;

export const twoVariableTournament = {
  id: 'two-variable-tournament',
  title: 'Find the highest-scoring pair',
  variables: [
    { name: 'x₁', min: -8, max: 7, bits: 4 },
    { name: 'x₂', min: -8, max: 7, bits: 4 },
  ],
  goal: 'maximize',
  selection: 'tournament',
  objective: ([x, y]) => 50 - (x - 1) ** 2 - (y + 2) ** 2,
  objectiveFloor: -112,
} satisfies Problem;

export const threeVariableMinimum = {
  id: 'three-variable-minimum',
  title: 'Find the best triple',
  variables: [
    { name: 'x₁', min: 0, max: 15, bits: 4 },
    { name: 'x₂', min: 0, max: 15, bits: 4 },
    { name: 'x₃', min: 0, max: 15, bits: 4 },
  ],
  goal: 'minimize',
  selection: 'roulette',
  objective: ([x, y, z]) => (x - 2) ** 2 + (y - 4) ** 2 + (z - 6) ** 2,
  objectiveFloor: 0,
} satisfies Problem;
