import { asSeat, canOpen } from "@/db/session";
import { listPipeline } from "@/services/telecalling";
import { EnquiryList } from "@/components/enquiry-row";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { SERVICE_STAGES } from "@/domain/ladders";
import { STAGE_LABEL } from "@/lib/labels";
import Link from "next/link";

export default async function ServicePage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "svc")) return <Forbidden />;
    const page = await listPipeline(tx, seat.userId);
    return (
      <div className="space-y-6">
        <RuleHeading>Service</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Due reminders, appointments, workshop status. No test drive. Cleanliness of a demo car is the test drive coordinator. Sales enquiries are not on this book.
        </p>
        <nav className="flex flex-wrap gap-2">
          {SERVICE_STAGES.map((key) => (
            <Link
              key={key}
              href={`/w/pipe?stage=${key}`}
              className="rounded-[3px] border border-[var(--arth-n10)] px-3 py-2 text-sm"
            >
              {STAGE_LABEL[key]} · {page.counts[key] ?? 0}
            </Link>
          ))}
        </nav>
        {page.rows.length === 0 ? (
          <p>No service enquiries on this seat.</p>
        ) : (
          <EnquiryList rows={page.rows} canCall={seat.roleKey === "svctele"} />
        )}
      </div>
    );
  });
}
