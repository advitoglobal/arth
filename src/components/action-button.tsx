import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ActionButton({
  href,
  children,
  variant = "outline",
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "outline" | "secondary";
}) {
  return (
    <Button
      size="sm"
      variant={variant}
      className="h-9 rounded-[3px] px-3"
      nativeButton={false}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}
