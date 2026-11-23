import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareElitism, runSchemaExperiment, schemaLowerBound } from '../src/ga/experiments.ts';
import { singleVariableMinimum } from '../src/ga/problems.ts';

const settings = { crossoverProbability: 0.8, mutationProbability: 0.05 };

test('matches the hand-computed schema bound and handles one-bit strings', () => {
  const result = schemaLowerBound([8, 4, 2, 2], ['0100', '0111', '1000', '1010'], '01**', settings);
  assert.equal(result.expectedParents, 3);
  assert.ok(Math.abs(result.bound - 1.9855) < 1e-12);
  assert.equal(schemaLowerBound([1, 1], ['0', '1'], '1', settings).crossoverSurvival, 1);
  assert.equal(schemaLowerBound([0, 0], ['0', '1'], '1', settings), null);
});

test('repeatable schema trials count every outcome and omit the tournament bound', () => {
  const population = ['0111', '1010', '0001', '1000'];
  const trial = problem => runSchemaExperiment(problem, population, '****', settings, 100, 42);
  const result = trial(singleVariableMinimum);
  assert.deepEqual(result, trial(singleVariableMinimum));
  assert.equal(result.mean, 4);
  assert.deepEqual(result.histogram, [0, 0, 0, 0, 100]);
  assert.equal(result.theorem.bound, 4);
  assert.equal(trial({ ...singleVariableMinimum, selection: 'tournament' }).theorem, null);
});

test('paired elitism replay starts from the same population and preserves the best score', () => {
  const result = compareElitism(singleVariableMinimum, ['0100', '0100'], {
    ...settings, mutationProbability: 1, limit: 1, count: 'reproduction-rounds', elitism: false,
  }, 42);
  assert.deepEqual(result.with[0], result.without[0]);
  assert.equal(result.without[1].best, 53);
  assert.equal(result.without[1].distinct, 1);
  assert.equal(result.with[1].best, 4);
  assert.equal(result.with[1].distinct, 2);
});
