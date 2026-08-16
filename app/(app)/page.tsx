"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CardGridSkeleton } from "@/components/common/card-grid-skeleton";
import { ChartSkeleton } from "@/components/common/chart-skeleton";
import { EntityCard } from "@/components/common/entity-card";
import { EntityIconChip } from "@/components/common/entity-icon-chip";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/common/stat-card";
import { buttonVariants } from "@/components/ui/button";
import { useActivities } from "@/hooks/use-activities";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import { useExpenses } from "@/hooks/use-expenses";
import { useHarvests } from "@/hooks/use-harvests";
import { useParcels } from "@/hooks/use-parcels";
import { useReminders } from "@/hooks/use-reminders";
import { useReports } from "@/hooks/use-reports";
import { entityTheme, type EntityKey } from "@/lib/entity-theme";
import { formatEuro, formatQuantity } from "@/lib/format";
import { activityTypeLabels } from "@/lib/validations/activity";
import { expenseCategoryLabels } from "@/lib/validations/expense";
import { unitTypeLabels } from "@/lib/validations/harvest";
import type { Reminder } from "@/types/reminder";

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("sq-AL");
}

type ReminderStatus = "overdue" | "today" | "upcoming";

function getReminderStatus(reminder: Reminder, today: string): ReminderStatus {
  const due = reminder.dueDate.slice(0, 10);
  if (due < today) return "overdue";
  if (due === today) return "today";
  return "upcoming";
}

function ReminderStatusBadge({ status }: { status: ReminderStatus }) {
  if (status === "overdue") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-danger-light px-2 py-0.5 text-xs font-medium text-danger">
        Vonuar
      </span>
    );
  }
  if (status === "today") {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
        Sot
      </span>
    );
  }
  return null;
}

const ParcelsIcon = entityTheme.parcels.icon;
const SeasonsIcon = entityTheme.seasons.icon;
const ExpensesIcon = entityTheme.expenses.icon;
const HarvestsIcon = entityTheme.harvests.icon;
const RemindersIcon = entityTheme.reminders.icon;
const ActivitiesIcon = entityTheme.activities.icon;

type FeedItem = {
  id: string;
  entityKey: EntityKey;
  label: string;
  date: string;
  href: string;
};

export default function DashboardPage() {
  const { data: parcels, isLoading: parcelsLoading } = useParcels();
  const { data: activeSeasons, isLoading: activeSeasonsLoading } =
    useCropSeasons({ status: "active" });
  const { data: report, isLoading: reportLoading } = useReports();
  const { data: pendingReminders, isLoading: remindersLoading } = useReminders({
    done: false,
  });
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: harvests, isLoading: harvestsLoading } = useHarvests();

  const kpiLoading = parcelsLoading || activeSeasonsLoading || reportLoading;

  const summary = report?.summary;
  const rows = report?.rows ?? [];
  const hasReportData = !!summary && summary.seasonsCount > 0 && rows.length > 0;

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

  const upcomingReminders = [...(pendingReminders ?? [])]
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1))
    .slice(0, 4);

  const activeSeasonsList = (activeSeasons ?? []).slice(0, 4);

  const chartData = rows.map((row) => ({
    name: `${row.cropName} · ${row.season}`,
    "Të ardhura": Math.round(row.totalRevenue),
    Shpenzime: Math.round(row.totalCost),
  }));

  const feedLoading = activitiesLoading || expensesLoading || harvestsLoading;
  const feed: FeedItem[] = [
    ...(activities ?? []).map((activity) => ({
      id: `activity-${activity.id}`,
      entityKey: "activities" as const,
      label: `${activityTypeLabels[activity.activityType]} — ${activity.cropName} (${activity.season})`,
      date: activity.date,
      href: `/seasons/${activity.cropSeasonId}?tab=aktivitete`,
    })),
    ...(expenses ?? []).map((expense) => ({
      id: `expense-${expense.id}`,
      entityKey: "expenses" as const,
      label: `Shpenzim: ${expenseCategoryLabels[expense.category]} — ${formatEuro(Number(expense.amount))}`,
      date: expense.date,
      href: `/seasons/${expense.cropSeasonId}?tab=shpenzime`,
    })),
    ...(harvests ?? []).map((harvest) => ({
      id: `harvest-${harvest.id}`,
      entityKey: "harvests" as const,
      label: `Korrje: ${formatQuantity(Number(harvest.quantity))} ${unitTypeLabels[harvest.unit]}`,
      date: harvest.date,
      href: `/seasons/${harvest.cropSeasonId}?tab=korrje`,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

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
            <RemindersIcon className="h-4 w-4 shrink-0" />
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

      {kpiLoading ? (
        <CardGridSkeleton count={4} className="mt-6 grid-cols-2 lg:grid-cols-4" />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Link href="/parcels" className="block rounded-xl transition-shadow hover:shadow-md">
            <StatCard
              label="Parcela"
              value={parcels?.length ?? 0}
              icon={ParcelsIcon}
              color={entityTheme.parcels.color}
            />
          </Link>
          <Link href="/seasons" className="block rounded-xl transition-shadow hover:shadow-md">
            <StatCard
              label="Sezone aktive"
              value={activeSeasons?.length ?? 0}
              icon={SeasonsIcon}
              color={entityTheme.seasons.color}
            />
          </Link>
          <Link href="/expenses" className="block rounded-xl transition-shadow hover:shadow-md">
            <StatCard
              label="Shpenzime"
              value={summary ? formatEuro(summary.totalCost) : "0,00 €"}
              icon={ExpensesIcon}
              color={entityTheme.expenses.color}
            />
          </Link>
          <Link href="/reports" className="block rounded-xl transition-shadow hover:shadow-md">
            <StatCard
              label="Të ardhura"
              value={summary ? formatEuro(summary.totalRevenue) : "0,00 €"}
              icon={HarvestsIcon}
              color={entityTheme.harvests.color}
            />
          </Link>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">
            Të ardhura kundrejt shpenzimeve
          </h2>
          {hasReportData && (
            <Link
              href="/reports"
              className="text-sm font-medium text-primary hover:underline"
            >
              Shiko raportin e plotë →
            </Link>
          )}
        </div>
        {reportLoading ? (
          <ChartSkeleton className="mt-3 h-64" />
        ) : hasReportData ? (
          <div className="mt-3 h-64 rounded-2xl border border-border bg-surface p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap={16} barGap={2}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e5e7eb" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => formatEuro(Number(value))}
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#e5e7eb",
                    fontSize: 13,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 13 }} />
                <Bar
                  dataKey="Të ardhura"
                  fill={entityTheme.harvests.color.solid}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="Shpenzime"
                  fill={entityTheme.expenses.color.solid}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-6 text-center">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: entityTheme.expenses.color.tint }}
            >
              <BarChart3
                className="h-5 w-5"
                style={{ color: entityTheme.expenses.color.solid }}
              />
            </div>
            <p className="text-sm text-text-secondary">
              Shto shpenzime dhe korrje për të parë financat.
            </p>
            <Link
              href="/shto"
              className={buttonVariants({ size: "sm", className: "hover:opacity-90" })}
              style={{ backgroundColor: entityTheme.expenses.color.solid }}
            >
              Shto tani
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">
              Kujtesat e afërta
            </h2>
            <Link
              href="/reminders"
              className="text-sm font-medium hover:underline"
              style={{ color: remindersColor.solid }}
            >
              Shiko të gjitha →
            </Link>
          </div>
          <div className="mt-3">
            {remindersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            ) : upcomingReminders.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-6 text-center">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: remindersColor.tint }}
                >
                  <RemindersIcon
                    className="h-5 w-5"
                    style={{ color: remindersColor.solid }}
                  />
                </div>
                <Link
                  href="/reminders?new=1"
                  className="text-sm font-medium hover:underline"
                  style={{ color: remindersColor.solid }}
                >
                  Ende s&apos;ka kujtesa. Shto një →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingReminders.map((reminder) => {
                  const status = getReminderStatus(reminder, today);
                  return (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {reminder.title}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {formatDate(reminder.dueDate)}
                        </p>
                      </div>
                      <ReminderStatusBadge status={status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary">
              Sezonet aktive
            </h2>
            <Link
              href="/seasons"
              className="text-sm font-medium hover:underline"
              style={{ color: entityTheme.seasons.color.solid }}
            >
              Shiko të gjitha →
            </Link>
          </div>
          <div className="mt-3">
            {activeSeasonsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-[14px] border-[1.5px] border-border p-4"
                  >
                    <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeSeasonsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-6 text-center">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: entityTheme.seasons.color.tint }}
                >
                  <SeasonsIcon
                    className="h-5 w-5"
                    style={{ color: entityTheme.seasons.color.solid }}
                  />
                </div>
                <Link
                  href="/seasons?new=1"
                  className="text-sm font-medium hover:underline"
                  style={{ color: entityTheme.seasons.color.solid }}
                >
                  Ende s&apos;ka sezone. Fillo një →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {activeSeasonsList.map((season) => (
                  <EntityCard
                    key={season.id}
                    entityKey="seasons"
                    href={`/seasons/${season.id}`}
                    title={`${season.cropName} · ${season.season}`}
                    subtitle={season.parcelName}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text-primary">
          Aktiviteti i fundit
        </h2>
        <div className="mt-3">
          {feedLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
                >
                  <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-12 shrink-0" />
                </div>
              ))}
            </div>
          ) : feed.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-6 text-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: entityTheme.activities.color.tint }}
              >
                <ActivitiesIcon
                  className="h-5 w-5"
                  style={{ color: entityTheme.activities.color.solid }}
                />
              </div>
              <Link
                href="/shto"
                className="text-sm font-medium hover:underline"
                style={{ color: entityTheme.activities.color.solid }}
              >
                Ende s&apos;ka aktivitet. Shto diçka →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {feed.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-bg-page"
                >
                  <EntityIconChip entityKey={item.entityKey} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {item.label}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-text-secondary">
                    {formatDate(item.date)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
