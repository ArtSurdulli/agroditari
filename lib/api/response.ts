import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorBody = {
  error: string;
  details?: unknown;
};

export function apiError(status: number, message: string, details?: unknown) {
  return NextResponse.json<ApiErrorBody>(
    { error: message, ...(details !== undefined ? { details } : {}) },
    { status }
  );
}

export function withApiHandler<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of err.issues) {
          const field =
            issue.path.length > 0 ? String(issue.path[0]) : "_root";
          if (!fieldErrors[field]) fieldErrors[field] = issue.message;
        }
        return apiError(422, "Të dhëna të pavlefshme.", fieldErrors);
      }

      console.error(err);
      return apiError(500, "Ndodhi një gabim. Provo përsëri.");
    }
  };
}