import { useId, useState } from 'react';
import type { SimulationEvent } from './ga/simulation.ts';
import type { Variable } from './ga/encoding.ts';
import { matchesSchema } from './ga/schema.ts';
import type { Goal } from './ga/scoring.ts';

interface Props {
  selection: Extract<SimulationEvent, { type: 'select' }>['selection'];
  goal: Goal;
  variables: readonly Variable[];
  schema?: string;
  onInspect: (index: number) => void;
}

const formatDraw = (value: number) => value.toFixed(6);

export function SelectionPanel({ selection, goal, variables, schema, onInspect }: Props) {
  const id = useId();
  const [active, setActive] = useState(0);
  const roulette = selection?.method === 'roulette' ? selection : null;
  const tournament = selection?.method === 'tournament' ? selection.picks : null;
  const winner = (roulette?.picks ?? tournament)?.[active]?.winner;
  const roll = roulette?.picks[active]?.roll;

  function splitChromosome(chromosome: string) {
    let start = 0;
    return variables.map(variable => {
      const segment = chromosome.slice(start, start + variable.bits);
      start += variable.bits;
      return segment;
    }).join(" │ ");
  }

  function inspect(parent: number, index: number) {
    setActive(parent);
    onInspect(index);
  }

  return <section className="selection" aria-labelledby={`${id}-title`}>
    <div className="selection-heading">
      <div><span className="eyebrow">Parent selection</span><h3 id={`${id}-title`}>Build the mating pool</h3></div>
    </div>
    <p>{roulette
      ? 'Each fitness score gets a share of the wheel. The first nonempty slice that reaches the draw supplies one parent.'
      : `Two candidates are drawn with replacement. The ${goal === 'minimize' ? 'lower' : 'higher'} objective score wins. A tie keeps the first draw.`}</p>
    <p className="selection-note">Select a parent row to inspect its source chromosome.</p>
    {roulette && <div className="roulette">
      <div className="roulette-track" aria-hidden="true">
        {roulette.slices.map((slice, index) => <div key={index}
          className={index === winner ? 'slice active-slice' : 'slice'}
          style={{ width: `${(slice.end - slice.start) * 100}%` }}>
          {slice.probability >= 0.07 ? index + 1 : ''}
        </div>)}
        <span className="draw-marker" style={{ left: `${(roll ?? 0) * 100}%` }} />
      </div>
      <div className="roulette-key"><span>0</span><span>Draw {formatDraw(roll ?? 0)}</span><span>1</span></div>
      <table className="slice-table">
        <thead><tr><th scope="col">Slot</th><th scope="col">Width</th><th scope="col">Endpoint</th></tr></thead>
        <tbody>{roulette.slices.map((slice, index) =>
          <tr key={index} className={index === winner ? 'slice-winner' : ''}>
            <th scope="row">{index + 1}</th><td>{(slice.probability * 100).toFixed(2)}%</td><td>{slice.end.toFixed(4)}</td>
          </tr>)}</tbody>
      </table>
    </div>}
    <div className="parent-list" aria-label="Mating pool in draw order">
      {(roulette?.picks ?? tournament)?.map((pick, index) => <button type="button" key={index} aria-pressed={active === index}
        className="parent-pick" onClick={() => inspect(index, pick.winner)}>
        <span><strong>Parent {index + 1}</strong><small>{'roll' in pick
          ? `Draw ${formatDraw(pick.roll)} → slot ${pick.winner + 1}`
          : `Slots ${pick.first + 1} and ${pick.second + 1} · scores ${pick.firstScore} and ${pick.secondScore} → slot ${pick.winner + 1}`}</small>
          {'firstRoll' in pick && <small>Draws {formatDraw(pick.firstRoll)} and {formatDraw(pick.secondRoll)}</small>}</span>
        <span><code>{splitChromosome(pick.chromosome)}</code>{schema && matchesSchema(pick.chromosome, schema) && <small className="match-label">Schema match</small>}</span>
      </button>)}
    </div>
  </section>;
}
