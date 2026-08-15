"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { Crop } from "@/types/crop";
import type { CropInput } from "@/lib/validations/crop";

export function useCrops(params?: { q?: string }) {
  return useQuery({
    queryKey: keys.crops.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<Crop[]>("/crops", {
        params: params?.q ? { q: params.q } : undefined,
      });
      return data;
    },
  });
}

export function useCreateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CropInput) => {
      const { data } = await apiClient.post<Crop>("/crops", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.crops.all });
    },
  });
}