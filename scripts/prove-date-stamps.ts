/**
 * Enquiry record dates name the event that produced them. Never a bare clock.
 */
import { withTenant } from "../src/db/with-tenant";
import { getLead } from "../src/services/telecalling";
import {
  DATE_STAMP_KEYS,
  enquiryDateStamps,
  isBareDate,
  rendererKeys,
  withEvent,
} from "../src/domain/date-stamp";
import { istDateTime } from "../src/lib/format";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const ANITA = "ffffffff-ffff-ffff-ffff-fffffffffff6";
const RAMESH = "ffffffff-ffff-ffff-ffff-fffffffffff1";

function assertBidirectional() {
  const keys = rendererKeys();
  for (const row of DATE_STAMP_KEYS) {
    if (!keys.includes(row.key)) throw new Error(`Stamp ${row.key} has no renderer`);
  }
  const at = new Date("2026-08-24T04:30:00.000Z");
  const line = withEvent("Filed", at);
  if (isBareDate(line)) throw new Error("withEvent must not return a bare date");
  if (line === istDateTime(at)) throw new Error("The stamp must name the event, not only the time");
  if (!line.startsWith("Filed · ")) throw new Error("Filed stamp must lead with the event");
  const missing = withEvent("Assigned", null);
  if (missing !== "Assigned · not recorded") throw new Error("Missing dates must say not recorded");
}

async function main() {
  assertBidirectional();

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const anita = await getLead(tx, ANITA);
    if (!anita.lead) throw new Error("Anita Desai must be visible to Iyer");
    const stamps = enquiryDateStamps({
      createdAt: anita.lead.created_at as Date,
      assignedAt: anita.lead.assigned_at as Date | null,
      firstResponseDue: anita.lead.first_response_due as Date | null,
      firstRespondedAt: anita.lead.first_responded_at as Date | null,
      nextActionAt: anita.lead.next_action_at as Date | null,
      events: anita.events as Parameters<typeof enquiryDateStamps>[0]["events"],
    });
    for (const [name, line] of Object.entries(stamps)) {
      if (isBareDate(line)) throw new Error(`${name} is a bare date: ${line}`);
    }
    if (!stamps.arrived.startsWith("Filed · ")) {
      throw new Error(`Anita arrived must be Filed, got ${stamps.arrived}`);
    }
    if (!stamps.callBy.includes("Clock deferred") || !stamps.callBy.includes("branch")) {
      throw new Error(`Anita call-by must name the deferred clock on the branch, got ${stamps.callBy}`);
    }

    const ramesh = await getLead(tx, RAMESH);
    if (!ramesh.lead) throw new Error("Ramesh Kumar must be on Iyer’s book");
    const rk = enquiryDateStamps({
      createdAt: ramesh.lead.created_at as Date,
      assignedAt: ramesh.lead.assigned_at as Date | null,
      firstResponseDue: ramesh.lead.first_response_due as Date | null,
      firstRespondedAt: ramesh.lead.first_responded_at as Date | null,
      nextActionAt: ramesh.lead.next_action_at as Date | null,
      events: ramesh.events as Parameters<typeof enquiryDateStamps>[0]["events"],
    });
    for (const [name, line] of Object.entries(rk)) {
      if (isBareDate(line)) throw new Error(`Ramesh ${name} is a bare date: ${line}`);
    }
    if (rk.firstCall.includes("not recorded") && ramesh.events.some((e) => e.event_type === "disposition")) {
      throw new Error("A logged outcome must stamp first call with that event’s time");
    }
  });

  console.log("DATE_STAMPS_OK event named on every rec date, Anita delay on the branch");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
