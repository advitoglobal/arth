import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-24">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.22em] text-primary">
              अर्थ · meaning, value, result
            </p>
            <h1 className="font-display text-4xl leading-[1.1] tracking-tight text-balance sm:text-6xl">
              Clients should hold the gavel. Delivery should bring proof.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Arth is the operating system for global programmes. Outcomes,
              workstreams, and decisions live in one tenant-scoped workspace so
              sponsors can move the work — not wait for a weekly pack.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/enter" />}
              >
                Enter the workspace
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href="/trust" />}
              >
                How we secure it
              </Button>
            </div>
          </div>
          <Card className="self-start">
            <CardHeader>
              <CardTitle className="font-display text-2xl">
                This week at Meridian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-muted-foreground">Cycle time</span>
                <span>6.4 days · was 18</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-muted-foreground">Value booked</span>
                <span>$4.8m of $7.2m</span>
              </div>
              <div className="flex justify-between gap-4 border-b border-border pb-3">
                <span className="text-muted-foreground">Decisions waiting</span>
                <span>3 · client-owned</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Regions live</span>
                <span>AMER · EMEA · APAC</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3">
            {[
              {
                title: "Outcomes first",
                body: "Every programme is scored on results the client named — cycle time, value, control, completion — not activity.",
              },
              {
                title: "Decisions in the open",
                body: "The queue is explicit: what to approve, what it unlocks, and what stalls if it sits.",
              },
              {
                title: "Global, tenant-tight",
                body: "AMER, EMEA, and APAC in one workspace. Isolation is a product rule, not a slide in a security appendix.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h2 className="font-display text-2xl">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-border px-4 py-8 text-center text-xs text-muted-foreground">
        Arth · built for clients who intend to run the programme
      </footer>
    </div>
  );
}
