"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { Farm } from "@/types/farm";
import type { FarmInput } from "@/lib/validations/farm";

export function useFarms(params?: { q?: string }) {
  return useQuery({
    queryKey: keys.farms.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<Farm[]>("/farms", {
        params: params?.q ? { q: params.q } : undefined,
      });
      return data;
    },
  });
}

export function useCreateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FarmInput) => {
      const { data } = await apiClient.post<Farm>("/farms", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.farms.all });
    },
  });
}

export function useUpdateFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<FarmInput>) => {
      const { data } = await apiClient.patch<Farm>(`/farms/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.farms.all });
    },
  });
}

export function useDeleteFarm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/farms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.farms.all });
    },
  });
}