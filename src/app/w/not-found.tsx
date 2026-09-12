import { ActionButton } from "@/components/action-button";
import { RuleHeading } from "@/components/brand/type";

export default function FloorNotFound() {
  return (
    <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-6">
      <RuleHeading>That screen is not on this floor</RuleHeading>
      <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
        This address is not a screen on this floor. Open a screen on your access list, or ask the digital desk who can grant access.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <ActionButton href="/w/login" variant="default">
          Sign in again
        </ActionButton>
      </div>
    </div>
  );
}
