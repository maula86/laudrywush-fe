import { useQuery } from "@tanstack/react-query";

import { useIsAuthenticated, useSessionUser } from "@/lib/api/auth-store";
import { apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type {
  DailyReportRow,
  PaymentReportRow,
  ReportSummary,
  Role,
  ServiceReportRow,
} from "@/lib/api/types";

const canReadReports = (role: Role | undefined): boolean => role === "admin" || role === "kasir";

const buildRangeOptions = (range: number | undefined) =>
  range !== undefined ? { query: { range } } : {};

const emptySummaryResponseError = (): Error =>
  new Error("Respons ringkasan laporan dari server kosong. Silakan coba lagi.");

export const useReportSummary = (range?: number) => {
  const isAuthenticated = useIsAuthenticated();
  const sessionUser = useSessionUser();
  const stableRange = range !== undefined ? String(range) : undefined;

  return useQuery({
    queryKey: queryKeys.reports.summary(stableRange),
    queryFn: async (): Promise<ReportSummary> => {
      const response = await apiGet<ReportSummary>(
        "/api/reports/summary",
        buildRangeOptions(range),
      );
      if (!response) throw emptySummaryResponseError();
      return response;
    },
    enabled: isAuthenticated && canReadReports(sessionUser?.role),
  });
};

export const useDailyReport = (range?: number) => {
  const isAuthenticated = useIsAuthenticated();
  const sessionUser = useSessionUser();
  const stableRange = range !== undefined ? String(range) : undefined;

  return useQuery({
    queryKey: queryKeys.reports.daily(stableRange),
    queryFn: async (): Promise<DailyReportRow[]> => {
      const response = await apiGet<DailyReportRow[]>(
        "/api/reports/daily",
        buildRangeOptions(range),
      );
      return response ?? [];
    },
    enabled: isAuthenticated && canReadReports(sessionUser?.role),
  });
};

export const useServiceReport = (range?: number) => {
  const isAuthenticated = useIsAuthenticated();
  const sessionUser = useSessionUser();
  const stableRange = range !== undefined ? String(range) : undefined;

  return useQuery({
    queryKey: queryKeys.reports.byService(stableRange),
    queryFn: async (): Promise<ServiceReportRow[]> => {
      const response = await apiGet<ServiceReportRow[]>(
        "/api/reports/by-service",
        buildRangeOptions(range),
      );
      return response ?? [];
    },
    enabled: isAuthenticated && canReadReports(sessionUser?.role),
  });
};

export const usePaymentReport = (range?: number) => {
  const isAuthenticated = useIsAuthenticated();
  const sessionUser = useSessionUser();
  const stableRange = range !== undefined ? String(range) : undefined;

  return useQuery({
    queryKey: queryKeys.reports.byPayment(stableRange),
    queryFn: async (): Promise<PaymentReportRow[]> => {
      const response = await apiGet<PaymentReportRow[]>(
        "/api/reports/by-payment",
        buildRangeOptions(range),
      );
      return response ?? [];
    },
    enabled: isAuthenticated && canReadReports(sessionUser?.role),
  });
};
