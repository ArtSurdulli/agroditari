"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { Reminder } from "@/types/reminder";
import type { ReminderInput } from "@/lib/validations/reminder";

export function useReminders(params?: {
  done?: boolean;
  cropSeasonId?: string;
  q?: string;
}) {
  return useQuery({
    queryKey: keys.reminders.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<Reminder[]>("/reminders", {
        params: {
          done: params?.done === undefined ? undefined : String(params.done),
          cropSeasonId: params?.cropSeasonId || undefined,
          q: params?.q || undefined,
        },
      });
      return data;
    },
    // The default QueryClient already refetches on window focus — relied on
    // here (not overridden) so reminders refresh whenever the farmer reopens
    // or returns to the app without a manual refresh.
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReminderInput) => {
      const { data } = await apiClient.post<Reminder>("/reminders", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.reminders.all });
    },
  });
}

export function useUpdateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<ReminderInput>) => {
      const { data } = await apiClient.patch<Reminder>(
        `/reminders/${id}`,
        input
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.reminders.all });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.reminders.all });
    },
  });
}

export function useToggleReminderDone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isDone }: { id: string; isDone: boolean }) => {
      const { data } = await apiClient.patch<Reminder>(`/reminders/${id}`, {
        isDone,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.reminders.all });
    },
  });
}