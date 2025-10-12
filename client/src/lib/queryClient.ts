import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 30 * 60 * 1000,
        staleTime: 5 * 60 * 1000,
        retry: (failureCount, error) => {
          // Don't retry on authentication errors
          if (error instanceof ApiError && [401, 403].includes(error.status)) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
