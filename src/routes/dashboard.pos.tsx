import { createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { formatNumber, formatRupiah } from "@/lib/laundry/format";
import {
  PAYMENT_LABEL,
  type CustomerType,
  type Order,
  type PaymentMethod,
} from "@/lib/laundry/types";
import { useLaundryStore } from "@/store/laundry-store";

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

function PosPage() {
  const allServices = useLaundryStore((s) => s.services);
  const services = useMemo(() => allServices.filter((x) => x.isActive), [allServices]);
  const customers = useLaundryStore((s) => s.customers);
  const outlet = useLaundryStore((s) => s.outlet);
  const createOrder = useLaundryStore((s) => s.createOrder);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType>("retail");
  const [company, setCompany] = useState("");
  const [customerId, setCustomerId] = useState<string | null>(null);

  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<Order | null>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .slice(0, 5);
  }, [customers, query]);

  const lines = cart.map((line) => {
    const service = services.find((s) => s.id === line.serviceId)!;
    return {
      ...line,
      service,
      subtotal: Math.round(service.pricePerUnit * line.quantity),
    };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const discountValue = Math.max(0, Number(discount) || 0);
  const tax = Math.round((subtotal * outlet.taxRate) / 100);
  const total = Math.max(0, subtotal + tax - discountValue);
  const estimatedHours = lines.reduce((max, l) => Math.max(max, l.service.estimatedHours), 24);

  const setQty = (serviceId: string, quantity: number) =>
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.serviceId !== serviceId)
        : prev.map((l) => (l.serviceId === serviceId ? { ...l, quantity } : l)),
    );

  const addService = (serviceId: string) =>
    setCart((prev) =>
      prev.some((l) => l.serviceId === serviceId)
        ? prev.map((l) =>
            l.serviceId === serviceId ? { ...l, quantity: l.quantity + 1 } : l,
          )
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

  const submit = () => {
    if (!lines.length) {
      toast.error("Tambahkan minimal satu layanan.");
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      toast.error("Nama dan nomor HP pelanggan wajib diisi.");
      return;
    }

    const order = createOrder({
      customer: {
        ...(customerId ? { id: customerId } : {}),
        name: customerName.trim(),
        phone: customerPhone.trim(),
        type: customerType,
        company: customerType === "corporate" ? company.trim() || null : null,
      },
      items: lines.map((l) => ({
        serviceId: l.service.id,
        serviceName: l.service.name,
        quantity: l.quantity,
        unitPrice: l.service.pricePerUnit,
        subtotal: l.subtotal,
        notes: null,
      })),
      paymentMethod: payment,
      discount: discountValue,
      notes,
      estimatedHours,
    });

    setReceipt(order);
    toast.success(`Order ${order.orderNumber} berhasil dibuat.`);
    reset();
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
                            Number((line.quantity - (line.service.unit === "kg" ? 0.5 : 1)).toFixed(1)),
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
                            Number((line.quantity + (line.service.unit === "kg" ? 0.5 : 1)).toFixed(1)),
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
                  onValueChange={(v) => setCustomerType(v as CustomerType)}
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
                <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} />
                <SummaryRow label={`Pajak ${outlet.taxRate}%`} value={formatRupiah(tax)} />
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

              <Button className="w-full" size="lg" onClick={submit}>
                Simpan & Cetak Nota
              </Button>
            </div>
          </div>
        </div>
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
