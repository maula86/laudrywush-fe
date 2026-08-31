import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  Printer,
  Search,
  Wallet,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";

import { ReceiptDialog } from "@/components/laundry/receipt-dialog";
import { PaymentBadge, StatusBadge } from "@/components/laundry/status-badge";
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
import { formatDateTime, formatRupiah } from "@/lib/laundry/format";
import {
  PAYMENT_LABEL,
  PAYMENT_STATUS_LABEL,
  STATUS_LABEL,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/laundry/types";
import {
  orderApiErrorMessage,
  useOrderViewModels,
  useUpdateOrderPayment,
  useUpdateOrderStatus,
} from "@/lib/api/hooks/use-orders";
import { useOutlet } from "@/lib/api/hooks/use-outlet";

export const Route = createFileRoute("/dashboard/orders")({
  head: () => ({
    meta: [
      { title: "Manajemen Order — LaundryWush" },
      {
        name: "description",
        content:
          "Cari, filter, dan kelola seluruh order laundry beserta status produksi dan pembayarannya.",
      },
      { property: "og:title", content: "Manajemen Order — LaundryWush" },
      {
        property: "og:description",
        content: "Daftar order laundry lengkap dengan status, pembayaran, dan cetak nota ulang.",
      },
    ],
  }),
  component: OrdersPage,
});

const csvEscape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

function OrdersPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [payment, setPayment] = useState<"all" | PaymentStatus>("all");
  const [receipt, setReceipt] = useState<Order | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const outletQuery = useOutlet();
  const ordersQuery = useOrderViewModels({
    ...(status !== "all" ? { status } : {}),
    ...(payment !== "all" ? { paymentStatus: payment } : {}),
    ...(debouncedQuery.trim() ? { search: debouncedQuery.trim() } : {}),
  });
  const markPaidMutation = useUpdateOrderPayment();
  const completeOrderMutation = useUpdateOrderStatus();
  const orders = ordersQuery.orders;
  const outlet = outletQuery.data;
  const trimmedDebouncedQuery = debouncedQuery.trim();
  const hasActiveFilter = status !== "all" || payment !== "all" || trimmedDebouncedQuery.length > 0;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const markPaid = async (order: Order) => {
    if (markPaidMutation.isPending) return;

    try {
      await markPaidMutation.mutateAsync({
        id: order.id,
        body: { paidAmount: order.total, status: "paid" },
      });
      toast.success(`${order.orderNumber} ditandai lunas.`);
    } catch (error) {
      toast.error(orderApiErrorMessage(error));
    }
  };

  const completeOrder = async (order: Order) => {
    if (completeOrderMutation.isPending) return;

    try {
      await completeOrderMutation.mutateAsync({ id: order.id, status: "completed" });
      toast.success(`${order.orderNumber} selesai diambil.`);
    } catch (error) {
      toast.error(orderApiErrorMessage(error));
    }
  };

  const exportCsv = () => {
    if (!orders.length) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }
    const header = [
      "Nota",
      "Pelanggan",
      "HP",
      "Masuk",
      "Status",
      "Pembayaran",
      "Metode",
      "Subtotal",
      "Pajak",
      "Diskon",
      "Total",
    ];
    const rows = orders.map((o) =>
      [
        o.orderNumber,
        o.customerName,
        o.customerPhone,
        formatDateTime(o.createdAt),
        STATUS_LABEL[o.status],
        PAYMENT_STATUS_LABEL[o.paymentStatus],
        PAYMENT_LABEL[o.paymentMethod],
        o.subtotal,
        o.tax,
        o.discount,
        o.total,
      ].map(csvEscape),
    );
    const csv = [header.map(csvEscape), ...rows].map((r) => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-laundrywush-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${orders.length} order diekspor ke CSV.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Order</h1>
        <p className="text-sm text-muted-foreground">
          {orders.length} order dimuat.
          {hasActiveFilter ? " Hasil sudah difilter di server." : ""}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Cari nomor nota, nama, atau HP"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={payment} onValueChange={(v) => setPayment(v as typeof payment)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua pembayaran</SelectItem>
            {(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map((p) => (
              <SelectItem key={p} value={p}>
                {PAYMENT_STATUS_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}>
          <Download /> Ekspor CSV
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Nota</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Masuk</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bayar</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <Fragment key={order.id}>
                <TableRow>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={expanded === order.id ? "Tutup detail" : "Lihat detail"}
                      onClick={() => setExpanded((prev) => (prev === order.id ? null : order.id))}
                    >
                      {expanded === order.id ? <ChevronDown /> : <ChevronRight />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={order.paymentStatus} />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {PAYMENT_LABEL[order.paymentMethod]}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatRupiah(order.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {order.paymentStatus !== "paid" && (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Tandai lunas"
                          disabled={markPaidMutation.isPending}
                          onClick={() => {
                            void markPaid(order);
                          }}
                        >
                          <Wallet />
                        </Button>
                      )}
                      {order.status === "ready" && (
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Selesaikan order"
                          disabled={completeOrderMutation.isPending}
                          onClick={() => {
                            void completeOrder(order);
                          }}
                        >
                          <CheckCircle2 />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Lihat nota"
                        onClick={() => setReceipt(order)}
                      >
                        <Printer />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expanded === order.id && (
                  <TableRow className="bg-surface/60">
                    <TableCell colSpan={8}>
                      <div className="grid gap-4 py-2 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Rincian layanan
                          </p>
                          <ul className="mt-2 space-y-1 text-sm">
                            {order.items.map((item) => (
                              <li key={item.id} className="flex justify-between gap-4">
                                <span>
                                  {item.serviceName} × {item.quantity}
                                </span>
                                <span className="tabular-nums">{formatRupiah(item.subtotal)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 space-y-1 border-t pt-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span className="tabular-nums">{formatRupiah(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Pajak</span>
                              <span className="tabular-nums">{formatRupiah(order.tax)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Diskon</span>
                              <span className="tabular-nums">- {formatRupiah(order.discount)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Riwayat status
                          </p>
                          <ul className="mt-2 space-y-1 text-sm">
                            {order.history.map((h, i) => (
                              <li key={`${h.status}-${i}`} className="flex justify-between gap-4">
                                <span>{STATUS_LABEL[h.status]}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDateTime(h.at)}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-3 text-xs text-muted-foreground">
                            Estimasi selesai: {formatDateTime(order.estimatedCompletion)}
                          </p>
                          {order.notes && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Catatan: {order.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}

            {ordersQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Memuat order…
                </TableCell>
              </TableRow>
            )}

            {ordersQuery.isError && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-destructive">
                  {orderApiErrorMessage(ordersQuery.error)}
                </TableCell>
              </TableRow>
            )}

            {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  {hasActiveFilter
                    ? "Tidak ada order yang cocok dengan filter."
                    : "Belum ada order."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ReceiptDialog
        order={receipt}
        outlet={outlet}
        open={receipt !== null}
        onOpenChange={(open) => !open && setReceipt(null)}
      />
    </div>
  );
}
