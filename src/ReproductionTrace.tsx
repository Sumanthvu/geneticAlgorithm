import type { SimulationEvent } from './ga/simulation.ts';

type ReproductionEvent = Exclude<SimulationEvent, { type: 'evaluate' | 'select' }>;

function showCut(bits: string, cut: number | null) {
  return cut === null ? bits : `${bits.slice(0, cut)} │ ${bits.slice(cut)}`;
}

export function ReproductionTrace({ event }: { event: ReproductionEvent }) {
  switch (event.type) {
    case 'crossover':
      return <section className="reproduction" aria-label="Crossover decisions">
        {event.pairs.map(pair => <div className="trace-row" key={pair.parentSlots[0]}>
          <strong>Parents {pair.parentSlots[0] + 1} and {pair.parentSlots[1] + 1}</strong>
          <span>Draw {pair.roll.toFixed(6)} · {pair.cut === null ? 'copied unchanged' : `cut after bit ${pair.cut}`}</span>
          <code>{pair.parents.map(bits => showCut(bits, pair.cut)).join(' + ')}</code>
          <code>Children: {pair.children.map(bits => showCut(bits, pair.cut)).join(', ')}</code>
        </div>)}
        {event.unpaired !== null && <p>The last parent has no partner, so it is copied before mutation.</p>}
      </section>;
    case 'mutate':
      return <section className="reproduction" aria-label="Mutation decisions">
        {event.children.map((child, index) => <div className="trace-row" key={index}>
          <strong>Child {index + 1} <code>{child.before} → {child.after}</code></strong>
          <span>{child.bits.filter(bit => bit.flipped).map(bit => `Bit ${bit.index + 1}: ${bit.roll.toFixed(6)}`).join(' · ') || 'No bits flipped'}</span>
          <details><summary>Show all bit draws</summary><code>{child.bits.map(bit => `${bit.index + 1}: ${bit.roll.toFixed(6)}`).join(' · ')}</code></details>
        </div>)}
      </section>;
    case 'replace':
      return <section className="reproduction" aria-label="Replacement result">
        {event.elite
          ? <p>Elitism replaces slot {event.elite.slot + 1} ({event.elite.removed.chromosome}) with {event.elite.inserted.chromosome}.</p>
          : <p>All {event.population.length} children enter the next population.</p>}
      </section>;
    case 'stop':
      return <section className="reproduction" aria-label="Run result">
        <div className="readout"><span>Best in the final population</span><strong>{event.bestFinal.chromosome} · score {event.bestFinal.score}</strong></div>
        <div className="readout"><span>Best seen during the run</span><strong>{event.bestSeen.chromosome} · score {event.bestSeen.score}</strong></div>
        <p>Scored {event.generation} populations, including the starting population.</p>
      </section>;
  }
}
