"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { ReportResponse } from "@/types/report";

export function useReports(params?: {
  seasonId?: string;
  parcelId?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: keys.reports.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<ReportResponse>("/reports", {
        params: {
          seasonId: params?.seasonId || undefined,
          parcelId: params?.parcelId || undefined,
          from: params?.from || undefined,
          to: params?.to || undefined,
        },
      });
      return data;
    },
  });
}
