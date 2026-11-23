import assert from 'node:assert/strict';
import { test } from 'node:test';
import { singleVariableMinimum } from '../src/ga/problems.ts';
import { crossPopulation } from '../src/ga/reproduction.ts';
import { seededRandom } from '../src/ga/selection.ts';
import { runSimulation } from '../src/ga/simulation.ts';

const settings = {
  limit: 1,
  count: 'reproduction-rounds',
  crossoverProbability: 0.8,
  mutationProbability: 0.05,
  elitism: false,
};

test('replays a hand-checked lecture generation through replacement', () => {
  const draws = [
    0.921, 0.694, 0.437, 0.995, // roulette
    0.771, 0.4, 0.616, 0,     // pair rolls and draws that give cuts 2 and 1
    0.9, 0.9, 0.9, 0.9,
    0.9, 0.02, 0.9, 0.9,
    0.9, 0.02, 0.9, 0.9,
    0.9, 0.9, 0.9, 0.9,
  ].values();
  const events = runSimulation(singleVariableMinimum, ['0111', '1010', '0001', '1000'], settings, () => draws.next().value);
  assert.deepEqual(events.map(event => event.type), ['evaluate', 'select', 'crossover', 'mutate', 'replace', 'evaluate', 'stop']);
  assert.deepEqual(events[2].children, ['1001', '0000', '1000', '1010']);
  assert.deepEqual(events[3].children.map(child => child.after), ['1001', '0100', '1100', '1010']);
  assert.deepEqual(events[4].population.map(candidate => candidate.score), [29, 4, 68, 40]);
  assert.equal(events.at(-1).bestFinal.score, 4);
});

test('counts both stop conventions and produces identical seeded histories', () => {
  const run = options => runSimulation(singleVariableMinimum, ['0100', '0111'], options, seededRandom(12));
  const threeRounds = run({ ...settings, limit: 3 });
  const threePopulations = run({ ...settings, limit: 3, count: 'scored-populations' });
  assert.deepEqual(threeRounds, run({ ...settings, limit: 3 }));
  assert.equal(threeRounds.filter(event => event.type === 'evaluate').length, 4);
  assert.equal(threePopulations.filter(event => event.type === 'evaluate').length, 3);
  assert.deepEqual(run({ ...settings, limit: 0 }).map(event => event.type), ['evaluate', 'stop']);
});

test('distinguishes the final winner from the overall winner and can preserve the elite', () => {
  const run = elitism => runSimulation(singleVariableMinimum, ['0100', '0100'], {
    ...settings, mutationProbability: 1, elitism,
  }, () => 0.5);
  assert.equal(run(false).at(-1).bestFinal.score, 53);
  assert.equal(run(false).at(-1).bestSeen.score, 4);
  const protectedRun = run(true);
  assert.equal(protectedRun[4].elite.slot, 0);
  assert.equal(protectedRun.at(-1).bestFinal.score, 4);
  assert.equal(protectedRun.at(-1).bestFinal.chromosome, '0100');
});

test('copies the unpaired parent and supports chromosomes with no possible cut', () => {
  const result = crossPopulation(['1', '0', '1'], 1, () => 0);
  assert.equal(result.pairs[0].cut, null);
  assert.equal(result.unpaired, 2);
  assert.deepEqual(result.children, ['1', '0', '1']);
});
