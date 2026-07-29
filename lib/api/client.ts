import axios, { type AxiosError } from "axios";

const GENERIC_ERROR_MESSAGE = "Ndodhi një gabim. Provo përsëri.";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    if (typeof window !== "undefined" && error.response?.status === 401) {
      window.location.href = "/login";
    }

    const message = error.response?.data?.error ?? GENERIC_ERROR_MESSAGE;
    return Promise.reject(new Error(message));
  }
);