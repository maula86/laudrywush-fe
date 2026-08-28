export type UserRole = "admin" | "kasir" | "operator";
export type PaymentMethod = "cash" | "transfer" | "qris" | "piutang";
export type CustomerType = "retail" | "corporate";
export type ServiceType =
  | "kiloan_regular"
  | "kiloan_express"
  | "satuan_regular"
  | "satuan_express";
export type OrderStatus =
  | "pending"
  | "washing"
  | "drying"
  | "ironing"
  | "packing"
  | "ready"
  | "completed"
  | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "partial" | "overdue";

export type Permission =
  | "view_dashboard"
  | "create_order"
  | "view_orders"
  | "update_production"
  | "view_reports"
  | "manage_settings";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  permissions: Permission[] | ["*"];
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  type: CustomerType;
  company: string | null;
  notes: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
}

export interface ServicePrice {
  id: string;
  name: string;
  type: ServiceType;
  pricePerUnit: number;
  unit: "kg" | "pcs";
  estimatedHours: number;
  isActive: boolean;
}

export interface OrderItem {
  id: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  /** Relative tracking path encoded into the receipt QR code. */
  qrCode?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerType: CustomerType;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  status: OrderStatus;
  notes: string;
  estimatedCompletion: string;
  actualCompletion: string | null;
  assignedOperator: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  history: { status: OrderStatus; at: string }[];
}

export interface Expense {
  id: string;
  category: "detergent" | "electricity" | "water" | "salary" | "maintenance" | "other";
  amount: number;
  description: string;
  date: string;
}

export interface OutletSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: {
    weekday: { open: string; close: string };
    weekend: { open: string; close: string };
  };
  taxRate: number;
  currency: string;
  receiptFooter: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "view_dashboard",
    "create_order",
    "view_orders",
    "update_production",
    "view_reports",
    "manage_settings",
  ],
  kasir: ["view_dashboard", "create_order", "view_orders"],
  operator: ["view_orders", "update_production"],
};

export const PRODUCTION_STAGES: {
  status: OrderStatus;
  label: string;
  tone: string;
}[] = [
  { status: "pending", label: "Antri", tone: "stage-pending" },
  { status: "washing", label: "Dicuci", tone: "stage-washing" },
  { status: "drying", label: "Dikeringkan", tone: "stage-drying" },
  { status: "ironing", label: "Disetrika", tone: "stage-ironing" },
  { status: "packing", label: "Packing", tone: "stage-packing" },
  { status: "ready", label: "Siap Ambil", tone: "stage-ready" },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Antri",
  washing: "Dicuci",
  drying: "Dikeringkan",
  ironing: "Disetrika",
  packing: "Packing",
  ready: "Siap Ambil",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  transfer: "Transfer",
  qris: "QRIS",
  piutang: "Piutang",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Belum Bayar",
  paid: "Lunas",
  partial: "Sebagian",
  overdue: "Jatuh Tempo",
};
