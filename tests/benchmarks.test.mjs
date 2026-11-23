import assert from 'node:assert/strict';
import { test } from 'node:test';
import { configureLesson, lessonBenchmarks, lessons } from '../src/ga/lessons.ts';
import { evaluateChromosome } from '../src/ga/scoring.ts';

test('grid benchmarks match exhaustive search for every four-bit lecture preset', () => {
  for (const lesson of lessons) {
    const { problem } = lesson;
    const { grid } = lessonBenchmarks(lesson, problem);
    const length = problem.variables.reduce((sum, variable) => sum + variable.bits, 0);
    const scores = Array.from({ length: 2 ** length }, (_, index) =>
      evaluateChromosome(index.toString(2).padStart(length, '0'), problem).score);
    assert.equal(grid.score, problem.goal === 'minimize' ? Math.min(...scores) : Math.max(...scores), problem.id);
  }
});

test('edited bounds clamp the optimum and recalculate the roulette fitness shift', () => {
  const lesson = lessons.find(item => item.problem.id === 'positive-maximum');
  const problem = configureLesson(lesson, [{ name: 'x', min: -4, max: 2, bits: 4 }], 'roulette');
  assert.equal(problem.objectiveFloor, -76);
  assert.equal(evaluateChromosome('0000', problem).fitness, 1);
  const benchmarks = lessonBenchmarks(lesson, problem);
  assert.deepEqual(benchmarks.continuous, { values: [2], score: 26 });
  assert.equal(benchmarks.grid.chromosome, '1111');
});
