import { useMutation, useQueryClient } from "@tanstack/react-query";

import { clearSession, setSession } from "@/lib/api/auth-store";
import { apiPost } from "@/lib/api/client";
import type { LoginRequest, LoginResponse, Role } from "@/lib/api/types";

export type DashboardNavPath =
  | "/dashboard"
  | "/dashboard/pos"
  | "/dashboard/orders"
  | "/dashboard/production"
  | "/dashboard/customers"
  | "/dashboard/reports"
  | "/dashboard/settings";

export const DASHBOARD_NAV_ROLES: Record<DashboardNavPath, readonly Role[]> = {
  "/dashboard": ["admin", "kasir"],
  "/dashboard/pos": ["admin", "kasir"],
  "/dashboard/orders": ["admin", "kasir", "operator"],
  "/dashboard/production": ["admin", "kasir", "operator"],
  "/dashboard/customers": ["admin", "kasir"],
  "/dashboard/reports": ["admin", "kasir"],
  "/dashboard/settings": ["admin", "kasir"],
} as const;

const missingLoginResponseError = (): Error =>
  new Error("Respons login dari server kosong. Silakan coba lagi.");

export const canAccessDashboardPath = (role: Role, path: DashboardNavPath): boolean =>
  DASHBOARD_NAV_ROLES[path].includes(role);

export const useLogin = () =>
  useMutation({
    mutationFn: async (body: LoginRequest): Promise<LoginResponse> => {
      const response = await apiPost<LoginResponse>("/api/auth/login", body, { auth: false });
      if (!response) throw missingLoginResponseError();
      return response;
    },
    onSuccess: (response) => {
      setSession(response);
    },
  });

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost("/api/auth/logout"),
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
};
