import { cn } from "@/lib/utils";

export function ArthMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8", className)}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" className="text-primary" />
      <path
        d="M9 23 L16 8 L23 23 M11.6 17.5 H20.4"
        fill="none"
        stroke="oklch(0.2 0.03 80)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArthWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <ArthMark />
      <span className="font-display text-xl tracking-tight">arth</span>
    </span>
  );
}
