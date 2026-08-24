import { Suspense } from "react";
import { WorkspaceNav } from "@/components/workspace-nav";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <Suspense fallback={<div className="hidden w-64 lg:block" />}>
        <WorkspaceNav />
      </Suspense>
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">{children}</div>
      </div>
    </div>
  );
}
