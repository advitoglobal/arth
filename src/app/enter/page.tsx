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
        <RuleHeading>The telecalling floor</RuleHeading>
        <p className="mt-4 max-w-[68ch] text-[var(--arth-n60)]">
          Username and password, or the seat mobile number with a one-time code. Two tenants. Switch to prove one dealer cannot see the other.
        </p>
        <div className="mt-10 max-w-md border border-[var(--arth-n10)] p-6">
          <span className="arth-rule" />
          <h2 className="mt-3 font-display text-[20px] font-semibold">
            Telecaller
          </h2>
          <p className="mt-2 text-sm text-[var(--arth-n60)]">
            Two tenants. Switch to prove one dealer cannot see the other.
          </p>
          <Button
            className="mt-6"
            nativeButton={false}
            render={<Link href="/w/login" />}
          >
            Open Today
          </Button>
        </div>
      </main>
    </div>
  );
}
