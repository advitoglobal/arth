import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Trust",
};

const controls = [
  {
    title: "Tenant isolation",
    body: "Every record carries a tenant id. The demo workspace only reads Meridian Holdings. Cross-tenant reads are treated as incidents.",
  },
  {
    title: "Least privilege roles",
    body: "Clients own decisions and outcomes. Directors see programme health and audit. Neither role can see another tenant.",
  },
  {
    title: "Browser hardening",
    body: "nosniff, deny framing, referrer lockdown, permissions policy, and a content security policy ship on every response.",
  },
  {
    title: "No secret dependency",
    body: "This slice runs without credentials. When identity lands, it will use httpOnly sessions — never tokens in localStorage.",
  },
  {
    title: "Audit as a product surface",
    body: "Who invited, who posted evidence, and who opened an exception is visible in the director status view.",
  },
  {
    title: "Data residency path",
    body: "Regions are first-class (AMER, EMEA, APAC). Production will pin tenant data to the region the client names.",
  },
];

export default function TrustPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
        <p className="text-xs uppercase tracking-[0.22em] text-primary">
          Security
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Built to be trusted with a client’s programme.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Arth is result-oriented, not theatre. Security is part of the product
          the client can inspect — not a promise in a proposal.
        </p>
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {controls.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-10">
          <Button nativeButton={false} render={<Link href="/enter" />}>
            Continue to workspace
          </Button>
        </div>
      </main>
    </div>
  );
}
