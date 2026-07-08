import type { CondRow } from './types';

let _id = 0;
export function mkId(): string {
  return `${Date.now()}_${(++_id).toString(36)}`;
}

export function newCond(type: CondRow['type']): CondRow {
  return {
    id: mkId(), type,
    field: 'k', op: '=', val: '',
    splitField: 'g', delim: '@', idx: '1', splitOp: '=', splitVal: '',
    expr: '',
  };
}

export function condToSQL(c: CondRow): string {
  if (c.type === 'simple') {
    if (!c.field || c.val === '') return '';
    if (c.op === 'IN') return c.val ? `${c.field} IN (${c.val})` : '';
    return `${c.field} ${c.op} '${c.val}'`;
  }
  if (c.type === 'split') {
    if (!c.splitField || !c.splitVal) return '';
    return `Split(${c.splitField},'${c.delim}')[${c.idx}] ${c.splitOp} '${c.splitVal}'`;
  }
  return c.expr || '';
}

export function condsToOrGroup(conds: CondRow[]): string {
  const parts = conds.map(condToSQL).filter(Boolean);
  if (!parts.length) return '';
  return parts.length === 1 ? `(${parts[0]})` : `(${parts.join(' AND ')})`;
}

export function condsToWhere(conds: CondRow[]): string {
  const parts = conds.map(condToSQL).filter(Boolean);
  return parts.length ? parts.join('\n      AND ') : '1=1';
}
