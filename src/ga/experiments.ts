import { describeSchema, matchesSchema } from './schema.ts';
import { evaluateChromosome, type Problem } from './scoring.ts';
import { seededRandom } from './selection.ts';
import { runSimulation, type RunSettings, type SimulationEvent } from './simulation.ts';

type Settings = Pick<RunSettings, 'crossoverProbability' | 'mutationProbability'>;

export function schemaLowerBound(fitness: readonly number[], chromosomes: readonly string[], pattern: string, settings: Settings) {
  const schema = describeSchema(pattern, chromosomes[0]?.length ?? 0);
  if (!schema || chromosomes.length !== fitness.length || fitness.some(value => !Number.isFinite(value) || value < 0)) return null;
  const total = fitness.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total) || total <= 0) return null;

  const matchingWeight = fitness.reduce((sum, value, index) => matchesSchema(chromosomes[index], pattern) ? sum + value : sum, 0);
  const expectedParents = chromosomes.length * (matchingWeight / total);
  const crossoverSurvival = pattern.length === 1 ? 1 : 1 - settings.crossoverProbability * schema.definingLength / (pattern.length - 1);
  const mutationSurvival = (1 - settings.mutationProbability) ** schema.order;
  return { expectedParents, crossoverSurvival, mutationSurvival, bound: expectedParents * crossoverSurvival * mutationSurvival };
}

export function runSchemaExperiment(problem: Problem, population: readonly string[], pattern: string, settings: Settings, trials: number, seed: number) {
  if (!describeSchema(pattern, population[0]?.length ?? 0) || !Number.isInteger(trials) || trials < 1 || trials > 1000) {
    throw new RangeError('Use a matching schema and between 1 and 1,000 trials.');
  }

  const draw = seededRandom(seed);
  const histogram = Array.from({ length: population.length + 1 }, () => 0);
  for (let trial = 0; trial < trials; trial++) {
    const events = runSimulation(problem, population, { ...settings, count: 'reproduction-rounds', limit: 1, elitism: false }, draw);
    const replacement = events.find(event => event.type === 'replace');
    if (!replacement) throw new Error('The trial did not produce a new population.');
    const count = replacement.population.filter(candidate => matchesSchema(candidate.chromosome, pattern)).length;
    histogram[count]++;
  }
  const mean = histogram.reduce((sum, frequency, count) => sum + frequency * count, 0) / trials;
  const theorem = problem.selection === 'roulette'
    ? schemaLowerBound(population.map(bits => evaluateChromosome(bits, problem).fitness), population, pattern, settings)
    : null;
  return { mean, histogram, theorem, trials };
}

export function generationStats(events: readonly SimulationEvent[], goal: Problem['goal']) {
  const populations = events.filter(event => event.type === 'evaluate');
  return populations.map(({ population, generation }) => {
    const scores = population.map(candidate => candidate.score);
    return {
      generation,
      best: goal === 'minimize' ? Math.min(...scores) : Math.max(...scores),
      mean: scores.reduce((sum, score) => sum + score, 0) / scores.length,
      distinct: new Set(population.map(candidate => candidate.chromosome)).size,
      size: scores.length,
    };
  });
}

export function compareElitism(problem: Problem, initial: readonly string[], settings: RunSettings, seed: number) {
  const run = (elitism: boolean) => generationStats(
    runSimulation(problem, initial, { ...settings, elitism }, seededRandom(seed)), problem.goal,
  );
  return { without: run(false), with: run(true) };
}
