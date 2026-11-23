import { useEffect, useRef } from 'react';
import type { SimulationEvent } from './ga/simulation.ts';

const labels: Record<SimulationEvent['type'], string> = {
  evaluate: 'Decode & score',
  select: 'Select parents',
  crossover: 'Crossover',
  mutate: 'Mutation',
  replace: 'Replace population',
  stop: 'Review result',
};

interface Props {
  events: readonly SimulationEvent[];
  position: number;
  onNavigate: (position: number) => void;
}

export function StageNavigation({ events, position, onNavigate }: Props) {
  const list = useRef<HTMLOListElement>(null);
  const generation = events[position].generation;
  const stages = events.map((event, index) => ({ event, index }));
  const generations = stages.filter(({ event }) => event.type === 'evaluate');

  useEffect(() => {
    const rail = list.current;
    const active = rail?.querySelector("[aria-current=step]");
    if (!rail || !active || rail.scrollWidth <= rail.clientWidth) return;
    const item = active.getBoundingClientRect();
    const frame = rail.getBoundingClientRect();
    if (item.left < frame.left) rail.scrollLeft += item.left - frame.left - 3;
    else if (item.right > frame.right) rail.scrollLeft += item.right - frame.right + 3;
  }, [position]);

  return <nav className="stage-nav" aria-labelledby="run-stages-title">
    <h2 id="run-stages-title">Run stages</h2>
    <label className="generation-picker">
      <span>View generation</span>
      <select value={generation} onChange={event => {
        const selected = generations.find(item => item.event.generation === Number(event.target.value));
        if (selected) onNavigate(selected.index);
      }}>
        {generations.map(({ event }) => <option key={event.generation} value={event.generation}>
          Generation {event.generation}
        </option>)}
      </select>
    </label>
    <ol ref={list}>
      {stages.filter(({ event }) => event.generation === generation).map(({ event, index }) => <li key={index}>
        <button type="button" aria-current={position === index ? 'step' : undefined}
          onClick={() => onNavigate(index)}><span className="stage-indicator" aria-hidden="true" />{labels[event.type]}</button>
      </li>)}
    </ol>
  </nav>;
}
