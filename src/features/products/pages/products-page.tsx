import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, TriangleAlert } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import {
  categoriesOptions,
  DEFAULT_PRODUCT_LIST_PARAMS,
  deleteProduct,
  productListOptions,
  PRODUCTS_PAGE_SIZE,
  productQueryKeys,
  removeProductFromListCache,
  type Product,
  type ProductListCache,
  type ProductStockFilter,
} from '../api/products-api'
import { ProductCreateDialog } from '../components/product-create-dialog'
import { useUiStore } from '../../../shared/stores/ui-store'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'

export function ProductsPage() {
  const [search, setSearch] = useState(DEFAULT_PRODUCT_LIST_PARAMS.search)
  const [categoryId, setCategoryId] = useState(DEFAULT_PRODUCT_LIST_PARAMS.categoryId)
  const [stockFilter, setStockFilter] = useState<ProductStockFilter>(DEFAULT_PRODUCT_LIST_PARAMS.stock)
  const [page, setPage] = useState(DEFAULT_PRODUCT_LIST_PARAMS.page)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const tableDensity = useUiStore((state) => state.tableDensity)
  const currencyFormatter = useCurrencyFormatter()
  const queryClient = useQueryClient()
  const deferredSearch = useDeferredValue(search)
  // Key ve istek ayni nesneden beslenir; trim key kurulmadan once yapilir.
  const listParams = { search: deferredSearch.trim(), categoryId, stock: stockFilter, page }

  // Render sirasinda state uyarlama: reset deferredSearch'ten turedigi icin
  // eski arama + page 1 kombinasyonu fetch'e donusmeden atilan render'da kalir.
  const [prevFilters, setPrevFilters] = useState({ search: listParams.search, categoryId, stock: stockFilter })
  if (
    prevFilters.search !== listParams.search ||
    prevFilters.categoryId !== categoryId ||
    prevFilters.stock !== stockFilter
  ) {
    setPrevFilters({ search: listParams.search, categoryId, stock: stockFilter })
    setPage(1)
  }

  const productsQuery = useQuery({
    ...productListOptions(listParams),
    // Sunum davranisi veri sozlesmesine degil cagri yerine aittir; spread ile eklenir.
    placeholderData: keepPreviousData,
  })
  const categoriesQuery = useQuery(categoriesOptions())
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

  if (productsQuery.isPending || categoriesQuery.isPending) {
    return <ProductsLoadingState />
  }

  if (productsQuery.isError || categoriesQuery.isError) {
    const error = productsQuery.error ?? categoriesQuery.error

    return (
      <section className="border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-base font-semibold text-rose-950">Urunler yuklenemedi</h1>
        <p className="mt-2 text-sm text-rose-800">
          {error?.message ?? 'Beklenmeyen bir hata olustu.'}
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800"
          onClick={() => {
            void productsQuery.refetch()
            void categoriesQuery.refetch()
          }}
        >
          Tekrar dene
        </button>
      </section>
    )
  }

  const { items: products, totalCount } = productsQuery.data
  const totalPages = Math.max(1, Math.ceil(totalCount / PRODUCTS_PAGE_SIZE))

  // Bos kalan son sayfadan taze veriye gore geri cekilir; placeholder'in eski totalCount'u clamp'i yaniltmasin.
  if (!productsQuery.isPlaceholderData && page > totalPages) {
    setPage(totalPages)
  }

  const categoryNames = new Map(categoriesQuery.data.map((category) => [category.id, category.name]))
  const tableCellPadding = tableDensity === 'compact' ? 'py-2.5' : 'py-4'

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal-700">Envanter</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Urunler</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Urun katalogunu ve stok seviyelerini yonetin.</p>
        </div>
        <button type="button" onClick={() => setIsCreateDialogOpen(true)} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">
          Urun ekle
        </button>
      </div>

      <div className="grid gap-3 border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="relative block">
          <span className="sr-only">Urun ara</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Urun adi veya SKU ara"
            className="h-10 w-full border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
        <label>
          <span className="sr-only">Kategori filtrele</span>
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">Tum kategoriler</option>
            {categoriesQuery.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Stok durumu filtrele</span>
          <select
            value={stockFilter}
            onChange={(event) => setStockFilter(event.target.value as ProductStockFilter)}
            className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">Tum stok durumlari</option>
            <option value="low">Dusuk stok</option>
            <option value="in-stock">Yeterli stok</option>
          </select>
        </label>
      </div>

      {totalCount === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-slate-950">Eslesen urun yok</h2>
          <p className="mt-2 text-sm text-slate-600">Arama veya filtre secimlerinizi degistirin.</p>
        </div>
      ) : (
        <>
          <div
            aria-busy={productsQuery.isPlaceholderData}
            className={`overflow-x-auto border border-slate-200 bg-white ${productsQuery.isPlaceholderData ? 'opacity-60' : ''}`}
          >
          <table className="w-full min-w-180 text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Urun</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3 text-right">Fiyat</th>
                <th className="px-5 py-3 text-right">Stok</th>
                <th className="px-5 py-3"><span className="sr-only">Islemler</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product) => {
                const isLowStock = product.stock <= product.reorderLevel

                return (
                  <tr key={product.id} className="text-slate-700">
                    <td className={`px-5 ${tableCellPadding}`}>
                      <p className="font-medium text-slate-950">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
                    </td>
                    <td className={`px-5 ${tableCellPadding}`}>{categoryNames.get(product.categoryId) ?? '-'}</td>
                    <td className={`px-5 ${tableCellPadding} text-right font-medium`}>{currencyFormatter.format(product.price)}</td>
                    <td className={`px-5 ${tableCellPadding} text-right`}>
                      <span className={isLowStock ? 'font-semibold text-amber-700' : 'text-slate-700'}>
                        {isLowStock && <TriangleAlert className="mr-1 inline size-4" aria-hidden="true" />}
                        {product.stock} adet
                      </span>
                    </td>
                    <td className={`px-5 ${tableCellPadding} text-right`}>
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setProductToEdit(product)} className="text-sm font-medium text-teal-700 hover:text-teal-900">Duzenle</button>
                        <button type="button" onClick={() => setProductToDelete(product)} className="text-sm font-medium text-rose-700 hover:text-rose-900">Sil</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-slate-200 bg-white px-5 py-3">
            <p className="text-sm text-slate-600">
              Toplam {totalCount} kayit · Sayfa {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Onceki
              </button>
              <button
                type="button"
                onClick={() => setPage(page + 1)}
                // Placeholder gosterilirken yeni verinin totalPages'i bilinmez; tasmayi onlemek icin kilitli.
                disabled={productsQuery.isPlaceholderData || page >= totalPages}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sonraki
              </button>
            </div>
          </div>
        </>
      )}
      {isCreateDialogOpen && <ProductCreateDialog categories={categoriesQuery.data} onClose={() => setIsCreateDialogOpen(false)} />}
      {productToEdit && <ProductCreateDialog categories={categoriesQuery.data} product={productToEdit} onClose={() => setProductToEdit(null)} />}
      {productToDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="product-delete-title" className="w-full max-w-md bg-white p-5 shadow-xl">
            <h2 id="product-delete-title" className="text-base font-semibold text-slate-950">Urunu sil</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600"><strong>{productToDelete.name}</strong> urununu kalici olarak silmek istiyor musunuz?</p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setProductToDelete(null)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Vazgec</button>
              <button type="button" onClick={() => deleteProductMutation.mutate(productToDelete.id)} className="rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">Urunu sil</button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}

function ProductsLoadingState() {
  return (
    <section aria-busy="true" className="space-y-6">
      <div className="h-8 w-40 animate-pulse bg-slate-200" />
      <div className="h-18 animate-pulse border border-slate-200 bg-white" />
      <div className="h-80 animate-pulse border border-slate-200 bg-white" />
    </section>
  )
}