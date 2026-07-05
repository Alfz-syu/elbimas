"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function MonthPicker({ month }: { month: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(delta: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", shiftMonth(month, delta));
    router.push(`${pathname}?${params.toString()}`);
  }

  const label = new Date(`${month}-01T00:00:00`).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="size-10"
        aria-label="Bulan sebelumnya"
        onClick={() => go(-1)}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>
      <span className="min-w-36 text-center text-sm font-medium">{label}</span>
      <Button
        variant="outline"
        size="icon"
        className="size-10"
        aria-label="Bulan berikutnya"
        onClick={() => go(1)}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
