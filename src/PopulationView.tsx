import { useEffect, useRef } from 'react';
import { formatCoordinates, formatNumber } from './display.ts';
import type { Problem, evaluateChromosome } from './ga/scoring.ts';

type Candidate = ReturnType<typeof evaluateChromosome>;

interface Props {
  problem: Problem;
  population: readonly Candidate[];
  selected: number;
  onInspect: (index: number) => void;
}

function markerLabel(candidate: Candidate, index: number) {
  return `Inspect slot ${index + 1}, chromosome ${candidate.chromosome}, value ${formatCoordinates(candidate.values)}`;
}

function Heatmap({ problem, population, selected, onInspect }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [x, y] = problem.variables;
  const width = Math.min(2 ** x.bits, 64);
  const height = Math.min(2 ** y.bits, 64);

  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    const scores = Array.from({ length: width * height }, (_, index) => {
      const xRatio = (index % width) / (width - 1);
      const yRatio = 1 - Math.floor(index / width) / (height - 1);
      return problem.objective([x.min + xRatio * (x.max - x.min), y.min + yRatio * (y.max - y.min)]);
    });
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const pixels = context.createImageData(width, height);
    scores.forEach((score, index) => {
      const normalized = max === min ? 0.5 : (score - min) / (max - min);
      const quality = problem.goal === 'minimize' ? 1 - normalized : normalized;
      pixels.data.set([242 - 198 * quality, 246 - 128 * quality, 242 - 135 * quality, 255], index * 4);
    });
    context.putImageData(pixels, 0, 0);
  }, [problem, x, y, width, height]);

  return <figure className="ruler coordinate-view">
    <figcaption>Objective landscape <span>Darker areas have better scores</span></figcaption>
    <div className="heatmap-frame">
      <div className="heatmap-y" aria-hidden="true"><span>{y.max}</span><strong>{y.name}</strong><span>{y.min}</span></div>
      <div className="heatmap-plane">
        <canvas ref={canvas} width={width} height={height} aria-hidden="true" />
        {population.map((candidate, index) => <button key={index} type="button" className="heatmap-point"
          aria-pressed={selected === index} aria-label={markerLabel(candidate, index)}
          onClick={() => onInspect(index)}
          style={{
            left: `${(0.5 + candidate.segments[0].position / (2 ** x.bits - 1) * (width - 1)) / width * 100}%`,
            top: `${(0.5 + (1 - candidate.segments[1].position / (2 ** y.bits - 1)) * (height - 1)) / height * 100}%`,
          }}><span aria-hidden="true">{index + 1}</span></button>)}
      </div>
      <div className="heatmap-x" aria-hidden="true"><span>{x.min}</span><strong>{x.name}</strong><span>{x.max}</span></div>
    </div>
    <p className="plot-caption">Select a numbered point to inspect both coordinates. Coincident points can also be selected in the population list.</p>
  </figure>;
}

export function PopulationView(props: Props) {
  const { problem, population, selected, onInspect } = props;
  if (problem.variables.length === 2) return <Heatmap {...props} />;

  return <figure className="ruler">
    <figcaption>{problem.variables.length === 1 ? 'Candidate positions' : 'Linked coordinate rulers'}
      <span>{problem.variables.length === 1 ? 'Decoded value x' : `Selected slot ${selected + 1}`}</span>
    </figcaption>
    {problem.variables.map((variable, axis) => {
      const gaps = 2 ** variable.bits - 1;
      const markCount = Math.min(8, gaps + 1);
      const ticks = Array.from({ length: markCount }, (_, index) => Math.round(index * gaps / (markCount - 1)));
      return <div className="coordinate-axis" key={variable.name}>
        {problem.variables.length > 1 && <div className="coordinate-label"><strong>{variable.name}</strong><span>{formatNumber(population[selected].values[axis])}</span></div>}
        <div className="track">
          <div className="ticks" aria-hidden="true">{ticks.map(tick => <span key={tick} style={{ left: `${tick / gaps * 100}%` }}>
            {formatNumber(variable.min + (variable.max - variable.min) * tick / gaps)}
          </span>)}</div>
          {population.map((candidate, index) => <button key={index} type="button" className="point"
            style={{ left: `${candidate.segments[axis].position / gaps * 100}%` }}
            aria-pressed={selected === index} aria-label={`${markerLabel(candidate, index)} on ${variable.name}`}
            onClick={() => onInspect(index)} />)}
        </div>
      </div>;
    })}
    {problem.variables.length > 1 && <p className="plot-caption">Each ruler shows one coordinate. Selecting a point highlights the same candidate on all rulers.</p>}
  </figure>;
}
