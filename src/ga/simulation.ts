import { evaluateChromosome, type Goal, type Problem } from './scoring.ts';
import { selectRoulette, selectTournament, type Draw } from './selection.ts';
import { crossPopulation, mutatePopulation } from './reproduction.ts';

type Evaluated = ReturnType<typeof evaluateChromosome>;
type Selection =
  | ({ method: 'roulette' } & ReturnType<typeof selectRoulette>)
  | { method: 'tournament'; picks: ReturnType<typeof selectTournament> };

type EliteReplacement = { slot: number; removed: Evaluated; inserted: Evaluated };

export type SimulationEvent =
  | { type: 'evaluate'; generation: number; population: Evaluated[] }
  | { type: 'select'; generation: number; selection: Selection }
  | ({ type: 'crossover'; generation: number } & ReturnType<typeof crossPopulation>)
  | { type: 'mutate'; generation: number; children: ReturnType<typeof mutatePopulation> }
  | { type: 'replace'; generation: number; population: Evaluated[]; elite: EliteReplacement | null }
  | { type: 'stop'; generation: number; bestFinal: Evaluated; bestSeen: Evaluated };

export interface RunSettings {
  limit: number;
  count: 'scored-populations' | 'reproduction-rounds';
  crossoverProbability: number;
  mutationProbability: number;
  elitism: boolean;
}

function better(left: Evaluated, right: Evaluated, goal: Goal): boolean {
  return goal === 'minimize' ? left.score < right.score : left.score > right.score;
}

function bestOf(population: readonly Evaluated[], goal: Goal): Evaluated {
  return population.reduce((best, candidate) => better(candidate, best, goal) ? candidate : best);
}

export function runSimulation(problem: Problem, initial: readonly string[], settings: RunSettings, draw: Draw) {
  const minimum = settings.count === 'scored-populations' ? 1 : 0;
  if (!initial.length || !Number.isSafeInteger(settings.limit) || settings.limit < minimum) {
    throw new RangeError('Use a nonempty population and a valid generation limit.');
  }

  const rounds = settings.limit - minimum;
  let population = initial.map(chromosome => evaluateChromosome(chromosome, problem));
  let bestSeen = bestOf(population, problem.goal);
  const events: SimulationEvent[] = [];

  for (let generation = 1; generation <= rounds + 1; generation++) {
    events.push({ type: 'evaluate', generation, population });
    const best = bestOf(population, problem.goal);
    if (better(best, bestSeen, problem.goal)) bestSeen = best;

    if (generation === rounds + 1) {
      events.push({ type: 'stop', generation, bestFinal: best, bestSeen });
      break;
    }

    const selection: Selection = problem.selection === 'roulette'
      ? { method: 'roulette', ...selectRoulette(population, draw) }
      : { method: 'tournament', picks: selectTournament(population, problem.goal, draw) };
    events.push({ type: 'select', generation, selection });

    const crossover = crossPopulation(selection.picks.map(pick => pick.chromosome), settings.crossoverProbability, draw);
    events.push({ type: 'crossover', generation, ...crossover });

    const children = mutatePopulation(crossover.children, settings.mutationProbability, draw);
    events.push({ type: 'mutate', generation, children });

    const next = children.map(child => evaluateChromosome(child.after, problem));
    let elite: EliteReplacement | null = null;
    if (settings.elitism) {
      const slot = next.reduce((worst, candidate, index) => better(next[worst], candidate, problem.goal) ? index : worst, 0);
      elite = { slot, removed: next[slot], inserted: best };
      next[slot] = best;
    }
    population = next;
    events.push({ type: 'replace', generation, population, elite });
  }

  return events;
}
