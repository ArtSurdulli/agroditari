"use client";

import { useState } from "react";
import {
  BarChart3,
  Download,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { PageHeader } from "@/components/common/page-header";
import { SelectLoadingItem } from "@/components/common/select-loading-item";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";
import { useParcels } from "@/hooks/use-parcels";
import { useReports } from "@/hooks/use-reports";
import { formatEuro, formatPercent, formatQuantity } from "@/lib/format";
import type { ReportSeasonRow } from "@/types/report";

const ALL_SEASONS_VALUE = "all";
const ALL_PARCELS_VALUE = "all";

function formatCostPerUnit(row: ReportSeasonRow) {
  if (row.costPerUnit === null || !row.costPerUnitUnit) return "—";
  return `${formatEuro(row.costPerUnit)}/${row.costPerUnitUnit}`;
}

function formatYield(row: ReportSeasonRow) {
  if (row.yieldPerHa === null || !row.yieldUnit) return "—";
  return `${formatQuantity(row.yieldPerHa)} ${row.yieldUnit}/ha`;
}

function toCsvField(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function exportCsv(rows: ReportSeasonRow[]) {
  const headers = [
    "Parcela",
    "Kultura",
    "Sipërfaqja (ha)",
    "Shpenzime (€)",
    "Të ardhura (€)",
    "Fitimi neto (€)",
    "Kosto/njësi",
    "Rendimenti",
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.parcelName,
        row.cropName,
        formatQuantity(row.areaHa),
        row.totalCost.toFixed(2),
        row.totalRevenue.toFixed(2),
        row.netProfit.toFixed(2),
        formatCostPerUnit(row),
        formatYield(row),
      ]
        .map(toCsvField)
        .join(",")
    );
  }
  // Leading BOM so Excel renders Albanian diacritics correctly.
  const csv = "﻿" + lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "raporti.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [seasonFilter, setSeasonFilter] = useState(ALL_SEASONS_VALUE);
  const [parcelFilter, setParcelFilter] = useState(ALL_PARCELS_VALUE);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const { data: seasons, isLoading: seasonsLoading } = useCropSeasons();
  const { data: parcels, isLoading: parcelsLoading } = useParcels();

  const {
    data: report,
    isLoading,
    isError,
    error,
  } = useReports({
    seasonId: seasonFilter === ALL_SEASONS_VALUE ? undefined : seasonFilter,
    parcelId: parcelFilter === ALL_PARCELS_VALUE ? undefined : parcelFilter,
    from: from || undefined,
    to: to || undefined,
  });

  const rows = report?.rows ?? [];
  const summary = report?.summary;

  const chartData = rows.map((row) => ({
    name: `${row.cropName} · ${row.season}`,
    "Të ardhura": Math.round(row.totalRevenue),
    Shpenzime: Math.round(row.totalCost),
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Raporte"
        subtitle="Kosto/njësi, marxhini dhe fitimi për sezonet e tua."
        actions={
          <Button
            variant="outline"
            onClick={() => exportCsv(rows)}
            disabled={rows.length === 0}
          >
            <Download className="h-4 w-4" />
            Eksporto
          </Button>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select
          value={seasonFilter}
          onValueChange={(value) => setSeasonFilter(value ?? ALL_SEASONS_VALUE)}
          items={[
            { value: ALL_SEASONS_VALUE, label: "Të gjitha sezonet" },
            ...(seasons?.map((season) => ({
              value: season.id,
              label: `${season.cropName} · ${season.season}`,
            })) ?? []),
          ]}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Të gjitha sezonet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SEASONS_VALUE}>
              Të gjitha sezonet
            </SelectItem>
            {seasonsLoading ? (
              <SelectLoadingItem />
            ) : (
              seasons?.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.cropName} · {season.season}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select
          value={parcelFilter}
          onValueChange={(value) => setParcelFilter(value ?? ALL_PARCELS_VALUE)}
          items={[
            { value: ALL_PARCELS_VALUE, label: "Të gjitha parcelat" },
            ...(parcels?.map((parcel) => ({
              value: parcel.id,
              label: `${parcel.name} — ${parcel.farmName}`,
            })) ?? []),
          ]}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Të gjitha parcelat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_PARCELS_VALUE}>
              Të gjitha parcelat
            </SelectItem>
            {parcelsLoading ? (
              <SelectLoadingItem />
            ) : (
              parcels?.map((parcel) => (
                <SelectItem key={parcel.id} value={parcel.id}>
                  {parcel.name} — {parcel.farmName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Nga data"
            className="w-full sm:w-40"
          />
          <span className="text-sm text-text-secondary">deri</span>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Deri më"
            className="w-full sm:w-40"
          />
        </div>
      </div>

      {isLoading ? (
        <>
          <CardGridSkeleton count={4} className="mt-6" />
          <div className="mt-8">
            <Skeleton className="h-[18px] w-56" />
            <ChartSkeleton className="mt-3 h-72" />
          </div>
          <div className="mt-8">
            <Skeleton className="h-[18px] w-40" />
            <div className="mt-3">
              <ListSkeleton rows={5} columns={8} />
            </div>
          </div>
        </>
      ) : isError ? (
        <p className="mt-6 text-sm text-danger">
          {error instanceof Error
            ? error.message
            : "Ndodhi një gabim. Provo përsëri."}
        </p>
      ) : !summary || summary.seasonsCount === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={BarChart3}
            title="Ende s'ka të dhëna për raport."
            description="Raportet shfaqen pasi të shtosh shpenzime dhe korrje për sezonet e tua."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Kosto/njësi"
              value={
                summary.costPerUnit !== null && summary.costPerUnitUnit
                  ? `${formatEuro(summary.costPerUnit)}/${summary.costPerUnitUnit}`
                  : "—"
              }
              icon={BarChart3}
            />
            <StatCard
              label="Marxhini"
              value={
                summary.marginPct !== null
                  ? formatPercent(summary.marginPct)
                  : "—"
              }
              icon={TrendingUp}
            />
            <StatCard
              label="Të ardhura totale"
              value={formatEuro(summary.totalRevenue)}
              icon={Wallet}
            />
            <StatCard
              label="Shpenzime totale"
              value={formatEuro(summary.totalCost)}
              icon={Receipt}
            />
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-text-primary">
              Të ardhura kundrejt shpenzimeve
            </h2>
            <div className="mt-3 h-72 rounded-2xl border border-border bg-surface p-4">
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
                    fill="#15803D"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="Shpenzime"
                    fill="#DC2626"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-sm font-semibold text-text-primary">
              Detajet sipas sezonit
            </h2>
            <div className="mt-3">
              {isDesktop ? (
                <div className="overflow-hidden rounded-xl border border-border bg-surface">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Kultura</TableHead>
                        <TableHead>Sipërfaqja (ha)</TableHead>
                        <TableHead>Shpenzime</TableHead>
                        <TableHead>Të ardhura</TableHead>
                        <TableHead>Fitimi neto</TableHead>
                        <TableHead>Kosto/njësi</TableHead>
                        <TableHead>Rendimenti</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row) => (
                        <TableRow key={row.seasonId}>
                          <TableCell className="text-text-secondary">
                            {row.parcelName}
                          </TableCell>
                          <TableCell className="font-medium text-text-primary">
                            {row.cropName}
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {formatQuantity(row.areaHa)}
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {formatEuro(row.totalCost)}
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {formatEuro(row.totalRevenue)}
                          </TableCell>
                          <TableCell
                            className={
                              row.netProfit >= 0
                                ? "font-medium text-primary"
                                : "font-medium text-danger"
                            }
                          >
                            {formatEuro(row.netProfit)}
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {formatCostPerUnit(row)}
                          </TableCell>
                          <TableCell className="text-text-secondary">
                            {formatYield(row)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="space-y-3">
                  {rows.map((row) => (
                    <div
                      key={row.seasonId}
                      className="rounded-xl border border-border bg-surface p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-text-primary">
                          {row.cropName} · {row.season}
                        </p>
                        <span
                          className={
                            row.netProfit >= 0
                              ? "shrink-0 text-sm font-semibold text-primary"
                              : "shrink-0 text-sm font-semibold text-danger"
                          }
                        >
                          {formatEuro(row.netProfit)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">
                        {row.parcelName} — {row.farmName}
                      </p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-text-secondary">
                            Shpenzime:{" "}
                          </span>
                          <span className="text-text-primary">
                            {formatEuro(row.totalCost)}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">
                            Të ardhura:{" "}
                          </span>
                          <span className="text-text-primary">
                            {formatEuro(row.totalRevenue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">
                            Kosto/njësi:{" "}
                          </span>
                          <span className="text-text-primary">
                            {formatCostPerUnit(row)}
                          </span>
                        </div>
                        <div>
                          <span className="text-text-secondary">
                            Rendimenti:{" "}
                          </span>
                          <span className="text-text-primary">
                            {formatYield(row)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
