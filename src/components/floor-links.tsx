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
              className={`rounded-[3px] px-3 py-2 text-sm ${
                on
                  ? "bg-[var(--arth-n90)] text-[var(--arth-n00)]"
                  : "text-[var(--arth-n20)] hover:bg-[var(--arth-n90)] hover:text-[var(--arth-n00)]"
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
            className={`text-sm ${on ? "font-semibold underline" : "underline"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
