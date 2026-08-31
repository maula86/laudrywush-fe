type OrderFilters = {
  readonly status?: string;
  readonly payment?: string;
  readonly paymentStatus?: string;
  readonly search?: string;
  readonly range?: string;
};

type SearchFilters = {
  readonly search?: string;
};

type ServiceFilters = {
  readonly includeInactive?: true;
};

type RangeFilters = {
  readonly range?: string;
};

export const queryKeys = {
  outlet: {
    all: ["outlet"] as const,
  },
  services: {
    all: ["services"] as const,
    lists: () => ["services", "list"] as const,
    list: (filters: ServiceFilters = {}) => ["services", "list", filters] as const,
    detail: (id: string) => ["services", "detail", id] as const,
  },
  customers: {
    all: ["customers"] as const,
    lists: () => ["customers", "list"] as const,
    list: (filters: SearchFilters = {}) => ["customers", "list", filters] as const,
    detail: (id: string) => ["customers", "detail", id] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: () => ["orders", "list"] as const,
    list: (filters: OrderFilters = {}) => ["orders", "list", filters] as const,
    detail: (id: string) => ["orders", "detail", id] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    lists: () => ["expenses", "list"] as const,
    list: (filters: RangeFilters = {}) => ["expenses", "list", filters] as const,
    detail: (id: string) => ["expenses", "detail", id] as const,
  },
  reports: {
    all: ["reports"] as const,
    summary: (range?: string) => ["reports", "summary", { range }] as const,
    daily: (range?: string) => ["reports", "daily", { range }] as const,
    byService: (range?: string) => ["reports", "by-service", { range }] as const,
    byPayment: (range?: string) => ["reports", "by-payment", { range }] as const,
  },
  users: {
    all: ["users"] as const,
    lists: () => ["users", "list"] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  tracking: {
    all: ["tracking"] as const,
    detail: (orderNumber: string) => ["tracking", "detail", orderNumber] as const,
  },
} as const;
