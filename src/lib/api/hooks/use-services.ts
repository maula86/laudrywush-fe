import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useIsAuthenticated } from "@/lib/api/auth-store";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  CreateServiceRequest,
  Service,
  SuccessResponse,
  UpdateServiceRequest,
} from "@/lib/api/types";

type UseServicesOptions = {
  readonly includeInactive?: boolean;
};

type UpdateServiceMutationInput = {
  readonly id: string;
  readonly body: UpdateServiceRequest;
};

const emptyServiceResponseError = (): Error =>
  new Error("Respons layanan dari server kosong. Silakan coba lagi.");

export const useServices = (options: UseServicesOptions = {}) => {
  const isAuthenticated = useIsAuthenticated();
  const includeInactive = options.includeInactive === true;

  return useQuery({
    queryKey: queryKeys.services.list(includeInactive ? { includeInactive: true } : {}),
    queryFn: async (): Promise<Service[]> => {
      const response = includeInactive
        ? await apiGet<Service[]>("/api/services", { query: { includeInactive: true } })
        : await apiGet<Service[]>("/api/services");
      return response ?? [];
    },
    enabled: isAuthenticated,
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateServiceRequest): Promise<Service> => {
      const response = await apiPost<Service>("/api/services", body);
      if (!response) throw emptyServiceResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: UpdateServiceMutationInput): Promise<Service> => {
      const response = await apiPatch<Service>(`/api/services/${id}`, body);
      if (!response) throw emptyServiceResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });
};

export const useDeactivateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<SuccessResponse> => {
      const response = await apiDelete<SuccessResponse>(`/api/services/${id}`);
      if (!response) throw emptyServiceResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });
};
