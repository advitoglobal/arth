import { RuleHeading } from "@/components/brand/type";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-8 py-24">
      <RuleHeading>That page is not in Arth</RuleHeading>
      <p className="mt-3 text-[var(--arth-n60)]">
        The route does not exist. Return to the product or the public site.
      </p>
    </div>
  );
}
