/** In-place confirmation. SPEC DoD 6, Pass 2 §4.3 undo sentence. */
export const CONFIRM_MS = 1500;

export const UNDO_LINE = "Undo writes a correcting entry. The original row stays.";

export const CONFIRM_ACTIONS = [
  { key: "disposition", destructive: true },
  { key: "stage", destructive: true },
  { key: "handoff", destructive: true },
  { key: "nurture", destructive: true },
  { key: "claim", destructive: true },
  { key: "whatsapp", destructive: false },
] as const;

export function rendererKeys() {
  return CONFIRM_ACTIONS.map((row) => row.key);
}

export function isDestructive(key: (typeof CONFIRM_ACTIONS)[number]["key"]) {
  return CONFIRM_ACTIONS.find((row) => row.key === key)?.destructive ?? false;
}
