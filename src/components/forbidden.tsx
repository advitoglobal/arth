import { ActionButton } from "@/components/action-button";

export function Forbidden({
  landing = "/w/pipe",
}: {
  landing?: string;
}) {
  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold">You cannot open this screen</h1>
      <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
        This screen is for another seat. Open a screen on your access list, or leave this floor.
      </p>
      <div className="mt-6">
        <ActionButton href={landing} variant="default">
          Open your landing screen
        </ActionButton>
      </div>
    </div>
  );
}
