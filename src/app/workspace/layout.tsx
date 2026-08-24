import type { ReactNode } from "react";
import { Suspense } from "react";
import { WorkspaceNav } from "@/components/workspace-nav";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-[var(--arth-n05)] lg:flex-row">
      <Suspense fallback={<div className="hidden w-[240px] bg-[var(--arth-ink)] lg:block" />}>
        <WorkspaceNav />
      </Suspense>
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-[1440px] px-8 py-8">{children}</div>
      </div>
    </div>
  );
}
