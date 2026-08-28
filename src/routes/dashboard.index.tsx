import { createFileRoute, Link } from "@tanstack/react-router";
import { CircleDollarSign, Package, TrendingUp, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard } from "@/components/laundry/kpi-card";
import { StatusBadge } from "@/components/laundry/status-badge";
import { Button } from "@/components/ui/button";
import {
  formatDayShort,
  formatRupiah,
  formatShortRupiah,
  fromNow,
  isSameDay,
} from "@/lib/laundry/format";
import { PRODUCTION_STAGES } from "@/lib/laundry/types";
import { useLaundryStore } from "@/store/laundry-store";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard Outlet — LaundryWush" },
      {
        name: "description",
        content:
          "Ringkasan omzet harian, order aktif, dan performa outlet laundry dalam satu dashboard.",
      },
      { property: "og:title", content: "Dashboard Outlet — LaundryWush" },
      {
        property: "og:description",
        content: "Pantau omzet, order aktif, dan produksi laundry secara real-time.",
      },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const orders = useLaundryStore((s) => s.orders);
  const customers = useLaundryStore((s) => s.customers);

  const today = new Date();
  const todayOrders = orders.filter((o) => isSameDay(o.createdAt, today));
  const revenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const activeOrders = orders.filter(
    (o) => !["completed", "cancelled"].includes(o.status),
  ).length;
  const unpaid = orders.filter((o) => o.paymentStatus !== "paid");
  const avgTicket = orders.length
    ? Math.round(orders.reduce((s, o) => s + o.total, 0) / orders.length)
    : 0;

  const trend = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(today.getTime() - (6 - i) * 86400_000);
    const dayOrders = orders.filter((o) => isSameDay(o.createdAt, day));
    return {
      day: formatDayShort(day),
      omzet: dayOrders.reduce((s, o) => s + o.total, 0),
      order: dayOrders.length,
    };
  });

  const stageData = PRODUCTION_STAGES.map((stage) => ({
    stage: stage.label,
    jumlah: orders.filter((o) => o.status === stage.status).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan performa outlet hari ini.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/pos">Buat order baru</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Omzet hari ini"
          value={formatRupiah(revenueToday)}
          delta={12}
          hint="vs kemarin"
          icon={CircleDollarSign}
        />
        <KpiCard
          label="Order hari ini"
          value={`${todayOrders.length}`}
          delta={8}
          hint="transaksi"
          icon={Package}
        />
        <KpiCard
          label="Order aktif"
          value={`${activeOrders}`}
          hint="dalam proses produksi"
          icon={TrendingUp}
        />
        <KpiCard
          label="Pelanggan"
          value={`${customers.length}`}
          delta={5}
          hint="total terdaftar"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold">Omzet 7 hari terakhir</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="omzetFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickFormatter={(v) => formatShortRupiah(Number(v))}
                  width={70}
                />
                <Tooltip
                  formatter={(v) => formatRupiah(Number(v))}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="omzet"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#omzetFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold">Order per tahap</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="stage"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={54}
                />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="jumlah" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Order terbaru</h2>
            <Link className="text-sm font-medium text-primary hover:underline" to="/dashboard/orders">
              Lihat semua
            </Link>
          </div>
          <div className="mt-4 divide-y">
            {orders.slice(0, 6).map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{o.customerName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {o.orderNumber} · {fromNow(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatRupiah(o.total)}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Rata-rata nilai order</p>
            <p className="text-metric mt-2">{formatRupiah(avgTicket)}</p>
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Belum dibayar</p>
            <p className="text-metric mt-2">
              {formatRupiah(unpaid.reduce((s, o) => s + (o.total - o.paidAmount), 0))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{unpaid.length} order</p>
          </div>
        </div>
      </div>
    </div>
  );
}
