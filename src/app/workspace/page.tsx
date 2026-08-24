import Link from "next/link";
import { cockpitCards } from "@/lib/arth-data";
import { inr } from "@/lib/format";
import { RuleHeading } from "@/components/brand/type";

export default function CockpitPage() {
  const ranked = [...cockpitCards].sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      <RuleHeading>The Exception Cockpit</RuleHeading>
      <p className="max-w-[68ch] text-[var(--arth-n60)]">
        Ranked by rupee value at risk. Reserved places hold a broken customer
        promise and unowned enquiries, stated as aggregates.
      </p>
      <div className="grid gap-6">
        {ranked.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="block border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6"
          >
            <span className="arth-rule" />
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="font-display text-[20px] font-semibold">
                  {card.title}
                </h2>
                <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-[var(--arth-n60)]">
                  {card.body}
                </p>
                {card.reason ? (
                  <p className="mt-2 text-[12.5px] text-[var(--arth-n60)]">
                    {card.reason}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0">
                <p className="font-display text-[28px] font-semibold tabular-nums text-[var(--arth-brass-deep)]">
                  {inr(card.amount)}
                </p>
                <p className="text-[12px] text-[var(--arth-n60)]">at risk</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
