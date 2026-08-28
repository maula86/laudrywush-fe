import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  ClipboardCheck,
  KanbanSquare,
  QrCode,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import heroImage from "@/assets/hero-dashboard.jpg";
import { Logo } from "@/components/laundry/logo";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/laundry/format";
import { subscriptionPlans } from "@/lib/laundry/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LaundryWush — Sistem Manajemen Laundry untuk UMKM & Korporat" },
      {
        name: "description",
        content:
          "Kelola laundry kiloan & satuan dari satu aplikasi: POS kasir, production board kanban, tracking pelanggan, dan laporan omzet real-time.",
      },
      { property: "og:title", content: "LaundryWush — Sistem Manajemen Laundry Modern" },
      {
        property: "og:description",
        content:
          "POS kasir, kanban produksi, tracking nota via QR, dan laporan keuangan untuk bisnis laundry UMKM & kontrak korporat.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const services = [
  {
    icon: ScanLine,
    title: "POS Kasir Cepat",
    desc: "Input berat, pilih layanan, harga terhitung otomatis. Nota + QR code langsung tercetak.",
  },
  {
    icon: KanbanSquare,
    title: "Production Board",
    desc: "Pantau cucian dari Antri sampai Siap Ambil dengan kanban drag & drop antar stage.",
  },
  {
    icon: QrCode,
    title: "Tracking Pelanggan",
    desc: "Pelanggan cek status cucian sendiri lewat nomor nota atau scan QR — tanpa login.",
  },
  {
    icon: BarChart3,
    title: "Laporan & Piutang",
    desc: "Omzet harian, layanan terlaris, dan tagihan korporat yang jatuh tempo dalam satu layar.",
  },
  {
    icon: Users,
    title: "Multi Role (RBAC)",
    desc: "Admin, kasir, dan operator punya akses berbeda sesuai tanggung jawabnya.",
  },
  {
    icon: ShieldCheck,
    title: "B2C & B2B Siap",
    desc: "Harga retail dan kontrak korporat dengan pembayaran piutang dan invoice bulanan.",
  },
];

const testimonials = [
  {
    name: "Rudi Hartono",
    role: "Owner, Laundry Bersih Wangi",
    quote:
      "Dulu catat pakai buku, sering salah hitung. Sekarang omzet harian langsung kelihatan dan pelanggan berhenti telepon nanya cucian.",
  },
  {
    name: "Melati Puspa",
    role: "Owner, Melati Laundry Express",
    quote:
      "Production board-nya paling kepakai. Operator tinggal geser kartu, saya tahu ada 12 cucian yang belum disetrika.",
  },
  {
    name: "Agus Prasetyo",
    role: "Manajer, Laundry Mitra Hotel",
    quote:
      "Kontrak hotel kami butuh invoice bulanan. Fitur piutang korporatnya bikin penagihan jauh lebih rapi.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a className="transition-colors hover:text-foreground" href="#fitur">
              Fitur
            </a>
            <a className="transition-colors hover:text-foreground" href="#testimoni">
              Testimoni
            </a>
            <a className="transition-colors hover:text-foreground" href="#harga">
              Harga
            </a>
            <Link className="transition-colors hover:text-foreground" to="/tracking">
              Lacak Cucian
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Masuk</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">Coba Gratis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="gradient-hero border-b">
          <div className="container-app grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-card">
                <Sparkles className="size-3.5 text-accent" />
                Untuk laundry kiloan & satuan
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
                Kelola laundry lebih mudah dengan{" "}
                <span className="text-gradient-brand">LaundryWush</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Sistem manajemen laundry modern untuk UMKM dan pelanggan korporat. Kasir,
                produksi, tracking, dan laporan keuangan dalam satu aplikasi.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/login">
                    Mulai Gratis <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/tracking">Lihat Demo Tracking</Link>
                </Button>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
                {[
                  { k: "1.200+", v: "Outlet laundry" },
                  { k: "98%", v: "Nota akurat" },
                  { k: "5 menit", v: "Setup awal" },
                ].map((s) => (
                  <div key={s.v}>
                    <dt className="text-2xl font-bold tabular-nums">{s.k}</dt>
                    <dd className="text-xs text-muted-foreground">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="relative">
              <div className="gradient-brand absolute -inset-4 rounded-3xl opacity-15 blur-2xl" />
              <img
                src={heroImage}
                alt="Tampilan dashboard LaundryWush dengan ringkasan omzet dan papan produksi"
                width={1280}
                height={960}
                className="relative w-full rounded-2xl border shadow-elevated"
              />
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="fitur" className="py-16 md:py-24">
          <div className="container-app">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Semua yang dibutuhkan operasional laundry
              </h2>
              <p className="mt-3 text-muted-foreground">
                Dari nota masuk sampai cucian diambil, semuanya tercatat rapi.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((s) => (
                <div
                  key={s.title}
                  className="rounded-xl border bg-card p-6 shadow-card transition-shadow hover:shadow-elevated"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimoni" className="border-y bg-surface py-16 md:py-24">
          <div className="container-app">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Dipakai pemilik laundry di seluruh Indonesia
              </h2>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {testimonials.map((t) => (
                <figure key={t.name} className="rounded-xl border bg-card p-6 shadow-card">
                  <div className="flex gap-0.5 text-warning">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm text-foreground">"{t.quote}"</blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t pt-4">
                    <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {t.name.charAt(0)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">{t.role}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="harga" className="py-16 md:py-24">
          <div className="container-app">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">Pilih paket yang sesuai</h2>
              <p className="mt-3 text-muted-foreground">
                Tanpa biaya setup. Bisa berhenti kapan saja.
              </p>
            </div>
            <div className="mt-12 grid items-start gap-6 md:grid-cols-3">
              {subscriptionPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={cn(
                    "relative rounded-2xl border bg-card p-6 shadow-card",
                    plan.popular && "border-primary/40 shadow-elevated md:-mt-3 md:pb-8",
                  )}
                >
                  {plan.popular && (
                    <span className="gradient-brand absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-semibold text-primary-foreground">
                      Paling Populer
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="mt-3">
                    <span className="text-metric">{formatRupiah(plan.price)}</span>
                    <span className="text-sm text-muted-foreground">/bulan</span>
                  </p>
                  <ul className="mt-6 space-y-3 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-success-foreground" />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="mt-7 w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    <Link to="/login">{plan.cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container-app pb-16 md:pb-24">
          <div className="gradient-brand flex flex-col items-center gap-5 rounded-2xl px-6 py-12 text-center shadow-elevated">
            <ClipboardCheck className="size-9 text-primary-foreground" />
            <h2 className="max-w-xl text-2xl font-bold text-primary-foreground sm:text-3xl">
              Siap merapikan operasional laundry Anda?
            </h2>
            <p className="max-w-lg text-sm text-primary-foreground/85">
              Masuk ke demo dan coba semua fitur dengan data contoh — tidak perlu kartu kredit.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to="/login">
                Buka Demo Dashboard <ArrowRight />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t bg-surface">
        <div className="container-app grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Sistem manajemen laundry modern untuk UMKM dan kontrak korporat di Indonesia.
            </p>
          </div>
          <FooterCol
            title="Produk"
            links={[
              { label: "Fitur", href: "#fitur" },
              { label: "Harga", href: "#harga" },
            ]}
          />
          <div>
            <h3 className="text-sm font-semibold">Aplikasi</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link className="hover:text-foreground" to="/tracking">
                  Lacak Cucian
                </Link>
              </li>
              <li>
                <Link className="hover:text-foreground" to="/login">
                  Masuk Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Kontak</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Smartphone className="size-4" /> 0812-1234-5678
              </li>
              <li>hello@laundrywush.com</li>
              <li>Jl. Sukajadi No. 88, Bandung</li>
            </ul>
          </div>
        </div>
        <div className="container-app border-t py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} LaundryWush. Seluruh hak cipta dilindungi.
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            <a className="hover:text-foreground" href={l.href}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
