import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/laundry/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLaundryStore } from "@/store/laundry-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Masuk Demo — LaundryWush" },
      {
        name: "description",
        content:
          "Masuk ke demo LaundryWush sebagai admin, kasir, atau operator untuk mencoba POS, papan produksi, dan laporan laundry.",
      },
      { property: "og:title", content: "Masuk Demo — LaundryWush" },
      {
        property: "og:description",
        content: "Coba demo aplikasi manajemen laundry LaundryWush tanpa daftar.",
      },
    ],
  }),
  component: LoginPage,
});

const demoAccounts = [
  {
    email: "admin@laundrywush.com",
    role: "Admin / Owner",
    desc: "Akses penuh: dashboard, laporan, pengaturan",
  },
  {
    email: "kasir@laundrywush.com",
    role: "Kasir",
    desc: "Buat order, kelola pembayaran, cetak nota",
  },
  {
    email: "operator@laundrywush.com",
    role: "Operator",
    desc: "Papan produksi & update status cucian",
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const login = useLaundryStore((s) => s.login);
  const [email, setEmail] = useState("admin@laundrywush.com");
  const [password, setPassword] = useState("demo1234");

  const submit = (value: string) => {
    const user = login(value);
    if (!user) {
      toast.error("Akun tidak ditemukan", {
        description: "Gunakan salah satu akun demo di sebelah kanan.",
      });
      return;
    }
    toast.success(`Selamat datang, ${user.name}`);
    navigate({ to: user.role === "operator" ? "/dashboard/production" : "/dashboard" });
  };

  return (
    <main className="gradient-hero min-h-screen">
      <div className="container-app flex min-h-screen flex-col justify-center py-12">
        <Link className="mb-10 inline-flex w-fit" to="/">
          <Logo />
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">Masuk ke dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Demo interaktif — data tersimpan di perangkat kamu.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit(email);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@laundry.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" size="lg" type="submit">
                Masuk <ArrowRight />
              </Button>
            </form>

            <p className="mt-4 text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link className="font-medium text-primary hover:underline" to="/register">
                Daftar outlet baru
              </Link>
            </p>

            <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success-foreground" />
              Password apa pun diterima pada mode demo.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">
              Pilih akun demo
            </h2>
            <div className="mt-4 space-y-3">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    submit(acc.email);
                  }}
                  className={cn(
                    "w-full rounded-xl border bg-card p-4 text-left shadow-card transition-all",
                    "hover:border-primary/40 hover:shadow-elevated",
                  )}
                >
                  <p className="font-semibold">{acc.role}</p>
                  <p className="text-sm text-muted-foreground">{acc.desc}</p>
                  <p className="mt-2 text-xs font-medium text-primary">{acc.email}</p>
                </button>
              ))}
            </div>
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
