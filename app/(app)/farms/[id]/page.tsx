import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/common/back-button";
import { EntityCard } from "@/components/common/entity-card";
import { EntityIconChip } from "@/components/common/entity-icon-chip";
import { StatCard } from "@/components/common/stat-card";
import { entityTheme } from "@/lib/entity-theme";
import { FarmDetailActions } from "./farm-detail-actions";
import type { Farm } from "@/types/farm";

const ParcelsIcon = entityTheme.parcels.icon;

type FarmDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatArea(areaHa: number) {
  return areaHa.toLocaleString("sq-AL", { maximumFractionDigits: 2 });
}

function formatEuro(amount: number) {
  return `${amount.toLocaleString("sq-AL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export default async function FarmDetailPage({ params }: FarmDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const farm = await prisma.farm.findUnique({
    where: { id },
    include: {
      parcels: {
        orderBy: { name: "asc" },
        include: { cropSeasons: { include: { expenses: true } } },
      },
    },
  });

  // Ownership check, same shape as the API route: 404 for both "not found"
  // and "not owned" so existence is never leaked.
  if (!farm || farm.userId !== session.user.id) {
    notFound();
  }

  const parcelCount = farm.parcels.length;
  const totalAreaHa = farm.parcels.reduce(
    (sum, parcel) => sum + Number(parcel.areaHa),
    0
  );
  const allSeasons = farm.parcels.flatMap((parcel) => parcel.cropSeasons);
  const activeSeasonsCount = allSeasons.filter(
    (season) => season.status === "active"
  ).length;
  const totalExpenses = allSeasons.reduce(
    (sum, season) =>
      sum +
      season.expenses.reduce(
        (seasonSum, expense) => seasonSum + Number(expense.amount),
        0
      ),
    0
  );

  const farmForClient: Farm = {
    id: farm.id,
    userId: farm.userId,
    name: farm.name,
    location: farm.location,
    createdAt: farm.createdAt.toISOString(),
    updatedAt: farm.updatedAt.toISOString(),
  };

  const theme = entityTheme.farms;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <BackButton fallbackHref="/farms" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <EntityIconChip entityKey="farms" size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
              {farm.name}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {farm.location || "Pa vendndodhje"}
            </p>
          </div>
        </div>
        <FarmDetailActions farm={farmForClient} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Parcela"
          value={parcelCount}
          icon={theme.icon}
          color={theme.color}
          compact
        />
        <StatCard
          label="Sipërfaqja gjithsej"
          value={`${formatArea(totalAreaHa)} ha`}
          icon={theme.icon}
          color={theme.color}
          compact
        />
        <StatCard
          label="Sezone aktive"
          value={activeSeasonsCount}
          icon={entityTheme.seasons.icon}
          color={entityTheme.seasons.color}
          compact
        />
        <StatCard
          label="Shpenzime gjithsej"
          value={formatEuro(totalExpenses)}
          icon={entityTheme.expenses.icon}
          color={entityTheme.expenses.color}
          compact
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text-primary">Parcelat</h2>
        <div className="mt-3">
          {farm.parcels.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border px-6 py-6 text-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: entityTheme.parcels.color.tint }}
              >
                <ParcelsIcon
                  className="h-5 w-5"
                  style={{ color: entityTheme.parcels.color.solid }}
                />
              </div>
              <Link
                href="/parcels?new=1"
                className="text-sm font-medium hover:underline"
                style={{ color: entityTheme.parcels.color.solid }}
              >
                Ende s&apos;ka parcela. Shto një →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {farm.parcels.map((parcel) => (
                <EntityCard
                  key={parcel.id}
                  entityKey="parcels"
                  href={`/parcels/${parcel.id}`}
                  title={parcel.name}
                  subtitle={`${formatArea(Number(parcel.areaHa))} ha${
                    parcel.soilType ? ` · ${parcel.soilType}` : ""
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
