import { createFileRoute } from "@tanstack/react-router";
import { CircleDollarSign, Receipt, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard } from "@/components/laundry/kpi-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRupiah, formatShortRupiah } from "@/lib/laundry/format";
import { PAYMENT_LABEL, type PaymentMethod } from "@/lib/laundry/types";
import { useLaundryStore } from "@/store/laundry-store";

export const Route = createFileRoute("/dashboard/reports")({
  head: () => ({
    meta: [
      { title: "Laporan Keuangan — LaundryWush" },
      {
        name: "description",
        content:
          "Laporan omzet, pengeluaran, dan laba bersih laundry dengan grafik harian serta rincian metode pembayaran.",
      },
      { property: "og:title", content: "Laporan Keuangan — LaundryWush" },
      {
        property: "og:description",
        content: "Analisa omzet, biaya operasional, dan laba outlet laundry Anda.",
      },
    ],
  }),
  component: ReportsPage,
});

const RANGES = [7, 14, 30] as const;
const PIE_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
];

function ReportsPage() {
  const orders = useLaundryStore((s) => s.orders);
  const expenses = useLaundryStore((s) => s.expenses);
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);

  const since = useMemo(
    () => Date.now() - range * 24 * 3600_000,
    [range],
  );

  const scopedOrders = orders.filter((o) => new Date(o.createdAt).getTime() >= since);
  const scopedExpenses = expenses.filter((e) => new Date(e.date).getTime() >= since);

  const revenue = scopedOrders.reduce((sum, o) => sum + o.total, 0);
  const spending = scopedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = revenue - spending;
  const receivable = scopedOrders
    .filter((o) => o.paymentStatus !== "paid")
    .reduce((sum, o) => sum + (o.total - o.paidAmount), 0);

  const daily = useMemo(() => {
    const buckets = new Map<string, { day: string; omzet: number; biaya: number }>();
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 3600_000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { day: formatDate(d).slice(0, 6), omzet: 0, biaya: 0 });
    }
    scopedOrders.forEach((o) => {
      const key = o.createdAt.slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) bucket.omzet += o.total;
    });
    scopedExpenses.forEach((e) => {
      const key = e.date.slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) bucket.biaya += e.amount;
    });
    return [...buckets.values()];
  }, [range, scopedOrders, scopedExpenses]);

  const byPayment = (Object.keys(PAYMENT_LABEL) as PaymentMethod[])
    .map((method) => ({
      name: PAYMENT_LABEL[method],
      value: scopedOrders
        .filter((o) => o.paymentMethod === method)
        .reduce((sum, o) => sum + o.total, 0),
    }))
    .filter((row) => row.value > 0);

  const byService = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    scopedOrders.forEach((o) =>
      o.items.forEach((item) => {
        const row = map.get(item.serviceName) ?? {
          name: item.serviceName,
          qty: 0,
          revenue: 0,
        };
        row.qty += item.quantity;
        row.revenue += item.subtotal;
        map.set(item.serviceName, row);
      }),
    );
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [scopedOrders]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan performa {range} hari terakhir.
          </p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={r === range ? "default" : "outline"}
              onClick={() => setRange(r)}
            >
              {r} hari
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Omzet" value={formatRupiah(revenue)} icon={CircleDollarSign} />
        <KpiCard label="Pengeluaran" value={formatRupiah(spending)} icon={Wallet} />
        <KpiCard label="Laba bersih" value={formatRupiah(profit)} icon={TrendingUp} />
        <KpiCard label="Piutang" value={formatRupiah(receivable)} icon={Receipt} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Omzet vs pengeluaran</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="day" fontSize={12} stroke="var(--color-muted-foreground)" />
                <YAxis
                  fontSize={12}
                  stroke="var(--color-muted-foreground)"
                  tickFormatter={(v) => formatShortRupiah(Number(v))}
                />
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Legend />
                <Bar dataKey="omzet" name="Omzet" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="biaya" name="Biaya" fill="var(--color-chart-4)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Metode pembayaran</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byPayment} dataKey="value" nameKey="name" innerRadius={54} outerRadius={92}>
                  {byPayment.map((entry, i) => (
                    <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatRupiah(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Layanan</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Omzet</TableHead>
              <TableHead className="text-right">Kontribusi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byService.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {row.qty.toFixed(1).replace(".0", "")}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatRupiah(row.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {revenue ? Math.round((row.revenue / revenue) * 100) : 0}%
                </TableCell>
              </TableRow>
            ))}
            {byService.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Belum ada transaksi pada periode ini.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
