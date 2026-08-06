"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { Activity } from "@/types/activity";
import type { ActivityInput } from "@/lib/validations/activity";

export function useActivities(params?: {
  q?: string;
  cropSeasonId?: string;
  activityType?: string;
}) {
  return useQuery({
    queryKey: keys.activities.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<Activity[]>("/activities", {
        params: {
          q: params?.q || undefined,
          cropSeasonId: params?.cropSeasonId || undefined,
          activityType: params?.activityType || undefined,
        },
      });
      return data;
    },
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ActivityInput) => {
      const { data } = await apiClient.post<Activity>("/activities", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.activities.all });
    },
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<ActivityInput>) => {
      const { data } = await apiClient.patch<Activity>(
        `/activities/${id}`,
        input
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.activities.all });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.activities.all });
    },
  });
}