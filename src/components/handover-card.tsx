import { inr } from "@/lib/format";

export function HandoverCard({
  card,
}: {
  card: {
    customerName: string;
    ownerName: string | null;
    discussedAt: Date | string | null;
    minutes: number | null;
    model: string | null;
    variant: string | null;
    lines: { tool: string; text: string; values: Record<string, unknown> }[];
    price?: boolean;
    emi?: boolean;
    testdrive?: boolean;
    exchange?: boolean;
    said?: string | null;
    completeness?: { filled: number; total: number; percent: number };
    recordingLine?: string;
  };
}) {
  const when = card.discussedAt
    ? new Date(card.discussedAt).toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
      })
    : null;
  const facts = [
    card.price ? "Price discussed" : "Price not discussed",
    card.emi ? "EMI discussed" : "EMI not discussed",
    card.testdrive ? "Test drive discussed" : "Test drive not discussed",
    card.said ? "What he said is on the card" : "What he said is missing",
  ];
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
        Handover card
      </p>
      <p className="mt-3 font-medium">
        Discussed{when ? ` ${when}` : ""}
        {card.ownerName ? ` with ${card.ownerName}` : ""}
        {card.minutes ? ` · ${card.minutes} minutes` : ""}
      </p>
      {card.completeness ? (
        <p className="mt-2 text-sm">
          Card completeness: {card.completeness.filled} of {card.completeness.total} ({card.completeness.percent}%). Measured. Conversion is not.
        </p>
      ) : null}
      <ul className="mt-3 space-y-1 text-sm">
        {facts.map((line) => (
          <li key={line}>{line}</li>
        ))}
        {card.exchange ? <li>Exchange discussed</li> : null}
      </ul>
      {card.said ? <p className="mt-3 text-sm">{card.said}</p> : null}
      {card.lines.length === 0 ? (
        <p className="mt-3 text-sm">
          Nothing has been discussed on the adviser panel yet. When a telecaller taps price, EMI, delivery or a slot, it appears here. Not a transcript. Not a summary a model wrote.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {card.lines.map((line, i) => (
            <li key={i}>
              <span className="font-semibold capitalize">{line.tool}</span>
              {" · "}
              {line.text}
              {line.values && Object.keys(line.values).length > 0
                ? ` · ${Object.entries(line.values)
                    .map(([k, v]) =>
                      typeof v === "number" && /paise/i.test(k) ? `${k} ${inr(v / 100)}` : `${k} ${String(v)}`,
                    )
                    .join(", ")}`
                : ""}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-[var(--arth-n60)]">
        {card.model} {card.variant}. This is the record of what was looked up and said.
      </p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        {card.recordingLine ?? "Recording is not on file until telephony is connected."}
      </p>
    </div>
  );
}
