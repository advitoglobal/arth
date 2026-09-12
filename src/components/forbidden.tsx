import { ActionButton } from "@/components/action-button";
import { FORBIDDEN_LINE, refusalNext } from "@/domain/refusal";

export function Forbidden({
  landing = "/w/pipe",
  screen = null,
}: {
  landing?: string;
  screen?: string | null;
}) {
  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold">You cannot open this screen</h1>
      <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">{FORBIDDEN_LINE}</p>
      <p className="mt-2 max-w-[68ch] text-[var(--arth-n60)]">{refusalNext(screen)}</p>
      <div className="mt-6">
        <ActionButton href={landing} variant="default">
          Open your landing screen
        </ActionButton>
      </div>
    </div>
  );
}
