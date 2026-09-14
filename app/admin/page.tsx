"use client";

import { Map, Sprout, Tractor, Users } from "lucide-react";
import { CardGridSkeleton } from "@/components/common/card-grid-skeleton";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useAdminSession } from "@/components/admin/admin-context";
import { useAdminStats } from "@/hooks/use-admin";
import { getAdminRoleTheme } from "@/lib/admin-theme";

export default function AdminOverviewPage() {
  const { role } = useAdminSession();
  const theme = getAdminRoleTheme(role);
  const { data: stats, isLoading, isError } = useAdminStats();

  return (
    <div>
      <PageHeader
        title="Përmbledhje"
        subtitle="Statistika mbi të gjithë sistemin — të gjithë përdoruesit, jo vetëm të tuat."
      />

      {isLoading ? (
        <CardGridSkeleton count={4} className="mt-6" />
      ) : isError ? (
        <p className="mt-6 text-sm text-danger">
          Ndodhi një gabim. Provo përsëri.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Përdorues"
            value={stats?.totalUsers ?? 0}
            icon={Users}
            color={theme.color}
          />
          <StatCard
            label="Ferma"
            value={stats?.totalFarms ?? 0}
            icon={Tractor}
            color={theme.color}
          />
          <StatCard
            label="Parcela"
            value={stats?.totalParcels ?? 0}
            icon={Map}
            color={theme.color}
          />
          <StatCard
            label="Sezone"
            value={stats?.totalSeasons ?? 0}
            icon={Sprout}
            color={theme.color}
          />
        </div>
      )}
    </div>
  );
}
