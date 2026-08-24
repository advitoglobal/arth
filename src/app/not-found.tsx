import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-24 text-center">
      <h1 className="font-display text-4xl">That page is not in Arth</h1>
      <p className="mt-3 text-muted-foreground">
        The route does not exist. Return to the workspace or the public site.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button nativeButton={false} render={<Link href="/" />}>
          Home
        </Button>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/enter" />}
        >
          Enter workspace
        </Button>
      </div>
    </div>
  );
}
