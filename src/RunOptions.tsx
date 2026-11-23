import { useState, type FormEvent } from 'react';
import { lessons } from './ga/lessons.ts';
import type { SelectionMethod } from './ga/scoring.ts';
import type { RunSettings } from './ga/simulation.ts';

export interface RunConfig extends RunSettings {
  lesson: number;
  bits: number;
  size: number;
  seed: number;
  method: SelectionMethod;
}

interface Props {
  config: RunConfig;
  worked: boolean;
  onApply: (config: RunConfig) => void;
  onWorked: () => void;
}

export function RunOptions({ config, worked, onApply, onWorked }: Props) {
  const [draft, setDraft] = useState(config);
  const update = (patch: Partial<RunConfig>) => setDraft(value => ({ ...value, ...patch }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply(draft);
  }

  return <div className="run-options">
    <button type="button" className="verify-button" aria-pressed={worked} onClick={onWorked}>
      {worked ? 'Return to sandbox' : 'Load worked example'}
    </button>
    {worked ? <p className="selection-note">Lecture Example 1, first round. The cut positions and flips are fixed for verification.</p> :
      <form className="run-options-form" onSubmit={submit}>
        <label>Problem<select value={draft.lesson} onChange={event => {
          const lesson = Number(event.target.value);
          update({ lesson, method: lessons[lesson].problem.selection });
        }}>
          {lessons.map((lesson, index) => <option key={lesson.problem.id} value={index}>{lesson.problem.title}</option>)}
        </select></label>
        <label>Selection<select value={draft.method} onChange={event => update({ method: event.target.value === 'roulette' ? 'roulette' : 'tournament' })}>
          <option value="roulette">Roulette wheel</option><option value="tournament">Binary tournament</option>
        </select></label>
        <div className="number-fields">
          <label>Bits<input type="number" min="1" max="10" step="1" required value={Number.isNaN(draft.bits) ? "" : draft.bits} onChange={event => update({ bits: event.target.valueAsNumber })} /></label>
          <label>Population<input type="number" min="2" max="20" step="1" required value={Number.isNaN(draft.size) ? "" : draft.size} onChange={event => update({ size: event.target.valueAsNumber })} /></label>
          <label>Crossover<input type="number" min="0" max="1" step="any" required value={Number.isNaN(draft.crossoverProbability) ? "" : draft.crossoverProbability} onChange={event => update({ crossoverProbability: event.target.valueAsNumber })} /></label>
          <label>Mutation<input type="number" min="0" max="1" step="any" required value={Number.isNaN(draft.mutationProbability) ? "" : draft.mutationProbability} onChange={event => update({ mutationProbability: event.target.valueAsNumber })} /></label>
        </div>
        <label>Stop after<select value={draft.count} onChange={event => update({
          count: event.target.value === 'reproduction-rounds' ? 'reproduction-rounds' : 'scored-populations',
          limit: Math.max(1, draft.limit),
        })}>
          <option value="scored-populations">Scored populations</option>
          <option value="reproduction-rounds">Reproduction rounds</option>
        </select></label>
        <div className="number-fields">
          <label>Limit<input type="number" min={draft.count === 'reproduction-rounds' ? 0 : 1} max="30" step="1" required value={Number.isNaN(draft.limit) ? "" : draft.limit} onChange={event => update({ limit: event.target.valueAsNumber })} /></label>
          <label>Random seed<input type="number" min="0" max="4294967295" step="1" required value={Number.isNaN(draft.seed) ? "" : draft.seed} onChange={event => update({ seed: event.target.valueAsNumber })} /></label>
        </div>
        <label className="elitism-control"><input type="checkbox" checked={draft.elitism} onChange={event => update({ elitism: event.target.checked })} /> Enable elitism</label>
        <button type="submit" className="apply-run">Apply settings</button>
      </form>}
  </div>;
}
