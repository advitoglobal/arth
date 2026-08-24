"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RuleHeading } from "@/components/brand/type";

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
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-8 py-24">
      <RuleHeading>This screen did not load</RuleHeading>
      <p className="mt-3 text-[var(--arth-n60)]">
        The last saved work on this screen is still on the device. Retry.
      </p>
      <div className="mt-8">
        <Button onClick={() => reset()}>Retry</Button>
      </div>
    </div>
  );
}
