import { spendRows } from "@/lib/arth-data";
import { inr, num } from "@/lib/format";
import { RuleHeading } from "@/components/brand/type";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Cost per booking" };

export default function SpendPage() {
  const spend = spendRows.reduce((s, r) => s + r.spend, 0);
  const bookings = spendRows.reduce((s, r) => s + r.bookings, 0);
  const cost = Math.round(spend / bookings);

  return (
    <div className="space-y-6">
      <RuleHeading>Cost per booking</RuleHeading>
      <p className="font-data text-[12.5px] text-[var(--arth-n60)]">
        1 Jul – 31 Jul 2026 · Meta Ads API, Google Ads API · pulled 04 Aug 11:42
      </p>
      <div className="border border-[var(--arth-n10)] bg-[var(--arth-n00)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Cost / booking</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {spendRows.map((row) => (
              <TableRow key={row.campaign}>
                <TableCell>{row.campaign}</TableCell>
                <TableCell className="arth-num font-data">
                  {inr(row.spend)}
                </TableCell>
                <TableCell className="arth-num font-data">
                  {num(row.bookings)}
                </TableCell>
                <TableCell className="arth-num font-data text-[var(--arth-brass-deep)]">
                  {inr(row.cost)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell className="arth-num font-data">{inr(spend)}</TableCell>
              <TableCell className="arth-num font-data">
                {num(bookings)}
              </TableCell>
              <TableCell className="arth-num font-data">{inr(cost)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
