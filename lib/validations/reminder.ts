import { z } from "zod";

export const reminderSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Titulli duhet të ketë të paktën 2 shkronja.")
    .max(160, "Titulli mund të ketë deri në 160 shkronja."),
  description: z
    .string()
    .trim()
    .max(1000, "Përshkrimi mund të ketë deri në 1000 shkronja.")
    .optional(),
  dueDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data nuk është e vlefshme."),
  // Nullable (not just optional): PATCH uses an explicit null to unlink an
  // already-linked season, distinct from omitting the field entirely.
  cropSeasonId: z
    .string()
    .uuid("Zgjidh një sezon të vlefshëm.")
    .nullable()
    .optional(),
  isDone: z.boolean().optional().default(false),
});

export type ReminderInput = z.infer<typeof reminderSchema>;