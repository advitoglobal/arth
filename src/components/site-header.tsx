import Link from "next/link";
import { ArthWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-[100] border-b border-[var(--arth-n10)] bg-[var(--arth-n00)]">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-8">
        <Link href="/" aria-label="arth home">
          <ArthWordmark />
        </Link>
        <nav className="flex items-center gap-6">
          <Button
            variant="outline"
            className="hidden h-9 sm:inline-flex"
            nativeButton={false}
            render={<Link href="/trust" />}
          >
            How records are kept
          </Button>
          <Button nativeButton={false} render={<Link href="/w/login" />}>
            Open the product
          </Button>
        </nav>
      </div>
    </header>
  );
}
