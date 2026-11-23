import { useState } from 'react';
import { formatNumber } from './display.ts';
import { compareElitism } from './ga/experiments.ts';
import type { Problem } from './ga/scoring.ts';
import type { RunSettings } from './ga/simulation.ts';

export function ElitismComparison({ problem, initial, settings, seed }: {
  problem: Problem; initial: readonly string[]; settings: RunSettings; seed: number;
}) {
  const [result, setResult] = useState<ReturnType<typeof compareElitism> | null>(null);
  return <section className="history">
    <details className="experiment">
      <summary>Compare runs with and without elitism</summary>
      <p>Replay the same initial population and starting seed twice. Only the elitism setting changes.</p>
      <button className="verify-button" type="button" onClick={() => setResult(compareElitism(problem, initial, settings, seed))}>Compare elitism</button>
      {result && <div aria-live="polite">
        <p>Each cell shows the best objective score, then the number of distinct chromosomes.</p>
        <table className="slice-table">
          <thead><tr><th scope="col">Generation</th><th scope="col">Without elitism</th><th scope="col">With elitism</th></tr></thead>
          <tbody>{result.without.map((row, index) => <tr key={row.generation}>
            <th scope="row">{row.generation}</th>
            <td>{formatNumber(row.best)} · {row.distinct}/{row.size}</td>
            <td>{formatNumber(result.with[index].best)} · {result.with[index].distinct}/{row.size}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </details>
  </section>;
}
