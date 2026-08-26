import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { RuleHeading } from "@/components/brand/type";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-[var(--arth-n00)]">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-[1440px] px-8 py-16 lg:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
            arth for auto retail
          </p>
          <RuleHeading className="mt-6 max-w-[68ch] [&_h1]:text-[28px] sm:[&_h1]:text-[44px]">
            Other systems tell you your telecaller made forty calls. Arth tells you which of those calls came from a source costing ₹9,200 a booking.
          </RuleHeading>
          <p className="mt-6 max-w-[68ch] text-base leading-relaxed text-[var(--arth-n60)]">
            This preview is the telecalling floor for Indian dealer groups. Not the full 80-screen product. You can hold a person to an enquiry: owner, clock, disposition, ledger. Walk it, then send what should change.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-11 px-4"
              nativeButton={false}
              render={<Link href="/w/login" />}
            >
              Open the product
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 px-4"
              nativeButton={false}
              render={<Link href="/trust" />}
            >
              How records are kept
            </Button>
          </div>
        </section>

        <section className="border-t border-[var(--arth-n10)] bg-[var(--arth-ink)] text-[var(--arth-n00)]">
          <div className="mx-auto max-w-[1440px] px-8 py-16">
            <span className="arth-rule" />
            <p className="mt-6 max-w-[40ch] font-display text-[28px] font-semibold leading-snug">
              Forty calls is activity. One delivered car is arth.
            </p>
            <p className="mt-4 max-w-[68ch] text-sm leading-relaxed text-[var(--arth-n40)]">
              Meaning, and wealth. Enquiry data in a dealership has always had
              both and delivered neither. Arth records who did the work, and
              will not flatter anyone.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1440px] gap-8 px-8 py-16 md:grid-cols-3">
          {[
            {
              t: "Evidence, not assertion",
              b: "Every claim carries its number, its source and its date.",
            },
            {
              t: "Silence when nothing is wrong",
              b: "Colour is spent only where money is at stake.",
            },
            {
              t: "A bound ledger",
              b: "Rules and edges. Nothing that looks like it could be swiped away.",
            },
          ].map((item) => (
            <div key={item.t}>
              <span className="arth-rule" />
              <h2 className="mt-3 font-display text-[20px] font-semibold">
                {item.t}
              </h2>
              <p className="mt-2 max-w-[68ch] text-sm text-[var(--arth-n60)]">
                {item.b}
              </p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t border-[var(--arth-n10)] px-8 py-6 text-center text-[12.5px] text-[var(--arth-n60)]">
        An Advito Global product
      </footer>
    </div>
  );
}
