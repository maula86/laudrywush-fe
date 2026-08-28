import {
  PAYMENT_STATUS_LABEL,
  STATUS_LABEL,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/laundry/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<OrderStatus, string> = {
  pending: "bg-muted text-muted-foreground ring-border",
  washing: "bg-info/12 text-info ring-info/30",
  drying: "bg-warning/15 text-warning-foreground ring-warning/40",
  ironing: "bg-chart-5/12 text-chart-5 ring-chart-5/30",
  packing: "bg-accent/15 text-accent-foreground ring-accent/40",
  ready: "bg-success/15 text-success-foreground ring-success/40",
  completed: "bg-primary/10 text-primary ring-primary/25",
  cancelled: "bg-destructive/12 text-destructive ring-destructive/30",
};

const paymentStyles: Record<PaymentStatus, string> = {
  paid: "bg-success/15 text-success-foreground ring-success/40",
  unpaid: "bg-muted text-muted-foreground ring-border",
  partial: "bg-warning/15 text-warning-foreground ring-warning/40",
  overdue: "bg-destructive/12 text-destructive ring-destructive/30",
};

const base =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <span className={cn(base, statusStyles[status], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PaymentBadge({
  status,
  className,
}: {
  status: PaymentStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, paymentStyles[status], className)}>
      {PAYMENT_STATUS_LABEL[status]}
    </span>
  );
}
