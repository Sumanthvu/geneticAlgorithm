import { decodeChromosome, type Variable } from './encoding.ts';

export type Goal = 'minimize' | 'maximize';
export type SelectionMethod = 'roulette' | 'tournament';

export interface Problem {
  id: string;
  title: string;
  variables: readonly Variable[];
  goal: Goal;
  selection: SelectionMethod;
  objective: (values: readonly number[]) => number;
  objectiveFloor: number;
}

export function scoreFitness(score: number, problem: Pick<Problem, 'goal' | 'selection' | 'objectiveFloor'>): number {
  if (!Number.isFinite(score)) throw new RangeError('The objective score must be finite.');
  if (problem.selection === 'tournament') {
    return problem.goal === 'minimize' ? -score : score;
  }

  const floor = problem.objectiveFloor;
  if (!Number.isFinite(floor)) throw new RangeError('The objective lower bound must be finite.');

  const shifted = floor < 0 ? score - floor : score;
  if (shifted < 0) throw new RangeError('The objective lower bound does not support roulette scoring.');
  if (problem.goal === 'minimize') return 1 / (1 + shifted);

  // Give every candidate a slice for objectives that need a positive shift.
  return floor < 0 ? shifted + 1 : shifted;
}

export function evaluateChromosome(chromosome: string, problem: Problem) {
  const segments = decodeChromosome(chromosome, problem.variables);
  const values = segments.map(segment => segment.value);
  const score = problem.objective(values);
  return { chromosome, segments, values, score, fitness: scoreFitness(score, problem) };
}
