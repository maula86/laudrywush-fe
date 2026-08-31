import { useQuery } from "@tanstack/react-query";
import { ApiError, apiGet } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { Tracking } from "@/lib/api/types";

/**
 * Public hook to fetch the tracking projection for a given order number.
 * The backend endpoint is public (`auth: false`).
 * Returns a `Tracking` object or throws on empty response.
 */
export const useTracking = (orderNumber: string) => {
  const trimmed = orderNumber.trim();
  return useQuery({
    queryKey: queryKeys.tracking.detail(trimmed),
    queryFn: async (): Promise<Tracking> => {
      const response = await apiGet<Tracking>(`/api/tracking/${encodeURIComponent(trimmed)}`, {
        auth: false,
      });
      if (!response) throw new Error("Respons tracking dari server kosong. Silakan coba lagi.");
      return response;
    },
    enabled: trimmed.length > 0,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 404) return false;
      return failureCount < 3;
    },
  });
};

/**
 * Human‐readable Indonesian error messages for the tracking hook.
 */
export const trackingErrorMessage = (error: unknown): string => {
  if (!(error instanceof ApiError)) {
    if (error instanceof TypeError) return "Tidak dapat menghubungi server.";
    if (error instanceof Error) return error.message;
    return "Terjadi kesalahan. Silakan coba lagi.";
  }

  if (error.status === 404) return "Nomor nota tidak ditemukan.";

  return error.message;
};
