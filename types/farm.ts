// Client-side shape of a Farm as it arrives over JSON (dates are ISO strings,
// not Date instances). Shared between the API route responses, the hook, and
// the UI components so there is one definition to update per entity.
export type Farm = {
  id: string;
  userId: string;
  name: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  // Row-summary rollups, present only on the list endpoint (GET /api/farms)
  // — undefined elsewhere (create/update/detail responses).
  parcelCount?: number;
  totalAreaHa?: number;
  activeSeasonCount?: number;
};