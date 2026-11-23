import assert from 'node:assert/strict';
import { test } from 'node:test';
import { workedExample } from '../src/ga/lessons.ts';
import { describeSchema, matchesSchema, schemaStage } from '../src/ga/schema.ts';

test('counts fixed positions, gaps, and possible matches', () => {
  assert.deepEqual(describeSchema('*11*0**', 7), {
    pattern: '*11*0**', order: 3, definingLength: 3, matchingStrings: 16n,
  });
  assert.equal(describeSchema('****', 4).definingLength, 0);
  assert.equal(describeSchema('***1', 4).definingLength, 0);
  assert.equal(describeSchema('0**', 4), null);
  assert.equal(describeSchema('01?*', 4), null);
  assert.ok(matchesSchema('0111000', '*11*0**'));
  assert.ok(!matchesSchema('1010011', '*11*0**'));
});

test('tracks exact schema counts as the lecture generation evolves', () => {
  const events = workedExample();
  const population = events[0].population.map(candidate => candidate.chromosome);
  const selection = schemaStage(events[1], population, '01**');
  assert.deepEqual(selection.previous, { count: 1, total: 4 });
  assert.equal(selection.count, 0);
  assert.equal(schemaStage(events[2], population, '01**').count, 0);
  const mutation = schemaStage(events[3], population, '01**');
  assert.deepEqual(mutation.previous, { count: 0, total: 4 });
  assert.equal(mutation.count, 1);
  assert.equal(mutation.entries[1].note, 'Fixed positions flipped: 2. Match created.');
  const crossover = schemaStage(events[2], population, '10**');
  assert.equal(crossover.count, 3);
  assert.equal(crossover.previous.count, 3);
});
