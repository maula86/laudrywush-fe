import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  mockCustomers,
  mockExpenses,
  mockOrders,
  mockOutlet,
  mockServices,
  mockUsers,
} from "@/lib/laundry/mock-data";
import {
  ROLE_PERMISSIONS,
  type Customer,
  type Expense,
  type Order,
  type OrderItem,
  type OrderStatus,
  type OutletSettings,
  type Permission,
  type ServicePrice,
  type User,
  type UserRole,
} from "@/lib/laundry/types";

export interface NewOrderInput {
  customer: {
    id?: string;
    name: string;
    phone: string;
    type: Customer["type"];
    company?: string | null;
  };
  items: Omit<OrderItem, "id">[];
  paymentMethod: Order["paymentMethod"];
  discount: number;
  notes: string;
  estimatedHours: number;
}

interface LaundryState {
  users: User[];
  customers: Customer[];
  services: ServicePrice[];
  orders: Order[];
  expenses: Expense[];
  outlet: OutletSettings;
  currentUserId: string | null;
  login: (email: string) => User | null;
  logout: () => void;
  createOrder: (input: NewOrderInput) => Order;
  moveOrder: (orderId: string, status: OrderStatus) => void;
  markPaid: (orderId: string) => void;
  completeOrder: (orderId: string) => void;
  upsertService: (service: ServicePrice) => void;
  toggleUserActive: (userId: string) => void;
  addUser: (user: Omit<User, "id" | "createdAt" | "permissions"> & { role: UserRole }) => void;
  updateOutlet: (patch: Partial<OutletSettings>) => void;
  resetDemo: () => void;
}

const seed = () => ({
  users: mockUsers,
  customers: mockCustomers,
  services: mockServices,
  orders: mockOrders,
  expenses: mockExpenses,
  outlet: mockOutlet,
  currentUserId: null as string | null,
});

const pad = (n: number) => String(n).padStart(3, "0");

export const useLaundryStore = create<LaundryState>()(
  persist(
    (set, get) => ({
      ...seed(),

      login: (email) => {
        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.isActive,
        );
        if (user) set({ currentUserId: user.id });
        return user ?? null;
      },

      logout: () => set({ currentUserId: null }),

      createOrder: (input) => {
        const state = get();
        let customer = input.customer.id
          ? state.customers.find((c) => c.id === input.customer.id)
          : state.customers.find((c) => c.phone === input.customer.phone);

        let customers = state.customers;
        if (!customer) {
          customer = {
            id: `c${Date.now()}`,
            name: input.customer.name,
            phone: input.customer.phone,
            email: null,
            address: null,
            type: input.customer.type,
            company: input.customer.company ?? null,
            notes: "",
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null,
            createdAt: new Date().toISOString(),
          };
          customers = [...customers, customer];
        }

        const subtotal = input.items.reduce((sum, i) => sum + i.subtotal, 0);
        const tax = Math.round((subtotal * state.outlet.taxRate) / 100);
        const total = Math.max(0, subtotal + tax - input.discount);
        const now = new Date();
        const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1).slice(-2)}${pad(now.getDate()).slice(-2)}`;
        const todayCount =
          state.orders.filter((o) => o.orderNumber.includes(stamp)).length + 1;

        const order: Order = {
          id: `o${Date.now()}`,
          orderNumber: `LW-${stamp}-${pad(todayCount)}`,
          qrCode: `/tracking/LW-${stamp}-${pad(todayCount)}`,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerType: customer.type,
          items: input.items.map((item, i) => ({ ...item, id: `oi${Date.now()}${i}` })),
          subtotal,
          tax,
          discount: input.discount,
          total,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "piutang" ? "unpaid" : "paid",
          paidAmount: input.paymentMethod === "piutang" ? 0 : total,
          status: "pending",
          notes: input.notes,
          estimatedCompletion: new Date(
            now.getTime() + input.estimatedHours * 3600_000,
          ).toISOString(),
          actualCompletion: null,
          assignedOperator: null,
          createdBy: state.currentUserId ?? "u2",
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          history: [{ status: "pending", at: now.toISOString() }],
        };

        set({
          orders: [order, ...state.orders],
          customers: customers.map((c) =>
            c.id === customer!.id
              ? {
                  ...c,
                  totalOrders: c.totalOrders + 1,
                  totalSpent: c.totalSpent + total,
                  lastOrderDate: now.toISOString(),
                }
              : c,
          ),
        });
        return order;
      },

      moveOrder: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status,
                  updatedAt: new Date().toISOString(),
                  actualCompletion:
                    status === "completed" ? new Date().toISOString() : o.actualCompletion,
                  history: [...o.history, { status, at: new Date().toISOString() }],
                }
              : o,
          ),
        })),

      markPaid: (orderId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, paymentStatus: "paid", paidAmount: o.total, updatedAt: new Date().toISOString() }
              : o,
          ),
        })),

      completeOrder: (orderId) => get().moveOrder(orderId, "completed"),

      upsertService: (service) =>
        set((state) => ({
          services: state.services.some((s) => s.id === service.id)
            ? state.services.map((s) => (s.id === service.id ? service : s))
            : [...state.services, service],
        })),

      toggleUserActive: (userId) =>
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u)),
        })),

      addUser: (user) =>
        set((state) => ({
          users: [
            ...state.users,
            {
              ...user,
              id: `u${Date.now()}`,
              permissions: ROLE_PERMISSIONS[user.role],
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateOutlet: (patch) => set((state) => ({ outlet: { ...state.outlet, ...patch } })),

      resetDemo: () => set({ ...seed() }),
    }),
    { name: "laundrywush-store", version: 1 },
  ),
);

export const useCurrentUser = () =>
  useLaundryStore((s) => s.users.find((u) => u.id === s.currentUserId) ?? null);

export const hasPermission = (user: User | null, permission: Permission) => {
  if (!user) return false;
  if (user.permissions[0] === "*") return true;
  return (user.permissions as Permission[]).includes(permission);
};
