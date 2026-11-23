import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { configureLesson, lessonBenchmarks, lessons, workedCheck, workedExample, workedInitial } from './ga/lessons.ts';
import { stepSize, searchSpaceSize } from './ga/encoding.ts';
import { seededRandom } from './ga/selection.ts';
import { runSimulation, type SimulationEvent } from './ga/simulation.ts';
import { SelectionPanel } from './SelectionPanel.tsx';
import { ReproductionTrace } from './ReproductionTrace.tsx';
import { RunOptions, type RunConfig } from './RunOptions.tsx';
import { PopulationView } from './PopulationView.tsx';
import { formatNumber as display, formatCoordinates } from './display.ts';
import { SchemaTracker } from './SchemaTracker.tsx';
import { describeSchema, matchesSchema } from './ga/schema.ts';
import { SchemaExperiment } from './SchemaExperiment.tsx';
import { ElitismComparison } from './ElitismComparison.tsx';
import { ScoreHistory } from './ScoreHistory.tsx';
import './style.css';

const defaultConfig: RunConfig = {
  lesson: 0, bits: [4], bounds: [{ min: 0, max: 15 }], size: 4, seed: 42, method: 'roulette', elitism: false,
  limit: 3, count: 'scored-populations', crossoverProbability: 0.8, mutationProbability: 0.05,
};
const exampleSchema = (length: number) => "01".slice(0, length).padEnd(length, "*");

const stageText: Record<SimulationEvent['type'], [string, string]> = {
  evaluate: ['Decode & score', 'Decode each chromosome and calculate one objective score for its complete set of values.'],
  select: ['Select parents', 'Fill the mating pool in draw order. A candidate can be picked more than once.'],
  crossover: ['Cross the parents', 'Pair adjacent parents. A draw below the crossover rate makes the pair swap tails.'],
  mutate: ['Mutate the children', 'Check every bit separately. A draw below the mutation rate flips that bit.'],
  replace: ['Replace the population', 'The children form the next population. Elitism can carry the best old candidate forward.'],
  stop: ['Review the result', 'The run has reached its limit. Compare the final winner with the best seen across all scored populations.'],
};

function Bits({ bits }: { bits: string }) {
  return <span className="bits" aria-hidden="true">{Array.from(bits, (bit, index) =>
    <span className={bit === '1' ? 'on' : ''} key={index}>{bit}</span>)}</span>;
}

function App() {
  const [config, setConfig] = useState(defaultConfig);
  const [worked, setWorked] = useState(false);
  const [pattern, setPattern] = useState(() => exampleSchema(4));
  const [selected, setSelected] = useState(0);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const active = worked ? defaultConfig : config;
  const lesson = lessons[active.lesson];
  const problem = useMemo(() => configureLesson(lesson, lesson.problem.variables.map((variable, index) => ({
    ...variable, ...active.bounds[index], bits: active.bits[index],
  })), active.method), [lesson, active]);
  const { variables } = problem;
  const chromosomeLength = variables.reduce((sum, variable) => sum + variable.bits, 0);
  const tracked = describeSchema(pattern, chromosomeLength)?.pattern;
  const multivariable = variables.length > 1;
  const scoreLabel = problem.goal === 'minimize' ? 'Penalty' : 'Score';
  const events = useMemo(() => {
    if (worked) return workedExample();
    const draw = seededRandom(config.seed);
    const initial = config.lesson === 0 && config.bits[0] === 4 && config.size === 4 && config.bounds[0].min === 0 && config.bounds[0].max === 15
      ? workedInitial
      : Array.from({ length: config.size }, () => variables.map(({ bits }) =>
        Math.floor(draw() * 2 ** bits).toString(2).padStart(bits, '0')).join(''));
    return runSimulation(problem, initial, config, draw);
  }, [config, worked, problem, variables]);
  const last = events.length - 1;
  const current = events[position];
  const [title, explanation] = stageText[current.type];
  const visibleEvents = events.slice(0, position + 1);
  const latestPopulation = [...visibleEvents].reverse()
    .find(event => event.type === 'evaluate' || event.type === 'replace');
  const population = latestPopulation?.population ?? [];
  const candidate = population[selected];
  const scoredSource = visibleEvents.filter(event => event.type === 'evaluate').at(-1);
  const initialScore = events[0].type === 'evaluate' ? events[0] : null;
  const experimentKey = JSON.stringify(active) + (worked ? '-worked' : '-sandbox');
  const generation = current.generation + Number(current.type === 'replace');
  const check = worked ? workedCheck(current) : null;
  const benchmark = current.type === "stop" ? lessonBenchmarks(lesson, problem) : null;
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

  function resetForLength(bits: readonly number[]) {
    const length = bits.reduce((sum, size) => sum + size, 0);
    if (length !== chromosomeLength) setPattern(exampleSchema(length));
    reset();
  }

  return <>
    <a className="skip-link" href="#playback">Skip to playback</a>
    <header className="masthead">
      <div className="wordmark"><span className="mark" aria-hidden="true">01</span> Genetic Algorithm Lab</div>
      <span className="edition">{worked ? 'Worked example' : 'Sandbox'}</span>
    </header>
    <main className="workspace">
      <aside className="lesson" aria-labelledby="lesson-title">
        <span className="eyebrow">{variables.length} {multivariable ? "variables" : "variable"}</span>
        <h1 id="lesson-title">{problem.title}</h1>
        <p>{problem.goal === 'minimize' ? 'Find the candidate with the lowest penalty.' : 'Find the candidate with the highest score.'}</p>
        <div className="equation">f({variables.map(variable => variable.name).join(", ")}) = {lesson.equation}</div>
        <dl className="settings">
          {variables.map(variable => <div key={variable.name}><dt>{variable.name} range</dt><dd>{variable.min} to {variable.max}</dd></div>)}
          <div><dt>Search space</dt><dd>{searchSpaceSize(variables).toString()} {multivariable ? "candidates" : "values"}</dd></div>
        </dl>
        <RunOptions config={config} worked={worked}
          onApply={value => { setConfig(value); resetForLength(value.bits); }}
          onWorked={() => { setWorked(!worked); resetForLength(worked ? config.bits : defaultConfig.bits); }} />
      </aside>
      <section className="stage" aria-labelledby="stage-title">
        <div className="stage-heading"><div><span className="eyebrow">Generation {generation}</span><h2 id="stage-title" aria-live={playing ? "off" : "polite"}>{title}</h2></div><span className="stage-label">Step {position + 1} of {events.length}</span></div>
        <div id="playback" className="transport" role="group" aria-label="Playback" tabIndex={-1} onKeyDown={event => {
          if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
          if (event.key === "ArrowLeft") seek(Math.max(0, position - 1));
          else if (event.key === "ArrowRight") seek(Math.min(last, position + 1));
          else if (event.key === "Home") reset();
          else return;
          event.preventDefault();
        }}>
          <button type="button" className="play" disabled={position === last} onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Play'}</button>
          <button type="button" disabled={position === 0} aria-keyshortcuts="ArrowLeft" onClick={() => seek(position - 1)}>Back</button>
          <button type="button" disabled={position === last} aria-keyshortcuts="ArrowRight" onClick={() => seek(position + 1)}>Step</button>
          <button type="button" aria-keyshortcuts="Home" onClick={reset}>Reset</button>
        </div>
        <p className="stage-explanation" aria-live={playing ? 'off' : 'polite'}>{explanation}{threshold !== null && <> Threshold {threshold}.</>}</p>
        {check && <section className="worked-check" aria-label="Hand calculation check">
          <strong>{check.expected === check.actual ? 'Matches hand calculation' : 'Check mismatch'}</strong>
          <div>{check.label}</div>
          <dl><dt>Expected</dt><dd>{check.expected}</dd><dt>Calculated</dt><dd>{check.actual}</dd></dl>
        </section>}
        {current.type === 'select' && <SelectionPanel key={position} selection={current.selection} goal={problem.goal} variables={variables} schema={tracked} onInspect={setSelected} />}
        {current.type !== 'evaluate' && current.type !== 'select' && <ReproductionTrace event={current} variables={variables} />}
        {benchmark && <section className="benchmark" aria-labelledby="benchmark-title">
          <h3 id="benchmark-title">Compare with the optimum</h3>
          <dl>
            <div className="readout"><dt>Best representable on the grid</dt><dd>{formatCoordinates(benchmark.grid.values)} · score {display(benchmark.grid.score)}</dd></div>
            <div className="readout"><dt>Best possible within the bounds</dt><dd>{formatCoordinates(benchmark.continuous.values)} · score {display(benchmark.continuous.score)}</dd></div>
          </dl>
          <p>The grid can only use values allowed by the bit lengths. The mathematical optimum can use any value within the bounds. When grid points tie, one is shown.</p>
        </section>}
        <PopulationView problem={problem} population={population} selected={selected} onInspect={setSelected} />
        <div className="population" aria-label={`Generation ${generation} population`}>
          <div className="row row-header" aria-hidden="true"><span>Chromosome</span><span>{multivariable ? "Coordinates" : "Value"}</span><span>{scoreLabel}</span></div>
          {population.map((item, index) => {
            const matched = tracked !== undefined && matchesSchema(item.chromosome, tracked);
            return <button key={index} className={matched ? "row candidate schema-match" : "row candidate"} type="button"
            aria-pressed={selected === index} onClick={() => setSelected(index)}>
            <span className="sr-only">{`Slot ${index + 1}, chromosome ${item.chromosome}, value ${formatCoordinates(item.values)}, ${scoreLabel.toLowerCase()} ${display(item.score)}`}</span>
            <span className="chromosome-cell"><span className="chromosome-strip" aria-hidden="true">{item.segments.map(segment => <Bits bits={segment.bits} key={segment.variable.name} />)}</span>{matched && <span className="match-label">Schema match</span>}</span><span aria-hidden="true">{formatCoordinates(item.values)}</span><span aria-hidden="true">{display(item.score)}</span>
            </button>;
          })}
        </div>
        <SchemaTracker pattern={pattern} defaultPattern={exampleSchema(chromosomeLength)} length={chromosomeLength}
          event={current} population={population.map(item => item.chromosome)} onChange={setPattern} />
        {tracked && scoredSource && <section className="experiment-panel" aria-label="Schema experiment">
          <SchemaExperiment key={experimentKey + scoredSource.generation + tracked} problem={problem}
            population={scoredSource.population.map(item => item.chromosome)} generation={scoredSource.generation}
            pattern={tracked} settings={active} seed={active.seed} />
        </section>}
        <ScoreHistory events={visibleEvents} goal={problem.goal} />
        {!worked && initialScore && <ElitismComparison key={experimentKey} problem={problem}
          initial={initialScore.population.map(item => item.chromosome)} settings={active} seed={active.seed} />}
      </section>
      <aside className="inspector" aria-labelledby="inspect-title">
        <span className="eyebrow">Candidate inspector</span>
        <h2 id="inspect-title">Read the bits</h2>
        <div aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
          <p>Read each segment on its own ruler. The full candidate gets one objective score.</p>
          {candidate.segments.map(segment => <div className="segment-inspector" key={segment.variable.name}>
            <div className="readout"><span>{segment.variable.name} decoded value</span><strong>{display(segment.value)}</strong></div>
            <div className="weighted" aria-label={segment.variable.name + " bits " + segment.bits}>
              <div aria-hidden="true">{Array.from({ length: segment.bits.length }, (_, index) => <span key={index}>{2 ** (segment.bits.length - index - 1)}</span>)}</div>
              <Bits bits={segment.bits} />
            </div>
            <span className="segment-spacing">D = {segment.position} · Gap {display(stepSize(segment.variable))} · Half-gap {display(segment.step / 2)}</span>
          </div>)}
          <div className="readout"><span>Objective {scoreLabel.toLowerCase()}</span><strong>{display(candidate.score)}</strong></div>
          {active.method === 'roulette' && <div className="readout"><span>Roulette fitness</span><strong>{display(candidate.fitness)}</strong></div>}
          <details><summary>Show the calculation</summary>
            {candidate.segments.map(segment => <code key={segment.variable.name}>{segment.variable.name} = {segment.variable.min} + {segment.position} × {display(segment.step)} ≈ {display(segment.value)}</code>)}
            <code>f({candidate.values.map(display).join(", ")}) = {lesson.substitute(...candidate.values.map(display))} ≈ {display(candidate.score)}</code>
            {active.method === 'roulette' && <code>{problem.goal === 'minimize'
              ? `1 / (1 + ${display(candidate.score)}) ≈ ${display(candidate.fitness)}`
              : `f(x)${problem.objectiveFloor < 0 ? ` + ${1 - problem.objectiveFloor}` : ''} ≈ ${display(candidate.fitness)}`}</code>}
          </details>
        </div>
      </aside>
    </main>
    <footer>Genetic Algorithm Lab <span>{multivariable ? "Multivariable search" : "Single-variable search"}</span></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
