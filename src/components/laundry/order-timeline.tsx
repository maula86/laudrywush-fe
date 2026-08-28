import { Check } from "lucide-react";

import { formatDateTime } from "@/lib/laundry/format";
import { PRODUCTION_STAGES, type Order } from "@/lib/laundry/types";
import { cn } from "@/lib/utils";

const flow = [...PRODUCTION_STAGES.map((s) => s.status), "completed"] as const;
const labels: Record<string, string> = {
  pending: "Order diterima",
  washing: "Sedang dicuci",
  drying: "Dikeringkan",
  ironing: "Disetrika",
  packing: "Packing",
  ready: "Siap diambil",
  completed: "Selesai / diambil",
};

export function OrderTimeline({ order }: { order: Order }) {
  const currentIndex = flow.indexOf(order.status as (typeof flow)[number]);

  return (
    <ol className="relative space-y-0">
      {flow.map((stage, i) => {
        const done = currentIndex >= i;
        const active = currentIndex === i;
        const at = order.history.find((h) => h.status === stage)?.at;
        return (
          <li key={stage} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                  active && "ring-4 ring-primary/15",
                )}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </span>
              {i < flow.length - 1 && (
                <span
                  className={cn(
                    "my-1 w-0.5 flex-1 rounded-full",
                    currentIndex > i ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-6", i === flow.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-semibold",
                  done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {labels[stage]}
              </p>
              <p className="text-xs text-muted-foreground">
                {at ? formatDateTime(at) : active ? "Sedang berlangsung" : "Menunggu"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
