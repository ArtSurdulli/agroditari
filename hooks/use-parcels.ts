"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { Parcel } from "@/types/parcel";
import type { ParcelInput } from "@/lib/validations/parcel";

export function useParcels(params?: { q?: string; farmId?: string }) {
  return useQuery({
    queryKey: keys.parcels.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<Parcel[]>("/parcels", {
        params:
          params?.q || params?.farmId
            ? { q: params?.q || undefined, farmId: params?.farmId || undefined }
            : undefined,
      });
      return data;
    },
  });
}

export function useCreateParcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ParcelInput) => {
      const { data } = await apiClient.post<Parcel>("/parcels", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.parcels.all });
    },
  });
}

export function useUpdateParcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<ParcelInput>) => {
      const { data } = await apiClient.patch<Parcel>(`/parcels/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.parcels.all });
    },
  });
}

export function useDeleteParcel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/parcels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.parcels.all });
    },
  });
}