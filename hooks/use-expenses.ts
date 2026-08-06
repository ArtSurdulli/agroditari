"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { Expense } from "@/types/expense";
import type { ExpenseInput } from "@/lib/validations/expense";

export function useExpenses(params?: {
  cropSeasonId?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: keys.expenses.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<Expense[]>("/expenses", {
        params: {
          cropSeasonId: params?.cropSeasonId || undefined,
          category: params?.category || undefined,
        },
      });
      return data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExpenseInput) => {
      const { data } = await apiClient.post<Expense>("/expenses", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.expenses.all });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string } & Partial<ExpenseInput>) => {
      const { data } = await apiClient.patch<Expense>(
        `/expenses/${id}`,
        input
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.expenses.all });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.expenses.all });
    },
  });
}