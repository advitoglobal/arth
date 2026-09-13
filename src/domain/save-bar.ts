/** Save bar at the end of a form. Unsaved bar on first edit. SPEC DoD item 5. */
export const SAVE_BAR = [
  { key: "unsaved", label: "You have unsaved changes on this screen." },
  { key: "save", label: "Save" },
  { key: "discard", label: "Discard" },
  { key: "record_outcome", label: "Record outcome" },
  { key: "save_enquiry", label: "Save lead" },
  { key: "save_lead", label: "Save lead" },
] as const;

export function rendererKeys() {
  return SAVE_BAR.map((row) => row.key);
}

export function saveBarLabel(key: (typeof SAVE_BAR)[number]["key"]) {
  return SAVE_BAR.find((row) => row.key === key)?.label ?? key;
}
