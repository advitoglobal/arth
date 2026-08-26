"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/action-button";
import { RuleHeading } from "@/components/brand/type";

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
      <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
        The last saved work on this screen is still in the ledger. Retry, or open Today.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Button onClick={() => reset()}>Retry</Button>
        <ActionButton href="/w/dayb" variant="default">
          Open Today
        </ActionButton>
      </div>
    </div>
  );
}
