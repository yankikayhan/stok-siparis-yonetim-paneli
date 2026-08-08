import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { isApiError } from '../shared/api/api-error'
import { useToastStore } from '../shared/stores/toast-store'

// meta alanlarina tip guvenligi kazandiran TanStack Query module augmentation'i.
declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      suppressErrorToast?: boolean
      errorSuffix?: string
      successMessage?: string
    }
  }
}

function toErrorMessage(error: unknown, fallback: string) {
  return isApiError(error) ? error.message : fallback
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Ilk yukleme hatasini sayfa zaten gosterir; toast yalnizca arka plan refetch hatasi icindir.
      if (query.state.data === undefined) return

      useToastStore.getState().addToast({
        type: 'error',
        message: toErrorMessage(error, 'Veriler arka planda guncellenemedi.'),
      })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressErrorToast) return

      const message = toErrorMessage(error, 'Islem tamamlanamadi.')
      const suffix = mutation.meta?.errorSuffix

      useToastStore.getState().addToast({
        type: 'error',
        message: suffix ? `${message} ${suffix}` : message,
      })
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.successMessage) {
        useToastStore.getState().addToast({ type: 'success', message: mutation.meta.successMessage })
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Varsayilan tazelik penceresi: kisa gezinmelerde refetch firtinasini onler,
      // 30 sn sonrasinda veri bayat sayilip arka planda tazelenir.
      staleTime: 30_000,
      // Yukaridaki QueryCache.onError'in tam tumleyeni: veri YOKKEN hata boundary'ye firlatilir,
      // veri VARKEN firlatilmaz ve toast'a birakilir. Ayni hata iki kanaldan gosterilmez.
      throwOnError: (_error, query) => query.state.data === undefined,
      retry: (failureCount, error) =>
        !(isApiError(error) && error.status !== undefined && error.status < 500) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})