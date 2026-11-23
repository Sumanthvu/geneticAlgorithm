import { formatCoordinates, formatNumber } from './display.ts';
import type { Variable } from './ga/encoding.ts';
import type { SimulationEvent } from './ga/simulation.ts';

type ReproductionEvent = Exclude<SimulationEvent, { type: 'evaluate' | 'select' }>;

function cutLabel(cut: number, variables: readonly Variable[]) {
  let boundary = 0;
  for (const [index, variable] of variables.entries()) {
    boundary += variable.bits;
    if (cut < boundary) return "inside " + variable.name;
    if (cut === boundary) return "between " + variable.name + " and " + variables[index + 1].name;
  }
  return "";
}

function showCut(bits: string, variables: readonly Variable[], cut: number | null = null) {
  let start = 0;
  return variables.map(variable => {
    const end = start + variable.bits;
    const segment = cut !== null && cut > start && cut < end
      ? bits.slice(start, cut) + " / " + bits.slice(cut, end)
      : bits.slice(start, end);
    start = end;
    return segment;
  }).join(" │ ");
}

function bitLabel(index: number, variables: readonly Variable[]) {
  let local = index;
  for (const variable of variables) {
    if (local < variable.bits) return "bit " + (index + 1) + " (" + variable.name + ", weight " + 2 ** (variable.bits - local - 1) + ")";
    local -= variable.bits;
  }
  return "bit " + (index + 1);
}

export function ReproductionTrace({ event, variables }: { event: ReproductionEvent; variables: readonly Variable[] }) {
  switch (event.type) {
    case 'crossover':
      return <section className="reproduction" aria-label="Crossover decisions">
        {event.pairs.map(pair => <div className="trace-row" key={pair.parentSlots[0]}>
          <strong>Parents {pair.parentSlots[0] + 1} and {pair.parentSlots[1] + 1}</strong>
          <span>Draw {pair.roll.toFixed(6)} · {pair.cut === null ? 'copied unchanged' : `cut after bit ${pair.cut} · ${cutLabel(pair.cut, variables)}`}</span>
          <code>{pair.parents.map(bits => showCut(bits, variables, pair.cut)).join(' + ')}</code>
          <code>Children: {pair.children.map(bits => showCut(bits, variables, pair.cut)).join(', ')}</code>
        </div>)}
        {event.unpaired !== null && <p>The last parent has no partner, so it is copied before mutation.</p>}
      </section>;
    case 'mutate':
      return <section className="reproduction" aria-label="Mutation decisions">
        {event.children.map((child, index) => <div className="trace-row" key={index}>
          <strong>Child {index + 1} <code>{showCut(child.before, variables)} → {showCut(child.after, variables)}</code></strong>
          <span>{child.bits.filter(bit => bit.flipped).map(bit => `${bitLabel(bit.index, variables)}: ${bit.roll.toFixed(6)}`).join(' · ') || 'No bits flipped'}</span>
          <details><summary>Show all bit draws</summary><code>{child.bits.map(bit => `${bit.index + 1}: ${bit.roll.toFixed(6)}`).join(' · ')}</code></details>
        </div>)}
      </section>;
    case 'replace':
      return <section className="reproduction" aria-label="Replacement result">
        {event.elite
          ? <p>Elitism replaces slot {event.elite.slot + 1} ({showCut(event.elite.removed.chromosome, variables)}) with {showCut(event.elite.inserted.chromosome, variables)}.</p>
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
