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

The lab displays a fixed starting population from the single-variable minimization lesson. Select a chromosome or a point on the number line to inspect its binary representation, objective score, and roulette fitness. The engine also supports concatenated chromosomes with independent bounds and bit lengths. Selection, parameter controls, and playback are subsequent milestones.

The tests check the lecture values and include mixed segment lengths, fractional steps, negative bounds, and negative objective scores.
