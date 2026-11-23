import { generationStats } from './ga/experiments.ts';
import type { Goal } from './ga/scoring.ts';
import type { SimulationEvent } from './ga/simulation.ts';

export function ScoreHistory({ events, goal }: { events: SimulationEvent[]; goal: Goal }) {
  const rows = generationStats(events, goal);
  let bestSeen = rows[0]?.best;
  let lastImprovement = rows[0]?.generation ?? 0;
  for (const row of rows.slice(1)) {
    if (goal === 'minimize' ? row.best < bestSeen : row.best > bestSeen) {
      bestSeen = row.best;
      lastImprovement = row.generation;
    }
  }
  const stalled = (rows.at(-1)?.generation ?? 0) - lastImprovement;
  const values = rows.flatMap(row => [row.best, row.mean]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const offset = (score: number) => `${max === min ? 50 : (score - min) / (max - min) * 100}%`;
  const format = (score: number) => Number(score.toFixed(4));
  return <section className="history" aria-label="Objective score history">
    <h3>Score &amp; diversity history</h3>
    <p>{goal === 'minimize' ? 'Lower is better.' : 'Higher is better.'} Filled dots show the best score. Open dots show the average. Distinct counts unique chromosomes.</p>
    {stalled > 0 && <p>No new best for {stalled} {stalled === 1 ? "generation" : "generations"}.</p>}
    <table className="slice-table">
      <thead><tr><th scope="col">Generation</th><th scope="col">Best</th><th scope="col">Average</th><th scope="col">Distinct</th><th scope="col"><span className="sr-only">Plot</span></th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.generation}>
        <th scope="row">{row.generation}</th><td>{format(row.best)}</td><td>{format(row.mean)}</td><td>{row.distinct}/{row.size}</td>
        <td className="history-plot"><div aria-hidden="true"><i style={{ left: offset(row.best) }} /><i style={{ left: offset(row.mean) }} /></div></td>
      </tr>)}</tbody>
    </table>
  </section>;
}
