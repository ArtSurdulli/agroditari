import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { withApiHandler, apiError } from "@/lib/api/response";
import { getReport, parseReportFilters } from "@/lib/reports/get-report";
import type { ReportResponse } from "@/types/report";

// Reports are read/compute only — there is no writable "report" entity, no
// schema change, and no POST/PATCH/DELETE here.
export const GET = withApiHandler(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return apiError(401, "Kërkohet identifikimi.");
  }

  const filters = parseReportFilters(request.nextUrl.searchParams);
  const response: ReportResponse = await getReport(session.user.id, filters);
  return NextResponse.json(response);
});
