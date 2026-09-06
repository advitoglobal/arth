import { publicTrack } from "@/services/delivery";
import { RuleHeading } from "@/components/brand/type";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await publicTrack(token);
  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <RuleHeading>Delivery</RuleHeading>
        <p className="mt-4">This link has expired or is not a live booking.</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <RuleHeading>Your car</RuleHeading>
      <p className="mt-4">{data.customerName}</p>
      <p className="text-sm text-[var(--arth-n60)]">{data.model}</p>
      <p className="mt-4 text-sm">
        Promised {data.promisedOn ?? "not set yet"}. This page does not need a login. It expires thirty days after physical delivery.
      </p>
      <ul className="mt-6 divide-y divide-[var(--arth-n10)] border border-[var(--arth-n10)]">
        {data.steps.map((s) => (
          <li key={`${s.lane}-${s.key}`} className="px-4 py-3 text-sm">
            {s.lane} · {s.key} · {s.status}
            {s.blockKind ? ` · ${s.blockKind}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
