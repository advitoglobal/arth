import { asSeat, canOpen } from "@/db/session";
import { RuleHeading } from "@/components/brand/type";
import { Forbidden } from "@/components/forbidden";
import { ArthbotChat } from "@/components/arthbot-chat";

export default async function BotPage() {
  return asSeat(async (_tx, seat) => {
    if (!canOpen(seat.roleKey, "bot")) return <Forbidden />;
    return (
      <div className="space-y-6">
        <RuleHeading>Arthbot</RuleHeading>
        <p className="text-sm text-[var(--arth-n60)]">
          Ask for a report on this dealer only. Arthbot never writes SQL. It picks an allowlisted report and you download CSV or PDF. Prompt injection cannot open another dealer.
        </p>
        <ArthbotChat tenantName={seat.tenantName} />
      </div>
    );
  });
}
