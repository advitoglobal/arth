import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "How records are kept" };

const items = [
  {
    t: "Nothing is silently edited",
    b: "A record that can be quietly rewritten has no meaning. Changes are visible.",
  },
  {
    t: "Tenant isolation",
    b: "Every enquiry carries a tenant. Whitefield Motors cannot read another group.",
  },
  {
    t: "Overdue and Settled are not configurable",
    b: "A tenant cannot recolour a broken promise. The moment red is a preference, the record stops being evidence.",
  },
  {
    t: "Rupees, lakhs, branches",
    b: "Indian digit grouping. Branch, not rooftop. Enquiry, not lead, except in the phrase lead source.",
  },
];

export default function TrustPage() {
  return (
    <div className="flex min-h-full flex-col bg-[var(--arth-n00)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-8 py-16">
        <RuleHeading>How records are kept</RuleHeading>
        <p className="mt-4 max-w-[68ch] text-[var(--arth-n60)]">
          Arth exists to connect the money leaving a dealer&apos;s bank account
          to the car leaving the showroom, and to name who was responsible at
          every step.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {items.map((item) => (
            <div key={item.t} className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
              <span className="arth-rule" />
              <h2 className="mt-3 font-display text-[20px] font-semibold">
                {item.t}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--arth-n60)]">
                {item.b}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Button nativeButton={false} render={<Link href="/enter" />}>
            Open the product
          </Button>
        </div>
      </main>
      <footer className="border-t border-[var(--arth-n10)] px-8 py-6 text-center text-[12.5px] text-[var(--arth-n60)]">
        An Advito Global product
      </footer>
    </div>
  );
}
