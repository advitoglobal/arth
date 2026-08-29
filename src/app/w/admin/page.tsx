import { asSeat, canOpen } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { FigureSource } from "@/components/figure-source";
import {
  assignmentMode,
  listPrices,
  listRates,
  listAudit,
} from "@/services/floor-register";
import { AssignmentModeForm, UploadBatchForm } from "@/components/register-forms";
import { istDateTime } from "@/lib/format";

export default async function AdminPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "admin")) return <Forbidden />;
    const [pos] = await tx<{ branch_id: string | null }[]>`
      SELECT p.branch_id::text FROM users u
      LEFT JOIN positions p ON p.id = u.position_id
      WHERE u.id = ${seat.userId}::uuid
    `;
    const mode = pos?.branch_id ? await assignmentMode(tx, pos.branch_id, "*") : "direct";
    const prices = await listPrices(tx);
    const rates = await listRates(tx);
    const audit = await listAudit(tx);
    return (
      <div className="space-y-8">
        <RuleHeading>Dealer setup</RuleHeading>
        <p className="max-w-[68ch] text-sm text-[var(--arth-n60)]">
          Configuration for this dealer. Price and bank rates are dated. A model does not invent a rate. Accounts exports incentives from a different screen and never sees enquiry content.
        </p>
        <FigureSource source="this dealer configuration" period="current" />
        <AssignmentModeForm current={mode} />
        <UploadBatchForm />
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Price master</h2>
          <p className="text-sm text-[var(--arth-n60)]">
            Ex-showroom is this dealer&apos;s figure. On-road is approximate until sales allocation. Confirmed date sits next to the number.
          </p>
          {prices.length === 0 ? (
            <p>No prices on the master yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {prices.map((p) => (
                <li key={`${p.model}-${p.variant}`} className="px-4 py-3 text-sm">
                  {p.model} {p.variant}
                  {p.colour ? ` · ${p.colour}` : ""} · ex-showroom ₹
                  {Math.round(Number(p.ex_showroom_paise) / 100).toLocaleString("en-IN")} · confirmed{" "}
                  {String(p.confirmed_at).slice(0, 10)}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Bank rates</h2>
          <p className="text-sm text-[var(--arth-n60)]">
            A rate with a confirmation date is worth quoting. A rate a model guessed is a liability.
          </p>
          <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {rates.map((r) => (
              <li key={`${r.bank_key}-${r.tenure_months}`} className="px-4 py-3 text-sm">
                {r.bank_key} · {r.tenure_months} months · {(r.rate_bps / 100).toFixed(2)} percent · confirmed{" "}
                {String(r.confirmed_at).slice(0, 10)}
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-[20px] font-semibold">Audit log</h2>
          {audit.length === 0 ? (
            <p>No configuration actions yet.</p>
          ) : (
            <ul className="divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {audit.map((row, i) => (
                <li key={i} className="px-4 py-3 text-sm">
                  {row.action}
                  {row.entity ? ` · ${row.entity}` : ""} · {istDateTime(row.created_at)}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  });
}
