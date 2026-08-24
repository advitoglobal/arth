"use client";

import { useEffect, useState } from "react";

export function OfflineBar() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (!offline) return null;
  return (
    <div className="bg-[var(--arth-ink)] px-4 py-2 text-sm text-[var(--arth-n00)]">
      Working offline. Calls you log will sync when you reconnect.
    </div>
  );
}
