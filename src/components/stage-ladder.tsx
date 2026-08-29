import { STAGE_KEYS } from "@/domain/clock";
import { STAGE_LABEL } from "@/lib/labels";

export function StageLadder({ current }: { current: string }) {
  const key = current === "qualified" ? "meeting" : current;
  return (
    <ol className="flex flex-wrap gap-1" aria-label="Stage ladder">
      {STAGE_KEYS.map((stage) => {
        const on = stage === key;
        return (
          <li
            key={stage}
            className={`rounded-[3px] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${
              on
                ? "bg-[var(--arth-ink)] text-[var(--arth-n00)]"
                : "bg-[var(--arth-n10)] text-[var(--arth-n60)]"
            }`}
          >
            {STAGE_LABEL[stage] ?? stage}
          </li>
        );
      })}
    </ol>
  );
}
