/**
 * Weekly loop: one metric against her own four-week median, one cause, one
 * action. Team leader ranks by who moved furthest from themselves. Principal
 * does not get a person ranking.
 */
import { withTenant } from "../src/db/with-tenant";
import { createOwnedEnquiry } from "../src/services/assignment";
import { canOpen } from "../src/lib/access";
import {
  LOOP_METRICS,
  LOOP_RULES,
  LOOP_STEPS,
  REVIEW_CRITERIA,
  addDays,
  istYmd,
  median,
  pickOneThing,
  rendererKeys,
  remeasureLine,
  weekStartIst,
} from "../src/domain/weekly-loop";
import {
  floorPattern,
  listCoaching,
  listReviewCriteria,
  loadWeeklyNote,
  saveSampledReview,
  saveSelfReport,
} from "../src/services/weekly-loop";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const NAIR = "dddddddd-dddd-dddd-dddd-ddddddddddd3";
const MENON = "dddddddd-dddd-dddd-dddd-ddddddddddd6";
const GUPTA = "dddddddd-dddd-dddd-dddd-ddddddddddd7";
const SHAH = "dddddddd-dddd-dddd-dddd-ddddddddddd8";
const RAO = "dddddddd-dddd-dddd-dddd-ddddddddddd4";

function assertBidirectional() {
  const keys = rendererKeys();
  for (const m of LOOP_METRICS) {
    if (!keys.metrics.includes(m.key)) throw new Error(`Metric ${m.key} has no renderer`);
  }
  for (const s of LOOP_STEPS) {
    if (!keys.steps.includes(s.key)) throw new Error(`Step ${s.key} has no renderer`);
  }
  for (const r of LOOP_RULES) {
    if (!keys.rules.includes(r.key)) throw new Error(`Rule ${r.key} has no renderer`);
  }
  for (const c of REVIEW_CRITERIA) {
    if (!keys.criteria.includes(c.key)) throw new Error(`Criterion ${c.key} has no renderer`);
  }
  if (pickOneThing([]) !== null) throw new Error("Empty metrics must not invent a thing");
  const one = pickOneThing([
    { key: "connect_rate", current: 0.29, median: 0.41 },
    { key: "first_response", current: 0.9, median: 0.91 },
    { key: "outcomes_per_day", current: 8, median: 8.2 },
    { key: "handoff_conversion", current: 0.2, median: 0.21 },
  ]);
  if (one?.key !== "connect_rate") throw new Error("The one thing must be the furthest from her own median");
  const med = median([0.4, 0.42, 0.41, 0.39]);
  if (med == null || Math.abs(med - 0.405) > 0.001) throw new Error("Four-week median is the middle of her own weeks");
  const line = remeasureLine({ key: "connect_rate", last: 0.29, now: 0.38 });
  if (!line.startsWith("It moved.")) throw new Error("Re-measure must say it moved, plainly");
  if (canOpen("owner", "loop") || canOpen("sales", "loop") || !canOpen("tele", "loop")) {
    throw new Error("Access list for This week is wrong");
  }
}

function istStamp(weekStart: Date, day: number, hour: number) {
  const dayStart = addDays(weekStart, day);
  const ymd = istYmd(dayStart);
  return new Date(`${ymd}T${String(hour).padStart(2, "0")}:15:00+05:30`);
}

async function seedWeek(
  tx: Parameters<typeof createOwnedEnquiry>[0],
  input: {
    userId: string;
    leadId: string;
    weekStart: Date;
    attempts: number;
    connects: number;
    afternoon?: boolean;
  },
) {
  const payload = { scoring_connected: true, duration_source: "desk_simulation" };
  for (let i = 0; i < input.attempts; i++) {
    const hour = input.afternoon ? 16 : 10;
    const at = istStamp(input.weekStart, Math.min(i, 5), hour);
    await tx`
      INSERT INTO lead_events (
        tenant_id, lead_id, event_type, actor_type, actor_id, note, payload, call_seconds, created_at
      )
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${input.leadId}::uuid,
        'call_attempt',
        'USER',
        ${input.userId}::uuid,
        'Dial started from Arth.',
        ${tx.json({ source: "loop_prove" })},
        NULL,
        ${at.toISOString()}::timestamptz
      )
    `;
  }
  for (let i = 0; i < input.connects; i++) {
    const hour = input.afternoon ? 16 : 10;
    const at = istStamp(input.weekStart, Math.min(i, 5), hour);
    await tx`
      INSERT INTO lead_events (
        tenant_id, lead_id, event_type, actor_type, actor_id, note, payload, call_seconds, created_at,
        disposition_key
      )
      VALUES (
        current_setting('app.tenant_id')::uuid,
        ${input.leadId}::uuid,
        'disposition',
        'USER',
        ${input.userId}::uuid,
        'Connected. Discussed the model.',
        ${tx.json(payload)},
        40,
        ${at.toISOString()}::timestamptz,
        'interested_continuing'
      )
    `;
  }
}

async function main() {
  assertBidirectional();

  const thisWeek = weekStartIst();
  let iyerLead = "";
  let nairLead = "";
  let sampleEvent = "";

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const rows = await listReviewCriteria(tx);
    if (rows.length !== 6) throw new Error("Sampled review must have six criteria as rows");
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Loop Proof Iyer",
      phone: `6${String(Date.now()).slice(-9)}`,
      modelInterest: "Fronx",
      variantInterest: "Delta",
      sourceKey: "google",
      sourceDetail: "prove loop",
      expectedValuePaise: 0,
    });
    iyerLead = made.leadId;
    for (let w = 1; w <= 4; w++) {
      await seedWeek(tx, {
        userId: IYER,
        leadId: made.leadId,
        weekStart: addDays(thisWeek, -7 * w),
        attempts: 10,
        connects: 4,
      });
    }
    await seedWeek(tx, {
      userId: IYER,
      leadId: made.leadId,
      weekStart: thisWeek,
      attempts: 8,
      connects: 1,
      afternoon: true,
    });
    await seedWeek(tx, {
      userId: IYER,
      leadId: made.leadId,
      weekStart: thisWeek,
      attempts: 2,
      connects: 1,
    });
    const [ev] = await tx<{ id: string }[]>`
      SELECT id::text FROM lead_events
      WHERE lead_id = ${made.leadId}::uuid
        AND actor_id = ${IYER}::uuid
        AND event_type = 'disposition'
        AND created_at >= ${thisWeek.toISOString()}::timestamptz
      ORDER BY created_at
      LIMIT 1
    `;
    sampleEvent = ev?.id ?? "";
  });

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const note = await loadWeeklyNote(tx, IYER, IYER);
    if (note.oneThing?.key !== "connect_rate") {
      throw new Error(`One thing must be connect rate, got ${note.oneThing?.key}`);
    }
    if (!note.oneThing.line.includes("fell")) throw new Error("The note must name the fall against her median");
    if (note.oneThing.action.includes("target")) throw new Error("The action must be a behaviour, not a target");
    if (note.examples.length < 1) throw new Error("Two examples come from her own connected calls");
    await saveSelfReport(tx, IYER, "Cold names after four are not picking up.");
    let peeked = false;
    try {
      await loadWeeklyNote(tx, IYER, NAIR);
      peeked = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("team leader")) throw err;
    }
    if (peeked) throw new Error("A telecaller must not open a colleague's weekly note");
  });

  await withTenant({ tenantId: WHITEFIELD, userId: NAIR }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: NAIR,
      customerName: "Loop Proof Nair",
      phone: `6${String(Date.now() + 3).slice(-9)}`,
      modelInterest: "Brezza",
      variantInterest: "Zxi",
      sourceKey: "google",
      sourceDetail: "prove loop nair",
      expectedValuePaise: 0,
    });
    nairLead = made.leadId;
    for (let w = 1; w <= 4; w++) {
      await seedWeek(tx, {
        userId: NAIR,
        leadId: made.leadId,
        weekStart: addDays(thisWeek, -7 * w),
        attempts: 10,
        connects: 5,
      });
    }
    await seedWeek(tx, {
      userId: NAIR,
      leadId: made.leadId,
      weekStart: thisWeek,
      attempts: 10,
      connects: 2,
      afternoon: true,
    });
  });

  await withTenant({ tenantId: WHITEFIELD, userId: MENON }, async (tx) => {
    const list = await listCoaching(tx, MENON);
    if (list.length < 2) throw new Error("Team leader must see the branch telecallers");
    if (list[0].gap < list[1].gap) throw new Error("Coaching list is ranked by who moved furthest from themselves");
    if (!sampleEvent) throw new Error("Need a connected call to review");
    await saveSampledReview(tx, {
      reviewerId: MENON,
      eventId: sampleEvent,
      scores: Object.fromEntries(REVIEW_CRITERIA.map((c) => [c.key, 4])),
      note: "Opening was clear. Discovery was thin.",
    });
    const [rev] = await tx<{ n: string }[]>`
      SELECT count(*)::text AS n FROM sampled_call_reviews WHERE event_id = ${sampleEvent}::bigint
    `;
    if (Number(rev?.n ?? 0) < 1) throw new Error("Sampled review must write a new row");
  });

  await withTenant({ tenantId: WHITEFIELD, userId: GUPTA }, async (tx) => {
    const pattern = await floorPattern(tx, GUPTA);
    if (!pattern.present) throw new Error("Two connect-rate falls on a two-person floor is a floor pattern");
  });

  await withTenant({ tenantId: WHITEFIELD, userId: SHAH }, async (tx) => {
    let opened = false;
    try {
      await loadWeeklyNote(tx, SHAH, IYER);
      opened = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (!message.includes("department") && !message.includes("principal")) throw err;
    }
    if (opened) throw new Error("Principal must not receive individual coaching notes");
  });

  await withTenant({ tenantId: WHITEFIELD, userId: RAO }, async (tx) => {
    let opened = false;
    try {
      await loadWeeklyNote(tx, RAO, IYER);
      opened = true;
    } catch {
      opened = false;
    }
    if (opened) throw new Error("Sales must not open the weekly loop");
  });

  if (!iyerLead || !nairLead) throw new Error("Proof enquiries missing");

  console.log(
    "WEEKLY_LOOP_OK one metric against her own median, coaching by movement, no principal ranking",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
