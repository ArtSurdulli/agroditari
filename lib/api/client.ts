import axios, { type AxiosError } from "axios";

const GENERIC_ERROR_MESSAGE = "Ndodhi një gabim. Provo përsëri.";

// Zod field errors (e.g. { name: "Emri duhet..." }) surfaced by
// withApiHandler / apiError, attached to the thrown Error so callers can
// show per-field messages when present.
export type ApiError = Error & { details?: Record<string, string> };

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string; details?: Record<string, string> }>) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      window.location.href = "/login";
    }

    const message = error.response?.data?.error ?? GENERIC_ERROR_MESSAGE;
    const apiError: ApiError = new Error(message);
    const details = error.response?.data?.details;
    if (details && typeof details === "object") {
      apiError.details = details;
    }
    return Promise.reject(apiError);
  }
);