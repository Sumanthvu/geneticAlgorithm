import { useState } from 'react';
import { runSchemaExperiment } from './ga/experiments.ts';
import { formatNumber } from './display.ts';
import type { Problem } from './ga/scoring.ts';
import type { RunSettings } from './ga/simulation.ts';

interface Props {
  problem: Problem;
  population: readonly string[];
  generation: number;
  pattern: string;
  settings: RunSettings;
  seed: number;
}

export function SchemaExperiment({ problem, population, generation, pattern, settings, seed }: Props) {
  const [trials, setTrials] = useState(300);
  const [result, setResult] = useState<ReturnType<typeof runSchemaExperiment> | null>(null);
  return <details className="experiment">
    <summary>Test the schema theorem</summary>
    <p>Start each trial from scored Generation {generation}, then run one round with fresh seeded draws and elitism off.</p>
    <div className="experiment-controls">
      <label>Trials <select value={trials} onChange={event => { setTrials(Number(event.target.value)); setResult(null); }}>
        <option value={100}>100</option><option value={300}>300</option><option value={1000}>1,000</option>
      </select></label>
      <button type="button" onClick={() => setResult(runSchemaExperiment(problem, population, pattern, settings, trials, seed))}>Run trials</button>
    </div>
    {result && <div className="experiment-result" aria-live="polite">
      <div className="readout"><span>Observed mean matches</span><strong>{formatNumber(result.mean)}</strong></div>
      {result.theorem ? <>
        <div className="readout"><span>Theorem lower bound</span><strong>{formatNumber(result.theorem.bound)}</strong></div>
        <p>Expected matching parents × crossover survival bound × mutation survival</p>
        <code>{formatNumber(result.theorem.expectedParents)} × {formatNumber(result.theorem.crossoverSurvival)} × {formatNumber(result.theorem.mutationSurvival)}</code>
        <p>The bound applies to the true mean. A finite sample can fall below it.</p>
      </> : <p>{problem.selection === 'tournament'
        ? 'This bound assumes roulette selection. The tournament trials still show the observed distribution.'
        : 'This bound needs positive total fitness. These trials use equal roulette weights because all fitness scores are zero.'}</p>}
      <table className="slice-table histogram">
        <thead><tr><th scope="col">Matches in one trial</th><th scope="col">Frequency</th><th scope="col"><span className="sr-only">Share of trials</span></th></tr></thead>
        <tbody>{result.histogram.map((frequency, count) => frequency > 0 && <tr key={count}>
          <th scope="row">{count}</th><td>{frequency} / {result.trials}</td>
          <td aria-hidden="true"><div className="histogram-track"><i style={{ width: `${frequency / result.trials * 100}%` }} /></div></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </details>;
}
