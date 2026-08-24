"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-24 text-center">
      <h1 className="font-display text-4xl">Arth could not load this view</h1>
      <p className="mt-3 text-muted-foreground">
        Retry this screen. If it continues, open director status and treat it as
        an incident.
      </p>
      <div className="mt-8 flex justify-center">
        <Button onClick={() => reset()}>Retry</Button>
      </div>
    </div>
  );
}
