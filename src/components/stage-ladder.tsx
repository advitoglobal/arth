import { stagesFor } from "@/domain/ladders";
import { STAGE_LABEL } from "@/lib/labels";

export function StageLadder({
  current,
  department,
}: {
  current: string;
  department?: string | null;
}) {
  const key = current === "qualified" ? "meeting" : current;
  const ladder = stagesFor(department);
  return (
    <ol className="flex flex-wrap gap-1" aria-label="Stage ladder">
      {ladder.filter((stage) => stage !== "lost").map((stage) => {
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
