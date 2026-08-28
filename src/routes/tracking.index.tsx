import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/laundry/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLaundryStore } from "@/store/laundry-store";

export const Route = createFileRoute("/tracking/")({
  head: () => ({
    meta: [
      { title: "Lacak Cucian — LaundryWush" },
      {
        name: "description",
        content:
          "Masukkan nomor nota atau nomor HP untuk melacak status cucian Anda secara real-time di LaundryWush.",
      },
      { property: "og:title", content: "Lacak Cucian — LaundryWush" },
      {
        property: "og:description",
        content: "Cek status cucian Anda tanpa perlu login. Cukup masukkan nomor nota.",
      },
    ],
  }),
  component: TrackingSearchPage,
});

function TrackingSearchPage() {
  const navigate = useNavigate();
  const orders = useLaundryStore((s) => s.orders);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recent = orders.slice(0, 4);

  const submit = () => {
    const q = query.trim().toLowerCase();
    const found = orders.find(
      (o) =>
        o.orderNumber.toLowerCase() === q ||
        o.customerPhone.replace(/\D/g, "") === q.replace(/\D/g, ""),
    );
    if (!found) {
      setError("Nomor nota atau nomor HP tidak ditemukan. Coba salah satu contoh di bawah.");
      return;
    }
    setError(null);
    navigate({ to: "/tracking/$orderNumber", params: { orderNumber: found.orderNumber } });
  };

  return (
    <main className="gradient-hero min-h-screen">
      <div className="container-app py-10">
        <Link className="inline-flex w-fit" to="/">
          <Logo />
        </Link>

        <div className="mx-auto mt-14 max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Lacak cucian kamu</h1>
          <p className="mt-3 text-muted-foreground">
            Masukkan nomor nota (contoh: LW-20250101-001) atau nomor HP yang terdaftar.
          </p>

          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Input
              className="h-12 bg-card text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nomor nota atau nomor HP"
              aria-label="Nomor nota atau nomor HP"
            />
            <Button className="h-12" size="lg" type="submit">
              <Search /> Lacak
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="mx-auto mt-14 max-w-xl">
          <p className="text-sm font-semibold text-muted-foreground uppercase">
            Contoh nota demo
          </p>
          <div className="mt-3 space-y-2">
            {recent.map((o) => (
              <Link
                key={o.id}
                to="/tracking/$orderNumber"
                params={{ orderNumber: o.orderNumber }}
                className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-card transition-colors hover:border-primary/40"
              >
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">{o.customerName}</p>
                </div>
                <span className="text-sm font-medium text-primary">Lihat status</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
