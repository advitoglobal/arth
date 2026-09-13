/**
 * Desk qualify corrections: list stage tag, arthscore, one-save add enquiry,
 * qualify into a department without Meeting-as-floor when the desk sends it.
 */
import { withTenant } from "../src/db/with-tenant";
import { createOwnedEnquiry } from "../src/services/assignment";
import { qualifyLead } from "../src/services/floor-register";
import { arthscoreFromLead } from "../src/domain/arthscore";
import { captureReady } from "../src/domain/add-enquiry";
import { bookDepartmentForLane, isQualifyLane } from "../src/domain/qualify";
import { saveBarLabel } from "../src/domain/save-bar";

const WHITEFIELD = "11111111-1111-1111-1111-111111111111";
const IYER = "dddddddd-dddd-dddd-dddd-ddddddddddd1";

async function main() {
  if (saveBarLabel("save_lead") !== "Save lead") {
    throw new Error("Save lead label drifted");
  }
  if (!captureReady({ phone: "9845011122", name: "Test", model: "Swift", source: "google", department: "sales" })) {
    throw new Error("Sales capture must accept ten digits plus model");
  }
  if (!captureReady({ phone: "9845011122", name: "Test", model: "", source: "google", department: "service" })) {
    throw new Error("Service capture must not require a model");
  }
  if (arthscoreFromLead({ stage_key: "contacted", lost_at: null }) < 40) {
    throw new Error("Contacted arthscore too low");
  }
  if (arthscoreFromLead({ stage_key: "new", lost_at: new Date() }) !== 8) {
    throw new Error("Lost arthscore must be 8");
  }
  if (!isQualifyLane("driving_school") || bookDepartmentForLane("driving_school") !== "sales") {
    throw new Error("Driving school rides the sales book");
  }

  await withTenant({ tenantId: WHITEFIELD, userId: IYER }, async (tx) => {
    const phone = `98450${String(Date.now()).slice(-5)}`.slice(0, 10);
    const created = await createOwnedEnquiry(tx, {
      userId: IYER,
      customerName: "Qualify Desk",
      phone,
      modelInterest: "Swift",
      variantInterest: "Zxi",
      sourceKey: "inbound_call",
      sourceDetail: "desk qualify prove",
      expectedValuePaise: 0,
      departmentKey: "sales",
    });
    const sent = await qualifyLead(tx, {
      leadId: created.leadId,
      userId: IYER,
      lane: "sales",
      note: "Willing. Information collected.",
      send: true,
      testdrivePrefDate: "2026-09-20",
    });
    if (!sent.sent) throw new Error("Qualify must send when asked");
    const [lead] = await tx<{ stage_key: string; department_key: string; handed_on_at: Date | null }[]>`
      SELECT stage_key, department_key, handed_on_at FROM leads WHERE id = ${created.leadId}::uuid
    `;
    if (lead?.stage_key !== "meeting") throw new Error("Qualify sales must land on Meeting");
    if (!lead?.handed_on_at) throw new Error("Qualify send must hand on");
  });

  console.log("DESK_QUALIFY_OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
