'use client';
import type { CondRow } from '@/lib/types';
import { FIELD_OPTIONS, OP_OPTIONS, SPLIT_OP_OPTIONS, DELIM_OPTIONS, IDX_OPTIONS } from '@/lib/constants';

const sel = 'bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer';
const inp = 'bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500';
const pill = (active: boolean) =>
  `px-2 py-0.5 rounded text-xs font-medium border cursor-pointer transition-colors ${
    active
      ? 'bg-blue-600 border-blue-500 text-white'
      : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300'
  }`;

interface Props {
  cond: CondRow;
  onChange: (key: keyof CondRow, value: string) => void;
  onRemove: () => void;
  isOnly: boolean;
}

export default function ConditionRow({ cond, onChange, onRemove, isOnly }: Props) {
  return (
    <div className="flex items-center flex-wrap gap-1.5 py-1">
      {/* Type pills */}
      <button className={pill(cond.type === 'simple')} onClick={() => onChange('type', 'simple')}>field</button>
      <button className={pill(cond.type === 'split')}  onClick={() => onChange('type', 'split')}>Split()</button>
      <button className={pill(cond.type === 'custom')} onClick={() => onChange('type', 'custom')}>custom</button>

      <div className="w-px h-4 bg-slate-600 mx-0.5" />

      {cond.type === 'simple' && (
        <>
          <select className={sel} value={cond.field} onChange={e => onChange('field', e.target.value)}>
            {FIELD_OPTIONS.map(f => <option key={f}>{f}</option>)}
          </select>
          <select className={sel} value={cond.op} onChange={e => onChange('op', e.target.value)}>
            {OP_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <input
            className={`${inp} w-28`}
            value={cond.val}
            onChange={e => onChange('val', e.target.value)}
            placeholder={cond.op === 'IN' ? "'a','b','c'" : 'value'}
          />
        </>
      )}

      {cond.type === 'split' && (
        <>
          <span className="text-slate-500 text-xs font-mono">Split(</span>
          <select className={sel} value={cond.splitField} onChange={e => onChange('splitField', e.target.value)}>
            {FIELD_OPTIONS.map(f => <option key={f}>{f}</option>)}
          </select>
          <span className="text-slate-500 text-xs font-mono">,</span>
          <select className={sel} value={cond.delim} onChange={e => onChange('delim', e.target.value)}>
            {DELIM_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <span className="text-slate-500 text-xs font-mono">)[</span>
          <select className={sel} value={cond.idx} onChange={e => onChange('idx', e.target.value)}>
            {IDX_OPTIONS.map(i => <option key={i}>{i}</option>)}
          </select>
          <span className="text-slate-500 text-xs font-mono">]</span>
          <select className={sel} value={cond.splitOp} onChange={e => onChange('splitOp', e.target.value)}>
            {SPLIT_OP_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <input
            className={`${inp} w-24`}
            value={cond.splitVal}
            onChange={e => onChange('splitVal', e.target.value)}
            placeholder="value"
          />
        </>
      )}

      {cond.type === 'custom' && (
        <input
          className={`${inp} flex-1 min-w-48`}
          value={cond.expr}
          onChange={e => onChange('expr', e.target.value)}
          placeholder="e.g. f IN ('B0','B1')  or  cc IS NOT NULL"
        />
      )}

      <button
        onClick={onRemove}
        disabled={isOnly}
        className="text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed text-xs px-1 transition-colors"
        title="Remove condition"
      >
        ✕
      </button>
    </div>
  );
}
