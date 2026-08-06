"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { CropSeason } from "@/types/crop-season";
import type { CropSeasonInput } from "@/lib/validations/crop-season";

export function useCropSeasons(params?: {
  q?: string;
  parcelId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: keys.cropSeasons.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<CropSeason[]>("/crop-seasons", {
        params: {
          q: params?.q || undefined,
          parcelId: params?.parcelId || undefined,
          status: params?.status || undefined,
        },
      });
      return data;
    },
  });
}

export function useCreateCropSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CropSeasonInput) => {
      const { data } = await apiClient.post<CropSeason>(
        "/crop-seasons",
        input
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.cropSeasons.all });
    },
  });
}

export function useUpdateCropSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<CropSeasonInput>) => {
      const { data } = await apiClient.patch<CropSeason>(
        `/crop-seasons/${id}`,
        input
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.cropSeasons.all });
    },
  });
}

export function useDeleteCropSeason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/crop-seasons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.cropSeasons.all });
    },
  });
}