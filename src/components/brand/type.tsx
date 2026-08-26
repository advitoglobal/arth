import type { ReactNode } from "react";

export function RuleHeading({
  as: Tag = "h1",
  children,
  full = false,
  className,
}: {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
  full?: boolean;
  className?: string;
}) {
  const sizes = {
    h1: "font-display text-[44px] font-semibold leading-tight tracking-tight",
    h2: "font-display text-[28px] font-semibold leading-tight",
    h3: "font-display text-[20px] font-semibold leading-tight",
  };

  return (
    <div className={className}>
      <span className={full ? "arth-rule-full" : "arth-rule"} aria-hidden />
      <Tag className={`mt-3 ${sizes[Tag]}`}>{children}</Tag>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
      {children}
    </p>
  );
}

export function StatusStamp({
  state,
}: {
  state: "overdue" | "settled" | "review" | "draft" | "parked";
}) {
  const map = {
    overdue: "bg-[var(--arth-overdue-wash)] text-[var(--arth-overdue)]",
    settled: "bg-[var(--arth-settled-wash)] text-[var(--arth-settled)]",
    review: "bg-[var(--arth-brass-wash)] text-[var(--arth-brass-pill)]",
    draft: "bg-[var(--arth-n10)] text-[var(--arth-n80)]",
    parked: "bg-[var(--arth-n10)] text-[var(--arth-n80)]",
  };
  const label = {
    overdue: "Overdue",
    settled: "Settled",
    review: "Review",
    draft: "Draft",
    parked: "Parked",
  };

  return (
    <span
      className={`inline-flex rounded-[2px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${map[state]}`}
    >
      {label[state]}
    </span>
  );
}
