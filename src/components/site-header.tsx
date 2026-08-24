import Link from "next/link";
import { ArthWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Arth home">
          <ArthWordmark />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/trust"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Trust
          </Link>
          <Button nativeButton={false} render={<Link href="/enter" />}>
            Open workspace
          </Button>
        </nav>
      </div>
    </header>
  );
}
