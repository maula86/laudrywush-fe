import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useIsAuthenticated, useSessionUser } from "@/lib/api/auth-store";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  CreateCustomerRequest,
  Customer,
  SuccessResponse,
  UpdateCustomerRequest,
} from "@/lib/api/types";

type UseCustomersOptions = {
  readonly search?: string;
};

type UpdateCustomerMutationInput = {
  readonly id: string;
  readonly body: UpdateCustomerRequest;
};

const emptyCustomerResponseError = (): Error =>
  new Error("Respons pelanggan dari server kosong. Silakan coba lagi.");

export const useCustomers = (options: UseCustomersOptions = {}) => {
  const isAuthenticated = useIsAuthenticated();
  const sessionUser = useSessionUser();
  const search = options.search?.trim();
  const filters = search ? { search } : {};
  const canReadCustomers = sessionUser?.role === "admin" || sessionUser?.role === "kasir";

  return useQuery({
    queryKey: queryKeys.customers.list(filters),
    queryFn: async (): Promise<Customer[]> => {
      const response = search
        ? await apiGet<Customer[]>("/api/customers", { query: { search } })
        : await apiGet<Customer[]>("/api/customers");
      return response ?? [];
    },
    enabled: isAuthenticated && canReadCustomers,
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateCustomerRequest): Promise<Customer> => {
      const response = await apiPost<Customer>("/api/customers", body);
      if (!response) throw emptyCustomerResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: UpdateCustomerMutationInput): Promise<Customer> => {
      const response = await apiPatch<Customer>(`/api/customers/${id}`, body);
      if (!response) throw emptyCustomerResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<SuccessResponse> => {
      const response = await apiDelete<SuccessResponse>(`/api/customers/${id}`);
      if (!response) throw emptyCustomerResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
    },
  });
};
