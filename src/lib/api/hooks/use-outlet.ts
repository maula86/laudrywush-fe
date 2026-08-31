import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useIsAuthenticated } from "@/lib/api/auth-store";
import { apiGet, apiPatch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { Outlet, UpdateOutletRequest } from "@/lib/api/types";

const emptyOutletResponseError = (): Error =>
  new Error("Respons profil outlet dari server kosong. Silakan coba lagi.");

export const useOutlet = () => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: queryKeys.outlet.all,
    queryFn: async (): Promise<Outlet> => {
      const response = await apiGet<Outlet>("/api/outlet");
      if (!response) throw emptyOutletResponseError();
      return response;
    },
    enabled: isAuthenticated,
  });
};

export const useUpdateOutlet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: UpdateOutletRequest): Promise<Outlet> => {
      const response = await apiPatch<Outlet>("/api/outlet", body);
      if (!response) throw emptyOutletResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.outlet.all });
    },
  });
};
