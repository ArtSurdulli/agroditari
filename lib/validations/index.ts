import { z, type ZodType } from "zod";

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

const PASSWORD_POLICY_MESSAGE =
  "Fjalëkalimi duhet të ketë të paktën 8 shenja, me shkronja dhe numra.";

// Shared password policy — reused by register and password reset so both
// flows enforce the exact same rule.
export const PasswordSchema = z
  .string()
  .min(8, PASSWORD_POLICY_MESSAGE)
  .regex(/[A-Za-z]/, PASSWORD_POLICY_MESSAGE)
  .regex(/[0-9]/, PASSWORD_POLICY_MESSAGE);