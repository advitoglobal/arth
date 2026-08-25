import { asSeat, canOpen } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { AddEnquiryForm } from "@/components/add-enquiry-form";
import { Forbidden } from "@/components/forbidden";

export default async function NewEnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone } = await searchParams;
  return asSeat(async (_tx, seat) => {
    if (!canOpen(seat.roleKey, "new")) return <Forbidden />;
    return (
      <div className="space-y-6">
        <RuleHeading>File an enquiry</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Use this when Search finds no match. You become the owner. The first-response clock starts through working hours.
        </p>
        <AddEnquiryForm presetPhone={phone} />
      </div>
    );
  });
}
