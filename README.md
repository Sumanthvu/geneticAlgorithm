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

The sandbox offers four single-variable and five multivariable lecture problems. Choose a problem, edit the run settings, and select Apply settings. Playback uses a repeatable event trace. Each variable has a separate bit-length control. One-variable runs show a number line, two-variable runs show an objective heatmap, and three-variable runs show linked coordinate rulers. Crossover and mutation traces identify the affected segments, and Score history records the best and average objective score in each evaluated population.

Load worked example to check the first reproduction round of single-variable Example 1. It uses the printed starting population, roulette draws, cut positions, and mutation outcomes. Unlisted non-flip draws are filled in above the threshold, and the cut draws are chosen to produce the printed positions. Each stage compares the simulated result with the hand calculation.

The tests check the lecture values and include mixed segment lengths, fractional steps, negative bounds, and negative objective scores.

The Schema Tracker accepts a chromosome-length pattern of 0, 1, and * characters. It reports order, defining length, the number of possible matching strings, and observed matches at each stage. Expand Inspect the matches to see the strings before and after crossover or mutation.

Use Test the schema theorem to repeat one generation from the current scored population, with elitism off. The experiment shows an observed match histogram and, for roulette with positive total fitness, the theorem’s expected lower bound. Use the diversity history and the paired elitism comparison to see how a run can settle or lose variety.
