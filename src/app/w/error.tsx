"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RuleHeading } from "@/components/brand/type";
import { FLOOR_ERROR_NEXT } from "@/domain/refusal";

export default function FloorError({
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
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <RuleHeading>This screen did not load</RuleHeading>
      <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">{FLOOR_ERROR_NEXT}</p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Button onClick={() => reset()}>Retry</Button>
      </div>
    </div>
  );
}
