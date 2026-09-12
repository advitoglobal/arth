/**
 * My enquiries filters stay inside the four walls. Parked is derived.
 * A telecaller cannot name another owner and widen the book.
 */
import { withTenant } from "../src/db/with-tenant";
import { createOwnedEnquiry } from "../src/services/assignment";
import { listPipeline } from "../src/services/telecalling";
import { canOpen } from "../src/lib/access";
import { SOURCE_LABEL } from "../src/lib/labels";
import { PIPE_SOURCE_KEYS, rendererKeys } from "../src/domain/pipeline-filters";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";
const NAIR = "dddddddd-dddd-dddd-dddd-ddddddddddd3";
const GUPTA = "dddddddd-dddd-dddd-dddd-ddddddddddd7";
const PINTO = "dddddddd-dddd-dddd-dddd-ddddddddddd2";
const COASTAL = "22222222-2222-2222-2222-222222222222";

function assertBidirectional() {
  const keys = rendererKeys();
  for (const key of PIPE_SOURCE_KEYS) {
    if (!SOURCE_LABEL[key]) throw new Error(`Source ${key} has no label`);
    if (!keys.sources.includes(key)) throw new Error(`Source ${key} has no filter renderer`);
  }
  for (const key of keys.sources) {
    if (!PIPE_SOURCE_KEYS.includes(key as (typeof PIPE_SOURCE_KEYS)[number])) {
      throw new Error(`Filter renderer ${key} is not a source key`);
    }
  }
  if (!canOpen("tele", "pipe") || canOpen("acct", "pipe")) {
    throw new Error("Access list for My enquiries is wrong");
  }
}

async function main() {
  assertBidirectional();

  const google = await withTenant({ tenantId: WHITEFIELD, userId: IYER }, (tx) =>
    listPipeline(tx, IYER, { source: "google" }),
  );
  if (!google.rows.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Source google should include Ramesh Kumar");
  }
  if (google.rows.some((r) => r.source_key !== "google")) {
    throw new Error("Source google must not return another source");
  }

  const stamp = String(Date.now()).slice(-8);
  let parkedId = "";
  let nairId = "";

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Pipe Parked",
      phone: `98${stamp}`,
      modelInterest: "Brezza",
      variantInterest: "Zxi",
      sourceKey: "walk_in",
      sourceDetail: "prove pipe parked",
      expectedValuePaise: 0,
    });
    parkedId = made.leadId;
    await tx`
      UPDATE leads
      SET last_disposition_key = 'postponed',
          last_revisit_at = now() + interval '3 days'
      WHERE id = ${made.leadId}::uuid
    `;
  });

  await withTenant({ tenantId: WHITEFIELD, userId: NAIR }, async (tx) => {
    const made = await createOwnedEnquiry(tx, {
      userId: NAIR,
      customerName: "Pipe Nair Only",
      phone: `97${stamp}`,
      modelInterest: "Fronx",
      variantInterest: "Delta",
      sourceKey: "meta",
      sourceDetail: "prove pipe wall",
      expectedValuePaise: 0,
    });
    nairId = made.leadId;
  });

  const parked = await withTenant({ tenantId: WHITEFIELD, userId: IYER }, (tx) =>
    listPipeline(tx, IYER, { parked: "yes" }),
  );
  if (!parked.rows.some((r) => String(r.id) === parkedId)) {
    throw new Error("Parked filter should include the postponed enquiry");
  }
  if (parked.rows.some((r) => String(r.id) === nairId)) {
    throw new Error("Parked filter must not show another telecaller’s enquiry");
  }

  const stolen = await withTenant({ tenantId: WHITEFIELD, userId: IYER }, (tx) =>
    listPipeline(tx, IYER, { owner: NAIR }),
  );
  if (stolen.rows.length !== 0) {
    throw new Error("A telecaller cannot filter to another owner");
  }
  if (stolen.total !== 0) {
    throw new Error("Stage counts must also refuse another owner");
  }

  const desk = await withTenant({ tenantId: WHITEFIELD, userId: GUPTA }, (tx) =>
    listPipeline(tx, GUPTA, { owner: NAIR }),
  );
  if (!desk.rows.some((r) => String(r.id) === nairId)) {
    throw new Error("Digital desk can filter to a telecaller at this branch");
  }
  if (desk.rows.some((r) => String(r.id) === parkedId)) {
    throw new Error("Owner filter must not include another person’s parked name");
  }
  if (!desk.owners.some((o) => o.id === IYER) || !desk.owners.some((o) => o.id === NAIR)) {
    throw new Error("Assigned person list should name people on this branch book");
  }

  const coastal = await withTenant({ tenantId: COASTAL, userId: PINTO }, (tx) =>
    listPipeline(tx, PINTO, { source: "google" }),
  );
  if (coastal.rows.some((r) => r.customer_name === "Ramesh Kumar")) {
    throw new Error("Coastal must not see Whitefield enquiries");
  }

  console.log("PIPE_FILTERS_OK source, parked, owner wall, tenant bound");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
