"use client";

import Link from "next/link";
import {
  BarChart3,
  Bell,
  Receipt,
  TrendingUp,
  Tractor,
  Wallet,
} from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { useFarms } from "@/hooks/use-farms";
import { useReminders } from "@/hooks/use-reminders";
import { useReports } from "@/hooks/use-reports";
import { entityTheme } from "@/lib/entity-theme";
import { formatEuro, formatPercent } from "@/lib/format";

// Local calendar date, not UTC — matches how a farmer reads "today" on their
// device. dueDate is a plain calendar date (slice(0, 10) reduces its
// UTC-midnight-serialized value to the same string it was entered as).
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysStr(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DashboardPage() {
  const { data: farms, isLoading: farmsLoading } = useFarms();
  const { data: report, isLoading: reportLoading } = useReports();
  const { data: pendingReminders } = useReminders({ done: false });
  const summary = report?.summary;
  const hasReportData = !!summary && summary.seasonsCount > 0;

  const today = todayStr();
  const weekEnd = addDaysStr(today, 7);
  const overdueCount = (pendingReminders ?? []).filter(
    (reminder) => reminder.dueDate.slice(0, 10) < today
  ).length;
  const dueThisWeekCount = (pendingReminders ?? []).filter((reminder) => {
    const due = reminder.dueDate.slice(0, 10);
    return due >= today && due <= weekEnd;
  }).length;
  const remindersColor = entityTheme.reminders.color;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Ballina"
        subtitle="Përmbledhje e shpejtë e fermave dhe aktivitetit tënd."
      />

      {(overdueCount > 0 || dueThisWeekCount > 0) && (
        <Link
          href="/reminders"
          className="mt-6 flex items-center justify-between gap-3 rounded-xl border-[1.5px] px-4 py-3 text-sm transition-colors hover:opacity-90"
          style={{
            backgroundColor: remindersColor.tint,
            borderColor: remindersColor.border,
            color: remindersColor.textStrong,
          }}
        >
          <span className="flex items-center gap-2">
            <Bell className="h-4 w-4 shrink-0" />
            <span>
              {overdueCount > 0 && (
                <>
                  Ke <strong className="text-danger">{overdueCount}</strong>{" "}
                  kujtesa të vonuara
                  {dueThisWeekCount > 0 && " dhe "}
                </>
              )}
              {dueThisWeekCount > 0 && (
                <>
                  <strong>{dueThisWeekCount}</strong> këtë javë
                </>
              )}
              .
            </span>
          </span>
          <span className="shrink-0 text-xs font-medium underline">
            Shiko →
          </span>
        </Link>
      )}

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
