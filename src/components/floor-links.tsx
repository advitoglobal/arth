"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloorLinks({
  items,
  invert,
}: {
  items: { href: string; label: string }[];
  invert: boolean;
}) {
  const path = usePathname();
  return (
    <>
      {items.map((item) => {
        const on = path === item.href || path.startsWith(`${item.href}?`);
        if (invert) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-[3px] border px-3 py-2 text-sm ${
                on
                  ? "border-[var(--arth-n00)] bg-[var(--arth-n90)] text-[var(--arth-n00)]"
                  : "border-[var(--arth-n80)] text-[var(--arth-n20)] hover:bg-[var(--arth-n90)] hover:text-[var(--arth-n00)]"
              }`}
            >
              {item.label}
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-[3px] border px-3 py-1.5 text-sm ${
              on
                ? "border-[var(--arth-n00)] bg-[var(--arth-n90)] font-semibold"
                : "border-[var(--arth-n80)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
