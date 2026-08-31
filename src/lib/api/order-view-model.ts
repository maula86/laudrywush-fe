import type { Customer as ApiCustomer, Order as ApiOrder } from "@/lib/api/types";
import type { Order as ViewOrder } from "@/lib/laundry/types";

type OrderCustomerSnapshot = {
  readonly name: string;
  readonly phone: string;
  readonly type: ViewOrder["customerType"];
};

export type OrderCustomerLookup = (customerId: string) => OrderCustomerSnapshot | undefined;

type CustomerLookupSource = Pick<ApiCustomer, "id" | "name" | "phone" | "type">;

export const createOrderCustomerLookup = (
  customers: readonly CustomerLookupSource[],
): OrderCustomerLookup => {
  const customersById = new Map<string, OrderCustomerSnapshot>(
    customers.map((customer) => [
      customer.id,
      {
        name: customer.name,
        phone: customer.phone,
        type: customer.type,
      },
    ]),
  );

  return (customerId: string): OrderCustomerSnapshot | undefined => customersById.get(customerId);
};

export const toOrderViewModel = (apiOrder: ApiOrder, lookup?: OrderCustomerLookup): ViewOrder => {
  const customer = apiOrder.customerId ? lookup?.(apiOrder.customerId) : undefined;

  return {
    id: apiOrder.id,
    orderNumber: apiOrder.orderNumber,
    qrCode: `/tracking/${apiOrder.orderNumber}`,
    customerId: apiOrder.customerId ?? "",
    customerName: customer?.name ?? (apiOrder.customerId ? "—" : "Pelanggan umum"),
    customerPhone: customer?.phone ?? "",
    customerType: customer?.type ?? "retail",
    items: apiOrder.items.map((item) => ({ ...item })),
    subtotal: apiOrder.subtotal,
    tax: apiOrder.tax,
    discount: apiOrder.discount,
    total: apiOrder.total,
    paymentMethod: apiOrder.paymentMethod,
    paymentStatus: apiOrder.paymentStatus,
    paidAmount: apiOrder.paidAmount,
    status: apiOrder.status,
    notes: apiOrder.notes ?? "",
    // Existing UI formats this value with date-fns; falling back avoids new Date(null) rendering bugs.
    estimatedCompletion: apiOrder.estimatedCompletion ?? apiOrder.createdAt,
    actualCompletion: apiOrder.actualCompletion,
    assignedOperator: apiOrder.assignedOperatorId,
    createdBy: apiOrder.createdBy,
    createdAt: apiOrder.createdAt,
    updatedAt: apiOrder.updatedAt,
    history: apiOrder.history.map((entry) => ({ ...entry })),
  };
};

export const toOrderViewModels = (
  orders: readonly ApiOrder[],
  lookup?: OrderCustomerLookup,
): ViewOrder[] => orders.map((order) => toOrderViewModel(order, lookup));
