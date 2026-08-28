import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/laundry/logo";
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
import { type UserRole } from "@/lib/laundry/types";
import { useLaundryStore } from "@/store/laundry-store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Daftar Outlet — LaundryWush" },
      {
        name: "description",
        content:
          "Buat akun outlet LaundryWush dan mulai kelola order, produksi, serta laporan laundry dalam satu aplikasi.",
      },
      { property: "og:title", content: "Daftar Outlet — LaundryWush" },
      {
        property: "og:description",
        content: "Registrasi outlet laundry dan langsung coba POS, papan produksi, dan laporan.",
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
  const navigate = useNavigate();
  const addUser = useLaundryStore((s) => s.addUser);
  const login = useLaundryStore((s) => s.login);
  const updateOutlet = useLaundryStore((s) => s.updateOutlet);

  const [outletName, setOutletName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Nama dan email wajib diisi.");
      return;
    }
    addUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role,
      avatar: null,
      isActive: true,
    });
    if (outletName.trim()) updateOutlet({ name: outletName.trim() });
    const user = login(email.trim());
    if (!user) {
      toast.error("Gagal masuk otomatis, silakan login manual.");
      navigate({ to: "/login" });
      return;
    }
    toast.success(`Akun ${user.name} dibuat.`, { description: "Selamat mencoba LaundryWush!" });
    navigate({ to: role === "operator" ? "/dashboard/production" : "/dashboard" });
  };

  return (
    <main className="gradient-hero min-h-screen">
      <div className="container-app flex min-h-screen flex-col justify-center py-12">
        <Link className="mb-10 inline-flex w-fit" to="/">
          <Logo />
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">Daftar outlet baru</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Demo interaktif — akun tersimpan di perangkat kamu.
            </p>

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div className="space-y-2">
                <Label htmlFor="outlet">Nama outlet</Label>
                <Input
                  id="outlet"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  placeholder="Laundry Bersih Wangi"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nama pemilik / staf</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Budi Santoso"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="phone">Nomor HP</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Peran</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin / Owner</SelectItem>
                    <SelectItem value="kasir">Kasir</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button className="w-full" size="lg" type="submit">
                Buat akun <ArrowRight />
              </Button>
            </form>

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
                <li key={b} className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card">
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
