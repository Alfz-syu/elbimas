import Image from "next/image";
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
      <Image
        src="/icon.svg"
        alt=""
        width={34}
        height={28}
        priority
        className={cn("h-9 w-auto", markClassName)}
      />
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
