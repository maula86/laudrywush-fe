import type {
  Customer,
  Expense,
  Order,
  OrderStatus,
  OutletSettings,
  ServicePrice,
  User,
} from "./types";

const iso = (d: Date) => d.toISOString();
const hoursAgo = (h: number) => iso(new Date(Date.now() - h * 3600_000));
const hoursAhead = (h: number) => iso(new Date(Date.now() + h * 3600_000));

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Andi Wijaya",
    email: "admin@laundrywush.com",
    phone: "0812-1234-5678",
    role: "admin",
    permissions: ["*"],
    avatar: null,
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "u2",
    name: "Sari Kasir",
    email: "kasir@laundrywush.com",
    phone: "0812-2345-6789",
    role: "kasir",
    permissions: ["view_dashboard", "create_order", "view_orders"],
    avatar: null,
    isActive: true,
    createdAt: "2024-02-11T00:00:00.000Z",
  },
  {
    id: "u3",
    name: "Joko Operator",
    email: "operator@laundrywush.com",
    phone: "0812-3456-7890",
    role: "operator",
    permissions: ["view_orders", "update_production"],
    avatar: null,
    isActive: true,
    createdAt: "2024-03-02T00:00:00.000Z",
  },
];

export const mockServices: ServicePrice[] = [
  {
    id: "s1",
    name: "Cuci Kiloan Regular",
    type: "kiloan_regular",
    pricePerUnit: 7000,
    unit: "kg",
    estimatedHours: 48,
    isActive: true,
  },
  {
    id: "s2",
    name: "Cuci Kiloan Express",
    type: "kiloan_express",
    pricePerUnit: 12000,
    unit: "kg",
    estimatedHours: 8,
    isActive: true,
  },
  {
    id: "s3",
    name: "Satuan Regular (Kemeja/Jas)",
    type: "satuan_regular",
    pricePerUnit: 15000,
    unit: "pcs",
    estimatedHours: 48,
    isActive: true,
  },
  {
    id: "s4",
    name: "Satuan Express (Kemeja/Jas)",
    type: "satuan_express",
    pricePerUnit: 25000,
    unit: "pcs",
    estimatedHours: 6,
    isActive: true,
  },
];

export const mockCustomers: Customer[] = [
  {
    id: "c1",
    name: "Budi Santoso",
    phone: "0812-3456-7890",
    email: "budi@mail.com",
    address: "Jl. Melati No. 12, Bandung",
    type: "retail",
    company: null,
    notes: "Tidak pakai pewangi kuat",
    totalOrders: 14,
    totalSpent: 512000,
    lastOrderDate: hoursAgo(6),
    createdAt: "2024-05-10T00:00:00.000Z",
  },
  {
    id: "c2",
    name: "Siti Aminah",
    phone: "0813-1111-2222",
    email: null,
    address: "Jl. Kenanga No. 5, Bandung",
    type: "retail",
    company: null,
    notes: "",
    totalOrders: 8,
    totalSpent: 296000,
    lastOrderDate: hoursAgo(20),
    createdAt: "2024-07-01T00:00:00.000Z",
  },
  {
    id: "c3",
    name: "Deni Kurniawan",
    phone: "0857-9090-1234",
    email: "deni@mail.com",
    address: null,
    type: "retail",
    company: null,
    notes: "",
    totalOrders: 3,
    totalSpent: 84000,
    lastOrderDate: hoursAgo(30),
    createdAt: "2024-11-19T00:00:00.000Z",
  },
  {
    id: "c4",
    name: "Rina Hotel Purnama",
    phone: "022-555-1010",
    email: "purchasing@hotelpurnama.co.id",
    address: "Jl. Asia Afrika No. 100, Bandung",
    type: "corporate",
    company: "Hotel Purnama",
    notes: "Invoice bulanan, tempo 14 hari",
    totalOrders: 26,
    totalSpent: 8450000,
    lastOrderDate: hoursAgo(4),
    createdAt: "2024-03-15T00:00:00.000Z",
  },
  {
    id: "c5",
    name: "Klinik Sehat Bersama",
    phone: "022-555-2020",
    email: "admin@kliniksehat.id",
    address: "Jl. Sukajadi No. 44, Bandung",
    type: "corporate",
    company: "Klinik Sehat Bersama",
    notes: "Seragam medis, wajib disinfektan",
    totalOrders: 11,
    totalSpent: 3120000,
    lastOrderDate: hoursAgo(52),
    createdAt: "2024-06-08T00:00:00.000Z",
  },
];

let seq = 0;
const orderNumber = (daysAgo: number) => {
  const d = new Date(Date.now() - daysAgo * 86400_000);
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  seq += 1;
  return `LW-${stamp}-${String(seq).padStart(3, "0")}`;
};

interface Seed {
  customerId: string;
  serviceId: string;
  qty: number;
  status: OrderStatus;
  method: Order["paymentMethod"];
  paymentStatus: Order["paymentStatus"];
  hoursAgo: number;
  daysAgo: number;
  operator?: string | null;
}

const seeds: Seed[] = [
  { customerId: "c1", serviceId: "s1", qty: 3.5, status: "pending", method: "cash", paymentStatus: "paid", hoursAgo: 1, daysAgo: 0 },
  { customerId: "c2", serviceId: "s2", qty: 5, status: "washing", method: "qris", paymentStatus: "paid", hoursAgo: 3, daysAgo: 0, operator: "u3" },
  { customerId: "c3", serviceId: "s1", qty: 2, status: "pending", method: "cash", paymentStatus: "unpaid", hoursAgo: 4, daysAgo: 0 },
  { customerId: "c4", serviceId: "s1", qty: 42, status: "drying", method: "piutang", paymentStatus: "unpaid", hoursAgo: 6, daysAgo: 0, operator: "u3" },
  { customerId: "c1", serviceId: "s3", qty: 4, status: "ironing", method: "transfer", paymentStatus: "paid", hoursAgo: 8, daysAgo: 0 },
  { customerId: "c5", serviceId: "s4", qty: 18, status: "packing", method: "piutang", paymentStatus: "partial", hoursAgo: 10, daysAgo: 0, operator: "u3" },
  { customerId: "c2", serviceId: "s1", qty: 6.5, status: "ready", method: "cash", paymentStatus: "paid", hoursAgo: 22, daysAgo: 1 },
  { customerId: "c3", serviceId: "s2", qty: 4, status: "ready", method: "qris", paymentStatus: "paid", hoursAgo: 26, daysAgo: 1 },
  { customerId: "c4", serviceId: "s1", qty: 35, status: "completed", method: "piutang", paymentStatus: "overdue", hoursAgo: 30, daysAgo: 1 },
  { customerId: "c1", serviceId: "s1", qty: 5, status: "completed", method: "cash", paymentStatus: "paid", hoursAgo: 48, daysAgo: 2 },
  { customerId: "c5", serviceId: "s3", qty: 12, status: "completed", method: "transfer", paymentStatus: "paid", hoursAgo: 54, daysAgo: 2 },
  { customerId: "c2", serviceId: "s2", qty: 3, status: "completed", method: "qris", paymentStatus: "paid", hoursAgo: 72, daysAgo: 3 },
  { customerId: "c3", serviceId: "s1", qty: 8, status: "completed", method: "cash", paymentStatus: "paid", hoursAgo: 80, daysAgo: 3 },
  { customerId: "c4", serviceId: "s2", qty: 28, status: "completed", method: "piutang", paymentStatus: "paid", hoursAgo: 96, daysAgo: 4 },
  { customerId: "c1", serviceId: "s1", qty: 4.5, status: "completed", method: "cash", paymentStatus: "paid", hoursAgo: 104, daysAgo: 4 },
  { customerId: "c2", serviceId: "s3", qty: 6, status: "completed", method: "transfer", paymentStatus: "paid", hoursAgo: 120, daysAgo: 5 },
  { customerId: "c5", serviceId: "s1", qty: 22, status: "completed", method: "piutang", paymentStatus: "paid", hoursAgo: 128, daysAgo: 5 },
  { customerId: "c3", serviceId: "s2", qty: 5, status: "completed", method: "qris", paymentStatus: "paid", hoursAgo: 144, daysAgo: 6 },
  { customerId: "c1", serviceId: "s1", qty: 7, status: "completed", method: "cash", paymentStatus: "paid", hoursAgo: 150, daysAgo: 6 },
  { customerId: "c4", serviceId: "s1", qty: 30, status: "completed", method: "piutang", paymentStatus: "paid", hoursAgo: 160, daysAgo: 6 },
];

const TAX_RATE = 0;

export const mockOrders: Order[] = seeds.map((seed, i) => {
  const customer = mockCustomers.find((c) => c.id === seed.customerId)!;
  const service = mockServices.find((s) => s.id === seed.serviceId)!;
  const subtotal = Math.round(service.pricePerUnit * seed.qty);
  const tax = Math.round((subtotal * TAX_RATE) / 100);
  const total = subtotal + tax;
  const createdAt = hoursAgo(seed.hoursAgo);
  return {
    id: `o${i + 1}`,
    orderNumber: orderNumber(seed.daysAgo),
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerType: customer.type,
    items: [
      {
        id: `oi${i + 1}`,
        serviceId: service.id,
        serviceName: service.name,
        quantity: seed.qty,
        unitPrice: service.pricePerUnit,
        subtotal,
        notes: null,
      },
    ],
    subtotal,
    tax,
    discount: 0,
    total,
    paymentMethod: seed.method,
    paymentStatus: seed.paymentStatus,
    paidAmount:
      seed.paymentStatus === "paid" ? total : seed.paymentStatus === "partial" ? Math.round(total / 2) : 0,
    status: seed.status,
    notes: "",
    estimatedCompletion: hoursAhead(service.estimatedHours - seed.hoursAgo),
    actualCompletion: seed.status === "completed" ? hoursAgo(Math.max(0, seed.hoursAgo - 6)) : null,
    assignedOperator: seed.operator ?? null,
    createdBy: i % 3 === 0 ? "u1" : "u2",
    createdAt,
    updatedAt: createdAt,
    history: [{ status: "pending", at: createdAt }],
  };
});

export const mockExpenses: Expense[] = [
  { id: "e1", category: "detergent", amount: 450000, description: "Deterjen & pewangi 20L", date: hoursAgo(20) },
  { id: "e2", category: "electricity", amount: 1250000, description: "Listrik bulanan", date: hoursAgo(72) },
  { id: "e3", category: "water", amount: 620000, description: "Air PDAM", date: hoursAgo(96) },
  { id: "e4", category: "salary", amount: 4500000, description: "Gaji 2 operator", date: hoursAgo(120) },
  { id: "e5", category: "maintenance", amount: 350000, description: "Servis mesin cuci #2", date: hoursAgo(150) },
];

export const mockOutlet: OutletSettings = {
  name: "LaundryWush Sukajadi",
  address: "Jl. Sukajadi No. 88, Bandung, Jawa Barat",
  phone: "0812-1234-5678",
  email: "hello@laundrywush.com",
  operatingHours: {
    weekday: { open: "07:00", close: "21:00" },
    weekend: { open: "08:00", close: "18:00" },
  },
  taxRate: TAX_RATE,
  currency: "IDR",
  receiptFooter: "Terima kasih telah mempercayakan cucian Anda kepada LaundryWush!",
};

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
];
