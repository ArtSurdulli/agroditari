import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BackButton } from "@/components/common/back-button";
import { EntityCard } from "@/components/common/entity-card";
import { EntityIconChip } from "@/components/common/entity-icon-chip";
import { StatCard } from "@/components/common/stat-card";
import { entityTheme } from "@/lib/entity-theme";
import { seasonStatusLabels } from "@/lib/validations/crop-season";
import { hectareToAri } from "@/lib/units";
import { ParcelDetailActions } from "./parcel-detail-actions";
import type { Parcel } from "@/types/parcel";

type ParcelDetailPageProps = {
  params: Promise<{ id: string }>;
};

const SeasonsIcon = entityTheme.seasons.icon;

// areaHa is the canonical, stored figure — ari is shown alongside it only for
// readability, e.g. "0.5 ha (50 ari)".
function formatArea(areaHa: number) {
  const ha = areaHa.toLocaleString("sq-AL", { maximumFractionDigits: 2 });
  const ari = hectareToAri(areaHa).toLocaleString("sq-AL", {
    maximumFractionDigits: 2,
  });
  return `${ha} ha (${ari} ari)`;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("sq-AL");
}

function formatEuro(amount: number) {
  return `${amount.toLocaleString("sq-AL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export default async function ParcelDetailPage({
  params,
}: ParcelDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    notFound();
  }

  const parcel = await prisma.parcel.findUnique({
    where: { id },
    include: {
      farm: true,
      cropSeasons: {
        orderBy: { createdAt: "desc" },
        include: { crop: true, expenses: true, harvests: true },
      },
    },
  });

  // Two-hop ownership (parcel -> farm -> user), same as the API route: 404
  // for both "not found" and "not owned" so existence is never leaked.
  if (!parcel || parcel.farm.userId !== session.user.id) {
    notFound();
  }

  const seasonCount = parcel.cropSeasons.length;
  const activeSeasonCount = parcel.cropSeasons.filter(
    (season) => season.status === "active"
  ).length;
  const totalExpenses = parcel.cropSeasons.reduce(
    (sum, season) =>
      sum +
      season.expenses.reduce(
        (seasonSum, expense) => seasonSum + Number(expense.amount),
        0
      ),
    0
  );
  const totalRevenue = parcel.cropSeasons.reduce(
    (sum, season) =>
      sum +
      season.harvests.reduce(
        (seasonSum, harvest) => seasonSum + Number(harvest.revenue ?? 0),
        0
      ),
    0
  );

  const parcelForClient: Parcel = {
    id: parcel.id,
    farmId: parcel.farmId,
    farmName: parcel.farm.name,
    name: parcel.name,
    areaHa: parcel.areaHa.toString(),
    soilType: parcel.soilType,
    createdAt: parcel.createdAt.toISOString(),
    updatedAt: parcel.updatedAt.toISOString(),
  };

  const theme = entityTheme.parcels;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <BackButton fallbackHref="/parcels" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <EntityIconChip entityKey="parcels" size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-text-primary sm:text-2xl">
              {parcel.name}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {parcel.farm.name} · {formatArea(Number(parcel.areaHa))}
              {parcel.soilType ? ` · ${parcel.soilType}` : ""}
            </p>
          </div>
        </div>
        <ParcelDetailActions parcel={parcelForClient} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Sezone"
          value={seasonCount}
          icon={theme.icon}
          color={theme.color}
          compact
        />
        <StatCard
          label="Sezone aktive"
          value={activeSeasonCount}
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
        <StatCard
          label="Të ardhura gjithsej"
          value={formatEuro(totalRevenue)}
          icon={entityTheme.harvests.icon}
          color={entityTheme.harvests.color}
          compact
        />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-text-primary">Sezonet</h2>
        <div className="mt-3">
          {parcel.cropSeasons.length === 0 ? (
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
                Ende s&apos;ka sezone. Shto një →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {parcel.cropSeasons.map((season) => (
                <EntityCard
                  key={season.id}
                  entityKey="seasons"
                  href={`/seasons/${season.id}`}
                  title={`${season.crop.name} · ${season.season}`}
                  subtitle={
                    season.sowingDate
                      ? `Mbjellë më ${formatDate(season.sowingDate)}`
                      : undefined
                  }
                  badge={seasonStatusLabels[season.status]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
