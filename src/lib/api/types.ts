export const ROLES = ["admin", "kasir", "operator"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  "pending",
  "washing",
  "drying",
  "ironing",
  "packing",
  "ready",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "transfer", "qris", "piutang"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "partial", "overdue"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CUSTOMER_TYPES = ["retail", "corporate"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const SERVICE_TYPES = [
  "kiloan_regular",
  "kiloan_express",
  "satuan_regular",
  "satuan_express",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_UNITS = ["kg", "pcs"] as const;
export type ServiceUnit = (typeof SERVICE_UNITS)[number];

export const EXPENSE_CATEGORIES = [
  "detergent",
  "electricity",
  "water",
  "salary",
  "maintenance",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Outlet = {
  readonly id: string;
  readonly name: string;
  readonly address: string;
  readonly phone: string;
  readonly email: string;
  readonly taxRate: number;
  readonly currency: string;
  readonly receiptFooter: string;
};

export type PublicUser = {
  readonly id: string;
  readonly outletId: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly avatar: string | null;
  readonly role: Role;
  readonly isActive: boolean;
};

export type SessionUser = {
  readonly id: string;
  readonly name: string;
  readonly role: Role;
};

export type Customer = {
  readonly id: string;
  readonly outletId: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string | null;
  readonly address: string | null;
  readonly type: CustomerType;
  readonly company: string | null;
  readonly notes: string | null;
  readonly totalOrders: number;
  readonly totalSpent: number;
  readonly lastOrderDate: string | null;
  readonly isActive: boolean;
};

export type Service = {
  readonly id: string;
  readonly outletId: string;
  readonly name: string;
  readonly type: ServiceType;
  readonly pricePerUnit: number;
  readonly unit: ServiceUnit;
  readonly estimatedHours: number;
  readonly isActive: boolean;
};

export type OrderItem = {
  readonly id: string;
  readonly serviceId: string;
  readonly serviceName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly notes: string | null;
};

export type OrderHistoryEntry = {
  readonly status: OrderStatus;
  readonly at: string;
};

export type Order = {
  readonly id: string;
  readonly orderNumber: string;
  readonly customerId: string | null;
  readonly outletId: string;
  readonly subtotal: number;
  readonly tax: number;
  readonly discount: number;
  readonly total: number;
  readonly paymentMethod: PaymentMethod;
  readonly paymentStatus: PaymentStatus;
  readonly paidAmount: number;
  readonly status: OrderStatus;
  readonly notes: string | null;
  readonly estimatedCompletion: string | null;
  readonly actualCompletion: string | null;
  readonly assignedOperatorId: string | null;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly items: readonly OrderItem[];
  readonly history: readonly OrderHistoryEntry[];
};

export type Expense = {
  readonly id: string;
  readonly outletId: string;
  readonly category: ExpenseCategory;
  readonly amount: number;
  readonly description: string;
  readonly date: string;
  readonly isActive: boolean;
};

export type Tracking = {
  readonly orderNumber: string;
  readonly status: OrderStatus;
  readonly paymentStatus: PaymentStatus;
  readonly estimatedCompletion: string | null;
  readonly history: readonly OrderHistoryEntry[];
};

export type ReportSummary = {
  readonly revenue: number;
  readonly spending: number;
  readonly profit: number;
  readonly receivable: number;
};

export type DailyReportRow = {
  readonly day: string;
  readonly omzet: number;
  readonly biaya: number;
};

export type ServiceReportRow = {
  readonly name: string;
  readonly qty: number;
  readonly revenue: number;
  readonly contribution: number;
};

export type PaymentReportRow = {
  readonly method: PaymentMethod;
  readonly total: number;
};

export type LoginRequest = {
  readonly email: string;
  readonly password: string;
};

export type LoginResponse = {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: SessionUser;
};

export type RefreshRequest = {
  readonly refreshToken: string;
};

export type RefreshResponse = {
  readonly accessToken: string;
  readonly refreshToken: string;
};

export type NewCustomerRequest = {
  readonly name: string;
  readonly phone: string;
  readonly type?: CustomerType;
  readonly email?: string;
  readonly address?: string;
  readonly company?: string;
  readonly notes?: string;
};

export type CreateOrderItemRequest = {
  readonly serviceId: string;
  readonly quantity: number;
};

export type CreateOrderRequest = {
  readonly customerId?: string;
  readonly newCustomer?: NewCustomerRequest;
  readonly items: readonly CreateOrderItemRequest[];
  readonly paymentMethod: PaymentMethod;
  readonly discount?: number;
  readonly notes?: string;
  readonly estimatedHours?: number;
};

export type UpdateOrderStatusRequest = {
  readonly status: OrderStatus;
};

export type UpdateOrderPaymentRequest = {
  readonly method?: PaymentMethod;
  readonly status?: PaymentStatus;
  readonly paidAmount?: number;
};

export type AssignOperatorRequest = {
  readonly operatorId: string;
};

export type CreateCustomerRequest = {
  readonly name: string;
  readonly phone: string;
  readonly email?: string;
  readonly address?: string;
  readonly type: CustomerType;
  readonly company?: string;
  readonly notes?: string;
};

export type UpdateCustomerRequest = {
  readonly name?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly address?: string;
  readonly type?: CustomerType;
  readonly company?: string;
  readonly notes?: string;
};

export type CreateServiceRequest = {
  readonly name: string;
  readonly type: ServiceType;
  readonly pricePerUnit: number;
  readonly unit: ServiceUnit;
  readonly estimatedHours: number;
  readonly isActive?: boolean;
};

export type UpdateServiceRequest = {
  readonly name?: string;
  readonly type?: ServiceType;
  readonly pricePerUnit?: number;
  readonly unit?: ServiceUnit;
  readonly estimatedHours?: number;
  readonly isActive?: boolean;
};

export type UpdateOutletRequest = {
  readonly name?: string;
  readonly address?: string;
  readonly phone?: string;
  readonly email?: string;
  readonly taxRate?: number;
  readonly receiptFooter?: string;
};

export type CreateExpenseRequest = {
  readonly category: ExpenseCategory;
  readonly amount: number;
  readonly description: string;
  readonly date: string;
};

export type UpdateExpenseRequest = {
  readonly category?: ExpenseCategory;
  readonly amount?: number;
  readonly description?: string;
  readonly date?: string;
};

export type SuccessResponse = {
  readonly success: true;
};

export type DeleteOrderResponse = {
  readonly success: true;
  readonly status: OrderStatus;
};

export type ToggleUserActiveResponse = {
  readonly id: string;
  readonly isActive: boolean;
};

export type CreateUserRequest = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly role: Role;
  readonly phone?: string;
  readonly avatar?: string;
  readonly isActive?: boolean;
};

export type UpdateUserRequest = {
  readonly name?: string;
  readonly email?: string;
  readonly password?: string;
  readonly role?: Role;
  readonly phone?: string;
  readonly avatar?: string;
  readonly isActive?: boolean;
};
