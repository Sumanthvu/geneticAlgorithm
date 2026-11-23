import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bitsForPrecision, decodeChromosome, encodeChromosome, searchSpaceSize } from '../src/ga/encoding.ts';
import { evaluateChromosome, scoreFitness } from '../src/ga/scoring.ts';
import { singleVariableMinimum, threeVariableMinimum, twoVariableMinimum, twoVariableTournament } from '../src/ga/problems.ts';

test('matches the lecture penalties and roulette fitness', () => {
  const candidates = ['0111', '1010', '0001', '1000'].map(bits => evaluateChromosome(bits, singleVariableMinimum));
  assert.deepEqual(candidates.map(candidate => candidate.values[0]), [7, 10, 1, 8]);
  assert.deepEqual(candidates.map(candidate => candidate.score), [13, 40, 13, 20]);
  assert.equal(candidates[0].fitness, 1 / 14);
  const pair = evaluateChromosome('00110101', twoVariableMinimum);
  assert.deepEqual(pair.values, [3, 5]);
  assert.equal(pair.score, 2);
  assert.equal(pair.fitness, 1 / 3);
});

test('decodes unequal segments independently and encodes the nearest mark', () => {
  const variables = [
    { name: 'x', min: 0, max: 7, bits: 3 },
    { name: 'y', min: -2, max: 1, bits: 4 },
  ];
  const segments = decodeChromosome('1010110', variables);
  assert.deepEqual(segments.map(segment => segment.position), [5, 6]);
  assert.ok(Math.abs(segments[1].value + 0.8) < 1e-12);
  assert.equal(encodeChromosome([5, -0.79], variables), '1010110');
  assert.deepEqual(decodeChromosome('1111111', variables).map(segment => segment.value), [7, 1]);
  assert.equal(searchSpaceSize(variables), 128n);
  assert.equal(bitsForPrecision(-2, 1, 0.1), 4);
  assert.equal(bitsForPrecision(0, 15, 0.01), 10);
  assert.throws(() => decodeChromosome('1010210', variables), RangeError);
});

test('compares negative tournament scores and shifts negative roulette objectives', () => {
  assert.equal(evaluateChromosome('00001111', twoVariableTournament).fitness, -112);
  assert.equal(evaluateChromosome('10010110', twoVariableTournament).score, 50);
  assert.equal(scoreFitness(-30, { goal: 'maximize', selection: 'roulette', objectiveFloor: -30 }), 1);
  assert.equal(scoreFitness(-10, { goal: 'minimize', selection: 'roulette', objectiveFloor: -10 }), 1);
  assert.equal(scoreFitness(-1, { goal: 'minimize', selection: 'roulette', objectiveFloor: -10 }), 0.1);
});

test('scores the lecture three-variable optimum', () => {
  const candidate = evaluateChromosome('001001000110', threeVariableMinimum);
  assert.deepEqual(candidate.values, [2, 4, 6]);
  assert.equal(candidate.score, 0);
  assert.equal(candidate.fitness, 1);
  assert.equal(searchSpaceSize(threeVariableMinimum.variables), 4096n);
});
import { seededRandom, selectRoulette, selectTournament } from '../src/ga/selection.ts';

test('replays the lecture roulette endpoints and parent order', () => {
  const population = ['0111', '1010', '0001', '1000'].map(bits => evaluateChromosome(bits, singleVariableMinimum));
  const draws = [0.921, 0.694, 0.437, 0.995].values();
  const { slices, picks } = selectRoulette(population, () => draws.next().value);
  assert.deepEqual(slices.map(slice => slice.end.toFixed(4)), ['0.3324', '0.4459', '0.7784', '1.0000']);
  assert.deepEqual(picks.map(pick => pick.chromosome), ['1000', '0001', '1010', '1000']);
});

test('tournament replays lecture matches with replacement and negative scores', () => {
  const population = ['10010100', '00001111', '10110000', '11010110'].map(bits => evaluateChromosome(bits, twoVariableTournament));
  const draws = [0.477, 0.917, 0.189, 0.258, 0.248, 0.049, 0.674, 0.817].values();
  const picks = selectTournament(population, 'maximize', () => draws.next().value);
  assert.deepEqual(picks.map(pick => pick.winner), [3, 0, 0, 3]);
  assert.deepEqual([picks[2].first, picks[2].second], [0, 0]);
});

test('uses repeatable draws and handles zero roulette weights', () => {
  const population = [{ chromosome: '0', score: 0, fitness: 0 }, { chromosome: '1', score: 0, fitness: 1 }];
  assert.deepEqual(selectRoulette(population, seededRandom(42)), selectRoulette(population, seededRandom(42)));
  assert.equal(selectRoulette(population, () => 0).picks[0].winner, 1);
  const allZero = population.map(candidate => ({ ...candidate, fitness: 0 }));
  assert.deepEqual(selectRoulette(allZero, () => 0.75).slices.map(slice => slice.probability), [0.5, 0.5]);
  assert.equal(selectRoulette(allZero, () => 0.75).picks[0].winner, 1);
});
