"use client";

import { useState } from "react";
import { Plus, Sprout } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/list-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CropFormDialog } from "@/components/admin/crop-form-dialog";
import { DeleteCropDialog } from "@/components/admin/delete-crop-dialog";
import { useAdminSession } from "@/components/admin/admin-context";
import { useCrops } from "@/hooks/use-crops";
import { getAdminRoleTheme } from "@/lib/admin-theme";
import { unitTypeLabels } from "@/lib/validations/harvest";
import type { Crop } from "@/types/crop";

export default function AdminCropsPage() {
  const { role } = useAdminSession();
  const theme = getAdminRoleTheme(role);
  const { data: crops, isLoading, isError } = useCrops();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [cropToDelete, setCropToDelete] = useState<Crop | null>(null);

  const rows = crops ?? [];

  return (
    <div>
      <PageHeader
        title="Kulturat"
        subtitle="Katalogu global i kulturave — i dukshëm për të gjithë fermerët."
        actions={
          <Button
            style={{ backgroundColor: theme.color.solid }}
            className="hover:opacity-90"
            onClick={() => {
              setEditingCrop(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Shto kulturë
          </Button>
        }
      />

      <div className="mt-6">
        {isLoading ? (
          <ListSkeleton rows={6} columns={4} />
        ) : isError ? (
          <p className="text-sm text-danger">Ndodhi një gabim. Provo përsëri.</p>
        ) : rows.length === 0 ? (
          <EmptyState icon={Sprout} title="Ende s'ka kultura." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Emri</TableHead>
                  <TableHead>Kategoria</TableHead>
                  <TableHead>Njësia standarde</TableHead>
                  <TableHead>Lloji</TableHead>
                  <TableHead className="text-right">Veprime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((crop) => (
                  <TableRow key={crop.id}>
                    <TableCell className="font-medium text-text-primary">
                      {crop.name}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {crop.category ?? "—"}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {crop.standardUnit ? unitTypeLabels[crop.standardUnit] : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={crop.isDefault ? "secondary" : "outline"}>
                        {crop.isDefault ? "E parazgjedhur" : "E shtuar"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCrop(crop);
                            setFormOpen(true);
                          }}
                        >
                          Ndrysho
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCropToDelete(crop)}
                        >
                          Fshi
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <CropFormDialog open={formOpen} onOpenChange={setFormOpen} crop={editingCrop} />
      <DeleteCropDialog
        open={!!cropToDelete}
        onOpenChange={(open) => !open && setCropToDelete(null)}
        crop={cropToDelete}
      />
    </div>
  );
}
