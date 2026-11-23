# Genetic Algorithm Lab

A browser-based teaching lab for **binary genetic algorithms**. Follow a run one decision at a time, see the exact values used by each operator, and check a worked round against a hand calculation.

## Features

| Feature | What you can explore |
| --- | --- |
| Problem sandbox | Choose from nine lecture problems covering single-variable and multivariable optimization. Edit the search bounds, bit lengths, population, seed, operator probabilities, elitism, and stopping rule. |
| Step-by-step workbench | Play, pause, step, reset, or jump to a specific generation and operation. Plain-language explanations follow evaluation, parent selection, crossover, mutation, and replacement. |
| Candidate inspector | See how a binary chromosome decodes into one or more variable values. Objective plots and heatmaps show where candidates land in the search space. |
| Operator traces | Follow roulette-wheel draws or tournament brackets, then inspect the crossover cuts and mutation flips that produce the next population. |
| Schema experiments | Track a bit pattern through a run and compare the schema theorem’s lower bound with the average count from repeated trials. |
| Run analysis | Compare the winner of the final generation, the best candidate seen, the best point the encoding can represent, and the mathematical optimum. Review score and diversity history and compare runs with and without elitism. |
| Worked-example verification | Replay a lecture example with expected and calculated values shown side by side at each checkpoint. |

The lab runs entirely in the browser and is built with React, TypeScript, and Vite.

## Run locally

Use Node.js 22 and npm. From the repository root, run:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. To run the automated checks and preview the production build:

```sh
npm test
npm run build
npm run preview
```

## Deploy on Vercel

1. Sign in to Vercel with GitHub and choose **Add New → Project**.
2. Import **Sumanthvu/geneticAlgorithm**. If the repository is missing from the list, grant the Vercel GitHub integration access to it.
3. Use the settings below. Vercel can fill in the Vite defaults automatically.
4. Select **Deploy**. Open the URL Vercel provides and try **Load worked example → Step** to check the live site before sharing it.

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Root directory | Repository root |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variables | None required |
| Production branch | `main` |

After GitHub is connected, pushes to the production branch trigger a new production deployment. [Vercel Git deployment guide](https://vercel.com/docs/git)

## Assignment demonstration

1. **Verify a worked example.** Choose **Load worked example**, then press **Step** through the first reproduction round of single-variable Example 1. Each stage displays the expected and calculated values. The starting penalties are **13, 40, 13, 20**, the selected slots are **4, 3, 2, 4**, and the new population is **1001, 0100, 1100, 1010**. The final chromosome **0100** decodes to **4**, with a penalty of **4**.
2. **Change problems and settings.** Return to the sandbox, open **Run settings**, and pick **Find the highest-scoring pair**. Set different bit lengths for the two variables and apply the settings. The heatmap shows the objective landscape, and the inspector shows the separate binary segments. Use the tournament trace to see which competitors were drawn and why one won.
3. **Follow a pattern.** In the worked example, track **01\*\***. One starting chromosome matches, roulette picks no matching parents, and mutation introduces one match. Expand **Inspect the matches** to see each change. Then run the schema-theorem experiment and compare the observed mean with the expected lower bound.
4. **Compare the results.** At the end of a sandbox run, compare the best final candidate and best candidate seen with the best representable grid point and the mathematical optimum. Score and diversity history show the best and average objective score, the number of distinct chromosomes, and any stall. Use the paired elitism comparison to explore how this setting changes a run.

Use **Run stages** to jump to a generation and select an operation directly. The workbench displays that step, and the candidate inspector stays linked to the population. With focus in the playback controls, **Left** and **Right** move one step, and **Home** resets. Tab to **Play** or **Pause** and use Enter or Space.

## Scope and verification

- **Nine lecture presets:** four single-variable and five multivariable problems, with editable bounds, bits per variable, population, selection method, crossover and mutation rates, stopping rule, seed, and elitism.
- **Two stopping conventions:** count scored populations, including the starting one, or count rounds of reproduction and then score the final population.
- **Reproducibility:** the sandbox uses seeded draws. The verification replay uses the printed roulette draws, cut positions, and resulting mutation flips. It substitutes suitable draws where the notes omit a draw or show an annotation inconsistent with the printed outcome.
- **Grid benchmarks:** the nine objectives are separable quadratics. The continuous optimum is clamped to the configured bounds, and the grid benchmark selects a nearest available mark per coordinate. When several grid points tie, one is shown.
- **Schema theorem:** the bound is shown for roulette with positive total fitness. Repeated trials start from the same scored population and run without elitism. The bound applies to the expectation, and the histogram shows finite-sample observations.

The numeric tests cover encoding, scoring, selection, crossover, mutation, generation counting, the full worked-example replay, multivariable presets, schema tracking, experiments, and the optimum comparisons.

The lesson material is based on the supplied single-variable GA, multivariable GA, and schema theory lecture notes.
