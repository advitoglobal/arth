export function proposeFromTaps(
  rows: { payload?: { tool?: string; values?: Record<string, unknown> } | null }[],
) {
  const lastSlot = [...rows].reverse().find((r) => r.payload?.tool === "testdrive");
  const slot = lastSlot?.payload?.values?.slot as string | undefined;
  if (slot) {
    return {
      dispositionKey: "interested_continuing",
      revisitAt: slot.slice(0, 10),
      reason: "from the slot you opened",
      stageKey: "meeting",
    };
  }
  const lastEmi = [...rows].reverse().find((r) => r.payload?.tool === "emi");
  if (lastEmi) {
    return {
      dispositionKey: "interested_continuing",
      revisitAt: undefined as string | undefined,
      reason: "from the EMI tool you opened",
      stageKey: "quotation",
    };
  }
  return null;
}
