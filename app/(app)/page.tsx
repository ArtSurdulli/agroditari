"use client";

import Link from "next/link";
import { BarChart3, Receipt, TrendingUp, Tractor, Wallet } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useFarms } from "@/hooks/use-farms";
import { useReports } from "@/hooks/use-reports";
import { formatEuro, formatPercent } from "@/lib/format";

export default function DashboardPage() {
  const { data: farms, isLoading: farmsLoading } = useFarms();
  const { data: report, isLoading: reportLoading } = useReports();
  const summary = report?.summary;
  const hasReportData = !!summary && summary.seasonsCount > 0;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Ballina"
        subtitle="Përmbledhje e shpejtë e fermave dhe aktivitetit tënd."
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Fermat e mia"
          value={farmsLoading ? "…" : (farms?.length ?? 0)}
          icon={Tractor}
        />
        <StatCard
          label="Shpenzime totale"
          value={
            reportLoading ? "…" : summary ? formatEuro(summary.totalCost) : "—"
          }
          icon={Receipt}
        />
        <StatCard
          label="Kosto/njësi"
          value={
            reportLoading
              ? "…"
              : summary?.costPerUnit !== null &&
                  summary?.costPerUnit !== undefined &&
                  summary.costPerUnitUnit
                ? `${formatEuro(summary.costPerUnit)}/${summary.costPerUnitUnit}`
                : "—"
          }
          icon={BarChart3}
        />
        <StatCard
          label="Marxhini"
          value={
            reportLoading
              ? "…"
              : summary?.marginPct !== null && summary?.marginPct !== undefined
                ? formatPercent(summary.marginPct)
                : "—"
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Të ardhura totale"
          value={
            reportLoading
              ? "…"
              : summary
                ? formatEuro(summary.totalRevenue)
                : "—"
          }
          icon={Wallet}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text-primary">
          Grafiku financiar
        </h2>
        {hasReportData ? (
          <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <BarChart3 className="h-6 w-6 text-primary" />
            <p className="text-sm font-medium text-text-primary">
              Raporti i plotë me grafikun e të ardhurave kundrejt
              shpenzimeve është gati.
            </p>
            <Link
              href="/reports"
              className="text-sm font-medium text-primary hover:underline"
            >
              Shiko raportin e plotë →
            </Link>
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
            <BarChart3 className="h-6 w-6 text-text-secondary" />
            <p className="text-sm font-medium text-text-primary">
              S’ka ende të dhëna për grafikun.
            </p>
            <p className="text-sm text-text-secondary">
              Do të shfaqet pasi të shtosh shpenzime dhe korrje.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text-primary">
          Aktiviteti i fundit
        </h2>
        <div className="mt-3">
          <EmptyState
            title="Ende s'ka aktivitet."
            description="Aktivitetet e fundit do të shfaqen këtu."
          />
        </div>
      </div>
    </main>
  );
}
