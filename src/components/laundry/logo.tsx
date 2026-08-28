import { Droplets } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="gradient-brand flex size-9 items-center justify-center rounded-xl shadow-elevated">
        <Droplets className="size-5 text-primary-foreground" strokeWidth={2.4} />
      </span>
      <span
        className={cn(
          "text-lg font-bold tracking-tight",
          inverted ? "text-sidebar-foreground" : "text-foreground",
        )}
      >
        Laundry<span className="text-accent">Wush</span>
      </span>
    </span>
  );
}
