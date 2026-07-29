import type { ZodType } from "zod";

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string> };

export function validate<T>(
  schema: ZodType<T>,
  input: unknown
): ValidationResult<T> {
  const result = schema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? String(issue.path[0]) : "_root";
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return { success: false, errors };
}