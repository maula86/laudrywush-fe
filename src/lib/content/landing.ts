export type SubscriptionPlan = {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  readonly popular: boolean;
  readonly cta: string;
  readonly features: readonly string[];
};

// Static marketing content with no backend source.
export const subscriptionPlans = [
  {
    id: "starter",
    name: "Starter",
    price: 99000,
    popular: false,
    cta: "Pilih Starter",
    features: ["2 pengguna", "500 order / bulan", "POS & nota digital", "Laporan dasar"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 199000,
    popular: true,
    cta: "Pilih Pro",
    features: [
      "5 pengguna",
      "Order tanpa batas",
      "Production board kanban",
      "Halaman tracking pelanggan",
      "Laporan lanjutan",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 499000,
    popular: false,
    cta: "Hubungi Kami",
    features: [
      "Pengguna tanpa batas",
      "Multi-outlet",
      "Kontrak korporat & piutang",
      "Prioritas support 24/7",
    ],
  },
] satisfies readonly SubscriptionPlan[];
