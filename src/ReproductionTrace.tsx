import type { SimulationEvent } from './ga/simulation.ts';

interface Props {
  crossover: Extract<SimulationEvent, { type: 'crossover' }>;
  mutation: Extract<SimulationEvent, { type: 'mutate' }>;
  replacement: Extract<SimulationEvent, { type: 'replace' }>;
  stop: Extract<SimulationEvent, { type: 'stop' }>;
  elitism: boolean;
  onElitismChange: (enabled: boolean) => void;
}

function showCut(bits: string, cut: number | null) {
  return cut === null ? bits : `${bits.slice(0, cut)} │ ${bits.slice(cut)}`;
}

export function ReproductionTrace({ crossover, mutation, replacement, stop, elitism, onElitismChange }: Props) {
  return <div className="reproduction">
    <details>
      <summary>Crossover · compare parents and children</summary>
      <p>Pair adjacent parents. This example crosses a pair when its draw is below 0.8.</p>
      {crossover.pairs.map(pair => <div className="trace-row" key={pair.parentSlots[0]}>
        <strong>Parents {pair.parentSlots[0] + 1} and {pair.parentSlots[1] + 1}</strong>
        <span>Draw {pair.roll.toFixed(6)} · {pair.cut === null ? 'copied unchanged' : `cut after bit ${pair.cut}`}</span>
        <code>{pair.parents.map(bits => showCut(bits, pair.cut)).join(' + ')}</code>
        <code>Children: {pair.children.join(', ')}</code>
      </div>)}
      {crossover.unpaired !== null && <p>The last parent has no partner, so it is copied before mutation.</p>}
    </details>
    <details>
      <summary>Mutation · inspect each child</summary>
      <p>Every bit gets its own draw. A draw below 0.05 flips that bit.</p>
      {mutation.children.map((child, index) => <div className="trace-row" key={index}>
        <strong>Child {index + 1} <code>{child.before} → {child.after}</code></strong>
        <span>{child.bits.filter(bit => bit.flipped).map(bit => `Bit ${bit.index + 1}: ${bit.roll.toFixed(6)}`).join(' · ') || 'No bits flipped'}</span>
      </div>)}
    </details>
    <details>
      <summary>Replacement &amp; stop · score the next population</summary>
      <label className="elitism-control"><input type="checkbox" checked={elitism}
        onChange={event => onElitismChange(event.target.checked)} /> Copy the best old candidate over the worst child</label>
      {replacement.elite && <p>Elitism replaces slot {replacement.elite.slot + 1} ({replacement.elite.removed.chromosome}) with {replacement.elite.inserted.chromosome}.</p>}
      <table className="slice-table">
        <thead><tr><th scope="col">Slot</th><th scope="col">Chromosome</th><th scope="col">Score</th></tr></thead>
        <tbody>{replacement.population.map((candidate, index) => <tr key={index}>
          <th scope="row">{index + 1}</th><td>{candidate.chromosome}</td><td>{candidate.score}</td>
        </tr>)}</tbody>
      </table>
      <p>This preview stops after one round of making children and scoring them. Best in the final group: <strong>{stop.bestFinal.chromosome} (score {stop.bestFinal.score})</strong>. Best seen across both scored groups: <strong>{stop.bestSeen.chromosome} (score {stop.bestSeen.score})</strong>.</p>
    </details>
  </div>;
}
