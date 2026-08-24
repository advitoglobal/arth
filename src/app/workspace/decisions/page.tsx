import { DecisionQueue } from "./decision-queue";

export const metadata = { title: "Decisions" };

export default function DecisionsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl tracking-tight">Decision queue</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          This is where the client is empowered. Approve, and work unblocks.
          Defer, and the risk stays visible. Status never hides a decision.
        </p>
      </header>
      <DecisionQueue />
    </div>
  );
}
