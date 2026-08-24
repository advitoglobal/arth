import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Enter",
};

export default function EnterPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="text-xs uppercase tracking-[0.22em] text-primary">
          Demo access
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">
          Choose how you enter Meridian Holdings.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          No credentials in this slice. Production will replace this with SSO
          and tenant-bound sessions. The demo still respects role and tenant
          scope.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Client</CardTitle>
              <CardDescription>
                Priya Raman · programme sponsor. Own outcomes and the decision
                queue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                nativeButton={false}
                render={<Link href="/workspace?role=client" />}
              >
                Continue as client
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-2xl">Director</CardTitle>
              <CardDescription>
                Product or IT director. See health, blockers, and the audit
                trail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/workspace/status?role=director" />}
              >
                Continue as director
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
