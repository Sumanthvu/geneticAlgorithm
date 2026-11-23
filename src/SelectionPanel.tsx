import { useId, useState, type FormEvent } from 'react';
import { seededRandom, selectRoulette, selectTournament } from './ga/selection.ts';
import type { Goal, SelectionMethod } from './ga/scoring.ts';

type Candidate = { chromosome: string; score: number; fitness: number };

interface Props {
  population: readonly Candidate[];
  goal: Goal;
  method: SelectionMethod;
  onMethodChange: (method: SelectionMethod) => void;
  onInspect: (index: number) => void;
}

const formatDraw = (value: number) => value.toFixed(6);

export function SelectionPanel({ population, goal, method, onMethodChange, onInspect }: Props) {
  const id = useId();
  const [seed, setSeed] = useState(42);
  const [active, setActive] = useState(0);
  const draw = seededRandom(seed);
  const roulette = method === 'roulette' ? selectRoulette(population, draw) : null;
  const tournament = method === 'tournament' ? selectTournament(population, goal, draw) : null;
  const winner = (roulette?.picks ?? tournament)?.[active]?.winner;
  const roll = roulette?.picks[active]?.roll;

  function applySeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('seed');
    setSeed(Number(value));
    setActive(0);
  }

  function inspect(parent: number, index: number) {
    setActive(parent);
    onInspect(index);
  }

  return <section className="selection" aria-labelledby={`${id}-title`}>
    <div className="selection-heading">
      <div><span className="eyebrow">Parent selection</span><h3 id={`${id}-title`}>Build the mating pool</h3></div>
      <label className="selection-method">Method
        <select value={method} onChange={event => {
          onMethodChange(event.target.value === 'roulette' ? 'roulette' : 'tournament');
          setActive(0);
        }}>
          <option value="roulette">Roulette wheel</option>
          <option value="tournament">Binary tournament</option>
        </select>
      </label>
    </div>
    <p>{roulette
      ? 'Each fitness score gets a share of the wheel. The first nonempty slice that reaches the draw supplies one parent.'
      : `Two candidates are drawn with replacement. The ${goal === 'minimize' ? 'lower' : 'higher'} objective score wins. A tie keeps the first draw.`}</p>
    <form className="seed-form" onSubmit={applySeed}>
      <label htmlFor={`${id}-seed`}>Random seed</label>
      <input id={`${id}-seed`} name="seed" type="number" defaultValue={seed} min={0} max={4294967295} step={1} required />
      <button type="submit">Apply seed</button>
    </form>
    <p className="selection-note">Seed {seed} repeats the same draws. Select a parent row to inspect its source chromosome.</p>
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
        <code>{pick.chromosome}</code>
      </button>)}
    </div>
  </section>;
}
