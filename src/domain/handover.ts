/** Four handover ways. SPEC telecaller view 08. */

export const HANDOVER_MODES = [
  {
    key: "direct",
    label: "Direct to a named executive",
    detail: "She picks the person. Default mode.",
  },
  {
    key: "pool",
    label: "To a branch pool",
    detail: "Whole team notified once. First to reach the customer owns it.",
  },
  {
    key: "queue",
    label: "To the department queue",
    detail: "The sales manager assigns. Used when the branch is unclear, the enquiry is large, or it is a fleet case.",
  },
  {
    key: "nurture",
    label: "Keep and nurture",
    detail: "Not ready. Stays hers with a revisit date.",
  },
] as const;

export type HandoverModeKey = (typeof HANDOVER_MODES)[number]["key"];

export function handoverModeLabel(key: string) {
  return HANDOVER_MODES.find((m) => m.key === key)?.label ?? key.replaceAll("_", " ");
}

export function assignmentModesEnabled(deskMode: string): Exclude<HandoverModeKey, "nurture">[] {
  if (deskMode === "pool") return ["pool"];
  if (deskMode === "queue") return ["queue"];
  return ["direct"];
}

export function deskAssignmentMode(raw: string | null | undefined): Exclude<HandoverModeKey, "nurture"> {
  if (raw === "pool" || raw === "queue") return raw;
  return "direct";
}

export function isHandOnMode(key: string) {
  return key === "direct" || key === "pool" || key === "queue";
}

export function cardCompleteness(parts: {
  price: boolean;
  emi: boolean;
  testdrive: boolean;
  said: boolean;
}) {
  const filled = [parts.price, parts.emi, parts.testdrive, parts.said].filter(Boolean).length;
  return { filled, total: 4, percent: Math.round((filled / 4) * 100) };
}

export function rendererKeys() {
  return { modes: HANDOVER_MODES.map((m) => m.key) };
}
