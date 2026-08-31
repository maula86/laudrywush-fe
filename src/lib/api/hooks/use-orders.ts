import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useIsAuthenticated } from "@/lib/api/auth-store";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/api/client";
import { useCustomers } from "@/lib/api/hooks/use-customers";
import {
  createOrderCustomerLookup,
  toOrderViewModels,
  type OrderCustomerLookup,
} from "@/lib/api/order-view-model";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  AssignOperatorRequest,
  CreateOrderRequest,
  DeleteOrderResponse,
  Order as ApiOrder,
  OrderHistoryEntry,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UpdateOrderPaymentRequest,
} from "@/lib/api/types";
import type { Order as ViewOrder } from "@/lib/laundry/types";

type UseOrdersFilters = {
  readonly status?: OrderStatus;
  readonly payment?: PaymentMethod;
  readonly paymentStatus?: PaymentStatus;
  readonly search?: string;
  readonly range?: number;
};

type OrderQueryParams = {
  readonly status?: OrderStatus;
  readonly payment?: PaymentMethod;
  readonly paymentStatus?: PaymentStatus;
  readonly search?: string;
  readonly range?: number;
};

type OrderQueryKeyFilters = {
  readonly status?: OrderStatus;
  readonly payment?: PaymentMethod;
  readonly paymentStatus?: PaymentStatus;
  readonly search?: string;
  readonly range?: string;
};

type UpdateOrderStatusMutationInput = {
  readonly id: string;
  readonly status: OrderStatus;
};

type UpdateOrderPaymentMutationInput = {
  readonly id: string;
  readonly body: UpdateOrderPaymentRequest;
};

type AssignOperatorMutationInput = {
  readonly id: string;
  readonly operatorId: string;
};

const emptyOrderResponseError = (): Error =>
  new Error("Respons order dari server kosong. Silakan coba lagi.");

const buildOrderFilters = (filters: UseOrdersFilters = {}): OrderQueryKeyFilters => {
  const search = filters.search?.trim();

  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.payment ? { payment: filters.payment } : {}),
    ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
    ...(search ? { search } : {}),
    ...(filters.range !== undefined ? { range: String(filters.range) } : {}),
  };
};

const buildOrderQuery = (filters: OrderQueryKeyFilters): OrderQueryParams => ({
  ...(filters.status ? { status: filters.status } : {}),
  ...(filters.payment ? { payment: filters.payment } : {}),
  ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
  ...(filters.search ? { search: filters.search } : {}),
  ...(filters.range ? { range: Number(filters.range) } : {}),
});

const hasQueryParams = (query: OrderQueryParams): boolean => Object.keys(query).length > 0;

const invalidateOrderCollections = (queryClient: ReturnType<typeof useQueryClient>): void => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
};

const invalidateCustomerCollections = (queryClient: ReturnType<typeof useQueryClient>): void => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
};

const invalidateReportCollections = (queryClient: ReturnType<typeof useQueryClient>): void => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
};

export const useOrders = (filters: UseOrdersFilters = {}) => {
  const isAuthenticated = useIsAuthenticated();
  const queryFilters = buildOrderFilters(filters);
  const query = buildOrderQuery(queryFilters);

  return useQuery({
    queryKey: queryKeys.orders.list(queryFilters),
    queryFn: async (): Promise<ApiOrder[]> => {
      const response = hasQueryParams(query)
        ? await apiGet<ApiOrder[]>("/api/orders", { query })
        : await apiGet<ApiOrder[]>("/api/orders");
      return response ?? [];
    },
    enabled: isAuthenticated,
  });
};

export const useOrderViewModels = (filters: UseOrdersFilters = {}) => {
  const ordersQuery = useOrders(filters);
  const customersQuery = useCustomers();
  const customerLookup = useMemo<OrderCustomerLookup | undefined>(() => {
    if (!customersQuery.data) return undefined;
    return createOrderCustomerLookup(customersQuery.data);
  }, [customersQuery.data]);
  const orders = useMemo<ViewOrder[]>(
    () => toOrderViewModels(ordersQuery.data ?? [], customerLookup),
    [ordersQuery.data, customerLookup],
  );

  return {
    ...ordersQuery,
    orders,
    customerLookup,
    customersQuery,
  };
};

export const useOrder = (id: string) => {
  const isAuthenticated = useIsAuthenticated();
  const orderId = id.trim();

  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async (): Promise<ApiOrder> => {
      const response = await apiGet<ApiOrder>(`/api/orders/${orderId}`);
      if (!response) throw emptyOrderResponseError();
      return response;
    },
    enabled: isAuthenticated && orderId.length > 0,
  });
};

export const useOrderHistory = (id: string) => {
  const isAuthenticated = useIsAuthenticated();
  const orderId = id.trim();

  return useQuery({
    queryKey: [...queryKeys.orders.detail(orderId), "history"] as const,
    queryFn: async (): Promise<OrderHistoryEntry[]> => {
      const response = await apiGet<OrderHistoryEntry[]>(`/api/orders/${orderId}/history`);
      return response ?? [];
    },
    enabled: isAuthenticated && orderId.length > 0,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateOrderRequest): Promise<ApiOrder> => {
      const response = await apiPost<ApiOrder>("/api/orders", body);
      if (!response) throw emptyOrderResponseError();
      return response;
    },
    onSuccess: () => {
      invalidateOrderCollections(queryClient);
      invalidateCustomerCollections(queryClient);
      invalidateReportCollections(queryClient);
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: UpdateOrderStatusMutationInput): Promise<ApiOrder> => {
      const response = await apiPatch<ApiOrder>(`/api/orders/${id}/status`, { status });
      if (!response) throw emptyOrderResponseError();
      return response;
    },
    onSuccess: () => {
      invalidateOrderCollections(queryClient);
      invalidateReportCollections(queryClient);
      invalidateCustomerCollections(queryClient);
    },
  });
};

export const useUpdateOrderPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: UpdateOrderPaymentMutationInput): Promise<ApiOrder> => {
      const response = await apiPatch<ApiOrder>(`/api/orders/${id}/payment`, body);
      if (!response) throw emptyOrderResponseError();
      return response;
    },
    onSuccess: () => {
      invalidateOrderCollections(queryClient);
      invalidateReportCollections(queryClient);
    },
  });
};

export const useAssignOperator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, operatorId }: AssignOperatorMutationInput): Promise<ApiOrder> => {
      const body: AssignOperatorRequest = { operatorId };
      const response = await apiPatch<ApiOrder>(`/api/orders/${id}/assign-operator`, body);
      if (!response) throw emptyOrderResponseError();
      return response;
    },
    onSuccess: () => {
      invalidateOrderCollections(queryClient);
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<DeleteOrderResponse> => {
      const response = await apiDelete<DeleteOrderResponse>(`/api/orders/${id}`);
      if (!response) throw emptyOrderResponseError();
      return response;
    },
    onSuccess: () => {
      invalidateOrderCollections(queryClient);
      invalidateCustomerCollections(queryClient);
      invalidateReportCollections(queryClient);
    },
  });
};

export const orderApiErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    if (error instanceof TypeError) return "Tidak dapat menghubungi server.";
    if (error instanceof Error) return error.message;
    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  if (error.code === "invalid_transition") {
    return "Status order tidak bisa dipindah langsung ke tahap itu.";
  }

  if (error.code === "paid_amount_exceeds_total") {
    return "Jumlah bayar melebihi total order.";
  }

  if (error.code === "invalid_payment_status") {
    return "Status pembayaran tidak sesuai dengan jumlah yang dibayar.";
  }

  return error.message;
};
