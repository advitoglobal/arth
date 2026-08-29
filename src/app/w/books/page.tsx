import { asSeat, canOpen } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { FigureSource } from "@/components/figure-source";
import { incentiveExport } from "@/services/floor-register";

export default async function BooksPage() {
  return asSeat(async (tx, seat) => {
    if (!canOpen(seat.roleKey, "books")) return <Forbidden />;
    const rows = await incentiveExport(tx);
    return (
      <div className="space-y-6">
        <RuleHeading>Accounts</RuleHeading>
        <p className="max-w-[68ch] text-sm text-[var(--arth-n60)]">
          Incentive points computed on this dealer, ready to export. Arth does not pay anyone. Enquiry names, phones, and conversation notes are not on this screen.
        </p>
        <FigureSource source="point movements this dealer, no enquiry rows" period="all recorded movement" />
        {rows.length === 0 ? (
          <p>No incentive rows to export.</p>
        ) : (
          <div className="overflow-x-auto border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--arth-n10)] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--arth-slate)]">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.username} className="border-b border-[var(--arth-n10)]">
                    <td className="px-4 py-3">{r.full_name}</td>
                    <td className="px-4 py-3 font-data">{r.username}</td>
                    <td className="px-4 py-3 font-data tabular-nums">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <pre className="overflow-x-auto border border-[var(--arth-n10)] bg-[var(--arth-n00)] p-4 font-data text-sm">
          {["name,username,points", ...rows.map((r) => `${r.full_name},${r.username},${r.points}`)].join("\n")}
        </pre>
      </div>
    );
  });
}
