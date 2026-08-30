import { asSeat, canOpen } from "@/db/session";
import { getLead, listQueue } from "@/services/telecalling";
import { StageLadder } from "@/components/stage-ladder";
import { assignmentMode, listReceivers, listPrices, listRates, emiPaise } from "@/services/floor-register";
import { listConsents } from "@/services/conversion";
import { departmentOfRole } from "@/domain/ladders";
import { CallDesk } from "@/components/call-desk";
import { RuleHeading } from "@/components/brand/type";
import { istDateTime, indianMobile } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { Forbidden } from "@/components/forbidden";
import { LedgerLine } from "@/components/ledger-line";
import { enquiryNo } from "@/lib/labels";
import Link from "next/link";

export default async function TelePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; auto?: string }>;
}) {
  const { id, auto } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "tele")) return <Forbidden />;
    const queue = await listQueue(tx, seat.userId);
    const leadId = id ?? queue[0]?.id;
    const autoContinue = auto === "1";
    const lostReasons = await tx<{ key: string; label: string; requires_fact: string }[]>`
      SELECT key, label, requires_fact FROM config_lost_reasons
    `;
    if (!leadId) {
      return (
        <div>
          <RuleHeading>Log a call</RuleHeading>
          <p className="mt-4">No enquiries are due. New names appear here for every telecaller until someone reaches the customer.</p>
        </div>
      );
    }
    const { lead, events } = await getLead(tx, leadId);
    if (!lead) {
      return (
        <div>
          <RuleHeading>Log a call</RuleHeading>
          <p className="mt-4">This enquiry is not on your book.</p>
        </div>
      );
    }

    const dept = String(lead.department_key ?? "sales");
    const dispositions = await tx<{ key: string; label: string; requires_revisit: boolean; requires_lost_reason: boolean; connected: boolean }[]>`
      SELECT key, label, requires_revisit, requires_lost_reason, connected
      FROM config_dispositions
      WHERE department_key = ${dept}
      ORDER BY sort_order
    `;
    const consents = await listConsents(tx, leadId);
    const ownerId = String(lead.owner_user_id ?? "");
    const canWork = !ownerId || ownerId === seat.userId;
    const remaining = queue.filter((r) => r.id !== leadId);
    const nextUp = remaining[0];
    const handedToSales = Boolean(ownerId) && ownerId !== seat.userId && String(lead.owner_name ?? "").length > 0;
    const salesPeople = await listReceivers(tx, String(lead.branch_id), dept);
    const mode = await assignmentMode(tx, String(lead.branch_id), String(lead.source_key));
    const prices = await listPrices(tx);
    const rates = await listRates(tx);
    const price = prices.find((p) => p.model === String(lead.model_interest ?? "")) ?? prices[0];
    const rate = rates[0];
    const onRoad = price
      ? Number(price.ex_showroom_paise) + Number(price.rto_paise) + Number(price.insurance_paise) + Number(price.accessories_paise)
      : 0;
    const emi = price && rate ? emiPaise(onRoad, rate.rate_bps, rate.tenure_months) : 0;

    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <RuleHeading>Log a call</RuleHeading>
          <p className="mt-2 text-sm text-[var(--arth-n60)]">
            {autoContinue
              ? "Auto caller is lining up priority names. Dial, record the outcome, and the next late call loads."
              : "Dial, send WhatsApp if they asked for a brochure or quotation, then record what was said. This is not a live telephone exchange."}
          </p>
          <div className="mt-6 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
            <Link
              href={`/w/rec?id=${leadId}`}
              className="font-display text-[28px] font-semibold hover:underline"
            >
              {lead.customer_name}
            </Link>
            <p className="font-data mt-1">{indianMobile(String(lead.phone))}</p>
            <p className="mt-1 font-data text-sm text-[var(--arth-n60)]">
              {`Enquiry ${enquiryNo(String(lead.id))}`}
            </p>
            <div className="mt-4">
              <StageLadder current={String(lead.stage_key)} department={dept} />
            </div>
            {lead.intake_kind ? (
              <p className="mt-2 text-sm text-[var(--arth-n60)]">
                {String(lead.intake_kind) === "manager_upload"
                  ? `Uploaded by manager${lead.intake_batch_name ? ` · ${lead.intake_batch_name}` : ""}`
                  : "Pushed from telecalling"}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-[var(--arth-n60)]">
              {ownerId
                ? `Owner ${lead.owner_name} · call by ${istDateTime(lead.first_response_due)}`
                : `Shared new enquiry · call by ${istDateTime(lead.first_response_due)}. It stays on every telecaller list until someone reaches the customer.`}
            </p>
          </div>
          {canWork && remaining.length > 0 ? (
            <div className="mt-6 border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
                Still in Today
              </p>
              <p className="mt-2 text-sm text-[var(--arth-n60)]">
                {remaining.length} after this one. Late names first. The queue decrements when you record an outcome.
              </p>
              {nextUp ? (
                <div className="mt-3">
                  <ActionButton
                    href={autoContinue ? `/w/tele?id=${nextUp.id}&auto=1` : `/w/tele?id=${nextUp.id}`}
                    variant="default"
                  >
                    Next: {nextUp.customer_name}
                  </ActionButton>
                </div>
              ) : null}
            </div>
          ) : null}
          <h2 className="mt-8 font-display text-[20px] font-semibold">History</h2>
          {events.length === 0 ? (
            <p className="mt-3 text-sm">No activity recorded yet. The first call writes the first row.</p>
          ) : (
            <ul className="mt-3 border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
              {events.map((ev) => (
                <LedgerLine key={String(ev.id)} ev={ev as Record<string, unknown>} />
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-4">
          {canWork ? (
            <CallDesk
              leadId={leadId}
              phone={String(lead.phone)}
              stageKey={String(lead.stage_key)}
              department={dept}
              nextLeadId={nextUp?.id}
              nextName={nextUp?.customer_name}
              autoContinue={autoContinue}
              dispositions={dispositions}
              lostReasons={lostReasons}
              salesPeople={salesPeople}
              mode={mode}
              consents={consents}
              priceLine={
                price
                  ? `On-road about ₹${Math.round(onRoad / 100).toLocaleString("en-IN")}. Ex-showroom confirmed ${price.confirmed_at}. Approximate days if booked today: 21 to 35, an estimate until sales allocation.`
                  : "No price on the master for this model yet."
              }
              emiLine={
                rate
                  ? `EMI example ${rate.bank_key} ${rate.tenure_months} months at ${(rate.rate_bps / 100).toFixed(2)} percent, confirmed ${rate.confirmed_at}: ₹${Math.round(emi / 100).toLocaleString("en-IN")} a month.`
                  : "No bank rate on the table yet."
              }
            />
          ) : (
            <p>
              {handedToSales
                ? `This enquiry is with ${lead.owner_name}. Conversion is a sales job.`
                : `You do not own this enquiry. ${lead.owner_name ?? "Another seat"} reached the customer.`}
            </p>
          )}
        </div>
      </div>
    );
  });
}
