"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { Harvest } from "@/types/harvest";
import type { HarvestInput } from "@/lib/validations/harvest";

export function useHarvests(params?: { cropSeasonId?: string }) {
  return useQuery({
    queryKey: keys.harvests.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<Harvest[]>("/harvests", {
        params: {
          cropSeasonId: params?.cropSeasonId || undefined,
        },
      });
      return data;
    },
  });
}

export function useCreateHarvest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: HarvestInput) => {
      const { data } = await apiClient.post<Harvest>("/harvests", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.harvests.all });
    },
  });
}

export function useUpdateHarvest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<HarvestInput>) => {
      const { data } = await apiClient.patch<Harvest>(
        `/harvests/${id}`,
        input
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.harvests.all });
    },
  });
}

export function useDeleteHarvest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/harvests/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.harvests.all });
    },
  });
}