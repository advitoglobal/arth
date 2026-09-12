"use client";

import { Button } from "@/components/ui/button";
import { UNDO_LINE } from "@/domain/confirm";

export function InPlaceConfirm({
  line,
  next,
  onUndo,
}: {
  line: string;
  next?: string;
  onUndo?: () => void;
}) {
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <p className="font-medium">{line}</p>
      <p className="mt-2 text-sm text-[var(--arth-n60)]">
        {onUndo ? UNDO_LINE : "This action is on the ledger. It cannot be pulled back."}
        {next ? ` ${next}` : ""}
      </p>
      {onUndo ? (
        <Button className="mt-4" variant="outline" type="button" onClick={onUndo}>
          Undo
        </Button>
      ) : null}
    </div>
  );
}
