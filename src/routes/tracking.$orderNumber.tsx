import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock, Package } from "lucide-react";

import { Logo } from "@/components/laundry/logo";
import { PaymentBadge, StatusBadge } from "@/components/laundry/status-badge";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { ApiError } from "@/lib/api/client";
import { trackingErrorMessage, useTracking } from "@/lib/api/hooks/use-tracking";
import type { Tracking } from "@/lib/api/types";
import { formatDateTime, fromNow } from "@/lib/laundry/format";
import { PRODUCTION_STAGES } from "@/lib/laundry/types";
import { cn } from "@/lib/utils";

const trackingFlow = [...PRODUCTION_STAGES.map((stage) => stage.status), "completed"] as const;
const trackingLabels: Record<string, string> = {
  pending: "Order diterima",
  washing: "Sedang dicuci",
  drying: "Dikeringkan",
  ironing: "Disetrika",
  packing: "Packing",
  ready: "Siap diambil",
  completed: "Selesai / diambil",
};

export const Route = createFileRoute("/tracking/$orderNumber")({
  head: ({ params }) => {
    const title = `Status Cucian ${params.orderNumber} — LaundryWush`;
    return {
      meta: [
        { title },
        {
          name: "description",
          content: `Pantau progres cucian untuk nota ${params.orderNumber}: dicuci, dikeringkan, disetrika, hingga siap diambil.`,
        },
        { property: "og:title", content: title },
        {
          property: "og:description",
          content: `Progres cucian untuk nota ${params.orderNumber} di LaundryWush.`,
        },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: TrackingDetailPage,
});

function TrackingDetailPage() {
  const { orderNumber } = Route.useParams();
  const hydrated = useHydrated();
  const { data: order, error, isLoading } = useTracking(orderNumber);
  const isNotFound = error instanceof ApiError && error.status === 404;
  const lastHistoryAt = order?.history.at(-1)?.at;

  return (
    <main className="gradient-hero min-h-screen">
      <div className="container-app py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link className="inline-flex w-fit" to="/">
            <Logo />
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link to="/tracking">
              <ArrowLeft /> Lacak nota lain
            </Link>
          </Button>
        </div>

        {!hydrated || isLoading ? (
          <div className="mx-auto mt-16 max-w-2xl text-center text-sm text-muted-foreground">
            Memuat data cucian…
          </div>
        ) : isNotFound ? (
          <NotFoundCard orderNumber={orderNumber} />
        ) : error ? (
          <div className="mx-auto mt-16 max-w-md rounded-2xl border bg-card p-8 text-center shadow-card">
            <Package className="mx-auto size-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">Data cucian tidak dapat dimuat</h1>
            <p className="mt-2 text-sm text-muted-foreground">{trackingErrorMessage(error)}</p>
            <Button asChild className="mt-6">
              <Link to="/tracking">Coba lagi</Link>
            </Button>
          </div>
        ) : order ? (
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">Nomor nota</p>
                  <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={order.status} />
                  <PaymentBadge status={order.paymentStatus} />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoTile
                  icon={Clock}
                  label="Estimasi selesai"
                  value={
                    order.estimatedCompletion
                      ? formatDateTime(order.estimatedCompletion)
                      : "Belum ditentukan"
                  }
                  hint={order.estimatedCompletion ? fromNow(order.estimatedCompletion) : "—"}
                />
                <InfoTile
                  icon={Package}
                  label="Terakhir diperbarui"
                  value={lastHistoryAt ? formatDateTime(lastHistoryAt) : "—"}
                  hint={lastHistoryAt ? fromNow(lastHistoryAt) : "Belum ada riwayat"}
                />
              </div>

              {/* Public tracking projection intentionally excludes customer, item, and price details. */}
              <p className="mt-6 rounded-xl bg-surface p-4 text-sm text-muted-foreground">
                Untuk pertanyaan mengenai pesanan, hubungi outlet tempat pesanan dibuat.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <h2 className="text-base font-semibold">Progres cucian</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                Diperbarui otomatis oleh operator outlet.
              </p>
              <TrackingTimeline order={order} />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function NotFoundCard({ orderNumber }: { readonly orderNumber: string }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl border bg-card p-8 text-center shadow-card">
      <Package className="mx-auto size-10 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-semibold">Nota tidak ditemukan</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Nomor <span className="font-medium">{orderNumber}</span> tidak terdaftar. Cek kembali nota
        kamu atau hubungi outlet.
      </p>
      <Button asChild className="mt-6">
        <Link to="/tracking">Coba lagi</Link>
      </Button>
    </div>
  );
}

function TrackingTimeline({ order }: { readonly order: Tracking }) {
  const currentIndex = trackingFlow.indexOf(order.status);

  return (
    <ol className="relative space-y-0">
      {trackingFlow.map((stage, index) => {
        const done = currentIndex >= index;
        const active = currentIndex === index;
        const at = order.history.find((entry) => entry.status === stage)?.at;

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
                {done ? <Check className="size-4" /> : index + 1}
              </span>
              {index < trackingFlow.length - 1 && (
                <span
                  className={cn(
                    "my-1 w-0.5 flex-1 rounded-full",
                    currentIndex > index ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
            <div className={cn("pb-6", index === trackingFlow.length - 1 && "pb-0")}>
              <p
                className={cn(
                  "text-sm font-semibold",
                  done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {trackingLabels[stage]}
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

function InfoTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  readonly icon: typeof Clock;
  readonly label: string;
  readonly value: string;
  readonly hint: string;
}) {
  return (
    <div className="rounded-xl border bg-surface p-4">
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
