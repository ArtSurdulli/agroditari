"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { keys } from "@/lib/query-keys";
import type { AdminStats, AdminUserListResponse } from "@/types/admin";
import type { UserAccountStatus, UserRole } from "@/types/next-auth";
import type { Crop } from "@/types/crop";
import type { CropInput } from "@/lib/validations/crop";

export function useAdminStats() {
  return useQuery({
    queryKey: keys.admin.stats,
    queryFn: async () => {
      const { data } = await apiClient.get<AdminStats>("/admin/stats");
      return data;
    },
  });
}

export function useAdminUsers(params?: {
  role?: UserRole;
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: keys.admin.users.list(params),
    queryFn: async () => {
      const { data } = await apiClient.get<AdminUserListResponse>("/admin/users", {
        params: {
          role: params?.role || undefined,
          q: params?.q || undefined,
          page: params?.page || undefined,
          pageSize: params?.pageSize || undefined,
        },
      });
      return data;
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: UserAccountStatus;
    }) => {
      const { data } = await apiClient.patch(`/admin/users/${id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.admin.users.all });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: "admin" | "farmer" }) => {
      const { data } = await apiClient.patch(`/admin/users/${id}/role`, {
        role,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.admin.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.admin.users.all });
    },
  });
}

export function useUpdateCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & CropInput) => {
      const { data } = await apiClient.patch<Crop>(`/admin/crops/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.crops.all });
    },
  });
}

export function useDeleteCrop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/crops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.crops.all });
    },
  });
}
