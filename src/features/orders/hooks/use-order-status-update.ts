import { useMutation, useQueryClient } from '@tanstack/react-query'
import { customerQueryKeys } from '../../customers/api/customers-api'
import {
  applyStatusToCache,
  orderQueryKeys,
  updateOrderStatus,
  type OrderStatus,
  type OrdersCache,
} from '../api/orders-api'

// Tetikle-ve-devam-et aksiyonu: hata inline degil toast'la bildirilir; rollback bilgisi eklenir.
export function useOrderStatusUpdate() {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: updateOrderStatus,
    meta: { successMessage: 'Siparis durumu guncellendi.', errorSuffix: 'Degisiklik geri alindi.' },
    onMutate: async ({ id, status }) => {
      // Prefix TUM siparis cache'lerini kapsar: dashboard'un tam listesi + filtre basina infinite girdiler.
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.all })
      const snapshot = queryClient.getQueriesData<OrdersCache>({ queryKey: orderQueryKeys.all })

      queryClient.setQueriesData<OrdersCache>({ queryKey: orderQueryKeys.all }, (data) =>
        data === undefined ? undefined : applyStatusToCache(data, id, status),
      )

      return { snapshot }
    },
    onError: (_error, _variables, context) => {
      context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    // Durum degisimi filtre uyeligini de degistirir; yerinde boyamanin mutabakati invalidation'dadir.
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.all }),
      ])
    },
  })

  return {
    updateStatus: (id: string, status: OrderStatus) => mutation.mutate({ id, status }),
    isPending: mutation.isPending,
  }
}
