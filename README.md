# Genetic Algorithm Lab

An interactive teaching lab for binary genetic algorithms.

## Run locally

Use Node.js 22 and npm.

```sh
npm ci
npm run dev
npm test
npm run build
```

The lab displays a fixed starting population from the single-variable minimization lesson. Select a chromosome or a point on the number line to inspect its binary representation, objective score, and roulette fitness. The engine also supports concatenated chromosomes with independent bounds and bit lengths. The selection panel uses a repeatable seed to build a mating pool with roulette or binary tournaments. Click a parent row to inspect the winning source chromosome. Roulette uses equal slices when all fitness weights are zero. Expand the reproduction sections to explore crossover, mutation, replacement, and optional elitism for one round. The engine records the evaluated populations and each operation in order, and can stop by counting either scored populations or rounds of reproduction. Playback is a subsequent milestone.

The tests check the lecture values and include mixed segment lengths, fractional steps, negative bounds, and negative objective scores.
