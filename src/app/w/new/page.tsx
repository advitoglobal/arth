import { asSeat, canOpen } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { AddEnquiryForm } from "@/components/add-enquiry-form";
import { Forbidden } from "@/components/forbidden";
import { listRates } from "@/services/floor-register";

export default async function NewEnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "new")) return <Forbidden />;
    const rates = await listRates(tx);
    const rate = rates[0];
    const rateLine = rate
      ? `EMI uses the dated table. Example ${rate.bank_key} ${rate.tenure_months} months at ${(rate.rate_bps / 100).toFixed(2)} percent, confirmed ${String(rate.confirmed_at).slice(0, 10)}. Not inferred by a model.`
      : undefined;
    return (
      <div className="space-y-6">
        <RuleHeading>Add enquiry</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Capture four fields first so the enquiry exists. Qualify on the same screen as you go. You become the owner from the first save.
        </p>
        <AddEnquiryForm presetPhone={phone} rateLine={rateLine} />
      </div>
    );
  });
}
