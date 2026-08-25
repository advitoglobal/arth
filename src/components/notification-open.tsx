"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function NotificationOpen({
  id,
  href,
}: {
  id: string;
  href: string;
}) {
  const router = useRouter();
  async function open() {
    await fetch("/api/v1/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.push(href);
    router.refresh();
  }
  return (
    <Button type="button" variant="outline" size="sm" className="relative z-10 mt-2 h-9 px-3" onClick={open}>
      Open
    </Button>
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
