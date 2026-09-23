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

type EditTargetInput = {
  products: Product[] | undefined
  isPlaceholderData: boolean
  isPageOutOfRange: boolean
  editId: string | null
}

export type EditTargetResolution = { product: Product | undefined; shouldClear: boolean }

// Duzenlenen urun listeden dustugunde dialog sessizce kapanir ama editId dolu kalirsa urun
// listeye donunce dialog KENDILIGINDEN acilir. Karar yalnizca taze ve gecerli bir listeye
// dayanabilir: placeholder onceki sayfanin verisidir, aralik disi sayfa ise clamp bekler.
export function resolveEditTarget({
  editId,
  isPageOutOfRange,
  isPlaceholderData,
  products,
}: EditTargetInput): EditTargetResolution {
  if (editId === null || products === undefined) {
    return { product: undefined, shouldClear: false }
  }

  const product = products.find((candidate) => candidate.id === editId)

  if (isPlaceholderData || isPageOutOfRange) {
    return { product, shouldClear: false }
  }

  return { product, shouldClear: product === undefined }
}

// Silme tek akistir (dialog ac -> onayla -> mutate -> dialog kapan): dialog state'i ile mutation
// ayrilsaydi kapanma cagrisi hook disina cikar ve `await cancelQueries` sonrasindaki
// zamanlamasini kaybederdi.
export function useProductActions(list: ProductListState, page: number) {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  // B19 (Adim 8 / IB3): snapshot YERINE id — silme id ile yapilir; gosterim adi taze listeden
  // turetilir (tek dogruluk kaynagi: duzenleme tarafinin resolveEditTarget deseniyle ayni ilke).
  const [deleteId, setDeleteId] = useState<string | null>(null)
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
      setDeleteId(null)

      return { snapshot }
    },
    onError: (_error, _productId, context) => {
      context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
    },
    // Basari veya hata fark etmeksizin sunucuyla mutabakat: sayfa kaymasi ve totalCount duzeltilir.
    onSettled: () => queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() }),
  })

  // Dialog urunu snapshot degil guncel listeden turetir (tek dogruluk kaynagi): arkaplan
  // refetch'inin getirdigi degisiklikler dialoga akar.
  const { product: productToEdit, shouldClear } = resolveEditTarget({
    products: list.status === 'ready' ? list.products : undefined,
    isPlaceholderData: list.status === 'ready' && list.isPlaceholderData,
    isPageOutOfRange: list.status === 'ready' && page > list.totalPages,
    editId,
  })

  // Render fazinda uyarlama (effect degil): kosul kendi kendini dusurur, cunku shouldClear
  // yalnizca editId doluyken true olabilir ve bir sonraki render'da editId null olur.
  if (shouldClear) {
    setEditId(null)
  }

  // Silme onayinin gosterim adi taze listeden turetilir; urun taze listede yoksa (or. baska
  // sekmede silinmis) dialog yine acilir ama fallback metinle — silme id iledir, karar etkilenmez.
  const productToDeleteName =
    deleteId !== null && list.status === 'ready'
      ? list.products.find((product) => product.id === deleteId)?.name
      : undefined

  return {
    isCreateOpen,
    openCreate: () => setIsCreateOpen(true),
    closeCreate: () => setIsCreateOpen(false),
    productToEdit,
    openEdit: (productId: string) => setEditId(productId),
    closeEdit: () => setEditId(null),
    deleteId,
    productToDeleteName,
    openDelete: (productId: string) => setDeleteId(productId),
    closeDelete: () => setDeleteId(null),
    confirmDelete: () => {
      if (deleteId === null) return
      deleteProductMutation.mutate(deleteId)
    },
  }
}
