"use client";

import { BarChart3, Receipt, Sprout, Tractor, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useFarms } from "@/hooks/use-farms";

export default function DashboardPage() {
  const { data: farms, isLoading } = useFarms();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Ballina"
        subtitle="Përmbledhje e shpejtë e fermave dhe aktivitetit tënd."
      />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Fermat e mia"
          value={isLoading ? "…" : (farms?.length ?? 0)}
          icon={Tractor}
        />
        <StatCard label="Shpenzime totale" value="—" icon={Receipt} />
        <StatCard label="Kosto/njësi" value="—" icon={BarChart3} />
        <StatCard label="Marxhini" value="—" icon={TrendingUp} />
        <StatCard label="Rendimenti" value="—" icon={Sprout} />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text-primary">
          Grafiku financiar
        </h2>
        <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
          <BarChart3 className="h-6 w-6 text-text-secondary" />
          <p className="text-sm font-medium text-text-primary">
            S’ka ende të dhëna për grafikun.
          </p>
          <p className="text-sm text-text-secondary">
            Do të shfaqet pasi të shtosh shpenzime dhe korrje.
          </p>
        </div>
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