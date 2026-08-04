import { QueryClient } from '@tanstack/react-query'
import { isApiError } from '../shared/api/api-error'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        !(isApiError(error) && error.status !== undefined && error.status < 500) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})