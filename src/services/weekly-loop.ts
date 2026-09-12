import type { Tx } from "@/db/with-tenant";
import {
  LOOP_METRICS,
  REVIEW_CRITERIA,
  actionFor,
  addDays,
  causeFor,
  causeLine,
  floorPatternThreshold,
  median,
  metricLabel,
  oneThingLine,
  pickOneThing,
  remeasureLine,
  sampleReviewCount,
  weekLabel,
  weekStartIst,
  istYmd,
  type CauseKey,
  type LoopMetricKey,
} from "@/domain/weekly-loop";

export type WeekSlice = {
  start: Date;
  end: Date;
  connectAttempts: number;
  connects: number;
  connectRate: number | null;
  morningConnectRate: number | null;
  afternoonConnectRate: number | null;
  firstOnTime: number;
  firstTotal: number;
  firstResponse: number | null;
  outcomes: number;
  outcomeDays: number;
  outcomesPerDay: number | null;
  handed: number;
  converted: number;
  handoffConversion: number | null;
};

export type LoopExample = {
  leadId: string;
  name: string;
  seconds: number;
  note: string;
};

export type LoopNoteView = {
  userId: string;
  name: string;
  weekStart: string;
  weekLabel: string;
  incomplete: boolean;
  metrics: {
    key: LoopMetricKey;
    label: string;
    detail: string;
    current: number | null;
    median: number | null;
    displayCurrent: string;
    displayMedian: string;
  }[];
  oneThing: {
    key: LoopMetricKey;
    line: string;
    cause: CauseKey;
    causeLine: string;
    action: string;
    current: number;
    median: number;
  } | null;
  examples: LoopExample[];
  selfReport: string | null;
  remeasure: string | null;
  aiLine: string;
  period: string;
};

function rate(num: number, den: number) {
  if (den <= 0) return null;
  return num / den;
}

function display(key: LoopMetricKey, value: number | null) {
  if (value == null) return "Incomplete";
  if (key === "outcomes_per_day") return (Math.round(value * 10) / 10).toFixed(1);
  return `${Math.round(value * 100)}`;
}

async function assertLoopViewer(tx: Tx, viewerId: string, subjectId: string) {
  const [viewer] = await tx<{ role_key: string; branch_id: string | null }[]>`
    SELECT u.role_key, p.branch_id::text
    FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = ${viewerId}::uuid
  `;
  if (!viewer) throw new Error("This seat does not belong to this dealer.");
  if (["tele", "svctele", "instele"].includes(viewer.role_key) && viewerId !== subjectId) {
    throw new Error("A weekly note is hers and her team leader's. Not the floor's.");
  }
  if (viewer.role_key === "owner") {
    throw new Error("Individual coaching notes stay in the department. The principal sees floor outcomes.");
  }
  if (!["tele", "svctele", "instele", "lead", "mgr", "gm", "ops"].includes(viewer.role_key)) {
    throw new Error("This seat does not open the weekly loop.");
  }
  if (["lead", "mgr"].includes(viewer.role_key)) {
    const [subject] = await tx<{ branch_id: string | null; role_key: string }[]>`
      SELECT p.branch_id::text, u.role_key
      FROM users u
      LEFT JOIN positions p ON p.id = u.position_id
      WHERE u.id = ${subjectId}::uuid
    `;
    if (!subject || !["tele", "svctele", "instele"].includes(subject.role_key)) {
      throw new Error("The coaching list is telecallers on this branch.");
    }
    if (viewer.branch_id && subject.branch_id !== viewer.branch_id) {
      throw new Error("You cannot open another branch.");
    }
  }
}

async function measureWeek(tx: Tx, userId: string, start: Date, end: Date): Promise<WeekSlice> {
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const [calls] = await tx<{
    attempts: string;
    connects: string;
    morning_attempts: string;
    morning_connects: string;
    afternoon_attempts: string;
    afternoon_connects: string;
  }[]>`
    SELECT
      count(*) FILTER (WHERE event_type = 'call_attempt')::text AS attempts,
      count(*) FILTER (
        WHERE event_type = 'disposition'
          AND COALESCE((payload->>'scoring_connected')::boolean, false)
      )::text AS connects,
      count(*) FILTER (
        WHERE event_type = 'call_attempt'
          AND EXTRACT(HOUR FROM timezone('Asia/Kolkata', created_at)) < 13
      )::text AS morning_attempts,
      count(*) FILTER (
        WHERE event_type = 'disposition'
          AND COALESCE((payload->>'scoring_connected')::boolean, false)
          AND EXTRACT(HOUR FROM timezone('Asia/Kolkata', created_at)) < 13
      )::text AS morning_connects,
      count(*) FILTER (
        WHERE event_type = 'call_attempt'
          AND EXTRACT(HOUR FROM timezone('Asia/Kolkata', created_at)) >= 13
      )::text AS afternoon_attempts,
      count(*) FILTER (
        WHERE event_type = 'disposition'
          AND COALESCE((payload->>'scoring_connected')::boolean, false)
          AND EXTRACT(HOUR FROM timezone('Asia/Kolkata', created_at)) >= 13
      )::text AS afternoon_connects
    FROM lead_events
    WHERE actor_id = ${userId}::uuid
      AND created_at >= ${startIso}::timestamptz
      AND created_at < ${endIso}::timestamptz
      AND event_type IN ('call_attempt', 'disposition')
  `;
  const [first] = await tx<{ on_time: string; total: string }[]>`
    SELECT
      count(*) FILTER (WHERE l.first_responded_at <= l.first_response_due)::text AS on_time,
      count(*)::text AS total
    FROM leads l
    WHERE l.first_responded_at >= ${startIso}::timestamptz
      AND l.first_responded_at < ${endIso}::timestamptz
      AND EXISTS (
        SELECT 1 FROM lead_events e
        WHERE e.lead_id = l.id
          AND e.actor_id = ${userId}::uuid
          AND e.event_type IN ('call_attempt', 'disposition', 'assigned')
      )
  `;
  const [out] = await tx<{ n: string; days: string }[]>`
    SELECT
      count(*)::text AS n,
      count(DISTINCT (timezone('Asia/Kolkata', created_at))::date)::text AS days
    FROM lead_events
    WHERE actor_id = ${userId}::uuid
      AND event_type = 'disposition'
      AND created_at >= ${startIso}::timestamptz
      AND created_at < ${endIso}::timestamptz
  `;
  const [hand] = await tx<{ n: string; conv: string }[]>`
    SELECT
      count(*)::text AS n,
      count(*) FILTER (WHERE stage_key IN ('booked', 'delivered'))::text AS conv
    FROM leads
    WHERE handed_on_by = ${userId}::uuid
      AND handed_on_at >= ${startIso}::timestamptz
      AND handed_on_at < ${endIso}::timestamptz
  `;
  const attempts = Number(calls?.attempts ?? 0);
  const connects = Number(calls?.connects ?? 0);
  const outcomeDays = Number(out?.days ?? 0);
  const outcomes = Number(out?.n ?? 0);
  const handed = Number(hand?.n ?? 0);
  const converted = Number(hand?.conv ?? 0);
  const firstTotal = Number(first?.total ?? 0);
  return {
    start,
    end,
    connectAttempts: attempts,
    connects,
    connectRate: rate(connects, attempts),
    morningConnectRate: rate(Number(calls?.morning_connects ?? 0), Number(calls?.morning_attempts ?? 0)),
    afternoonConnectRate: rate(Number(calls?.afternoon_connects ?? 0), Number(calls?.afternoon_attempts ?? 0)),
    firstOnTime: Number(first?.on_time ?? 0),
    firstTotal,
    firstResponse: rate(Number(first?.on_time ?? 0), firstTotal),
    outcomes,
    outcomeDays,
    outcomesPerDay: rate(outcomes, outcomeDays),
    handed,
    converted,
    handoffConversion: rate(converted, handed),
  };
}

async function examplesFor(tx: Tx, userId: string, start: Date, end: Date): Promise<LoopExample[]> {
  return tx<LoopExample[]>`
    SELECT
      l.id::text AS "leadId",
      c.full_name AS name,
      COALESCE(e.call_seconds, 0) AS seconds,
      COALESCE(e.note, '') AS note
    FROM lead_events e
    JOIN leads l ON l.id = e.lead_id
    JOIN customers c ON c.id = l.customer_id
    WHERE e.actor_id = ${userId}::uuid
      AND e.event_type = 'disposition'
      AND COALESCE((e.payload->>'scoring_connected')::boolean, false)
      AND e.created_at >= ${start.toISOString()}::timestamptz
      AND e.created_at < ${end.toISOString()}::timestamptz
    ORDER BY e.call_seconds DESC NULLS LAST, e.created_at DESC
    LIMIT 2
  `;
}

function metricPack(current: WeekSlice, prior: WeekSlice[]) {
  return LOOP_METRICS.map((m) => {
    const read = (w: WeekSlice) =>
      m.key === "connect_rate"
        ? w.connectRate
        : m.key === "first_response"
          ? w.firstResponse
          : m.key === "outcomes_per_day"
            ? w.outcomesPerDay
            : w.handoffConversion;
    const history = prior.map(read).filter((v): v is number => v != null);
    return {
      key: m.key,
      label: m.label,
      detail: m.detail,
      current: read(current),
      median: median(history),
      displayCurrent: display(m.key, read(current)),
      displayMedian: display(m.key, median(history)),
    };
  });
}

export async function loadWeeklyNote(tx: Tx, viewerId: string, subjectId: string): Promise<LoopNoteView> {
  await assertLoopViewer(tx, viewerId, subjectId);
  const [person] = await tx<{ full_name: string }[]>`
    SELECT full_name FROM users WHERE id = ${subjectId}::uuid
  `;
  const start = weekStartIst();
  const weeks: WeekSlice[] = [];
  for (let i = 0; i < 5; i++) {
    const s = addDays(start, -7 * i);
    weeks.push(await measureWeek(tx, subjectId, s, addDays(s, 7)));
  }
  const current = weeks[0];
  const prior = weeks.slice(1);
  const metrics = metricPack(current, prior);
  const incomplete = metrics.some((m) => m.median == null || m.current == null);
  const picked = pickOneThing(metrics);
  const morningPct =
    current.morningConnectRate != null ? current.morningConnectRate * 100 : null;
  let oneThing: LoopNoteView["oneThing"] = null;
  if (picked) {
    if (picked.gap <= 0) {
      oneThing = {
        key: picked.key,
        line: oneThingLine(picked),
        cause: "steady",
        causeLine: causeLine("steady", {}),
        action: actionFor("steady"),
        current: picked.current,
        median: picked.median,
      };
    } else {
      const cause = causeFor(picked.key, {
        morningConnect: current.morningConnectRate,
        afternoonConnect: current.afternoonConnectRate,
      });
      oneThing = {
        key: picked.key,
        line: oneThingLine(picked),
        cause,
        causeLine: causeLine(cause, { morningConnectPct: morningPct }),
        action: actionFor(cause),
        current: picked.current,
        median: picked.median,
      };
    }
  }
  const examples = await examplesFor(tx, subjectId, current.start, current.end);
  const lastStart = addDays(start, -7);
  const [prev] = await tx<{
    metric_key: string | null;
    current_value: number | null;
  }[]>`
    SELECT metric_key, current_value
    FROM weekly_loop_notes
    WHERE user_id = ${subjectId}::uuid AND week_start = ${istYmd(lastStart)}::date
  `;
  const nowForLast =
    prev?.metric_key
      ? metrics.find((m) => m.key === prev.metric_key)?.current ?? null
      : null;
  const remeasure = prev
    ? remeasureLine({ key: prev.metric_key ?? "connect_rate", last: prev.current_value, now: nowForLast })
    : null;
  const [mine] = await tx<{ self_report: string | null }[]>`
    SELECT self_report FROM weekly_loop_notes
    WHERE user_id = ${subjectId}::uuid AND week_start = ${istYmd(start)}::date
  `;
  const weekStartDay = istYmd(start);
  await tx`
    INSERT INTO weekly_loop_notes (
      tenant_id, user_id, week_start, metric_key, current_value, median_value,
      cause_key, cause_text, action_text, one_thing_text, examples, metrics,
      self_report, remeasure_text, incomplete
    )
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${subjectId}::uuid,
      ${weekStartDay}::date,
      ${oneThing?.key ?? null},
      ${oneThing?.current ?? null},
      ${oneThing?.median ?? null},
      ${oneThing?.cause ?? null},
      ${oneThing?.causeLine ?? ""},
      ${oneThing?.action ?? ""},
      ${oneThing?.line ?? ""},
      ${tx.json(examples)},
      ${tx.json(metrics)},
      ${mine?.self_report ?? null},
      ${remeasure},
      ${incomplete}
    )
    ON CONFLICT (tenant_id, user_id, week_start) DO UPDATE SET
      metric_key = EXCLUDED.metric_key,
      current_value = EXCLUDED.current_value,
      median_value = EXCLUDED.median_value,
      cause_key = EXCLUDED.cause_key,
      cause_text = EXCLUDED.cause_text,
      action_text = EXCLUDED.action_text,
      one_thing_text = EXCLUDED.one_thing_text,
      examples = EXCLUDED.examples,
      metrics = EXCLUDED.metrics,
      remeasure_text = EXCLUDED.remeasure_text,
      incomplete = EXCLUDED.incomplete
  `;
  return {
    userId: subjectId,
    name: person?.full_name ?? "",
    weekStart: weekStartDay,
    weekLabel: weekLabel(start),
    incomplete,
    metrics,
    oneThing,
    examples,
    selfReport: mine?.self_report ?? null,
    remeasure,
    aiLine: "Coaching flags from recordings do not run until telephony is connected.",
    period: `week of ${weekLabel(start)}, against her own previous four weeks`,
  };
}

export async function saveSelfReport(tx: Tx, userId: string, text: string) {
  const [role] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${userId}::uuid
  `;
  if (!role || !["tele", "svctele", "instele"].includes(role.role_key)) {
    throw new Error("Only the telecaller writes what is getting in the way.");
  }
  const note = text.trim();
  if (note.length < 4) throw new Error("Write what is getting in the way. A few words at least.");
  await loadWeeklyNote(tx, userId, userId);
  const start = istYmd(weekStartIst());
  await tx`
    UPDATE weekly_loop_notes SET self_report = ${note}
    WHERE user_id = ${userId}::uuid AND week_start = ${start}::date
  `;
  return { recorded: "Saved on this week's note." };
}

export async function listCoaching(tx: Tx, viewerId: string) {
  const [viewer] = await tx<{ role_key: string; branch_id: string | null }[]>`
    SELECT u.role_key, p.branch_id::text
    FROM users u
    LEFT JOIN positions p ON p.id = u.position_id
    WHERE u.id = ${viewerId}::uuid
  `;
  if (!viewer || !["lead", "mgr", "gm", "ops"].includes(viewer.role_key)) {
    throw new Error("The coaching list is for the team leader and the manager.");
  }
  const teles =
    viewer.role_key === "gm" || viewer.role_key === "ops"
      ? await tx<{ id: string; full_name: string }[]>`
          SELECT u.id::text, u.full_name
          FROM users u
          WHERE u.is_active AND u.role_key = 'tele'
          ORDER BY u.full_name
        `
      : await tx<{ id: string; full_name: string }[]>`
          SELECT u.id::text, u.full_name
          FROM users u
          JOIN positions p ON p.id = u.position_id
          WHERE u.is_active
            AND u.role_key = 'tele'
            AND p.branch_id = ${viewer.branch_id}::uuid
          ORDER BY u.full_name
        `;
  const rows = [];
  for (const person of teles) {
    const note = await loadWeeklyNote(tx, viewerId, person.id);
    const gap = note.oneThing
      ? (note.oneThing.median - note.oneThing.current) / Math.max(Math.abs(note.oneThing.median), 0.01)
      : 0;
    rows.push({
      userId: person.id,
      name: person.full_name,
      metric: note.oneThing ? metricLabel(note.oneThing.key) : "No figure yet",
      line: note.oneThing?.line ?? "Incomplete. Not enough of her own weeks yet.",
      action: note.oneThing?.action ?? "",
      gap,
      incomplete: note.incomplete,
    });
  }
  rows.sort((a, b) => b.gap - a.gap);
  return rows;
}

export async function floorPattern(tx: Tx, viewerId: string) {
  const rows = await listCoaching(tx, viewerId);
  const dropped = rows.filter((r) => r.gap > 0.05 && /connect rate/i.test(r.metric));
  const need = floorPatternThreshold(rows.length);
  if (dropped.length >= need) {
    return {
      present: true,
      line: `${dropped.length} people whose connect rate fell the same week is not ${dropped.length} coaching problems. It is a data source problem, a number problem, or a script problem.`,
      names: dropped.map((d) => d.name),
    };
  }
  return {
    present: false,
    line: "No floor pattern this week. Coaching stays by person, ranked by who moved furthest from their own median.",
    names: [] as string[],
  };
}

export async function sampledDue(tx: Tx, viewerId: string) {
  const start = weekStartIst();
  const end = addDays(start, 7);
  const coaching = await listCoaching(tx, viewerId);
  const due: {
    eventId: string;
    leadId: string;
    name: string;
    revieweeId: string;
    reviewee: string;
    seconds: number;
  }[] = [];
  for (const person of coaching) {
    const [counts] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n
      FROM lead_events
      WHERE actor_id = ${person.userId}::uuid
        AND event_type = 'disposition'
        AND COALESCE((payload->>'scoring_connected')::boolean, false)
        AND created_at >= ${start.toISOString()}::timestamptz
        AND created_at < ${end.toISOString()}::timestamptz
    `;
    const want = sampleReviewCount(Number(counts?.n ?? 0));
    if (want <= 0) continue;
    const rows = await tx<{
      eventId: string;
      leadId: string;
      name: string;
      seconds: number;
    }[]>`
      SELECT e.id::text AS "eventId", l.id::text AS "leadId", c.full_name AS name, COALESCE(e.call_seconds, 0) AS seconds
      FROM lead_events e
      JOIN leads l ON l.id = e.lead_id
      JOIN customers c ON c.id = l.customer_id
      WHERE e.actor_id = ${person.userId}::uuid
        AND e.event_type = 'disposition'
        AND COALESCE((e.payload->>'scoring_connected')::boolean, false)
        AND e.created_at >= ${start.toISOString()}::timestamptz
        AND e.created_at < ${end.toISOString()}::timestamptz
        AND NOT EXISTS (
      WHERE r.event_id = e.id
        )
      ORDER BY e.created_at
      LIMIT ${want}
    `;
    for (const row of rows) {
      due.push({ ...row, revieweeId: person.userId, reviewee: person.name });
    }
  }
  return due;
}

export async function saveSampledReview(
  tx: Tx,
  input: {
    reviewerId: string;
    eventId: string;
    scores: Record<string, number>;
    note: string;
  },
) {
  const [reviewer] = await tx<{ role_key: string }[]>`
    SELECT role_key FROM users WHERE id = ${input.reviewerId}::uuid
  `;
  if (!reviewer || !["lead", "mgr", "ops"].includes(reviewer.role_key)) {
    throw new Error("Sampled call review is a team leader job.");
  }
  for (const key of REVIEW_CRITERIA.map((c) => c.key)) {
    const n = Number(input.scores[key]);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      throw new Error("Each criterion is scored from one to five.");
    }
  }
  const [ev] = await tx<{ lead_id: string; actor_id: string | null }[]>`
    SELECT lead_id::text, actor_id::text FROM lead_events WHERE id = ${input.eventId}::bigint
  `;
  if (!ev?.actor_id) throw new Error("This call is not on the book.");
  const start = istYmd(weekStartIst());
  await tx`
    INSERT INTO sampled_call_reviews (
      tenant_id, lead_id, event_id, reviewee_id, reviewer_id, week_start, scores, note
    )
    VALUES (
      current_setting('app.tenant_id')::uuid,
      ${ev.lead_id}::uuid,
      ${input.eventId}::bigint,
      ${ev.actor_id}::uuid,
      ${input.reviewerId}::uuid,
      ${start}::date,
      ${tx.json(input.scores)},
      ${input.note.trim()}
    )
  `;
  return {
    recorded:
      "Review saved. The original call stays on the ledger. Audio is not on file until telephony is connected.",
  };
}

export async function listReviewCriteria(tx: Tx) {
  return tx<{ key: string; label: string }[]>`
    SELECT key, label FROM config_review_criteria ORDER BY sort_order
  `;
}
