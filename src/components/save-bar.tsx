"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { saveBarLabel } from "@/domain/save-bar";

export function SaveBar({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--arth-n10)] pt-3.5">
      {children}
      {hint ? <p className="text-[12.5px] text-[var(--arth-n60)]">{hint}</p> : null}
    </div>
  );
}

export function UnsavedBar({
  show,
  onSave,
  onDiscard,
  saveDisabled = false,
  saveLabel,
}: {
  show: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
}) {
  if (!show) return null;
  return (
    <div
      className="fixed bottom-5 left-4 z-[399] flex max-w-[calc(100%-2rem)] flex-wrap items-center gap-3 rounded-[3px] border border-[var(--arth-brass-lift)] bg-[var(--arth-brass-wash)] px-4 py-2.5 text-sm text-[var(--arth-brass-pill)] lg:left-[256px]"
      role="status"
    >
      <span>{saveBarLabel("unsaved")}</span>
      <Button type="button" className="h-11" disabled={saveDisabled} onClick={onSave}>
        {saveLabel ?? saveBarLabel("save")}
      </Button>
      <Button type="button" variant="ghost" className="h-11" onClick={onDiscard}>
        {saveBarLabel("discard")}
      </Button>
    </div>
  );
}
