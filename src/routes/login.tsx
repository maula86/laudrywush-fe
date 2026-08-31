import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/laundry/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { useLogin } from "@/lib/api/hooks/use-auth";
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

const demoCredential = {
  email: "admin@laundrywush.local",
  password: "ChangeMe123!",
  role: "Admin / Owner",
  desc: "Akses penuh ke dashboard, laporan, dan pengaturan dari server demo.",
} as const;

const loginErrorMessage = (error: Error): string => {
  if (error instanceof ApiError && error.status === 401) return "Email atau password salah.";
  if (error instanceof TypeError) return "Tidak dapat menghubungi server.";
  return error.message;
};

function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState<string>(demoCredential.email);
  const [password, setPassword] = useState<string>(demoCredential.password);

  const submit = async () => {
    try {
      const response = await login.mutateAsync({ email, password });
      toast.success(`Selamat datang, ${response.user.name}`);
      await navigate({
        to: response.user.role === "operator" ? "/dashboard/production" : "/dashboard",
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error("Gagal masuk", { description: loginErrorMessage(error) });
        return;
      }
      toast.error("Gagal masuk", { description: "Terjadi kesalahan saat masuk." });
    }
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
              Masuk dengan akun yang tersimpan aman di server LaundryWush.
            </p>

            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
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
              <Button className="w-full" size="lg" type="submit" disabled={login.isPending}>
                {login.isPending ? "Memproses…" : "Masuk"} <ArrowRight />
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
              Sesi login menggunakan token dari server dan disimpan di perangkat ini.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase">Akun demo</h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setEmail(demoCredential.email);
                  setPassword(demoCredential.password);
                }}
                className={cn(
                  "w-full rounded-xl border bg-card p-4 text-left shadow-card transition-all",
                  "hover:border-primary/40 hover:shadow-elevated",
                )}
              >
                <p className="font-semibold">{demoCredential.role}</p>
                <p className="text-sm text-muted-foreground">{demoCredential.desc}</p>
                <p className="mt-2 text-xs font-medium text-primary">{demoCredential.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Password: {demoCredential.password}
                </p>
              </button>
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
