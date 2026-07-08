export const FIELD_OPTIONS = ['k', 'p', 'c', 'o', 'f', 'g', 'h', 's'];

export const OP_OPTIONS = ['=', '!=', 'IN'];
export const SPLIT_OP_OPTIONS = ['=', '!='];

export const DELIM_OPTIONS = [
  { value: '@', label: "'@'" },
  { value: '_', label: "'_'" },
  { value: '-', label: "'-'" },
  { value: '/', label: "'/'" },
  { value: '|', label: "'|'" },
];

export const IDX_OPTIONS = ['1', '2', '3', '4'];

export const G_MODE_OPTIONS = [
  { value: 'none',      label: 'o IS NOT NULL' },
  { value: 'split1_eq', label: "Split(g,'@')[1] =" },
  { value: 'split1_ne', label: "Split(g,'@')[1] !=" },
  { value: 'split2_eq', label: "Split(g,'@')[2] =" },
  { value: 'split2_ne', label: "Split(g,'@')[2] !=" },
  { value: 'exact',     label: 'g = value' },
  { value: 'custom',    label: 'Custom expression' },
];

export const OCC_MODE_OPTIONS = [
  { value: 'cond', label: 'COUNT (o IS NOT NULL)' },
  { value: 'sum',  label: 'SUM(field) / engagement' },
];
