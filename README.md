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

The lab displays a fixed starting population from the single-variable minimization lesson. Select a chromosome or a point on the number line to inspect its binary representation, objective score, and roulette fitness. The engine also supports concatenated chromosomes with independent bounds and bit lengths. The selection panel uses a repeatable seed to build a mating pool with roulette or binary tournaments. Click a parent row to inspect the winning source chromosome. Roulette uses equal slices when all fitness weights are zero. Use Play, Pause, Step, Back, and Reset to inspect the same recorded run. The default lesson scores three populations, including the starting one. Changing the selection method, random seed, or elitism starts a new trace. The engine also supports counting by rounds of reproduction.

The tests check the lecture values and include mixed segment lengths, fractional steps, negative bounds, and negative objective scores.
