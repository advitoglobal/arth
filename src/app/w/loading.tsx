import { RuleHeading } from "@/components/brand/type";

export default function FloorLoading() {
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <RuleHeading>Opening this screen</RuleHeading>
      <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
        Your last saved work stays in the ledger. This list will appear here.
      </p>
    </div>
  );
}
