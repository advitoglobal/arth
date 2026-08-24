import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Enter" };

export default function EnterPage() {
  return (
    <div className="flex min-h-full flex-col bg-[var(--arth-n00)]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-8 py-16">
        <RuleHeading>Enter Whitefield Motors</RuleHeading>
        <p className="mt-4 max-w-[68ch] text-[var(--arth-n60)]">
          Demo access. Production will use the tenant&apos;s identity, not this
          screen. Choose the day you are here for.
        </p>
        <div className="mt-10 grid max-w-3xl gap-4 md:grid-cols-2">
          <div className="border border-[var(--arth-n10)] p-6">
            <span className="arth-rule" />
            <h2 className="mt-3 font-display text-[20px] font-semibold">
              Dealer principal
            </h2>
            <p className="mt-2 text-sm text-[var(--arth-n60)]">
              Ninety seconds. The Exception Cockpit ranks what needs a decision,
              by rupee value.
            </p>
            <Button
              className="mt-6"
              nativeButton={false}
              render={<Link href="/workspace?role=principal" />}
            >
              Open The Exception Cockpit
            </Button>
          </div>
          <div className="border border-[var(--arth-n10)] p-6">
            <span className="arth-rule" />
            <h2 className="mt-3 font-display text-[20px] font-semibold">
              Telecaller
            </h2>
            <p className="mt-2 text-sm text-[var(--arth-n60)]">
              Nine hours. The day panel and the queue. What is due, what
              carried, who owns it.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              nativeButton={false}
              render={<Link href="/workspace/queue?role=telecaller" />}
            >
              Open my queue
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
