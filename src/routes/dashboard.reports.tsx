import { createFileRoute } from "@tanstack/react-router";
import { format, subDays } from "date-fns";
import { CircleDollarSign, Receipt, Trash2, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  expenseApiErrorMessage,
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
} from "@/lib/api/hooks/use-expenses";
import {
  useDailyReport,
  usePaymentReport,
  useReportSummary,
  useServiceReport,
} from "@/lib/api/hooks/use-reports";
import {
  EXPENSE_CATEGORIES,
  type CreateExpenseRequest,
  type ExpenseCategory,
} from "@/lib/api/types";
import { formatDate, formatNumber, formatRupiah, formatShortRupiah } from "@/lib/laundry/format";
import { PAYMENT_LABEL } from "@/lib/laundry/types";

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
] as const;
const EMPTY_SECTION_MESSAGE = "Belum ada data pada periode ini.";
const EXPENSE_CATEGORY_LABEL: Record<(typeof EXPENSE_CATEGORIES)[number], string> = {
  detergent: "Deterjen",
  electricity: "Listrik",
  water: "Air",
  salary: "Gaji",
  maintenance: "Perawatan",
  other: "Lainnya",
};

const createTodayDate = (): string => format(new Date(), "yyyy-MM-dd");

const isExpenseCategory = (value: string): value is ExpenseCategory =>
  EXPENSE_CATEGORIES.some((category) => category === value);

const buildFilledDailyChart = (
  rows: readonly { day: string; omzet: number; biaya: number }[],
  range: number,
) => {
  const rowsByDay = new Map(rows.map((row) => [row.day, row]));

  return Array.from({ length: range }, (_, index) => {
    const currentDate = subDays(new Date(), range - 1 - index);
    const dayKey = format(currentDate, "yyyy-MM-dd");
    const row = rowsByDay.get(dayKey);

    return {
      day: formatDate(currentDate),
      omzet: row?.omzet ?? 0,
      biaya: row?.biaya ?? 0,
    };
  });
};

function ReportsPage() {
  const [range, setRange] = useState<(typeof RANGES)[number]>(7);
  const [expenseForm, setExpenseForm] = useState<CreateExpenseRequest>({
    category: "detergent",
    amount: 0,
    description: "",
    date: createTodayDate(),
  });

  const summaryQuery = useReportSummary(range);
  const dailyQuery = useDailyReport(range);
  const paymentQuery = usePaymentReport(range);
  const serviceQuery = useServiceReport(range);
  const expensesQuery = useExpenses({ range });
  const createExpenseMutation = useCreateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const summary = summaryQuery.data;
  const dailyChartData = useMemo(
    () => buildFilledDailyChart(dailyQuery.data ?? [], range),
    [dailyQuery.data, range],
  );
  const paymentChartData = useMemo(
    () =>
      (paymentQuery.data ?? []).map((row) => ({
        name: PAYMENT_LABEL[row.method],
        value: row.total,
      })),
    [paymentQuery.data],
  );
  const serviceRows = serviceQuery.data ?? [];
  const expenseRows = expensesQuery.data ?? [];

  const handleExpenseInputChange = <K extends keyof CreateExpenseRequest>(
    key: K,
    value: CreateExpenseRequest[K],
  ) => {
    setExpenseForm((previous) => ({ ...previous, [key]: value }));
  };

  const submitExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (createExpenseMutation.isPending) return;

    try {
      await createExpenseMutation.mutateAsync(expenseForm);
      toast.success("Pengeluaran berhasil ditambahkan.");
      setExpenseForm({
        category: expenseForm.category,
        amount: 0,
        description: "",
        date: createTodayDate(),
      });
    } catch (error) {
      toast.error(expenseApiErrorMessage(error));
    }
  };

  const deleteExpense = async (id: string) => {
    if (deleteExpenseMutation.isPending) return;

    try {
      await deleteExpenseMutation.mutateAsync(id);
      toast.success("Pengeluaran berhasil dihapus.");
    } catch (error) {
      toast.error(expenseApiErrorMessage(error));
    }
  };

  const kpiCards = [
    {
      label: "Omzet",
      value: summaryQuery.isLoading ? "Memuat..." : formatRupiah(summary?.revenue ?? 0),
      icon: CircleDollarSign,
    },
    {
      label: "Pengeluaran",
      value: summaryQuery.isLoading ? "Memuat..." : formatRupiah(summary?.spending ?? 0),
      icon: Wallet,
    },
    {
      label: "Laba bersih",
      value: summaryQuery.isLoading ? "Memuat..." : formatRupiah(summary?.profit ?? 0),
      icon: TrendingUp,
    },
    {
      label: "Piutang",
      value: summaryQuery.isLoading ? "Memuat..." : formatRupiah(summary?.receivable ?? 0),
      icon: Receipt,
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground">Ringkasan performa {range} hari terakhir.</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={value === range ? "default" : "outline"}
              onClick={() => setRange(value)}
            >
              {value} hari
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <KpiCard key={card.label} label={card.label} value={card.value} icon={card.icon} />
        ))}
      </div>

      {summaryQuery.isError && (
        <div className="rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive shadow-card">
          {expenseApiErrorMessage(summaryQuery.error)}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Omzet vs pengeluaran</h2>
          <div className="mt-4 h-72">
            {dailyQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Memuat grafik harian…
              </div>
            ) : dailyQuery.isError ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-destructive">
                {expenseApiErrorMessage(dailyQuery.error)}
              </div>
            ) : (dailyQuery.data?.length ?? 0) === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {EMPTY_SECTION_MESSAGE}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis dataKey="day" fontSize={12} stroke="var(--color-muted-foreground)" />
                  <YAxis
                    fontSize={12}
                    stroke="var(--color-muted-foreground)"
                    tickFormatter={(value) => formatShortRupiah(Number(value))}
                  />
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                  <Legend />
                  <Bar
                    dataKey="omzet"
                    name="Omzet"
                    fill="var(--color-chart-1)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="biaya"
                    name="Biaya"
                    fill="var(--color-chart-4)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {/* Zero-filling is presentation-only so the selected date range displays consistently in Recharts. */}
            Grafik menampilkan seluruh hari pada rentang terpilih, termasuk hari tanpa aktivitas.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Metode pembayaran</h2>
          <div className="mt-4 h-72">
            {paymentQuery.isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Memuat distribusi pembayaran…
              </div>
            ) : paymentQuery.isError ? (
              <div className="flex h-full items-center justify-center text-center text-sm text-destructive">
                {expenseApiErrorMessage(paymentQuery.error)}
              </div>
            ) : paymentChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {EMPTY_SECTION_MESSAGE}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={54}
                    outerRadius={92}
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
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
            {serviceRows.map((row) => (
              <TableRow key={row.name}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="text-right tabular-nums">{formatNumber(row.qty)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatRupiah(row.revenue)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.contribution}%</TableCell>
              </TableRow>
            ))}
            {serviceQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  Memuat laporan layanan…
                </TableCell>
              </TableRow>
            )}
            {serviceQuery.isError && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-destructive">
                  {expenseApiErrorMessage(serviceQuery.error)}
                </TableCell>
              </TableRow>
            )}
            {!serviceQuery.isLoading && !serviceQuery.isError && serviceRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  {EMPTY_SECTION_MESSAGE}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.6fr]">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h2 className="text-sm font-semibold">Tambah pengeluaran</h2>
          <form className="mt-4 space-y-3" onSubmit={(event) => void submitExpense(event)}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Kategori</p>
                <Select
                  value={expenseForm.category}
                  onValueChange={(value) => {
                    if (isExpenseCategory(value)) handleExpenseInputChange("category", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {EXPENSE_CATEGORY_LABEL[category]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Tanggal</p>
                <Input
                  type="date"
                  value={expenseForm.date}
                  onChange={(event) => handleExpenseInputChange("date", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Nominal</p>
              <Input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Contoh: 450000"
                value={expenseForm.amount === 0 ? "" : String(expenseForm.amount)}
                onChange={(event) =>
                  handleExpenseInputChange(
                    "amount",
                    Number(event.target.value === "" ? 0 : event.target.value),
                  )
                }
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Deskripsi</p>
              <Input
                placeholder="Contoh: Deterjen & pewangi 20L"
                value={expenseForm.description}
                onChange={(event) => handleExpenseInputChange("description", event.target.value)}
              />
            </div>

            <Button type="submit" disabled={createExpenseMutation.isPending}>
              {createExpenseMutation.isPending ? "Menyimpan..." : "Simpan pengeluaran"}
            </Button>
          </form>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Daftar pengeluaran</h2>
              <p className="text-xs text-muted-foreground">
                Aktif pada rentang {range} hari terakhir.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseRows.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.date)}</TableCell>
                    <TableCell>{EXPENSE_CATEGORY_LABEL[expense.category]}</TableCell>
                    <TableCell className="max-w-64 truncate">{expense.description}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatRupiah(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Hapus pengeluaran"
                          disabled={deleteExpenseMutation.isPending}
                          onClick={() => {
                            void deleteExpense(expense.id);
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {expensesQuery.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Memuat pengeluaran…
                    </TableCell>
                  </TableRow>
                )}
                {expensesQuery.isError && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-destructive">
                      {expenseApiErrorMessage(expensesQuery.error)}
                    </TableCell>
                  </TableRow>
                )}
                {!expensesQuery.isLoading && !expensesQuery.isError && expenseRows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      {EMPTY_SECTION_MESSAGE}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
