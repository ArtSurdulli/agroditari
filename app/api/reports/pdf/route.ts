import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { withApiHandler, apiError } from "@/lib/api/response";
import { getReport, parseReportFilters } from "@/lib/reports/get-report";
import { generateReportPdf, type ReportPdfFilters } from "@/lib/reports/pdf";

// Same report data as GET /api/reports (same ownership scoping, same
// filters), rendered as a PDF instead of JSON. No schema change, no writes.
export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const userId = session.user.id;
  const filters = parseReportFilters(request.nextUrl.searchParams);
  const report = await getReport(userId, filters);

  // Human-readable labels for the filter line at the top of the PDF. Scoped
  // by the same ownership check as the report query itself — a filter for a
  // season/parcel that isn't the user's simply doesn't resolve to a label.
  const [season, parcel] = await Promise.all([
    filters.seasonId
      ? prisma.cropSeason.findFirst({
          where: {
            id: filters.seasonId,
            parcel: { farm: { userId } },
          },
          select: { season: true, crop: { select: { name: true } } },
        })
      : null,
    filters.parcelId
      ? prisma.parcel.findFirst({
          where: {
            id: filters.parcelId,
            farm: { userId },
          },
          select: { name: true, farm: { select: { name: true } } },
        })
      : null,
  ]);

  const pdfFilters: ReportPdfFilters = {
    seasonLabel: season ? `${season.crop.name} · ${season.season}` : null,
    parcelLabel: parcel ? `${parcel.name} — ${parcel.farm.name}` : null,
    from: filters.from ?? null,
    to: filters.to ?? null,
  };

  const pdfBuffer = await generateReportPdf(report, pdfFilters);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agroditari-raport-${date}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
});
