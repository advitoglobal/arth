import { asSeat, canOpen } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { ActionButton } from "@/components/action-button";
import { WhatsAppSend } from "@/components/whatsapp-send";
import { WhatsAppInboundDesk } from "@/components/whatsapp-inbound-desk";
import { LedgerLine } from "@/components/ledger-line";
import { getLead } from "@/services/telecalling";
import { listMessageInbox, queuedInbound } from "@/services/whatsapp-loop";
import { istDateTime } from "@/lib/format";
import { enquiryNo } from "@/lib/labels";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "msg")) return <Forbidden />;
    const inbox = await listMessageInbox(tx, seat.userId);
    const leadId = id ?? inbox[0]?.id;
    const thread = leadId ? await getLead(tx, leadId) : { lead: null, events: [] };
    const waiting = leadId ? await queuedInbound(tx, leadId) : [];
    const events = (thread.events as Record<string, unknown>[]).filter((ev) =>
      ["whatsapp", "whatsapp_inbound", "whatsapp_receipt", "whatsapp_auto"].includes(String(ev.event_type)),
    );

    return (
      <div className="space-y-6">
        <RuleHeading>Messages</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Every message in and out belongs to the enquiry, never to a person and never to a phone. The reply clock is 30 minutes inside working hours, separate from the call clock.
        </p>
        <WhatsAppInboundDesk defaultPhone={thread.lead ? String(thread.lead.phone ?? "") : ""} />
        {inbox.length === 0 && !leadId ? (
          <p className="text-sm">No WhatsApp replies are waiting. A customer message lands here against the enquiry.</p>
        ) : (
          <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_92px] gap-2 border-b border-[var(--arth-n10)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
              <span>Name</span>
              <span>Reply by</span>
              <span>Last line</span>
              <span>Open</span>
            </div>
            {inbox.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1.4fr_1fr_1fr_92px] gap-2 border-b border-[var(--arth-n10)] px-4 py-3 text-sm"
              >
                <span>{row.customer_name}</span>
                <span className="font-data">{row.message_reply_due ? istDateTime(row.message_reply_due) : "Not recorded"}</span>
                <span className="truncate text-[var(--arth-n60)]">{row.last_note ?? "WhatsApp"}</span>
                <ActionButton href={`/w/msg?id=${row.id}`} variant="outline">
                  Open
                </ActionButton>
              </div>
            ))}
          </div>
        )}
        {thread.lead ? (
          <div className="space-y-4">
            <p className="font-display text-[24px] font-semibold">{String(thread.lead.customer_name)}</p>
            <p className="text-sm text-[var(--arth-n60)]">{`Enquiry ${enquiryNo(String(thread.lead.id))}`}</p>
            {waiting.length > 0 ? (
              <p className="text-sm">
                {waiting.length === 1 ? "One reply is waiting in wrap-up." : `${waiting.length} replies are waiting in wrap-up.`}
              </p>
            ) : null}
            <WhatsAppSend leadId={String(thread.lead.id)} department={String(thread.lead.department_key ?? "sales")} />
            {events.length === 0 ? (
              <p className="text-sm">No WhatsApp on this enquiry yet.</p>
            ) : (
              <ul className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
                {events.map((ev) => (
                  <LedgerLine key={String(ev.id)} ev={ev} />
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    );
  });
}
