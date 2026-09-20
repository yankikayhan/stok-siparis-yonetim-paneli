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

// IB9 (KACAK): retry her denemede QueryCache.onError calistirir — uc denemeli bir refetch
// ayni sorgu icin 3 toast basar; rozet (StaleBanner) zaten kalici bilgi verirken bu gurultu
// g10'un ruhunu zedeler. Ayni queryKey icin kisa pencerede tekillestir: ilk hata toast
// basar, pencere icindeki tekrarlar susar. Kullanici gezintisi sirasinda FARKLI sorgular
// (urunler, siparisler...) ayri key tasir — her biri kendi tek toast'ini uretir.
const REFETCH_TOAST_THROTTLE_MS = 10_000
const lastRefetchToastAt = new Map<string, number>()

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Ilk yukleme hatasini sayfa zaten gosterir; toast yalnizca arka plan refetch hatasi icindir.
      if (query.state.data === undefined) return

      // Ayni sorgunun retry dalgalanmasini tek toast'a indir (rozet kalici kanal olarak var).
      const key = JSON.stringify(query.queryKey)
      const now = Date.now()
      const last = lastRefetchToastAt.get(key)
      if (last !== undefined && now - last < REFETCH_TOAST_THROTTLE_MS) return
      lastRefetchToastAt.set(key, now)

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