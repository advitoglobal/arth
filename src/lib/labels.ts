export const SOURCE_LABEL: Record<string, string> = {
  google: "Google",
  meta: "Meta",
  walk_in: "Walk-in",
  inbound_call: "Inbound call",
};

export const INTAKE_LABEL: Record<string, string> = {
  tele_push: "Filed at the desk",
  filed: "Filed at the desk",
  manager_upload: "Uploaded by manager",
  platform: "Paid lead form",
  paid_form: "Paid lead form",
  inbound: "Inbound call",
  inbound_call: "Inbound call",
  missed_inbound: "Missed inbound",
  whatsapp_inbound: "WhatsApp inbound",
  website: "Website form",
  walk_in: "Walk-in",
  referral: "Referral",
};

export const DEPARTMENT_LABEL: Record<string, string> = {
  sales: "Sales",
  service: "Service",
  insurance: "Insurance",
  used: "Used car",
  accessories: "Accessories",
};

export const STAGE_LABEL: Record<string, string> = {
  new: "New",
  assigned: "Assigned",
  contacted: "Contacted",
  appointment: "Appointment",
  arrived: "Arrived",
  in_work: "In work",
  waiting_parts: "Waiting parts",
  ready: "Ready",
  quoted: "Quoted",
  recommended: "Recommended",
  issued: "Issued",
  endorsed: "Endorsed",
  renewed: "Renewed",
  lost: "Lost",
  meeting: "Meeting",
  qualified: "Meeting",
  test_drive: "Test drive",
  quotation: "Quotation",
  negotiation: "Negotiation",
  booked: "Booked",
  delivered: "Delivered",
};

export function intakeLabel(key: string | null | undefined) {
  if (!key) return "";
  return INTAKE_LABEL[key] ?? key.replaceAll("_", " ");
}

export function sourceLabel(key: string | null | undefined) {
  if (!key) return "";
  return SOURCE_LABEL[key] ?? key;
}

export function stageLabel(key: string | null | undefined) {
  if (!key) return "";
  return STAGE_LABEL[key] ?? key.replaceAll("_", " ");
}

export function eventLabel(type: string) {
  const map: Record<string, string> = {
    assigned: "Assigned",
    clock_deferred: "Clock deferred",
    disposition: "Disposition",
    correction: "Correction",
    stage_change: "Stage moved",
    call_attempt: "Call attempt",
    created: "Filed",
    whatsapp: "WhatsApp sent",
    wrap_skip: "Wrap-up skipped",
    handoff: "Handed to sales",
    note: "What he said",
    discussed: "Discussed",
  };
  return map[type] ?? type;
}

export function actorLabel(type: string | null | undefined) {
  if (type === "SYSTEM") return "System";
  if (type === "USER") return "Seat";
  return type ?? "";
}

/** Short enquiry number used on paperwork and in Search. Last eight of the id. */
export function enquiryNo(id: string | null | undefined) {
  if (!id) return "";
  return id.replaceAll("-", "").slice(-8).toUpperCase();
}
