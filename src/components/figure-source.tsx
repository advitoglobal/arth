export function FigureSource({
  source,
  period,
}: {
  source: string;
  period: string;
}) {
  return (
    <p className="text-[12.5px] text-[var(--arth-n60)]">
      Source: {source}. Period: {period}.
    </p>
  );
}
