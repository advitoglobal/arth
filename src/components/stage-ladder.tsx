import { stagesFor } from "@/domain/ladders";
import { STAGE_LABEL } from "@/lib/labels";

export function StageLadder({
  current,
  department,
  compact = false,
}: {
  current: string;
  department?: string | null;
  compact?: boolean;
}) {
  const key = current === "qualified" ? "meeting" : current;
  const ladder = stagesFor(department);
  return (
    <ol className={`flex flex-wrap ${compact ? "gap-px" : "gap-1"}`} aria-label="Stage ladder">
      {ladder.filter((stage) => stage !== "lost").map((stage) => {
        const on = stage === key;
        return (
          <li
            key={stage}
            className={`rounded-[3px] font-semibold uppercase tracking-[0.06em] ${
              compact
                ? "px-1 py-0.5 text-[9px]"
                : "px-2 py-1 text-[11px] tracking-[0.08em]"
            } ${
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
