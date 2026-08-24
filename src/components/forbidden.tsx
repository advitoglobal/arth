export function Forbidden() {
  return (
    <div>
      <h1 className="font-display text-[28px] font-semibold">You cannot open this screen</h1>
      <p className="mt-3 max-w-[68ch] text-[var(--arth-n60)]">
        This screen is visible to other seats. Ask your manager to change your access. Open a screen on your access list, or leave this floor.

      </p>
    </div>
  );
}
