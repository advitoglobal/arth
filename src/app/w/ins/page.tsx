import { asSeat, canOpen, canSeeMargin } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { insuranceCatalogue } from "@/services/conversion";
import { EnquiryList } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { inr } from "@/lib/format";

export default async function InsurancePage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "ins")) return <Forbidden screen="ins" />;
    const page = await listPipeline(tx, seat.userId);
    const products = await insuranceCatalogue(tx, canSeeMargin(seat.roleKey));
    const suggested = products.filter((p) => p.suggested);
    const rest = products.filter((p) => !p.suggested);
    return (
      <div className="space-y-8">
        <RuleHeading>Insurance</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Every product stays on the list. The first three are the best dealer benefit that still holds up for the customer. Nothing is hidden from the person on the call.
        </p>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Suggest first</h2>
          <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {suggested.map((p) => (
              <li key={p.id} className="px-4 py-3">
                <p className="font-medium">{p.name} · {p.insurer}</p>
                <p className="text-sm text-[var(--arth-n60)]">
                  Premium {inr(Number(p.premium_paise) / 100)}
                  {p.dealer_margin_bps != null ? ` · dealer margin ${(p.dealer_margin_bps / 100).toFixed(1)} percent` : ""}
                </p>
                <p className="mt-1 text-sm">{p.reason}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Also on the book</h2>
          <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {rest.map((p) => (
              <li key={p.id} className="px-4 py-3">
                <p className="font-medium">{p.name} · {p.insurer}</p>
                <p className="text-sm text-[var(--arth-n60)]">{p.reason}</p>
              </li>
            ))}
          </ul>
        </section>
        {page.rows.length === 0 ? (
          <p>No insurance enquiries on this seat. Inbound on the insurance DID appears on Today for the insurance telecaller.</p>
        ) : (
          <EnquiryList rows={page.rows} canCall={seat.roleKey === "instele"} />
        )}
      </div>
    );
  });
}
