import type { UserAccountStatus, UserRole } from "@/types/next-auth";

// Client-side shape of a user row in the admin section. Never includes
// passwordHash — that never leaves the server.
export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserAccountStatus;
  farmCount: number;
  createdAt: string;
};

export type AdminStats = {
  totalUsers: number;
  totalFarms: number;
  totalParcels: number;
  totalSeasons: number;
};

export type AdminUserListResponse = {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
};
