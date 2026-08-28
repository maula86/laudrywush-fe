import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Package, Phone } from "lucide-react";

import { Logo } from "@/components/laundry/logo";
import { OrderTimeline } from "@/components/laundry/order-timeline";
import { PaymentBadge, StatusBadge } from "@/components/laundry/status-badge";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDateTime, formatNumber, formatRupiah, fromNow } from "@/lib/laundry/format";
import { useLaundryStore } from "@/store/laundry-store";

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
  const order = useLaundryStore((s) => s.orders.find((o) => o.orderNumber === orderNumber));
  const outlet = useLaundryStore((s) => s.outlet);

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

        {!hydrated ? (
          <div className="mx-auto mt-16 max-w-2xl text-center text-sm text-muted-foreground">
            Memuat data cucian…
          </div>
        ) : !order ? (
          <div className="mx-auto mt-16 max-w-md rounded-2xl border bg-card p-8 text-center shadow-card">
            <Package className="mx-auto size-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">Nota tidak ditemukan</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nomor <span className="font-medium">{orderNumber}</span> tidak terdaftar. Cek
              kembali nota kamu atau hubungi outlet.
            </p>
            <Button asChild className="mt-6">
              <Link to="/tracking">Coba lagi</Link>
            </Button>
          </div>
        ) : (
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Nomor nota
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{order.customerName}</p>
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
                  value={formatDateTime(order.estimatedCompletion)}
                  hint={fromNow(order.estimatedCompletion)}
                />
                <InfoTile
                  icon={Package}
                  label="Terakhir diperbarui"
                  value={formatDateTime(order.updatedAt)}
                  hint={fromNow(order.updatedAt)}
                />
              </div>

              <div className="mt-6 border-t pt-5">
                <p className="text-sm font-semibold">Rincian layanan</p>
                <div className="mt-3 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <span>
                        {item.serviceName}
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatNumber(item.quantity)}
                        </span>
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t pt-3 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatRupiah(order.total)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2 rounded-xl bg-surface p-4 text-sm">
                <Phone className="size-4 text-primary" />
                <span className="text-muted-foreground">
                  Ada pertanyaan? Hubungi {outlet.name} di{" "}
                  <span className="font-medium text-foreground">{outlet.phone}</span>
                </span>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-card">
              <h2 className="text-base font-semibold">Progres cucian</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                Diperbarui otomatis oleh operator outlet.
              </p>
              <OrderTimeline order={order} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  hint: string;
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
