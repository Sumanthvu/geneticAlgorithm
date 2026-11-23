import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { singleVariableMinimum } from './ga/problems.ts';
import { SelectionPanel } from './SelectionPanel.tsx';
import type { SelectionMethod } from './ga/scoring.ts';
import { seededRandom } from './ga/selection.ts';
import { runSimulation, type SimulationEvent } from './ga/simulation.ts';
import { ReproductionTrace } from './ReproductionTrace.tsx';
import './style.css';

const problem = singleVariableMinimum;
const [variable] = problem.variables;
const initial = ['0111', '1010', '0001', '1000'];

const stageText: Record<SimulationEvent['type'], { title: string; explanation: string }> = {
  evaluate: { title: 'Decode & score', explanation: 'Read each binary chromosome as a candidate value and calculate its penalty. The selection rule uses these results to pick parents.' },
  select: { title: 'Select parents', explanation: 'Fill the mating pool in draw order. Each draw can select a candidate that has already been picked.' },
  crossover: { title: 'Cross the parents', explanation: 'Pair adjacent parents. If their crossover draw is below 0.8, cut both at the same position and swap the tails.' },
  mutate: { title: 'Mutate the children', explanation: 'Check every bit separately. A draw below 0.05 flips that bit, creating a different candidate to try.' },
  replace: { title: 'Replace the population', explanation: 'The children become the next population. With elitism enabled, the best old candidate takes the place of the worst child.' },
  stop: { title: 'Review the result', explanation: 'The run has reached its limit. Compare the final winner with the best candidate seen across all scored populations.' },
};

function Bits({ bits }: { bits: string }) {
  return <span className="bits" aria-hidden="true">{Array.from(bits, (bit, index) =>
    <span className={bit === '1' ? 'on' : ''} key={index}>{bit}</span>)}</span>;
}

function App() {
  const [method, setMethod] = useState<SelectionMethod>(problem.selection);
  const [selected, setSelected] = useState(0);
  const [seed, setSeed] = useState(42);
  const [elitism, setElitism] = useState(false);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const events = useMemo(() => runSimulation({ ...problem, selection: method }, initial, {
    limit: 3,
    count: 'scored-populations',
    crossoverProbability: 0.8,
    mutationProbability: 0.05,
    elitism,
  }, seededRandom(seed)), [method, seed, elitism]);
  const last = events.length - 1;
  const current = events[position];
  const stage = stageText[current.type];
  const latestPopulation = events.slice(0, position + 1).reverse()
    .find(event => event.type === 'evaluate' || event.type === 'replace');
  const population = latestPopulation?.population ?? [];
  const candidate = population[selected];
  const generation = current.generation + Number(current.type === 'replace');

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setPosition(position + 1);
      if (position + 1 === last) setPlaying(false);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [playing, position, last]);

  function seek(index: number) {
    setPlaying(false);
    setPosition(index);
  }

  function reset() {
    seek(0);
    setSelected(0);
  }

  function applySeed(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSeed(Number(new FormData(event.currentTarget).get('seed')));
    reset();
  }

  return <>
    <header className="masthead">
      <div className="wordmark"><span className="mark" aria-hidden="true">01</span> Genetic Algorithm Lab</div>
      <span className="edition">Worked example</span>
    </header>
    <main className="workspace">
      <aside className="lesson" aria-labelledby="lesson-title">
        <span className="eyebrow">Single-variable search</span>
        <h1 id="lesson-title">{problem.title}</h1>
        <p>Follow a population as it searches for a value with the lowest penalty.</p>
        <div className="equation" aria-label="f of x equals x squared minus eight x plus twenty">f(x) = x² − 8x + 20</div>
        <dl className="settings">
          <div><dt>Range</dt><dd>{variable.min}–{variable.max}</dd></div>
          <div><dt>Bits per chromosome</dt><dd>{variable.bits}</dd></div>
          <div><dt>Population size</dt><dd>{population.length}</dd></div>
        </dl>
        <div className="run-options">
          <label className="selection-method">Method
            <select value={method} onChange={event => {
              setMethod(event.target.value === 'roulette' ? 'roulette' : 'tournament');
              reset();
            }}>
              <option value="roulette">Roulette wheel</option>
              <option value="tournament">Binary tournament</option>
            </select>
          </label>
          <form className="seed-form" onSubmit={applySeed}>
            <label htmlFor="seed">Random seed</label>
            <input id="seed" name="seed" type="number" defaultValue={seed} min={0} max={4294967295} step={1} required />
            <button type="submit">Apply seed</button>
          </form>
          <label className="elitism-control"><input type="checkbox" checked={elitism} onChange={event => {
            setElitism(event.target.checked);
            reset();
          }} /> Enable elitism</label>
        </div>
      </aside>
      <section className="stage" aria-labelledby="stage-title">
        <div className="stage-heading"><div><span className="eyebrow">Generation {generation}</span><h2 id="stage-title">{stage.title}</h2></div><span className="stage-label">Step {position + 1} of {events.length}</span></div>
        <div className="transport" role="group" aria-label="Playback">
          <button type="button" className="play" disabled={position === last} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
          <button type="button" disabled={position === 0} onClick={() => seek(position - 1)}>Back</button>
          <button type="button" disabled={position === last} onClick={() => seek(position + 1)}>Step</button>
          <button type="button" onClick={reset}>Reset</button>
        </div>
        <p className="stage-explanation" aria-live={playing ? 'off' : 'polite'}>{stage.explanation}</p>
        {current.type === 'select' && <SelectionPanel key={position} selection={current.selection} goal={problem.goal} onInspect={setSelected} />}
        {current.type !== 'evaluate' && current.type !== 'select' && <ReproductionTrace event={current} />}
        <figure className="ruler">
          <figcaption>Candidate positions <span>Decoded value <i>x</i></span></figcaption>
          <div className="track">
            <div className="ticks" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <span key={index}>{index}</span>)}</div>
            {population.map((item, index) => <button key={index} type="button"
              className="point" style={{ left: `${(item.values[0] - variable.min) / (variable.max - variable.min) * 100}%` }} aria-pressed={selected === index}
              aria-label={`Inspect chromosome ${item.chromosome} at x equals ${item.values[0]}`} onClick={() => setSelected(index)} />)}
          </div>
        </figure>
        <div className="population" aria-label={`Generation ${generation} population`}>
          <div className="row row-header" aria-hidden="true"><span>Chromosome</span><span>Value</span><span>Penalty</span></div>
          {population.map((item, index) => <button key={index} className="row candidate" type="button"
            aria-pressed={selected === index} onClick={() => setSelected(index)}>
            <span className="sr-only">{`Chromosome ${item.chromosome}, value ${item.values[0]}, penalty ${item.score}`}</span>
            <Bits bits={item.chromosome} /><span aria-hidden="true">{item.values[0]}</span><span aria-hidden="true">{item.score}</span>
          </button>)}
        </div>
      </section>
      <aside className="inspector" aria-labelledby="inspect-title">
        <span className="eyebrow">Candidate inspector</span>
        <h2 id="inspect-title">Read the bits</h2>
        <div aria-live="polite" aria-atomic="true">
          <p>Each <strong>1</strong> turns on its place value. Add the active places to read this chromosome.</p>
          <div className="weighted" aria-label={`Bit weights 8, 4, 2, 1. Chromosome ${candidate.chromosome}.`}>
            <div aria-hidden="true"><span>8</span><span>4</span><span>2</span><span>1</span></div>
            <Bits bits={candidate.chromosome} />
          </div>
          <div className="readout"><span>Decoded value</span><strong>{candidate.values[0]}</strong></div>
          <div className="readout"><span>Objective penalty</span><strong>{candidate.score}</strong></div>
          {method === "roulette" && <div className="readout"><span>Roulette fitness</span><strong>{candidate.fitness.toFixed(4)}</strong></div>}
          <details><summary>Show the calculation</summary><code>{candidate.values[0]}² − 8 × {candidate.values[0]} + 20 = {candidate.score}</code>{method === "roulette" && <code>1 / (1 + {candidate.score}) ≈ {candidate.fitness.toFixed(4)}</code>}</details>
        </div>
      </aside>
    </main>
    <footer>Genetic Algorithm Lab <span>Single-variable minimization</span></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
