import { createFileRoute } from "@tanstack/react-router";
import { Building2, Search, User } from "lucide-react";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRupiah } from "@/lib/laundry/format";
import { useLaundryStore } from "@/store/laundry-store";

export const Route = createFileRoute("/dashboard/customers")({
  head: () => ({
    meta: [
      { title: "Data Pelanggan — LaundryWush" },
      {
        name: "description",
        content:
          "Database pelanggan laundry retail dan korporat lengkap dengan riwayat belanja dan nilai transaksi.",
      },
      { property: "og:title", content: "Data Pelanggan — LaundryWush" },
      {
        property: "og:description",
        content: "Kelola pelanggan setia laundry Anda beserta riwayat order dan total belanja.",
      },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const customers = useLaundryStore((s) => s.customers);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(q) ||
            (c.company ?? "").toLowerCase().includes(q),
        )
      : customers;
    return [...list].sort((a, b) => b.totalSpent - a.totalSpent);
  }, [customers, query]);

  const corporate = customers.filter((c) => c.type === "corporate").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Pelanggan</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} pelanggan terdaftar · {corporate} akun korporat.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Cari nama, HP, atau perusahaan"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Order</TableHead>
              <TableHead className="text-right">Total belanja</TableHead>
              <TableHead>Order terakhir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                    {c.type === "corporate" ? (
                      <>
                        <Building2 className="size-3.5 text-primary" />
                        {c.company ?? "Korporat"}
                      </>
                    ) : (
                      <>
                        <User className="size-3.5 text-muted-foreground" /> Retail
                      </>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">{c.totalOrders}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatRupiah(c.totalSpent)}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.lastOrderDate ? formatDate(c.lastOrderDate) : "—"}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  Pelanggan tidak ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
