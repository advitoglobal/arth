"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NotificationCard({
  id,
  href,
  title,
  why,
  read,
}: {
  id: string;
  href: string | null;
  title: string;
  why: string;
  read: boolean;
}) {
  const router = useRouter();
  async function open() {
    if (!href) return;
    await fetch("/api/v1/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.push(href);
    router.refresh();
  }
  return (
    <li className="relative border-b border-[var(--arth-n10)] px-4 py-3">
      {href ? (
        <button
          type="button"
          className="absolute inset-0 z-0 cursor-pointer"
          onClick={open}
          aria-label={`Open ${title}`}
        />
      ) : null}
      <p className="font-medium">{title}</p>
      <p className="text-sm text-[var(--arth-n60)]">{why}</p>
      <p className="mt-1 text-[12.5px] text-[var(--arth-n60)]">
        {read ? "Read" : "Unread"}
      </p>
    </li>
  );
}

export function MarkAllRead() {
  const router = useRouter();
  async function mark() {
    await fetch("/api/v1/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    router.refresh();
  }
  return (
    <Button type="button" variant="outline" className="h-9" onClick={mark}>
      Mark all read
    </Button>
  );
}
