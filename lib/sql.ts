import type { Params, TrackingEvent } from './types';
import { condsToOrGroup, condsToWhere } from './utils';

function buildGCond(gMode: string, gVal: string, gCustom: string): string {
  switch (gMode) {
    case 'split1_eq': return `o IS NOT NULL AND Split(g,'@')[1] = '${gVal}'`;
    case 'split1_ne': return `o IS NOT NULL AND Split(g,'@')[1] != '${gVal}'`;
    case 'split2_eq': return `o IS NOT NULL AND Split(g,'@')[2] = '${gVal}'`;
    case 'split2_ne': return `o IS NOT NULL AND Split(g,'@')[2] != '${gVal}'`;
    case 'exact':     return `o IS NOT NULL AND g = '${gVal}'`;
    case 'custom':    return gCustom || 'o IS NOT NULL';
    default:          return 'o IS NOT NULL';
  }
}

function occExpr(ev: TrackingEvent, distinct: boolean): string {
  if (ev.occMode === 'sum') {
    const f = ev.sumField || 'clears';
    return distinct
      ? `COUNT(DISTINCT CASE WHEN ${f} > 0 THEN rid END)`
      : `SUM(${f})`;
  }
  const cond = buildGCond(ev.gMode, ev.gVal, ev.gCustom);
  return distinct
    ? `COUNT(DISTINCT CASE WHEN ${cond} THEN rid END)`
    : `COUNT(CASE WHEN ${cond} THEN rid END)`;
}

export function generateSQL(p: Params, events: TrackingEvent[]): string {
  const name = p.name        || '{NAME}';
  const sch  = p.schema      || 'play_crossword';
  const raw  = p.rawName     || 'feature';
  const rawT = `${raw}_tracking_raw`;
  const gid  = p.gid         || '{GID}';
  const cli  = p.cli         || '{CLI}';
  const sd   = p.startDate   || '{START_DATE}';
  const ed   = p.endDate     || '{END_DATE}';
  const mb   = p.minBuild    || '{MIN_BUILD}';
  const esd  = p.expStartDate || '{EXP_START_DATE}';
  const expN = p.expName     || '{EXPERIMENT_NAME}';
  const expV = p.expVer      || '{EXPERIMENT_VERSION}';

  const namedEvents = events.filter(e => e.name.trim());
  const parts: string[] = [];

  // ── 1. DAU Base ──────────────────────────────────────────────────────────
  parts.push(
`-- ============================================================
-- DAU BASE
-- ============================================================

CREATE OR REPLACE TABLE ${sch}.${name}_dau_base AS (
    SELECT *,
        CASE
            WHEN country = 'us'                THEN 'Tier 1 (US)'
            WHEN country IN ('au', 'ca', 'gb') THEN 'Tier 1 (Non US)'
            ELSE                                    'Non Tier 1'
        END AS geo,
        CASE
            WHEN build >= ${mb}
             AND install_date >= DATE('${esd}') THEN CONCAT('new user: ', CAST(build AS VARCHAR))
            ELSE 'old user'
        END AS user_type
    FROM derived_tables.dau_splits
    WHERE gid = ${gid}
      AND cli = ${cli}
      AND dau_date BETWEEN DATE('${sd}') AND DATE('${ed}')
);

CREATE OR REPLACE TABLE ${sch}.${name}_exp_base AS (
    SELECT date_field, gid, cli, rid, experiment, version, variant
    FROM experiment.users_v2
    WHERE gid = ${gid}
      AND cli = ${cli}
      AND experiment = '${expN}'
      AND version = '${expV}'
);

CREATE OR REPLACE TABLE ${sch}.${name}_dau_base_v1 AS (
    SELECT a.*, b.variant
    FROM ${sch}.${name}_dau_base a
    INNER JOIN ${sch}.${name}_exp_base b
        ON a.gid = b.gid AND a.cli = b.cli AND a.rid = b.rid
        AND a.dau_date >= b.date_field
);

CREATE OR REPLACE TABLE ${sch}.${name}_dau_base_final AS (
    SELECT * FROM ${sch}.${name}_dau_base_v1
);`
  );

  // ── 2. Engagement ────────────────────────────────────────────────────────
  if (p.inclEng) {
    const excl = p.puzzleExclude
      ? p.puzzleExclude.split(',').map(x => `'${x.trim()}'`).join(', ')
      : "'pc', 'me', 'mini_events'";
    parts.push(
`
-- ============================================================
-- ENGAGEMENT TABLE — Clears
-- ============================================================

CREATE OR REPLACE TABLE ${sch}.${name}_engagement_metrics AS (
    SELECT date_field, gid, cli, rid,
        COALESCE(SUM(CASE WHEN action_type = 'clear' THEN actions END), 0) AS clears
    FROM server_tables.engagement_puzzle_master_cc_col
    WHERE gid = ${gid}
      AND cli = ${cli}
      AND date_field BETWEEN DATE('${sd}') AND DATE('${ed}')
      AND puzzle_type NOT IN (${excl})
    GROUP BY 1, 2, 3, 4
);`
    );
  }

  // ── 3. Tracking Raw ──────────────────────────────────────────────────────
  const orGroups = namedEvents.map(e => condsToOrGroup(e.conds)).filter(Boolean);
  if (orGroups.length > 0) {
    const orBlock = namedEvents
      .map(e => {
        const g = condsToOrGroup(e.conds);
        return g ? `          ${g}  -- ${e.name}` : null;
      })
      .filter(Boolean)
      .join('\n          OR\n');

    parts.push(
`
-- ============================================================
-- TRACKING — Raw
-- ============================================================

CREATE OR REPLACE TABLE ${rawT} AS (
    SELECT *
    FROM sub_tables.tracking_slice_crossword_trino
    WHERE gid = ${gid} AND cli = ${cli}
      AND CAST(b AS INTEGER) >= ${mb}
      AND date_field BETWEEN DATE('${sd}') AND DATE('${ed}')
      AND (
${orBlock}
      )
);`
    );
  }

  // ── 4. Derived Tables ────────────────────────────────────────────────────
  if (namedEvents.length > 0) {
    const body = namedEvents.map(e =>
`
-- ${e.name}
CREATE OR REPLACE TABLE ${raw}_${e.name} AS (
    SELECT * FROM ${rawT}
    WHERE ${condsToWhere(e.conds)}
);`
    ).join('\n');

    parts.push(
`
-- ============================================================
-- DERIVED TRACKING TABLES
-- ============================================================
${body}`
    );
  }

  // ── 5. DAU Joins ─────────────────────────────────────────────────────────
  const joins: string[] = [];

  if (p.inclEng) {
    joins.push(
`
-- Engagement — Clears
CREATE OR REPLACE TABLE dau_${raw}_clears AS (
    SELECT a.*, b.clears
    FROM ${sch}.${name}_dau_base_v1 a
    LEFT JOIN ${sch}.${name}_engagement_metrics b
        ON a.gid = b.gid AND a.cli = b.cli AND a.rid = b.rid AND a.dau_date = b.date_field
);`
    );
  }

  for (const e of namedEvents) {
    joins.push(
`
CREATE OR REPLACE TABLE dau_${raw}_${e.name} AS (
    SELECT a.*, b.k, b.p, b.o, b.c, b.f, b.g, b.h, b.b, b.s, b.cc
    FROM ${sch}.${name}_dau_base_v1 a
    LEFT JOIN ${raw}_${e.name} b
        ON a.gid = CAST(b.gid AS INTEGER) AND a.cli = CAST(b.cli AS INTEGER)
        AND a.dau_date = b.date_field AND a.rid = b.rid
);`
    );
  }

  if (joins.length > 0) {
    parts.push(
`
-- ============================================================
-- DAU JOINS
-- ============================================================
${joins.join('\n')}`
    );
  }

  // ── 6. Funnel ────────────────────────────────────────────────────────────
  const selects: string[] = [];
  let stepNum = 1;

  selects.push(
`-- 01. DAU
SELECT dau_date, variant, cohort, payer_flag,
    'common' AS funnel_tag,
    '${String(stepNum++).padStart(2,'0')}. DAU' AS metric,
    COUNT(rid)          AS occurrences,
    COUNT(DISTINCT rid) AS users
FROM ${sch}.${name}_dau_base_v1
GROUP BY dau_date, variant, cohort, payer_flag`
  );

  if (p.inclEng) {
    const n = String(stepNum++).padStart(2,'0');
    selects.push(
`-- ${n}. Clears
SELECT dau_date, variant, cohort, payer_flag,
    'common' AS funnel_tag,
    '${n}. Clears' AS metric,
    SUM(clears)                                       AS occurrences,
    COUNT(DISTINCT CASE WHEN clears > 0 THEN rid END) AS users
FROM dau_${raw}_clears
GROUP BY dau_date, variant, cohort, payer_flag`
    );
  }

  for (const e of namedEvents) {
    const n = String(stepNum++).padStart(2,'0');
    selects.push(
`-- ${n}. ${e.name}
SELECT dau_date, variant, cohort, payer_flag,
    '${e.tag || 'common'}' AS funnel_tag,
    '${n}. ${e.name}' AS metric,
    ${occExpr(e, false)}          AS occurrences,
    ${occExpr(e, true)} AS users
FROM dau_${raw}_${e.name}
GROUP BY dau_date, variant, cohort, payer_flag`
    );
  }

  if (selects.length > 0) {
    parts.push(
`
-- ============================================================
-- FUNNEL
-- ============================================================

${selects.join('\n\nUNION ALL\n\n')}

ORDER BY dau_date, variant, cohort, payer_flag, funnel_tag, metric;`
    );
  }

  return parts.join('\n');
}
