import { useId } from 'react';
import { describeSchema, matchesSchema, schemaStage } from './ga/schema.ts';
import type { SimulationEvent } from './ga/simulation.ts';

interface Props {
  pattern: string;
  defaultPattern: string;
  length: number;
  event: SimulationEvent;
  population: readonly string[];
  onChange: (pattern: string) => void;
}

function SchemaBits({ bits, pattern }: { bits: string; pattern: string }) {
  const match = matchesSchema(bits, pattern);
  return <span className={match ? 'schema-token is-match' : 'schema-token'}>
    <code aria-label={bits}>{Array.from(bits, (bit, index) =>
      <span key={index} className={pattern[index] === '*' ? undefined : bit === pattern[index] ? 'fixed-ok' : 'fixed-diff'}>{bit}</span>)}</code>
    <span>{match ? 'Match' : 'No match'}</span>
  </span>;
}

export function SchemaTracker({ pattern, defaultPattern, length, event, population, onChange }: Props) {
  const id = useId();
  const schema = describeSchema(pattern, length);
  const summary = schema ? schemaStage(event, population, schema.pattern) : null;

  return <section className="schema-tracker" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>Schema tracker</h3>
    <p id={`${id}-help`}>Use {length} positions. A 0 or 1 fixes a bit. A * matches either value.</p>
    <div className="schema-input">
      <label>Pattern<input type="text" value={pattern} spellCheck={false} autoComplete="off"
        aria-describedby={`${id}-help${schema ? '' : ` ${id}-error`}`}
        aria-invalid={!schema} onChange={change => onChange(change.target.value.replace(/\s/g, ''))} /></label>
      <button type="button" onClick={() => onChange(defaultPattern)}>Use example</button>
    </div>
    {!schema && <p className="schema-error" id={`${id}-error`}>Enter exactly {length} characters using only 0, 1, or *.</p>}
    {schema && summary && <>
      <dl className="schema-stats">
        <div><dt>Order</dt><dd>{schema.order} fixed bits</dd></div>
        <div><dt>Defining length</dt><dd>{schema.definingLength} gaps</dd></div>
        <div><dt>Possible strings</dt><dd>{schema.matchingStrings.toLocaleString()}</dd></div>
      </dl>
      <div className="schema-count">
        <span>{summary.caption}</span><strong>{summary.count} of {summary.total} match</strong>
      </div>
      {summary.previous && <p>Before this step: {summary.previous.count} of {summary.previous.total} match.</p>}
      <details className="schema-details">
        <summary>Inspect the matches</summary>
        {summary.entries.map(entry => <div className="schema-entry" key={entry.label}>
          <strong>{entry.label}</strong>
          {!!entry.before.length && <div className="schema-token-row"><span>Before</span>
            {entry.before.map((bits, index) => <SchemaBits bits={bits} pattern={pattern} key={index} />)}
          </div>}
          <div className="schema-token-row"><span>{entry.before.length ? 'After' : 'String'}</span>
            {entry.after.map((bits, index) => <SchemaBits bits={bits} pattern={pattern} key={index} />)}
          </div>
          {entry.note && <p>{entry.note}</p>}
        </div>)}
      </details>
    </>}
  </section>;
}
