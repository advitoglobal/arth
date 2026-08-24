"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <button type="button" className="text-sm underline" onClick={open}>
      Open
    </button>
  );
}

export function NotificationLinkFallback({ href }: { href: string }) {
  return (
    <Link className="text-sm underline" href={href}>
      Open
    </Link>
  );
}
