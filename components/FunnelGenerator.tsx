'use client';
import { useCallback, useState, type ReactNode } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Params, TrackingEvent, CondRow } from '@/lib/types';
import { DEFAULT_PARAMS } from '@/lib/types';
import { generateSQL } from '@/lib/sql';
import { mkId, newCond } from '@/lib/utils';
import { G_MODE_OPTIONS, OCC_MODE_OPTIONS } from '@/lib/constants';
import ConditionRow from './ConditionRow';

const inp = 'w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
const label = 'block text-xs font-medium text-slate-400 mb-1';
const sel = 'w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer';
const btn = (variant: 'primary' | 'secondary' | 'danger') => {
  const base = 'px-3 py-1.5 rounded text-xs font-medium transition-colors';
  if (variant === 'primary')   return `${base} bg-blue-600 hover:bg-blue-700 text-white`;
  if (variant === 'danger')    return `${base} bg-red-900/50 hover:bg-red-800 text-red-300 border border-red-800`;
  return `${base} bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600`;
};

function newEvent(): TrackingEvent {
  return {
    id: mkId(), name: '', tag: '',
    conds: [newCond('simple')],
    gMode: 'none', gVal: '', gCustom: '',
    occMode: 'cond', sumField: '',
  };
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function Field({ label: l, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className={label}>{l}</label>
      {children}
    </div>
  );
}

function SectionHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      {children}
    </div>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-800/60 border border-slate-700 rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FunnelGenerator() {
  const [params, setParams]   = useLocalStorage<Params>('fq:params', DEFAULT_PARAMS);
  const [events, setEvents]   = useLocalStorage<TrackingEvent[]>('fq:events', [newEvent()]);
  const [sql, setSql]         = useLocalStorage<string>('fq:sql', '');
  const [copied, setCopied]   = useState(false);
  const [sqlEdited, setSqlEdited] = useState(false);

  // ── Params ──────────────────────────────────────────────────────────────
  function setParam<K extends keyof Params>(key: K, value: Params[K]) {
    setParams(p => ({ ...p, [key]: value }));
  }

  // ── Events ──────────────────────────────────────────────────────────────
  const addEvent = () => setEvents(ev => [...ev, newEvent()]);

  const removeEvent = useCallback((id: string) => {
    setEvents(ev => ev.filter(e => e.id !== id));
  }, [setEvents]);

  const updateEvent = useCallback((id: string, key: keyof TrackingEvent, value: string | boolean) => {
    setEvents(ev => ev.map(e => e.id === id ? { ...e, [key]: value } : e));
  }, [setEvents]);

  const addCond = useCallback((eventId: string) => {
    setEvents(ev => ev.map(e =>
      e.id === eventId ? { ...e, conds: [...e.conds, newCond('simple')] } : e
    ));
  }, [setEvents]);

  const removeCond = useCallback((eventId: string, condId: string) => {
    setEvents(ev => ev.map(e =>
      e.id === eventId
        ? { ...e, conds: e.conds.filter(c => c.id !== condId) }
        : e
    ));
  }, [setEvents]);

  const updateCond = useCallback((eventId: string, condId: string, key: keyof CondRow, value: string) => {
    setEvents(ev => ev.map(e =>
      e.id === eventId
        ? { ...e, conds: e.conds.map(c => c.id === condId ? { ...c, [key]: value } : c) }
        : e
    ));
  }, [setEvents]);

  // ── Generate ────────────────────────────────────────────────────────────
  const generate = useCallback(() => {
    const q = generateSQL(params, events);
    setSql(q);
    setSqlEdited(false);
  }, [params, events, setSql]);

  const copy = useCallback(async () => {
    if (!sql) return;
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sql]);

  const gModeNeedsValue = (m: string) => ['split1_eq','split1_ne','split2_eq','split2_ne','exact'].includes(m);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-slate-900">

      {/* ── LEFT PANEL ────────────────────────────────────────────────── */}
      <div className="w-[52%] flex flex-col border-r border-slate-700">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-base font-semibold text-slate-100">Funnel Query Generator</h1>
            <p className="text-xs text-slate-500 mt-0.5">Trino SQL for experiment funnel analysis</p>
          </div>
          <button onClick={generate} className={btn('primary') + ' text-sm px-4 py-2'}>
            ⚡ Generate SQL
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* ── Global Parameters ─────────────────────────────────────── */}
          <Card>
            <SectionHeader title="Global Parameters" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Your name (replaces placeholder)">
                <input className={inp} value={params.name} onChange={e => setParam('name', e.target.value)} placeholder="e.g. alice" />
              </Field>
              <Field label="Schema">
                <input className={inp} value={params.schema} onChange={e => setParam('schema', e.target.value)} placeholder="play_crossword" />
              </Field>
              <Field label="Feature / table prefix (raw_name)">
                <input className={inp} value={params.rawName} onChange={e => setParam('rawName', e.target.value)} placeholder="e.g. streaks" />
              </Field>
              <Field label="GID">
                <input className={inp} value={params.gid} onChange={e => setParam('gid', e.target.value)} placeholder="e.g. 3" />
              </Field>
              <Field label="CLI">
                <input className={inp} value={params.cli} onChange={e => setParam('cli', e.target.value)} placeholder="e.g. 1" />
              </Field>
              <Field label="Experiment Name">
                <input className={inp} value={params.expName} onChange={e => setParam('expName', e.target.value)} placeholder="experiment_slug" />
              </Field>
              <Field label="Version">
                <input className={inp} value={params.expVer} onChange={e => setParam('expVer', e.target.value)} placeholder="e.g. v1" />
              </Field>
              <Field label="Start Date">
                <input className={inp} type="date" value={params.startDate} onChange={e => setParam('startDate', e.target.value)} />
              </Field>
              <Field label="End Date">
                <input className={inp} type="date" value={params.endDate} onChange={e => setParam('endDate', e.target.value)} />
              </Field>
              <Field label="Min Build">
                <input className={inp} value={params.minBuild} onChange={e => setParam('minBuild', e.target.value)} placeholder="e.g. 3000" />
              </Field>
              <Field label="Experiment Start Date">
                <input className={inp} type="date" value={params.expStartDate} onChange={e => setParam('expStartDate', e.target.value)} />
              </Field>
            </div>

            {/* Engagement toggle */}
            <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-3">
              <button
                role="switch"
                aria-checked={params.inclEng}
                onClick={() => setParam('inclEng', !params.inclEng)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${params.inclEng ? 'bg-blue-600' : 'bg-slate-600'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${params.inclEng ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-slate-300">Include Engagement (Clears step)</span>
            </div>

            {params.inclEng && (
              <div className="mt-3">
                <Field label="Puzzle types to exclude (comma-separated)">
                  <input
                    className={inp}
                    value={params.puzzleExclude}
                    onChange={e => setParam('puzzleExclude', e.target.value)}
                    placeholder="pc,me,mini_events"
                  />
                </Field>
              </div>
            )}
          </Card>

          {/* ── Tracking Events ───────────────────────────────────────── */}
          <div>
            <SectionHeader title={`Tracking Events (${events.length})`}>
              <button onClick={addEvent} className={btn('secondary')}>+ Add Event</button>
            </SectionHeader>

            <div className="space-y-3">
              {events.map((ev, idx) => (
                <Card key={ev.id}>
                  {/* Event header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-blue-400 bg-blue-900/30 border border-blue-800/40 rounded px-2 py-0.5">
                      Step {idx + 1 + (params.inclEng ? 2 : 1)}
                    </span>
                    <button
                      onClick={() => removeEvent(ev.id)}
                      disabled={events.length === 1}
                      className="text-slate-500 hover:text-red-400 text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Field label="Event name (table suffix + metric label)">
                      <input
                        className={inp}
                        value={ev.name}
                        onChange={e => updateEvent(ev.id, 'name', e.target.value)}
                        placeholder="e.g. cta_tap"
                      />
                    </Field>
                    <Field label="Funnel tag">
                      <input
                        className={inp}
                        value={ev.tag}
                        onChange={e => updateEvent(ev.id, 'tag', e.target.value)}
                        placeholder="e.g. common"
                      />
                    </Field>
                  </div>

                  {/* Conditions */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-400 mb-1.5">WHERE conditions</div>
                    <div className="space-y-0.5">
                      {ev.conds.map((c, ci) => (
                        <div key={c.id}>
                          {ci > 0 && <div className="text-xs text-slate-500 ml-1 py-0.5">AND</div>}
                          <ConditionRow
                            cond={c}
                            onChange={(key, val) => updateCond(ev.id, c.id, key, val)}
                            onRemove={() => removeCond(ev.id, c.id)}
                            isOnly={ev.conds.length === 1}
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addCond(ev.id)}
                      className="mt-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      + condition
                    </button>
                  </div>

                  {/* Occurrence options */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
                    <Field label="Occurrences count method">
                      <select className={sel} value={ev.occMode} onChange={e => updateEvent(ev.id, 'occMode', e.target.value)}>
                        {OCC_MODE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </Field>
                    {ev.occMode === 'sum' && (
                      <Field label="Sum field name">
                        <input
                          className={inp}
                          value={ev.sumField}
                          onChange={e => updateEvent(ev.id, 'sumField', e.target.value)}
                          placeholder="e.g. clears"
                        />
                      </Field>
                    )}

                    <Field label="Users WHERE condition (g-filter)">
                      <select className={sel} value={ev.gMode} onChange={e => updateEvent(ev.id, 'gMode', e.target.value)}>
                        {G_MODE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </Field>
                    {gModeNeedsValue(ev.gMode) && (
                      <Field label="g-filter value">
                        <input
                          className={inp}
                          value={ev.gVal}
                          onChange={e => updateEvent(ev.id, 'gVal', e.target.value)}
                          placeholder="value"
                        />
                      </Field>
                    )}
                    {ev.gMode === 'custom' && (
                      <Field label="Custom expression">
                        <input
                          className={inp}
                          value={ev.gCustom}
                          onChange={e => updateEvent(ev.id, 'gCustom', e.target.value)}
                          placeholder="o IS NOT NULL AND ..."
                        />
                      </Field>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

        </div>{/* end scrollable form */}
      </div>

      {/* ── RIGHT PANEL — SQL Output ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* SQL toolbar */}
        <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">SQL Output</span>
            {sqlEdited && (
              <span className="text-xs text-amber-400 bg-amber-900/30 border border-amber-700/40 rounded px-1.5 py-0.5">
                manually edited
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={generate} className={btn('secondary')}>
              ↺ Regenerate
            </button>
            <button onClick={copy} disabled={!sql} className={btn(sql ? 'secondary' : 'secondary') + ' disabled:opacity-40'}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* SQL textarea */}
        <div className="flex-1 relative overflow-hidden">
          {!sql ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
              <div className="text-4xl mb-4 text-slate-600">⚡</div>
              <p className="text-slate-500 text-sm max-w-xs">
                Fill in the parameters and tracking events, then click{' '}
                <span className="text-blue-400 font-medium">Generate SQL</span> to see your Trino query here.
              </p>
            </div>
          ) : (
            <textarea
              value={sql}
              onChange={e => { setSql(e.target.value); setSqlEdited(true); }}
              spellCheck={false}
              className="absolute inset-0 w-full h-full resize-none bg-slate-950 text-slate-300 text-xs font-mono p-4 focus:outline-none leading-relaxed"
            />
          )}
        </div>
      </div>

    </div>
  );
}
