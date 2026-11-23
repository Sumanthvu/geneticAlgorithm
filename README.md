# Genetic Algorithm Lab

A browser-based teaching lab for **binary genetic algorithms**. Follow a run one decision at a time, see the exact values used by each operator, and check a worked round against a hand calculation.

## Run locally

Use Node.js 22 and npm.

```sh
npm ci
npm test
npm run build
npm run dev
```

Open the local URL printed by Vite. The production build writes static files to `dist/`.

## Assignment demonstration

1. **Verify a worked example.** Choose **Load worked example**, then press **Step** through the first reproduction round of single-variable Example 1. Each stage displays the expected and calculated values. The starting penalties are **13, 40, 13, 20**, the selected slots are **4, 3, 2, 4**, and the new population is **1001, 0100, 1100, 1010**. The final chromosome **0100** decodes to **4**, with a penalty of **4**.
2. **Change problems and settings.** Return to the sandbox, open **Run settings**, and pick **Find the highest-scoring pair**. Set different bit lengths for the two variables and apply the settings. The heatmap shows the objective landscape, and the inspector shows the separate binary segments. Use the tournament trace to see which competitors were drawn and why one won.
3. **Follow a pattern.** In the worked example, track **01\*\***. One starting chromosome matches, roulette picks no matching parents, and mutation introduces one match. Expand **Inspect the matches** to see each change. Then run the schema-theorem experiment and compare the observed mean with the expected lower bound.
4. **Compare the results.** At the end of a sandbox run, compare the best final candidate and best candidate seen with the best representable grid point and the mathematical optimum. Score and diversity history show the best and average objective score, the number of distinct chromosomes, and any stall. Use the paired elitism comparison to explore how this setting changes a run.

With focus in the playback controls, **Left** and **Right** move one step, and **Home** resets. Tab to **Play** or **Pause** and use Enter or Space.

## Scope and verification

- **Nine lecture presets:** four single-variable and five multivariable problems, with editable bounds, bits per variable, population, selection method, crossover and mutation rates, stopping rule, seed, and elitism.
- **Two stopping conventions:** count scored populations, including the starting one, or count rounds of reproduction and then score the final population.
- **Reproducibility:** the sandbox uses seeded draws. The verification replay uses the printed roulette draws, cut positions, and resulting mutation flips. It substitutes suitable draws where the notes omit a draw or show an annotation inconsistent with the printed outcome.
- **Grid benchmarks:** the nine objectives are separable quadratics. The continuous optimum is clamped to the configured bounds, and the grid benchmark selects a nearest available mark per coordinate. When several grid points tie, one is shown.
- **Schema theorem:** the bound is shown for roulette with positive total fitness. Repeated trials start from the same scored population and run without elitism. The bound applies to the expectation, and the histogram shows finite-sample observations.

The numeric tests cover encoding, scoring, selection, crossover, mutation, generation counting, the full worked-example replay, multivariable presets, schema tracking, experiments, and the optimum comparisons.

The lesson material is based on the supplied single-variable GA, multivariable GA, and schema theory lecture notes.
