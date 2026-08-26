import { cn } from "@/lib/utils";

export function ArthWordmark({
  invert = false,
  className,
}: {
  invert?: boolean;
  className?: string;
}) {
  const fill = invert ? "var(--arth-n05)" : "var(--arth-ink)";
  const rule = invert ? "var(--arth-brass-lift)" : "var(--arth-brass)";

  return (
    <svg
      viewBox="0 0 86 36"
      role="img"
      aria-label="arth"
      className={cn("h-8 w-auto", className)}
    >
      <rect x="0" y="2" width="78" height="2.2" fill={rule} />
      <text
        x="0"
        y="30"
        fill={fill}
        fontFamily="Anek Latin, sans-serif"
        fontSize="26"
        fontWeight="600"
      >
        arth
      </text>
    </svg>
  );
}
