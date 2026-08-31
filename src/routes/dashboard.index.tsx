import { createFileRoute, Link } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { CircleDollarSign, Package, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
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
import { useSessionUser } from "@/lib/api/auth-store";
import { useCustomers } from "@/lib/api/hooks/use-customers";
import { orderApiErrorMessage, useOrderViewModels } from "@/lib/api/hooks/use-orders";
import { useDailyReport, useReportSummary } from "@/lib/api/hooks/use-reports";
import { formatDayShort, formatRupiah, formatShortRupiah, fromNow } from "@/lib/laundry/format";
import { PRODUCTION_STAGES } from "@/lib/laundry/types";

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

const EMPTY_SECTION_MESSAGE = "Belum ada data.";

const buildFilledTrendData = (rows: readonly { day: string; omzet: number }[], range: number) => {
  const rowsByDay = new Map(rows.map((row) => [row.day, row]));

  return Array.from({ length: range }, (_, index) => {
    const currentDate = subDays(new Date(), range - 1 - index);
    const dayKey = format(currentDate, "yyyy-MM-dd");
    const row = rowsByDay.get(dayKey);

    return {
      day: formatDayShort(currentDate),
      omzet: row?.omzet ?? 0,
    };
  });
};

const findDailyOmzet = (
  rows: readonly { day: string; omzet: number }[],
  targetDate: Date,
): number => {
  const targetDay = format(targetDate, "yyyy-MM-dd");
  return rows.find((row) => row.day === targetDay)?.omzet ?? 0;
};

const calculateRevenueDelta = (
  rows: readonly { day: string; omzet: number }[],
): number | undefined => {
  const todayRevenue = findDailyOmzet(rows, new Date());
  const yesterdayRevenue = findDailyOmzet(rows, subDays(new Date(), 1));

  if (yesterdayRevenue === 0) {
    return todayRevenue === 0 ? 0 : undefined;
  }

  return Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
};

function DashboardHome() {
  const sessionUser = useSessionUser();
  const canReadReports = sessionUser?.role === "admin" || sessionUser?.role === "kasir";

  const summaryQuery = useReportSummary(30);
  const todayOrdersQuery = useOrderViewModels({ range: 1 });
  const ordersQuery = useOrderViewModels();
  const customersQuery = useCustomers();
  const dailyTrendQuery = useDailyReport(7);
  const dailyDeltaQuery = useDailyReport(2);

  const orders = ordersQuery.orders;
  const latestOrders = orders.slice(0, 6);
  const activeOrdersCount = orders.filter(
    (order) => order.status !== "completed" && order.status !== "cancelled",
  ).length;
  const unpaidOrdersCount = orders.filter((order) => order.paymentStatus !== "paid").length;
  const averageOrderValue =
    orders.length > 0 ? Math.round((summaryQuery.data?.revenue ?? 0) / orders.length) : 0;

  const revenueToday = useMemo(
    () => findDailyOmzet(dailyTrendQuery.data ?? [], new Date()),
    [dailyTrendQuery.data],
  );
  const revenueDelta = useMemo(
    () => calculateRevenueDelta(dailyDeltaQuery.data ?? []),
    [dailyDeltaQuery.data],
  );
  const trendData = useMemo(
    // Zero-filling is presentation-only so the 7-day chart keeps a stable window when the API skips inactive days.
    () => buildFilledTrendData(dailyTrendQuery.data ?? [], 7),
    [dailyTrendQuery.data],
  );
  const stageData = useMemo(
    () =>
      PRODUCTION_STAGES.map((stage) => ({
        stage: stage.label,
        jumlah: orders.filter((order) => order.status === stage.status).length,
      })),
    [orders],
  );

  const hasOrderData = orders.length > 0;
  const hasStageData = stageData.some((item) => item.jumlah > 0);
  const summaryErrorMessage = summaryQuery.isError
    ? orderApiErrorMessage(summaryQuery.error)
    : null;
  const customersErrorMessage = customersQuery.isError
    ? orderApiErrorMessage(customersQuery.error)
    : null;
  const ordersErrorMessage = ordersQuery.isError ? orderApiErrorMessage(ordersQuery.error) : null;
  const todayOrdersErrorMessage = todayOrdersQuery.isError
    ? orderApiErrorMessage(todayOrdersQuery.error)
    : null;
  const trendErrorMessage = dailyTrendQuery.isError
    ? orderApiErrorMessage(dailyTrendQuery.error)
    : null;

  /**
   * `delta` and `hint` are only passed when they are backed by real data.
   * `exactOptionalPropertyTypes` forbids handing the card an explicit
   * `undefined`, so both are attached with conditional spreads.
   */
  const omzetHint = dailyTrendQuery.isError
    ? "Gagal memuat omzet hari ini"
    : revenueDelta !== undefined
      ? "vs kemarin"
      : null;

  const omzetCardProps = {
    label: "Omzet hari ini",
    value: dailyTrendQuery.isLoading ? "Memuat…" : formatRupiah(revenueToday),
    icon: CircleDollarSign,
    ...(revenueDelta !== undefined ? { delta: revenueDelta } : {}),
    ...(omzetHint !== null ? { hint: omzetHint } : {}),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Ringkasan performa outlet hari ini.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/pos">Buat order baru</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard {...omzetCardProps} />
        <KpiCard
          label="Order hari ini"
          value={todayOrdersQuery.isLoading ? "Memuat..." : `${todayOrdersQuery.orders.length}`}
          hint={todayOrdersErrorMessage ?? "transaksi"}
          icon={Package}
        />
        <KpiCard
          label="Order aktif"
          value={ordersQuery.isLoading ? "Memuat..." : `${activeOrdersCount}`}
          hint={ordersErrorMessage ?? "dalam proses produksi"}
          icon={TrendingUp}
        />
        <KpiCard
          label="Pelanggan"
          value={customersQuery.isLoading ? "Memuat..." : `${customersQuery.data?.length ?? 0}`}
          hint={customersErrorMessage ?? "total terdaftar"}
          icon={Users}
        />
      </div>

      {canReadReports && summaryErrorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive shadow-card">
          {summaryErrorMessage}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold">Omzet 7 hari terakhir</h2>
          <div className="mt-4 h-64">
            {dailyTrendQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Memuat grafik omzet…
              </div>
            ) : trendErrorMessage ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-destructive">
                {trendErrorMessage}
              </div>
            ) : (dailyTrendQuery.data?.length ?? 0) === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {EMPTY_SECTION_MESSAGE}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
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
                    tickFormatter={(value) => formatShortRupiah(Number(value))}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value) => formatRupiah(Number(value))}
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
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-base font-semibold">Order per tahap</h2>
          <div className="mt-4 h-64">
            {ordersQuery.isLoading || ordersQuery.customersQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Memuat distribusi order…
              </div>
            ) : ordersErrorMessage ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-destructive">
                {ordersErrorMessage}
              </div>
            ) : !hasStageData ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {EMPTY_SECTION_MESSAGE}
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Order terbaru</h2>
            <Link
              className="text-sm font-medium text-primary hover:underline"
              to="/dashboard/orders"
            >
              Lihat semua
            </Link>
          </div>
          <div className="mt-4 divide-y">
            {ordersQuery.isLoading || ordersQuery.customersQuery.isLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Memuat order terbaru…
              </div>
            ) : ordersErrorMessage ? (
              <div className="py-8 text-center text-sm text-destructive">{ordersErrorMessage}</div>
            ) : latestOrders.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {EMPTY_SECTION_MESSAGE}
              </div>
            ) : (
              latestOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{order.customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {order.orderNumber} · {fromNow(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">
                      {formatRupiah(order.total)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Rata-rata nilai order</p>
            {ordersQuery.isLoading || summaryQuery.isLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Memuat rata-rata order…</p>
            ) : (ordersErrorMessage ?? summaryErrorMessage) ? (
              <p className="mt-2 text-sm text-destructive">
                {ordersErrorMessage ?? summaryErrorMessage}
              </p>
            ) : !hasOrderData ? (
              <p className="mt-2 text-sm text-muted-foreground">{EMPTY_SECTION_MESSAGE}</p>
            ) : (
              <p className="text-metric mt-2">{formatRupiah(averageOrderValue)}</p>
            )}
          </div>
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">Belum dibayar</p>
            {summaryQuery.isLoading || ordersQuery.isLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Memuat piutang…</p>
            ) : (summaryErrorMessage ?? ordersErrorMessage) ? (
              <p className="mt-2 text-sm text-destructive">
                {summaryErrorMessage ?? ordersErrorMessage}
              </p>
            ) : !hasOrderData ? (
              <p className="mt-2 text-sm text-muted-foreground">{EMPTY_SECTION_MESSAGE}</p>
            ) : (
              <>
                <p className="text-metric mt-2">
                  {formatRupiah(summaryQuery.data?.receivable ?? 0)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{unpaidOrdersCount} order</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
