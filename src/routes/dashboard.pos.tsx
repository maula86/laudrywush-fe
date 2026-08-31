import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ReceiptDialog } from "@/components/laundry/receipt-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/lib/api/hooks/use-customers";
import { orderApiErrorMessage, useCreateOrder } from "@/lib/api/hooks/use-orders";
import { useOutlet } from "@/lib/api/hooks/use-outlet";
import { useServices } from "@/lib/api/hooks/use-services";
import {
  createOrderCustomerLookup,
  toOrderViewModel,
  type OrderCustomerLookup,
} from "@/lib/api/order-view-model";
import type { CreateOrderRequest, Service } from "@/lib/api/types";
import { formatNumber, formatRupiah } from "@/lib/laundry/format";
import {
  PAYMENT_LABEL,
  type CustomerType,
  type Order,
  type PaymentMethod,
  type ServicePrice,
} from "@/lib/laundry/types";

export const Route = createFileRoute("/dashboard/pos")({
  head: () => ({
    meta: [
      { title: "Kasir POS — LaundryWush" },
      {
        name: "description",
        content:
          "Buat order laundry kiloan maupun satuan, hitung total otomatis, dan cetak nota dengan QR tracking.",
      },
      { property: "og:title", content: "Kasir POS — LaundryWush" },
      {
        property: "og:description",
        content: "Input order laundry cepat dengan kalkulasi harga dan nota digital.",
      },
    ],
  }),
  component: PosPage,
});

interface CartLine {
  serviceId: string;
  quantity: number;
}

const toServicePrice = (service: Service): ServicePrice => ({
  id: service.id,
  name: service.name,
  type: service.type,
  pricePerUnit: service.pricePerUnit,
  unit: service.unit,
  estimatedHours: service.estimatedHours,
  isActive: service.isActive,
});

function PosPage() {
  const servicesQuery = useServices();
  const outletQuery = useOutlet();
  const createOrderMutation = useCreateOrder();
  const services = useMemo(
    () => (servicesQuery.data ?? []).filter((service) => service.isActive).map(toServicePrice),
    [servicesQuery.data],
  );

  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType>("retail");
  const [company, setCompany] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<Order | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const customerSearch = debouncedQuery.trim();
  const customersQuery = useCustomers({ search: customerSearch });
  const customersData = customersQuery.data;
  const customerLookup = useMemo(
    () => createOrderCustomerLookup(customersData ?? []),
    [customersData],
  );

  // The server already narrowed by name/phone; cap the dropdown at five rows.
  const suggestions = useMemo(
    () => (customerSearch ? (customersData ?? []).slice(0, 5) : []),
    [customersData, customerSearch],
  );

  const lines = cart.flatMap((line) => {
    const service = services.find((item) => item.id === line.serviceId);
    if (!service) return [];
    return [
      {
        ...line,
        service,
        subtotal: Math.round(service.pricePerUnit * line.quantity),
      },
    ];
  });

  const outlet = outletQuery.data;
  const taxRate = outlet?.taxRate ?? 0;
  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const discountValue = Math.max(0, Number(discount) || 0);
  const tax = Math.round((subtotal * taxRate) / 100);
  const total = Math.max(0, subtotal + tax - discountValue);
  const estimatedHours = Math.round(
    lines.reduce((max, line) => Math.max(max, line.service.estimatedHours), 24),
  );

  const setQty = (serviceId: string, quantity: number) =>
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.serviceId !== serviceId)
        : prev.map((l) => (l.serviceId === serviceId ? { ...l, quantity } : l)),
    );

  const addService = (serviceId: string) =>
    setCart((prev) =>
      prev.some((l) => l.serviceId === serviceId)
        ? prev.map((l) => (l.serviceId === serviceId ? { ...l, quantity: l.quantity + 1 } : l))
        : [...prev, { serviceId, quantity: 1 }],
    );

  const reset = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerType("retail");
    setCompany("");
    setCustomerId(null);
    setQuery("");
    setDiscount("0");
    setNotes("");
    setPayment("cash");
  };

  const submit = async () => {
    if (createOrderMutation.isPending) {
      return;
    }

    if (!lines.length) {
      toast.error("Tambahkan minimal satu layanan.");
      return;
    }

    if (lines.some((line) => line.quantity <= 0)) {
      toast.error("Qty setiap layanan harus lebih dari 0.");
      return;
    }

    const trimmedCustomerName = customerName.trim();
    const trimmedCustomerPhone = customerPhone.trim();
    const trimmedCompany = company.trim();
    const trimmedNotes = notes.trim();
    const hasExistingCustomer = customerId !== null;
    const hasInlineCustomerInput =
      trimmedCustomerName.length > 0 || trimmedCustomerPhone.length > 0;
    const inlineCustomerSnapshot =
      !hasExistingCustomer && hasInlineCustomerInput && trimmedCustomerName && trimmedCustomerPhone
        ? {
            name: trimmedCustomerName,
            phone: trimmedCustomerPhone,
            type: customerType,
          }
        : undefined;

    if (
      !hasExistingCustomer &&
      hasInlineCustomerInput &&
      (!trimmedCustomerName || !trimmedCustomerPhone)
    ) {
      toast.error(
        "Isi nama dan nomor HP pelanggan, atau kosongkan keduanya untuk order tanpa pelanggan.",
      );
      return;
    }

    const requestBody: CreateOrderRequest = {
      items: lines.map((line) => ({
        serviceId: line.service.id,
        quantity: line.quantity,
      })),
      paymentMethod: payment,
      ...(hasExistingCustomer ? { customerId } : {}),
      ...(!hasExistingCustomer && hasInlineCustomerInput
        ? {
            newCustomer: {
              name: trimmedCustomerName,
              phone: trimmedCustomerPhone,
              type: customerType,
              ...(customerType === "corporate" && trimmedCompany
                ? { company: trimmedCompany }
                : {}),
            },
          }
        : {}),
      ...(discountValue > 0 ? { discount: discountValue } : {}),
      ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      estimatedHours: Math.round(estimatedHours),
    };

    try {
      const order = await createOrderMutation.mutateAsync(requestBody);
      /**
       * Resolve the receipt name from the customers cache first. When the order
       * created a brand-new customer the server returns its fresh id, which is
       * not in the cache yet, so fall back to what the cashier just typed.
       */
      const receiptLookup: OrderCustomerLookup = (id) =>
        customerLookup?.(id) ?? inlineCustomerSnapshot;

      setReceipt(toOrderViewModel(order, receiptLookup));
      toast.success(`Order ${order.orderNumber} berhasil dibuat.`);
      reset();
    } catch (error) {
      toast.error(orderApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kasir / POS</h1>
        <p className="text-sm text-muted-foreground">
          Pilih layanan, isi data pelanggan, lalu cetak nota dengan QR tracking.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Daftar layanan</h2>
            {servicesQuery.isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Memuat layanan…</p>
            ) : servicesQuery.isError ? (
              <p className="mt-4 text-sm text-destructive">Gagal memuat layanan.</p>
            ) : services.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Belum ada layanan aktif.</p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => addService(service.id)}
                    className="rounded-lg border bg-surface p-4 text-left transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <p className="text-sm font-semibold">{service.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRupiah(service.pricePerUnit)} / {service.unit} · estimasi{" "}
                      {service.estimatedHours} jam
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Keranjang</h2>
            {lines.length === 0 ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <ShoppingCart className="size-4" /> Belum ada layanan dipilih.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {lines.map((line) => (
                  <div
                    key={line.serviceId}
                    className="flex flex-wrap items-center gap-3 rounded-lg border bg-surface p-3"
                  >
                    <div className="min-w-40 flex-1">
                      <p className="text-sm font-medium">{line.service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(line.service.pricePerUnit)} / {line.service.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setQty(
                            line.serviceId,
                            Number(
                              (line.quantity - (line.service.unit === "kg" ? 0.5 : 1)).toFixed(1),
                            ),
                          )
                        }
                        aria-label="Kurangi"
                      >
                        <Minus />
                      </Button>
                      <Input
                        className="w-20 text-center"
                        value={line.quantity}
                        onChange={(e) => setQty(line.serviceId, Number(e.target.value) || 0)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setQty(
                            line.serviceId,
                            Number(
                              (line.quantity + (line.service.unit === "kg" ? 0.5 : 1)).toFixed(1),
                            ),
                          )
                        }
                        aria-label="Tambah"
                      >
                        <Plus />
                      </Button>
                    </div>
                    <p className="w-28 text-right text-sm font-semibold tabular-nums">
                      {formatRupiah(line.subtotal)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setQty(line.serviceId, 0)}
                      aria-label="Hapus"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Data pelanggan</h2>
            <div className="mt-4 space-y-3">
              <div className="relative">
                <Label htmlFor="cust-search">Cari pelanggan</Label>
                <div className="relative mt-1.5">
                  <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
                  <Input
                    id="cust-search"
                    className="pl-9"
                    placeholder="Nama atau nomor HP"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Kosongkan data pelanggan jika ingin membuat order tanpa pelanggan.
                </p>
                {suggestions.length > 0 && (
                  <div className="mt-1 overflow-hidden rounded-lg border bg-popover shadow-md">
                    {suggestions.map((c) => (
                      <button
                        key={c.id}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-accent/40"
                        onClick={() => {
                          setCustomerId(c.id);
                          setCustomerName(c.name);
                          setCustomerPhone(c.phone);
                          setCustomerType(c.type);
                          setCompany(c.company ?? "");
                          setQuery("");
                        }}
                      >
                        {c.name} · {c.phone}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="cust-name">Nama</Label>
                <Input
                  id="cust-name"
                  className="mt-1.5"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerId(null);
                    setCustomerName(e.target.value);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="cust-phone">Nomor HP</Label>
                <Input
                  id="cust-phone"
                  className="mt-1.5"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerId(null);
                    setCustomerPhone(e.target.value);
                  }}
                />
              </div>
              <div>
                <Label>Tipe pelanggan</Label>
                <Select
                  value={customerType}
                  onValueChange={(value) => {
                    if (value === "retail" || value === "corporate") {
                      setCustomerType(value);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">Retail / Perorangan</SelectItem>
                    <SelectItem value="corporate">Corporate / Instansi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {customerType === "corporate" && (
                <div>
                  <Label htmlFor="cust-company">Nama perusahaan</Label>
                  <Input
                    id="cust-company"
                    className="mt-1.5"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Cth: Hotel Melati"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-card">
            <h2 className="text-sm font-semibold">Pembayaran</h2>
            <div className="mt-4 space-y-3">
              <div>
                <Label>Metode</Label>
                <Select value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discount">Diskon (Rp)</Label>
                <Input
                  id="discount"
                  className="mt-1.5"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  className="mt-1.5"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Cth: pisahkan pakaian putih"
                />
              </div>

              <div className="space-y-1.5 border-t pt-3 text-sm">
                {/* Preview only for cashier UX; the backend remains authoritative for order totals. */}
                <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} />
                <SummaryRow label={`Pajak ${taxRate}%`} value={formatRupiah(tax)} />
                <SummaryRow label="Diskon" value={`- ${formatRupiah(discountValue)}`} />
                <SummaryRow
                  label="Total berat/pcs"
                  value={`${formatNumber(lines.reduce((s, l) => s + l.quantity, 0))} unit`}
                />
                <div className="flex items-center justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatRupiah(total)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => void submit()}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? "Menyimpan…" : "Simpan & Cetak Nota"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ReceiptDialog
        order={receipt}
        outlet={outlet}
        open={receipt !== null && Boolean(outlet)}
        onOpenChange={(open) => !open && setReceipt(null)}
      />
    </div>
  );
}

function SummaryRow({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
