import { FigureSource } from "@/components/figure-source";
import type { Figure } from "@/services/figures";

export function FiguresStrip({ figures }: { figures: Figure[] }) {
  if (figures.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="font-display text-[20px] font-semibold">Figures for this seat</h2>
      <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
        {figures.map((f) => (
          <li key={f.label} className="px-4 py-3">
            <p className="flex flex-wrap items-baseline justify-between gap-2">
              <span>{f.label}</span>
              <span className="font-data text-sm">{f.value}</span>
            </p>
            <FigureSource source={f.source} period={f.period} />
            {f.exclusion ? (
              <p className="mt-1 text-[12.5px] text-[var(--arth-n60)]">Exclusion: {f.exclusion}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
