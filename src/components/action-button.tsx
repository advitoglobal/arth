import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ActionButton({
  href,
  children,
  variant = "outline",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}) {
  return (
    <Button
      size="sm"
      variant={variant}
      className={cn("relative z-10 h-9 rounded-[3px] px-3", className)}
      nativeButton={false}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}
