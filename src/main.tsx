import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { singleVariableMinimum } from './ga/problems.ts';
import { SelectionPanel } from './SelectionPanel.tsx';
import type { SelectionMethod } from './ga/scoring.ts';
import { evaluateChromosome } from './ga/scoring.ts';
import './style.css';

const problem = singleVariableMinimum;
const [variable] = problem.variables;
const population = ['0111', '1010', '0001', '1000']
  .map(chromosome => evaluateChromosome(chromosome, problem))
  .map(candidate => ({ ...candidate, bits: candidate.chromosome, value: candidate.values[0] }));

function Bits({ bits }: { bits: string }) {
  return <span className="bits" aria-hidden="true">{Array.from(bits, (bit, index) =>
    <span className={bit === '1' ? 'on' : ''} key={index}>{bit}</span>)}</span>;
}

function App() {
  const [method, setMethod] = useState<SelectionMethod>(problem.selection);
  const [selected, setSelected] = useState(0);
  const candidate = population[selected];

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
      </aside>
      <section className="stage" aria-labelledby="stage-title">
        <div className="stage-heading"><div><span className="eyebrow">Generation 1</span><h2 id="stage-title">Decode &amp; score</h2></div><span className="stage-label">Starting population</span></div>
        <figure className="ruler">
          <figcaption>Candidate positions <span>Decoded value <i>x</i></span></figcaption>
          <div className="track">
            <div className="ticks" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <span key={index}>{index}</span>)}</div>
            {population.map((item, index) => <button key={item.bits} type="button"
              className="point" style={{ left: `${(item.value - variable.min) / (variable.max - variable.min) * 100}%` }} aria-pressed={selected === index}
              aria-label={`Inspect chromosome ${item.bits} at x equals ${item.value}`} onClick={() => setSelected(index)} />)}
          </div>
        </figure>
        <div className="population" aria-label="Starting population">
          <div className="row row-header" aria-hidden="true"><span>Chromosome</span><span>Value</span><span>Penalty</span></div>
          {population.map((item, index) => <button key={item.bits} className="row candidate" type="button"
            aria-pressed={selected === index} onClick={() => setSelected(index)}>
            <span className="sr-only">{`Chromosome ${item.bits}, value ${item.value}, penalty ${item.score}`}</span>
            <Bits bits={item.bits} /><span aria-hidden="true">{item.value}</span><span aria-hidden="true">{item.score}</span>
          </button>)}
        </div>
        <SelectionPanel population={population} problem={problem} method={method} onMethodChange={setMethod} onInspect={setSelected} />
      </section>
      <aside className="inspector" aria-labelledby="inspect-title">
        <span className="eyebrow">Candidate inspector</span>
        <h2 id="inspect-title">Read the bits</h2>
        <div aria-live="polite" aria-atomic="true">
          <p>Each <strong>1</strong> turns on its place value. Add the active places to read this chromosome.</p>
          <div className="weighted" aria-label={`Bit weights 8, 4, 2, 1. Chromosome ${candidate.bits}.`}>
            <div aria-hidden="true"><span>8</span><span>4</span><span>2</span><span>1</span></div>
            <Bits bits={candidate.bits} />
          </div>
          <div className="readout"><span>Decoded value</span><strong>{candidate.value}</strong></div>
          <div className="readout"><span>Objective penalty</span><strong>{candidate.score}</strong></div>
          {method === "roulette" && <div className="readout"><span>Roulette fitness</span><strong>{candidate.fitness.toFixed(4)}</strong></div>}
          <details><summary>Show the calculation</summary><code>{candidate.value}² − 8 × {candidate.value} + 20 = {candidate.score}</code>{method === "roulette" && <code>1 / (1 + {candidate.score}) ≈ {candidate.fitness.toFixed(4)}</code>}</details>
        </div>
      </aside>
    </main>
    <footer>Genetic Algorithm Lab <span>Single-variable minimization</span></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
