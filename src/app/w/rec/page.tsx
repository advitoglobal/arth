import { asSeat, canOpen, canSeeValue } from "@/db/session";
import { getLead } from "@/services/telecalling";
import { RuleHeading, StatusStamp } from "@/components/brand/type";
import { inr, istDateTime, indianMobile } from "@/lib/format";
import { ActionButton } from "@/components/action-button";
import { enquiryNo, sourceLabel } from "@/lib/labels";
import { LedgerLine } from "@/components/ledger-line";
import { StagePanel } from "@/components/stage-panel";
import { Forbidden } from "@/components/forbidden";
import { StageLadder } from "@/components/stage-ladder";
import { ClaimButton } from "@/components/claim-button";
import { FigureSource } from "@/components/figure-source";
import { QuoteButton, ReassignForm, BounceToPoolForm } from "@/components/register-forms";
import { listBranchPeople } from "@/services/floor-register";
import { listStock, listDiscounts, listConsents } from "@/services/conversion";
import { SalesConversion } from "@/components/sales-conversion";
import { ConsentPanel } from "@/components/consent-panel";
import { WhatsAppSend } from "@/components/whatsapp-send";
import { handoverCard } from "@/services/handover";
import { HandoverCard } from "@/components/handover-card";
import { canApproveDiscount } from "@/lib/access";

export default async function RecPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "rec")) return <Forbidden />;
    if (!id) {
      return (
        <div>
          <RuleHeading>Enquiry record</RuleHeading>
          <p className="mt-4">Open a name from Today, My enquiries, or Search.</p>
        </div>
      );
    }
    const { lead, events } = await getLead(tx, id);
    if (!lead) {
      return (
        <div>
          <RuleHeading>Enquiry record</RuleHeading>
          <p className="mt-4">This enquiry is not on your book.</p>
        </div>
      );
    }
    const overdue =
      lead.first_response_due &&
      !lead.first_responded_at &&
      new Date(String(lead.first_response_due)).getTime() < Date.now();
    const settled = lead.stage_key === "delivered";
    const canReassign = ["lead", "mgr", "owner", "admin", "ops", "gm", "salesmgr", "svcmgr"].includes(seat.roleKey);
    const people = canReassign
      ? await listBranchPeople(tx, String(lead.branch_id))
      : [];
    const dept = String(lead.department_key ?? "sales");
    const stock = dept === "sales" ? await listStock(tx) : [];
    const discounts = canApproveDiscount(seat.roleKey) ? await listDiscounts(tx) : [];
    const consents = await listConsents(tx, id);
    const card = await handoverCard(tx, id);
    const handedRead =
      String(lead.handed_on_by ?? "") === seat.userId &&
      ["tele", "svctele", "instele"].includes(seat.roleKey) &&
      String(lead.owner_user_id ?? "") !== seat.userId;
    const canWorkLead = !handedRead && (
      String(lead.owner_user_id ?? "") === seat.userId ||
      (!lead.owner_user_id && ["tele", "svctele", "instele"].includes(seat.roleKey))
    );

    return (
      <div className="space-y-6">
        <RuleHeading>Enquiry record</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Full enquiry: customer, owner, clock, and every action taken. Nothing here is edited. A correction writes a new row.
        </p>
        <FigureSource source="this enquiry" period="full activity ledger" />
        <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-[28px] font-semibold">{lead.customer_name}</p>
            {settled ? <StatusStamp state="settled" /> : null}
            {overdue && !settled ? <StatusStamp state="overdue" /> : null}
          </div>
          <p className="font-data">{indianMobile(String(lead.phone))}</p>
          <p className="mt-1 font-data text-sm text-[var(--arth-n60)]">
            {`Enquiry ${enquiryNo(String(lead.id))}`}
          </p>
          <div className="mt-4">
            <StageLadder current={String(lead.stage_key)} department={String(lead.department_key ?? "sales")} />
          </div>
          <p className="mt-3 text-sm text-[var(--arth-n60)]">
            {String(lead.intake_kind) === "manager_upload"
              ? `Uploaded by manager${lead.intake_batch_name ? ` · ${String(lead.intake_batch_name)}` : ""}`
              : "Pushed from telecalling"}
            {lead.department_key ? ` · ${String(lead.department_key)}` : ""}
          </p>
          {handedRead ? (
            <p className="mt-3 text-sm">
              You handed this on. Stage and outcome stay visible. Dial, WhatsApp, and stage moves are a sales job now.
            </p>
          ) : null}
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Vehicle</dt>
              <dd>{lead.model_interest} · {lead.variant_interest}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Source</dt>
              <dd>{sourceLabel(String(lead.source_key))} · {lead.source_detail}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Stage</dt>
              <dd>{lead.stage_label ?? lead.stage_key}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Owner</dt>
              <dd>{lead.owner_name ?? "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Arrived</dt>
              <dd className="font-data">{istDateTime(lead.created_at)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Call by</dt>
              <dd className="font-data">{istDateTime(lead.first_response_due)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">First call logged</dt>
              <dd className="font-data">{istDateTime(lead.first_responded_at)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Next action</dt>
              <dd className="font-data">{istDateTime(lead.next_action_at)}</dd>
            </div>
            {canSeeValue(seat.roleKey) ? (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Expected value</dt>
              <dd className="font-data">{inr(Number(lead.expected_value_paise) / 100)}</dd>
            </div>
            ) : null}
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Assigned</dt>
              <dd className="font-data">{istDateTime(lead.assigned_at)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">Lost reason</dt>
              <dd>{lead.lost_reason_label ?? (lead.lost_reason_key ? String(lead.lost_reason_key) : "Open")}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <HandoverCard card={card} />
          </div>
          {dept === "sales" && String(lead.stage_key) === "booked" ? (
            <div className="mt-4">
              <ActionButton href={`/w/delivery?id=${lead.id}`} variant="outline">
                Open delivery chain
              </ActionButton>
            </div>
          ) : null}
          {canWorkLead && canOpen(seat.roleKey, "tele") ? (
            <div className="mt-6">
              <ActionButton href={`/w/tele?id=${lead.id}`} variant="default">
                Log a call
              </ActionButton>
            </div>
          ) : null}
          {["sales", "svc", "ins"].includes(seat.roleKey) && lead.pool_open ? (
            <div className="mt-6">
              <ClaimButton leadId={String(lead.id)} />
            </div>
          ) : null}
          {!handedRead &&
          (String(lead.owner_user_id ?? "") === seat.userId ||
            ["sales", "svc", "ins", "lead", "mgr", "owner", "admin", "gm", "salesmgr", "svcmgr"].includes(seat.roleKey)) ? (
            <div className="mt-6 space-y-4">
              <StagePanel
                leadId={String(lead.id)}
                stageKey={String(lead.stage_key)}
                department={String(lead.department_key ?? "sales")}
              />
              {String(lead.department_key) === "sales" ? <QuoteButton leadId={String(lead.id)} /> : null}
            </div>
          ) : null}
          {["sales", "svc", "ins"].includes(seat.roleKey) &&
          String(lead.owner_user_id ?? "") === seat.userId &&
          lead.handed_on_at ? (
            <div className="mt-6">
              <BounceToPoolForm leadId={String(lead.id)} />
            </div>
          ) : null}
          {canReassign ? (
            <div className="mt-6">
              <ReassignForm leadId={String(lead.id)} people={people} />
            </div>
          ) : null}
          <div className="mt-6">
            <ConsentPanel leadId={String(lead.id)} initial={consents} />
          </div>
          {canWorkLead ? (
            <div className="mt-6">
              <WhatsAppSend leadId={String(lead.id)} department={dept} />
            </div>
          ) : null}
          {dept === "sales" &&
          ["sales", "salesmgr", "lead", "owner", "gm", "admin", "tdcoord"].includes(seat.roleKey) ? (
            <div className="mt-6">
              <SalesConversion
                leadId={String(lead.id)}
                stock={stock}
                discounts={discounts.filter((d) => d.lead_id === String(lead.id))}
                canRelease={["salesmgr", "owner", "gm", "admin"].includes(seat.roleKey)}
                canApprove={canApproveDiscount(seat.roleKey)}
              />
            </div>
          ) : null}
        </div>
        <h2 className="font-display text-[20px] font-semibold">Activity ledger</h2>
        {events.length === 0 ? (
          <p>No rows yet. The first call writes the first row. Rows are never edited.</p>
        ) : (
          <ul className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            {events.map((ev) => (
              <LedgerLine key={String(ev.id)} ev={ev as Record<string, unknown>} />
            ))}
          </ul>
        )}
      </div>
    );
  });
}
