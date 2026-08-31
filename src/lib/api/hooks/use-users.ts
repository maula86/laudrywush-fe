import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useIsAuthenticated, useSessionUser } from "@/lib/api/auth-store";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  CreateUserRequest,
  PublicUser,
  SuccessResponse,
  ToggleUserActiveResponse,
  UpdateUserRequest,
} from "@/lib/api/types";

type UpdateUserMutationInput = {
  readonly id: string;
  readonly body: UpdateUserRequest;
};

const emptyUserResponseError = (): Error =>
  new Error("Respons pengguna dari server kosong. Silakan coba lagi.");

/**
 * Every `/api/users` endpoint is admin-only; `kasir` and `operator` get 403.
 * The query is therefore gated on the role as well as on authentication, so a
 * non-admin never fires a request that is guaranteed to fail.
 */
export const useUsers = () => {
  const isAuthenticated = useIsAuthenticated();
  const sessionUser = useSessionUser();

  return useQuery({
    queryKey: queryKeys.users.lists(),
    queryFn: async (): Promise<PublicUser[]> => {
      const response = await apiGet<PublicUser[]>("/api/users");
      return response ?? [];
    },
    enabled: isAuthenticated && sessionUser?.role === "admin",
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateUserRequest): Promise<PublicUser> => {
      const response = await apiPost<PublicUser>("/api/users", body);
      if (!response) throw emptyUserResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: UpdateUserMutationInput): Promise<PublicUser> => {
      const response = await apiPatch<PublicUser>(`/api/users/${id}`, body);
      if (!response) throw emptyUserResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useToggleUserActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<ToggleUserActiveResponse> => {
      const response = await apiPatch<ToggleUserActiveResponse>(`/api/users/${id}/toggle-active`);
      if (!response) throw emptyUserResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<SuccessResponse> => {
      const response = await apiDelete<SuccessResponse>(`/api/users/${id}`);
      if (!response) throw emptyUserResponseError();
      return response;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
};

export const userApiErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.code === "email_taken") return "Email tersebut sudah digunakan.";
    if (error.status === 403) return "Hanya admin yang dapat mengelola pengguna.";
    return error.message;
  }
  if (error instanceof TypeError) return "Tidak dapat menghubungi server.";
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan. Silakan coba lagi.";
};
