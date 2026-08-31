import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useIsAuthenticated, useSessionUser } from "@/lib/api/auth-store";
import { apiDelete, apiGet, apiPatch, apiPost, ApiError } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  CreateExpenseRequest,
  Expense,
  Role,
  SuccessResponse,
  UpdateExpenseRequest,
} from "@/lib/api/types";

type UseExpensesOptions = {
  readonly range?: number;
};

type UpdateExpenseMutationInput = {
  readonly id: string;
  readonly body: UpdateExpenseRequest;
};

const canManageExpenses = (role: Role | undefined): boolean => role === "admin" || role === "kasir";

const buildRangeFilters = (range: number | undefined) =>
  range !== undefined ? { range: String(range) } : {};

const buildRangeOptions = (range: number | undefined) =>
  range !== undefined ? { query: { range } } : {};

const emptyExpenseResponseError = (): Error =>
  new Error("Respons pengeluaran dari server kosong. Silakan coba lagi.");

const invalidateExpenseAndReportCollections = (
  queryClient: ReturnType<typeof useQueryClient>,
): void => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
};

export const useExpenses = (options: UseExpensesOptions = {}) => {
  const isAuthenticated = useIsAuthenticated();
  const sessionUser = useSessionUser();
  const range = options.range;

  return useQuery({
    queryKey: queryKeys.expenses.list(buildRangeFilters(range)),
    queryFn: async (): Promise<Expense[]> => {
      const response = await apiGet<Expense[]>("/api/expenses", buildRangeOptions(range));
      return response ?? [];
    },
    enabled: isAuthenticated && canManageExpenses(sessionUser?.role),
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateExpenseRequest): Promise<Expense> => {
      const response = await apiPost<Expense>("/api/expenses", body);
      if (!response) throw emptyExpenseResponseError();
      return response;
    },
    onSuccess: () => {
      invalidateExpenseAndReportCollections(queryClient);
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: UpdateExpenseMutationInput): Promise<Expense> => {
      const response = await apiPatch<Expense>(`/api/expenses/${id}`, body);
      if (!response) throw emptyExpenseResponseError();
      return response;
    },
    onSuccess: () => {
      invalidateExpenseAndReportCollections(queryClient);
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<SuccessResponse> => {
      const response = await apiDelete<SuccessResponse>(`/api/expenses/${id}`);
      if (!response) throw emptyExpenseResponseError();
      return response;
    },
    onSuccess: () => {
      invalidateExpenseAndReportCollections(queryClient);
    },
  });
};

export const expenseApiErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    if (error instanceof TypeError) return "Tidak dapat menghubungi server.";
    if (error instanceof Error) return error.message;
    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  if (error.status === 422 || error.status === 400) {
    return "Data pengeluaran belum valid. Periksa kategori, nominal, deskripsi, dan tanggal YYYY-MM-DD.";
  }

  return error.message;
};
