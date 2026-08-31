import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { Logo } from "@/components/laundry/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Daftar Outlet — LaundryWush" },
      {
        name: "description",
        content:
          "Akun outlet dan staf LaundryWush dibuat oleh administrator melalui menu Pengaturan → Pengguna.",
      },
      { property: "og:title", content: "Daftar Outlet — LaundryWush" },
      {
        property: "og:description",
        content: "Pelajari cara administrator membuat akun outlet dan staf di LaundryWush.",
      },
    ],
  }),
  component: RegisterPage,
});

const benefits = [
  "POS kiloan & satuan dengan nota QR",
  "Papan produksi drag & drop 6 tahap",
  "Laporan omzet, biaya, dan piutang",
  "Tracking pelanggan tanpa login",
];

function RegisterPage() {
  return (
    <main className="gradient-hero min-h-screen">
      <div className="container-app flex min-h-screen flex-col justify-center py-12">
        <Link className="mb-10 inline-flex w-fit" to="/">
          <Logo />
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">Akun dibuat oleh administrator</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Self-service signup tidak tersedia. Akun outlet dan staf diprovisikan dari backend
              oleh admin.
            </p>

            <div className="mt-6 space-y-4 rounded-xl border bg-muted/30 p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Alur yang dipakai</p>
                <p className="text-sm text-muted-foreground">
                  Admin masuk ke{" "}
                  <span className="font-medium text-foreground">Pengaturan → Pengguna</span> untuk
                  menambah, mengubah, atau menonaktifkan akun staf.
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Kenapa tidak ada formulir di sini?</p>
                <p className="text-sm text-muted-foreground">
                  Backend hanya menerima pembuatan pengguna dari token admin, jadi proses registrasi
                  publik memang sengaja dimatikan.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/login">
                  Ke halaman masuk <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <Link to="/tracking">Lacak cucian</Link>
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Sudah punya akun?{" "}
              <Link className="font-medium text-primary hover:underline" to="/login">
                Masuk di sini
              </Link>
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              Yang kamu dapat
            </h2>
            <ul className="mt-4 space-y-3">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-sm">{b}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Pelanggan hanya ingin cek status?{" "}
              <Link className="font-medium text-primary hover:underline" to="/tracking">
                Lacak cucian di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
