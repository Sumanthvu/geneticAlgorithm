import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { lessons, workedCheck, workedExample, workedInitial } from './ga/lessons.ts';
import { stepSize, searchSpaceSize } from './ga/encoding.ts';
import { seededRandom } from './ga/selection.ts';
import { runSimulation, type SimulationEvent } from './ga/simulation.ts';
import { SelectionPanel } from './SelectionPanel.tsx';
import { ReproductionTrace } from './ReproductionTrace.tsx';
import { RunOptions, type RunConfig } from './RunOptions.tsx';
import { ScoreHistory } from './ScoreHistory.tsx';
import './style.css';

const defaultConfig: RunConfig = {
  lesson: 0, bits: 4, size: 4, seed: 42, method: 'roulette', elitism: false,
  limit: 3, count: 'scored-populations', crossoverProbability: 0.8, mutationProbability: 0.05,
};
const stageText: Record<SimulationEvent['type'], [string, string]> = {
  evaluate: ['Decode & score', 'Read each binary chromosome as a candidate value and calculate its objective score.'],
  select: ['Select parents', 'Fill the mating pool in draw order. A candidate can be picked more than once.'],
  crossover: ['Cross the parents', 'Pair adjacent parents. A draw below the crossover rate makes the pair swap tails.'],
  mutate: ['Mutate the children', 'Check every bit separately. A draw below the mutation rate flips that bit.'],
  replace: ['Replace the population', 'The children form the next population. Elitism can carry the best old candidate forward.'],
  stop: ['Review the result', 'The run has reached its limit. Compare the final winner with the best seen across all scored populations.'],
};
const display = (value: number) => Number(value.toPrecision(7)).toString();

function Bits({ bits }: { bits: string }) {
  return <span className="bits" aria-hidden="true">{Array.from(bits, (bit, index) =>
    <span className={bit === '1' ? 'on' : ''} key={index}>{bit}</span>)}</span>;
}

function App() {
  const [config, setConfig] = useState(defaultConfig);
  const [worked, setWorked] = useState(false);
  const [selected, setSelected] = useState(0);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const active = worked ? defaultConfig : config;
  const lesson = lessons[active.lesson];
  const { problem } = lesson;
  const variable = { ...problem.variables[0], bits: active.bits };
  const spacing = stepSize(variable);
  const rangeSteps = 2 ** variable.bits - 1;
  const markCount = Math.min(8, rangeSteps + 1);
  const ticks = Array.from({ length: markCount }, (_, index) => Math.round(index * rangeSteps / (markCount - 1)));
  const scoreLabel = problem.goal === 'minimize' ? 'Penalty' : 'Score';
  const events = useMemo(() => {
    if (worked) return workedExample();
    const draw = seededRandom(config.seed);
    const initial = config.lesson === 0 && config.bits === 4 && config.size === 4
      ? workedInitial
      : Array.from({ length: config.size }, () =>
        Math.floor(draw() * 2 ** config.bits).toString(2).padStart(config.bits, '0'));
    const preset = lessons[config.lesson].problem;
    const configured = { ...preset, variables: [{ ...preset.variables[0], bits: config.bits }], selection: config.method };
    return runSimulation(configured, initial, config, draw);
  }, [config, worked]);
  const last = events.length - 1;
  const current = events[position];
  const [title, explanation] = stageText[current.type];
  const visibleEvents = events.slice(0, position + 1);
  const latestPopulation = [...visibleEvents].reverse()
    .find(event => event.type === 'evaluate' || event.type === 'replace');
  const population = latestPopulation?.population ?? [];
  const candidate = population[selected];
  const generation = current.generation + Number(current.type === 'replace');
  const check = worked ? workedCheck(current) : null;
  const threshold = current.type === 'crossover' ? active.crossoverProbability
    : current.type === 'mutate' ? active.mutationProbability : null;

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

  return <>
    <header className="masthead">
      <div className="wordmark"><span className="mark" aria-hidden="true">01</span> Genetic Algorithm Lab</div>
      <span className="edition">{worked ? 'Worked example' : 'Sandbox'}</span>
    </header>
    <main className="workspace">
      <aside className="lesson" aria-labelledby="lesson-title">
        <span className="eyebrow">Single-variable search</span>
        <h1 id="lesson-title">{problem.title}</h1>
        <p>{problem.goal === 'minimize' ? 'Find the value with the lowest penalty.' : 'Find the value with the highest score.'}</p>
        <div className="equation">f(x) = {lesson.equation}</div>
        <dl className="settings">
          <div><dt>Range</dt><dd>{variable.min} to {variable.max}</dd></div>
          <div><dt>Search space</dt><dd>{searchSpaceSize([variable]).toString()} values</dd></div>
          <div><dt>Gap size</dt><dd>{display(spacing)}</dd></div>
        </dl>
        <RunOptions config={config} worked={worked}
          onApply={value => { setConfig(value); reset(); }}
          onWorked={() => { setWorked(!worked); reset(); }} />
      </aside>
      <section className="stage" aria-labelledby="stage-title">
        <div className="stage-heading"><div><span className="eyebrow">Generation {generation}</span><h2 id="stage-title">{title}</h2></div><span className="stage-label">Step {position + 1} of {events.length}</span></div>
        <div className="transport" role="group" aria-label="Playback">
          <button type="button" className="play" disabled={position === last} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
          <button type="button" disabled={position === 0} onClick={() => seek(position - 1)}>Back</button>
          <button type="button" disabled={position === last} onClick={() => seek(position + 1)}>Step</button>
          <button type="button" onClick={reset}>Reset</button>
        </div>
        <p className="stage-explanation" aria-live={playing ? 'off' : 'polite'}>{explanation}{threshold !== null && <> Threshold {threshold}.</>}</p>
        {check && <section className="worked-check" aria-label="Hand calculation check">
          <strong>{check.expected === check.actual ? 'Matches hand calculation' : 'Check mismatch'}</strong>
          <div>{check.label}</div>
          <dl><dt>Expected</dt><dd>{check.expected}</dd><dt>Calculated</dt><dd>{check.actual}</dd></dl>
        </section>}
        {current.type === 'select' && <SelectionPanel key={position} selection={current.selection} goal={problem.goal} onInspect={setSelected} />}
        {current.type !== 'evaluate' && current.type !== 'select' && <ReproductionTrace event={current} />}
        <figure className="ruler">
          <figcaption>Candidate positions <span>Decoded value <i>x</i></span></figcaption>
          <div className="track">
            <div className="ticks" aria-hidden="true">{ticks.map(tick => <span key={tick} style={{ left: `${tick / rangeSteps * 100}%` }}>{display(variable.min + spacing * tick)}</span>)}</div>
            {population.map((item, index) => <button key={index} type="button"
              className="point" style={{ left: `${item.segments[0].position / rangeSteps * 100}%` }} aria-pressed={selected === index}
              aria-label={`Inspect slot ${index + 1}, chromosome ${item.chromosome} at x equals ${display(item.values[0])}`} onClick={() => setSelected(index)} />)}
          </div>
        </figure>
        <div className="population" aria-label={`Generation ${generation} population`}>
          <div className="row row-header" aria-hidden="true"><span>Chromosome</span><span>Value</span><span>{scoreLabel}</span></div>
          {population.map((item, index) => <button key={index} className="row candidate" type="button"
            aria-pressed={selected === index} onClick={() => setSelected(index)}>
            <span className="sr-only">{`Slot ${index + 1}, chromosome ${item.chromosome}, value ${display(item.values[0])}, ${scoreLabel.toLowerCase()} ${display(item.score)}`}</span>
            <Bits bits={item.chromosome} /><span aria-hidden="true">{display(item.values[0])}</span><span aria-hidden="true">{display(item.score)}</span>
          </button>)}
        </div>
        <ScoreHistory events={visibleEvents} goal={problem.goal} />
      </section>
      <aside className="inspector" aria-labelledby="inspect-title">
        <span className="eyebrow">Candidate inspector</span>
        <h2 id="inspect-title">Read the bits</h2>
        <div aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
          <p>Add the active place values to find how many gaps to cross from the lower bound.</p>
          <div className="weighted" aria-label={`Chromosome ${candidate.chromosome}.`}>
            <div aria-hidden="true">{Array.from({ length: variable.bits }, (_, index) => <span key={index}>{2 ** (variable.bits - index - 1)}</span>)}</div>
            <Bits bits={candidate.chromosome} />
          </div>
          <div className="readout"><span>Decoded value</span><strong>{display(candidate.values[0])}</strong></div>
          <div className="readout"><span>Objective {scoreLabel.toLowerCase()}</span><strong>{display(candidate.score)}</strong></div>
          {active.method === 'roulette' && <div className="readout"><span>Roulette fitness</span><strong>{display(candidate.fitness)}</strong></div>}
          <details><summary>Show the calculation</summary>
            <code>x = {variable.min} + {candidate.segments[0].position} × {display(spacing)} ≈ {display(candidate.values[0])}</code>
            <code>f(x) = {lesson.substitute(display(candidate.values[0]))} ≈ {display(candidate.score)}</code>
            {active.method === 'roulette' && <code>{problem.goal === 'minimize'
              ? `1 / (1 + ${display(candidate.score)}) ≈ ${display(candidate.fitness)}`
              : `f(x)${problem.objectiveFloor < 0 ? ` + ${1 - problem.objectiveFloor}` : ''} ≈ ${display(candidate.fitness)}`}</code>}
          </details>
        </div>
      </aside>
    </main>
    <footer>Genetic Algorithm Lab <span>Single-variable search</span></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
