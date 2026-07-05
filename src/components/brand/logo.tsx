import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
  textClassName,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground",
          markClassName
        )}
      >
        <Wallet className="size-5" aria-hidden="true" />
      </span>
      <span
        className={cn(
          "font-heading text-xl font-bold tracking-tight",
          textClassName
        )}
      >
        Elbimas
      </span>
    </span>
  );
}
