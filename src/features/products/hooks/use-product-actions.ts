import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  deleteProduct,
  productQueryKeys,
  removeProductFromListCache,
  type Product,
  type ProductListCache,
} from '../api/products-api'
import { type ProductListState } from './use-product-list'

// Silme tek akistir (dialog ac -> onayla -> mutate -> dialog kapan): dialog state'i ile mutation
// ayrilsaydi kapanma cagrisi hook disina cikar ve `await cancelQueries` sonrasindaki
// zamanlamasini kaybederdi.
export function useProductActions(list: ProductListState) {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    // Tetikle-ve-devam-et aksiyonu: dialog mutate aninda kapanir, hata toast'la bildirilir.
    meta: { successMessage: 'Urun silindi.', errorSuffix: 'Urun geri getirildi.' },
    onMutate: async (productId) => {
      // Ucustaki refetch'lerin optimistic yazimin uzerine eski veriyle binmesi engellenir.
      await queryClient.cancelQueries({ queryKey: productQueryKeys.lists() })
      // Prefix'le eslesen TUM girdiler (sayfali listeler + listAll) yedeklenir; rollback birebir geri yazar.
      const snapshot = queryClient.getQueriesData<ProductListCache>({ queryKey: productQueryKeys.lists() })

      queryClient.setQueriesData<ProductListCache>({ queryKey: productQueryKeys.lists() }, (data) =>
        data === undefined ? undefined : removeProductFromListCache(data, productId),
      )
      setProductToDelete(null)

      return { snapshot }
    },
    onError: (_error, _productId, context) => {
      context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    // Basari veya hata fark etmeksizin sunucuyla mutabakat: sayfa kaymasi ve totalCount duzeltilir.
    onSettled: () => queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() }),
  })

  // Dialog urunu snapshot degil guncel listeden turetir (tek dogruluk kaynagi): arkaplan
  // refetch'inin getirdigi degisiklikler dialoga akar. Urun bu sayfadan duserse
  // (filtre uyeligi/sayfa kaymasi) find undefined kalir ve dialog sessizce kapanir.
  const productToEdit =
    list.status === 'ready' ? list.products.find((product) => product.id === editId) : undefined

  return {
    isCreateOpen,
    openCreate: () => setIsCreateOpen(true),
    closeCreate: () => setIsCreateOpen(false),
    productToEdit,
    openEdit: (productId: string) => setEditId(productId),
    closeEdit: () => setEditId(null),
    productToDelete,
    openDelete: (product: Product) => setProductToDelete(product),
    closeDelete: () => setProductToDelete(null),
    confirmDelete: () => {
      if (productToDelete === null) return
      deleteProductMutation.mutate(productToDelete.id)
    },
  }
}
