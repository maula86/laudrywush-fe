import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ClipboardList, QrCode, Search } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/laundry/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/tracking/")({
  head: () => ({
    meta: [
      { title: "Lacak Cucian — LaundryWush" },
      {
        name: "description",
        content:
          "Masukkan nomor nota untuk melacak status cucian Anda secara real-time di LaundryWush.",
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
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const orderNumber = query.trim();
    if (!orderNumber) {
      setError("Masukkan nomor nota terlebih dahulu.");
      return;
    }

    setError(null);
    void navigate({ to: "/tracking/$orderNumber", params: { orderNumber } });
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
            Masukkan nomor nota yang tercetak pada struk cucian untuk melihat progres terbaru.
          </p>

          <form
            className="mt-8 flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <Input
              className="h-12 bg-card text-base"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Contoh: LW-20260830-001"
              aria-label="Nomor nota"
            />
            <Button className="h-12" size="lg" type="submit">
              <Search /> Lacak
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <div className="mx-auto mt-14 max-w-xl">
          <p className="text-sm font-semibold text-muted-foreground uppercase">
            Di mana menemukan nomor nota?
          </p>
          <div className="mt-3 rounded-xl border bg-card p-4 shadow-card">
            <div className="flex gap-3">
              <ClipboardList className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-semibold">Cek struk cucian</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Nomor nota tercetak pada struk yang diberikan oleh kasir saat pesanan dibuat.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-3 border-t pt-4">
              <QrCode className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-semibold">Pindai QR pada struk</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Jika struk memiliki QR code, pindai kode tersebut untuk membuka halaman pelacakan
                  langsung.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
