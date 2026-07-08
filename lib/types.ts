export type CondType = 'simple' | 'split' | 'custom';

export interface CondRow {
  id: string;
  type: CondType;
  // simple
  field: string;
  op: string;
  val: string;
  // split
  splitField: string;
  delim: string;
  idx: string;
  splitOp: string;
  splitVal: string;
  // custom
  expr: string;
}

export interface TrackingEvent {
  id: string;
  name: string;      // table suffix + metric label
  tag: string;       // funnel_tag
  conds: CondRow[];  // WHERE conditions for the derived table
  gMode: string;     // g-filter for funnel CASE WHEN
  gVal: string;
  gCustom: string;
  occMode: string;   // 'cond' | 'sum'
  sumField: string;
}

export interface Params {
  name: string;
  schema: string;
  rawName: string;
  gid: string;
  cli: string;
  expName: string;
  expVer: string;
  startDate: string;
  endDate: string;
  minBuild: string;
  expStartDate: string;
  inclEng: boolean;
  puzzleExclude: string;
}

export const DEFAULT_PARAMS: Params = {
  name: '',
  schema: 'play_crossword',
  rawName: '',
  gid: '',
  cli: '',
  expName: '',
  expVer: '',
  startDate: '',
  endDate: '',
  minBuild: '',
  expStartDate: '',
  inclEng: false,
  puzzleExclude: 'pc,me,mini_events',
};
