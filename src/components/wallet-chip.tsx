import { unofficialScoresCopy, pointsAreOfficial } from "@/vendors/status";

export function WalletChip({
  monthPoints,
}: {
  monthPoints: number;
}) {
  return (
    <a
      href="/w/profile"
      className="inline-flex items-baseline gap-2 border border-[var(--arth-n40)] px-3 py-1 text-[12.5px] text-[var(--arth-n00)]"
    >
      <span className="font-data tabular-nums">{monthPoints > 0 ? `+${monthPoints}` : monthPoints}</span>
      <span className="text-[var(--arth-n40)]">
        {pointsAreOfficial() ? "this month" : unofficialScoresCopy()}
      </span>
    </a>
  );
}
