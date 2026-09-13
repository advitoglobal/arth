import { asSeat, canOpen } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { AddEnquiryForm } from "@/components/add-enquiry-form";
import { Forbidden } from "@/components/forbidden";
import { listRates } from "@/services/floor-register";
import { listCatalogue, listPriceColours } from "@/services/catalogue";

export default async function NewEnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string }>;
}) {
  const { phone } = await searchParams;
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "new")) return <Forbidden screen="new" />;
    const rates = await listRates(tx);
    const catalogue = await listCatalogue(tx);
    const colours = await listPriceColours(tx);
    const models = [...new Set(catalogue.map((r) => r.model))];
    const variants = catalogue.map((r) => ({ model: r.model, variant: r.variant }));
    const banks = [...new Set(rates.map((r) => r.bank_key))];
    const rate = rates[0];
    const rateLine = rate
      ? `EMI uses the dated table. Example ${rate.bank_key} ${rate.tenure_months} months at ${(rate.rate_bps / 100).toFixed(2)} percent, confirmed ${String(rate.confirmed_at).slice(0, 10)}. Not inferred by a model.`
      : undefined;
    return (
      <div className="space-y-6">
        <RuleHeading>Add enquiry</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Department first. Questions change with the lane. One Save lead files the enquiry in that department. You own it until you qualify and send it on.
        </p>
        <AddEnquiryForm
          presetPhone={phone}
          rateLine={rateLine}
          models={models}
          variants={variants}
          colours={colours}
          banks={banks}
          department={
            seat.roleKey === "svctele" ? "service" : seat.roleKey === "instele" ? "insurance" : "sales"
          }
        />
      </div>
    );
  });
}
