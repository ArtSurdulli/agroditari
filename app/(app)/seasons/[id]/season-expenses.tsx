"use client";

import { useState } from "react";
import { MoreVertical, Plus, Receipt } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { EntityCard } from "@/components/common/entity-card";
import { StatCard } from "@/components/common/stat-card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMounted } from "@/hooks/use-mounted";
import { useExpenses } from "@/hooks/use-expenses";
import { useOpenOnFlag } from "@/hooks/use-open-on-flag";
import { entityTheme } from "@/lib/entity-theme";
import { expenseCategoryLabels } from "@/lib/validations/expense";
import { ExpenseFormDialog } from "./expense-form-dialog";
import { DeleteExpenseDialog } from "./delete-expense-dialog";
import type { Expense } from "@/types/expense";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("sq-AL");
}

function formatEuro(amount: number) {
  return `${amount.toLocaleString("sq-AL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export function SeasonExpenses({ cropSeasonId }: { cropSeasonId: string }) {
  // Guard against a hydration mismatch: the server always renders the
  // mobile (card) layout, so the client's first render must match that
  // exactly. Only trust the real media query result after mount.
  const mounted = useMounted();
  const matchesDesktop = useMediaQuery("(min-width: 768px)");
  const isDesktop = mounted && matchesDesktop;

  const {
    data: expenses,
    isLoading,
    isError,
    error,
  } = useExpenses({ cropSeasonId });

  // Quick-add ("+ Shto") deep link: /seasons/[id]?new=expenses opens the
  // create dialog straight away.
  const [formOpen, setFormOpen] = useOpenOnFlag("new", "expenses");

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(
    null
  );

  const total = (expenses ?? []).reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  function openCreateForm() {
    setEditingExpense(null);
    setFormOpen(true);
  }

  function openEditForm(expense: Expense) {
    setEditingExpense(expense);
    setFormOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">
          Shpenzimet
        </h2>
        {expenses && expenses.length > 0 && (
          <Button onClick={openCreateForm} size="sm">
            <Plus className="h-4 w-4" />
            Shto shpenzim
          </Button>
        )}
      </div>

      {expenses && expenses.length > 0 && (
        <div className="mt-4 max-w-xs">
          <StatCard
            label="Gjithsej shpenzime"
            value={formatEuro(total)}
            icon={Receipt}
          />
        </div>
      )}

      <div className="mt-4">
        {isLoading ? (
          <p className="text-sm text-text-secondary">Duke ngarkuar...</p>
        ) : isError ? (
          <p className="text-sm text-danger">
            {error instanceof Error
              ? error.message
              : "Ndodhi një gabim. Provo përsëri."}
          </p>
        ) : !expenses || expenses.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Ende s'ka shpenzime."
            description="Shto shpenzimin e parë për këtë sezon."
            action={
              <Button onClick={openCreateForm}>
                <Plus className="h-4 w-4" />
                Shto shpenzim
              </Button>
            }
          />
        ) : isDesktop ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Përshkrimi</TableHead>
                  <TableHead>Shuma</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium text-text-primary">
                      {expenseCategoryLabels[expense.category]}
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
                    <TableCell>
                      <ExpenseRowActions
                        expense={expense}
                        onEdit={() => openEditForm(expense)}
                        onDelete={() => setDeletingExpense(expense)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <EntityCard
                key={expense.id}
                entityKey="expenses"
                title={expenseCategoryLabels[expense.category]}
                subtitle={
                  expense.description
                    ? `${formatDate(expense.date)} · ${expense.description}`
                    : formatDate(expense.date)
                }
                right={
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: entityTheme.expenses.color.textStrong }}
                    >
                      {formatEuro(Number(expense.amount))}
                    </span>
                    <ExpenseRowActions
                      expense={expense}
                      onEdit={() => openEditForm(expense)}
                      onDelete={() => setDeletingExpense(expense)}
                    />
                  </div>
                }
              />
            ))}
          </div>
        )}
      </div>

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editingExpense}
        lockedCropSeasonId={cropSeasonId}
      />
      <DeleteExpenseDialog
        open={!!deletingExpense}
        onOpenChange={(open) => !open && setDeletingExpense(null)}
        expense={deletingExpense}
      />
    </div>
  );
}

function ExpenseRowActions({
  expense,
  onEdit,
  onDelete,
}: {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Veprime për shpenzimin ${expenseCategoryLabels[expense.category]}`}
          />
        }
      >
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Ndrysho</DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          Fshi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}