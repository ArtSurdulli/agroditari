"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { EntityCard } from "@/components/common/entity-card";
import { EntityIconChip } from "@/components/common/entity-icon-chip";
import { EntityTableRow } from "@/components/common/entity-table-row";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { SelectLoadingItem } from "@/components/common/select-loading-item";
import { StatCard } from "@/components/common/stat-card";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
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
import { useDebounce } from "@/hooks/use-debounce";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";
import { useExpenses } from "@/hooks/use-expenses";
import { useCropSeasons } from "@/hooks/use-crop-seasons";
import { getEntityTheme } from "@/lib/entity-theme";
import {
  expenseCategoryLabels,
  expenseCategoryValues,
} from "@/lib/validations/expense";
import type { Expense } from "@/types/expense";

const theme = getEntityTheme("expenses");
const ALL_SEASONS_VALUE = "all";
const ALL_CATEGORIES_VALUE = "all";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("sq-AL");
}

function formatEuro(amount: number) {
  return `${amount.toLocaleString("sq-AL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

function CategoryBadge({ category }: { category: Expense["category"] }) {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: theme.color.badgeBg, color: theme.color.textStrong }}
    >
      {expenseCategoryLabels[category]}
    </span>
  );
}

function seasonLabel(expense: Expense) {
  return `${expense.cropName} — ${expense.parcelName} (${expense.season})`;
}

export default function ExpensesPage() {
  return (
    <Suspense>
      <ExpensesPageContent />
    </Suspense>
  );
}

function ExpensesPageContent() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [seasonFilter, setSeasonFilter] = useState<string>(ALL_SEASONS_VALUE);
  const [categoryFilter, setCategoryFilter] = useState<string>(
    ALL_CATEGORIES_VALUE
  );

  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const { data: seasons, isLoading: seasonsLoading } = useCropSeasons();

  const {
    data: expenses,
    isLoading,
    isError,
    error,
  } = useExpenses({
    cropSeasonId:
      seasonFilter === ALL_SEASONS_VALUE ? undefined : seasonFilter,
    category:
      categoryFilter === ALL_CATEGORIES_VALUE ? undefined : categoryFilter,
  });

  const filtered = (expenses ?? []).filter((expense) =>
    debouncedSearch
      ? (expense.description ?? "")
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase())
      : true
  );

  const total = filtered.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const isFiltered =
    !!debouncedSearch ||
    seasonFilter !== ALL_SEASONS_VALUE ||
    categoryFilter !== ALL_CATEGORIES_VALUE;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <PageHeader
        title="Shpenzime"
        subtitle="Të gjitha shpenzimet e fermave të tua."
        actions={
          <Link
            href="/shto/shpenzim"
            className={buttonVariants({ className: "hover:opacity-90" })}
            style={{ backgroundColor: theme.color.solid }}
          >
            <Plus className="h-4 w-4" />
            Shto shpenzim
          </Link>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Kërko sipas përshkrimit..."
            className="pl-9"
          />
        </div>

        <Select
          value={seasonFilter}
          onValueChange={(value) => setSeasonFilter(value ?? ALL_SEASONS_VALUE)}
          items={[
            { value: ALL_SEASONS_VALUE, label: "Të gjitha sezonet" },
            ...(seasons?.map((season) => ({
              value: season.id,
              label: `${season.cropName} — ${season.parcelName} (${season.season})`,
            })) ?? []),
          ]}
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Të gjitha sezonet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_SEASONS_VALUE}>Të gjitha sezonet</SelectItem>
            {seasonsLoading ? (
              <SelectLoadingItem />
            ) : (
              seasons?.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.cropName} — {season.parcelName} ({season.season})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Select
          value={categoryFilter}
          onValueChange={(value) =>
            setCategoryFilter(value ?? ALL_CATEGORIES_VALUE)
          }
          items={[
            { value: ALL_CATEGORIES_VALUE, label: "Të gjitha kategoritë" },
            ...expenseCategoryValues.map((value) => ({
              value,
              label: expenseCategoryLabels[value],
            })),
          ]}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Të gjitha kategoritë" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES_VALUE}>
              Të gjitha kategoritë
            </SelectItem>
            {expenseCategoryValues.map((value) => (
              <SelectItem key={value} value={value}>
                {expenseCategoryLabels[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length > 0 && (
        <div className="mt-4 max-w-xs">
          <StatCard
            label="Gjithsej (të filtruara)"
            value={formatEuro(total)}
            icon={theme.icon}
            color={theme.color}
            compact
          />
        </div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <ListSkeleton columns={5} />
        ) : isError ? (
          <p className="text-sm text-danger">
            {error instanceof Error
              ? error.message
              : "Ndodhi një gabim. Provo përsëri."}
          </p>
        ) : filtered.length === 0 ? (
          isFiltered ? (
            <EmptyState
              entityKey="expenses"
              icon={Search}
              title="Nuk u gjet asnjë shpenzim."
              description="Provo një kërkim ose filtër tjetër."
            />
          ) : (
            <EmptyState
              entityKey="expenses"
              title="Ende s'ka shpenzime."
              description="Shto shpenzimin tënd të parë për të filluar."
              action={
                <Link
                  href="/shto/shpenzim"
                  className={buttonVariants({ className: "hover:opacity-90" })}
                  style={{ backgroundColor: theme.color.solid }}
                >
                  <Plus className="h-4 w-4" />
                  Shto shpenzim
                </Link>
              }
            />
          )
        ) : isDesktop ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Sezoni</TableHead>
                  <TableHead>Përshkrimi</TableHead>
                  <TableHead>Shuma</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => (
                  <EntityTableRow key={expense.id} entityKey="expenses">
                    <TableCell className="font-medium text-text-primary">
                      <div className="flex items-center gap-3">
                        <EntityIconChip entityKey="expenses" />
                        <CategoryBadge category={expense.category} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/seasons/${expense.cropSeasonId}`}
                        className="hover:underline"
                        style={{ color: theme.color.solid }}
                      >
                        {seasonLabel(expense)}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-text-secondary">
                      {expense.description || "—"}
                    </TableCell>
                    <TableCell className="font-medium text-text-primary">
                      {formatEuro(Number(expense.amount))}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {formatDate(expense.date)}
                    </TableCell>
                  </EntityTableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((expense) => (
              <EntityCard
                key={expense.id}
                entityKey="expenses"
                href={`/seasons/${expense.cropSeasonId}`}
                title={expenseCategoryLabels[expense.category]}
                subtitle={`${seasonLabel(expense)} · ${formatDate(expense.date)}`}
                right={
                  <span
                    className="text-sm font-semibold"
                    style={{ color: theme.color.textStrong }}
                  >
                    {formatEuro(Number(expense.amount))}
                  </span>
                }
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
