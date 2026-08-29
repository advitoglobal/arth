import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { asPlatform, canOpen, currentSeat } from "@/db/session";
import { withPlatformDealer } from "@/db/with-tenant";
import { getPlatformDealer, logPlatformAction } from "@/services/platform";
import { controlSnapshot } from "@/services/control";
import { loadPerformance } from "@/services/performance";
import { PerformancePanel } from "@/components/performance-panel";
import { searchEnquiries } from "@/services/telecalling";
import { PlaceForm } from "@/components/place-form";
import { EnquiryList } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { Button } from "@/components/ui/button";
import { setViewTenant, clearViewTenant } from "@/lib/session-cookies";
import { enquiryNo } from "@/lib/labels";

export default async function DealerControlPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const { q } = await searchParams;
  const seat = await currentSeat();
  if (!canOpen(seat.roleKey, "adealers")) {
    return <Forbidden landing="/w/login" />;
  }

  const dealer = await asPlatform((tx) => getPlatformDealer(tx, id));
  if (!dealer) {
    return (
      <div>
        <RuleHeading>Dealer not found</RuleHeading>
        <p className="mt-3">That dealer is not on Arth, or you cannot open it.</p>
      </div>
    );
  }

  if (seat.roleKey === "adv_onboard") {
    return (
      <div className="space-y-6">
        <RuleHeading>{dealer.name}</RuleHeading>
        <p className="max-w-[68ch] text-[var(--arth-n60)]">
          Configuration only. Status {dealer.status}. You cannot see names, phones, or enquiry rows. Entering a dealer book is refused.
        </p>
      </div>
    );
  }

  async function enterDealer() {
    "use server";
    const s = await currentSeat();
    await asPlatform(async (tx) => {
      await logPlatformAction(tx, "enter_dealer", id, dealer.name);
    });
    const jar = await cookies();
    setViewTenant(jar, id);
    redirect(`/a/dealers/${id}`);
  }

  async function leaveDealer() {
    "use server";
    const jar = await cookies();
    clearViewTenant(jar);
    redirect("/a/dealers");
  }

  const snap = await withPlatformDealer(
    { platformUserId: seat.userId, tenantId: id },
    (tx) => controlSnapshot(tx),
  );
  const perf = await withPlatformDealer(
    { platformUserId: seat.userId, tenantId: id },
    (tx) => loadPerformance(tx),
  );
  const hits = q && q.trim().length >= 2
    ? await withPlatformDealer({ platformUserId: seat.userId, tenantId: id }, (tx) =>
        searchEnquiries(tx, { q }),
      )
    : [];

  return (
    <div className="space-y-8">
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
          {seat.roleLabel} · one dealer
        </p>
        <RuleHeading className="mt-3">{dealer.name}</RuleHeading>
        <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
          You are looking at this dealer only. Enquiry rows from any other dealer cannot appear here. {seat.roleKey === "adv_support" ? "You cannot onboard dealers or see Advito commercial terms." : "Onboard is a separate screen."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <form action={enterDealer}>
            <Button type="submit" className="h-11">
              Record that I entered
            </Button>
          </form>
          <form action={leaveDealer}>
            <Button type="submit" variant="outline" className="h-11">
              Leave dealer
            </Button>
          </form>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["On the book", snap.counts.names],
          ["Still shared", snap.counts.unowned],
          ["Late", snap.counts.late],
          ["Telecallers", snap.counts.teles],
        ].map(([label, n]) => (
          <div key={String(label)} className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
              {label}
            </dt>
            <dd className="mt-2 font-data text-2xl tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>
      <form className="flex flex-col gap-2 sm:flex-row" action={`/a/dealers/${id}`} method="get">
        <label className="block flex-1 text-sm">
          Search this dealer
          <input
            name="q"
            defaultValue={q ?? ""}
            className="mt-1 block h-11 w-full rounded-[3px] border border-[var(--arth-n50)] px-2"
            placeholder="Phone, name, or enquiry number"
          />
        </label>
        <Button type="submit" className="h-11 sm:self-end">
          Search
        </Button>
      </form>
      {q ? (
        hits.length === 0 ? (
          <p>No enquiries match at {dealer.name}.</p>
        ) : (
          <EnquiryList rows={hits} canCall={false} showValue />
        )
      ) : null}
      <section className="space-y-3">
        <h2 className="font-display text-[20px] font-semibold">People</h2>
        <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
          {snap.people.map((p) => (
            <li key={p.id} className="px-4 py-3">
              {p.full_name} · {p.role_key}
              {p.username ? ` · ${p.username}` : ""}
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-[20px] font-semibold">Shared book</h2>
        {snap.unowned.length === 0 ? (
          <p>Nothing is waiting in the shared book.</p>
        ) : (
          <ul className="space-y-4">
            {snap.unowned.slice(0, 8).map((row) => (
              <li key={row.id} className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
                <p className="font-semibold">{row.customer_name}</p>
                <p className="text-sm text-[var(--arth-n60)]">Enquiry {enquiryNo(row.id)}</p>
                <div className="mt-3">
                    <PlaceForm leadId={row.id} teles={snap.team} returnTo={`/a/dealers/${id}`} tenantId={id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <PerformancePanel view={perf} />
    </div>
  );
}
