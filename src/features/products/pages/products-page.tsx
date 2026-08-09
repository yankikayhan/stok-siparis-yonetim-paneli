import { Search, TriangleAlert } from 'lucide-react'
import { type ProductStockFilter } from '../api/products-api'
import { ProductCreateDialog } from '../components/product-create-dialog'
import { useProductActions } from '../hooks/use-product-actions'
import { useProductFilters } from '../hooks/use-product-filters'
import { useProductList } from '../hooks/use-product-list'
import { useUiStore } from '../../../shared/stores/ui-store'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'
import { EmptyState } from '../../../shared/components/empty-state'
import { PageHeader } from '../../../shared/components/page-header'

export function ProductsPage() {
  const filters = useProductFilters()
  // Sira korunur: /profile sorgusu urun ve kategori sorgularindan once kurulur.
  const tableDensity = useUiStore((state) => state.tableDensity)
  const currencyFormatter = useCurrencyFormatter()
  const list = useProductList(filters.listParams)
  const actions = useProductActions(list)

  if (list.status === 'loading') {
    return <ProductsLoadingState />
  }

  filters.clampPage(list.totalPages, list.isPlaceholderData)

  const tableCellPadding = tableDensity === 'compact' ? 'py-2.5' : 'py-4'

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Envanter"
          title="Urunler"
          description="Urun katalogunu ve stok seviyelerini yonetin."
        />
        <button type="button" onClick={actions.openCreate} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">
          Urun ekle
        </button>
      </div>

      <div className="grid gap-3 border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="relative block">
          <span className="sr-only">Urun ara</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
          <input
            value={filters.search}
            onChange={(event) => filters.setSearch(event.target.value)}
            placeholder="Urun adi veya SKU ara"
            className="h-10 w-full border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
        <label>
          <span className="sr-only">Kategori filtrele</span>
          <select
            value={filters.categoryId}
            onChange={(event) => filters.setCategoryId(event.target.value)}
            className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">Tum kategoriler</option>
            {list.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Stok durumu filtrele</span>
          <select
            value={filters.stock}
            onChange={(event) => filters.setStock(event.target.value as ProductStockFilter)}
            className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          >
            <option value="all">Tum stok durumlari</option>
            <option value="low">Dusuk stok</option>
            <option value="in-stock">Yeterli stok</option>
          </select>
        </label>
      </div>

      {list.totalCount === 0 ? (
        <EmptyState title="Eslesen urun yok" description="Arama veya filtre secimlerinizi degistirin." />
      ) : (
        <>
          <div
            aria-busy={list.isPlaceholderData}
            className={`overflow-x-auto border border-slate-200 bg-white ${list.isPlaceholderData ? 'opacity-60' : ''}`}
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
              {list.products.map((product) => {
                const isLowStock = product.stock <= product.reorderLevel

                return (
                  <tr key={product.id} className="text-slate-700">
                    <td className={`px-5 ${tableCellPadding}`}>
                      <p className="font-medium text-slate-950">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
                    </td>
                    <td className={`px-5 ${tableCellPadding}`}>{list.categoryNames.get(product.categoryId) ?? '-'}</td>
                    <td className={`px-5 ${tableCellPadding} text-right font-medium`}>{currencyFormatter.format(product.price)}</td>
                    <td className={`px-5 ${tableCellPadding} text-right`}>
                      <span className={isLowStock ? 'font-semibold text-amber-700' : 'text-slate-700'}>
                        {isLowStock && <TriangleAlert className="mr-1 inline size-4" aria-hidden="true" />}
                        {product.stock} adet
                      </span>
                    </td>
                    <td className={`px-5 ${tableCellPadding} text-right`}>
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => actions.openEdit(product.id)} className="text-sm font-medium text-teal-700 hover:text-teal-900">Duzenle</button>
                        <button type="button" onClick={() => actions.openDelete(product)} className="text-sm font-medium text-rose-700 hover:text-rose-900">Sil</button>
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
              Toplam {list.totalCount} kayit · Sayfa {filters.page} / {list.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => filters.setPage(filters.page - 1)}
                disabled={filters.page === 1}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Onceki
              </button>
              <button
                type="button"
                onClick={() => filters.setPage(filters.page + 1)}
                // Placeholder gosterilirken yeni verinin totalPages'i bilinmez; tasmayi onlemek icin kilitli.
                disabled={list.isPlaceholderData || filters.page >= list.totalPages}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Sonraki
              </button>
            </div>
          </div>
        </>
      )}
      {actions.isCreateOpen && <ProductCreateDialog categories={list.categories} onClose={actions.closeCreate} />}
      {actions.productToEdit && <ProductCreateDialog categories={list.categories} product={actions.productToEdit} onClose={actions.closeEdit} />}
      {actions.productToDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="product-delete-title" className="w-full max-w-md bg-white p-5 shadow-xl">
            <h2 id="product-delete-title" className="text-base font-semibold text-slate-950">Urunu sil</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600"><strong>{actions.productToDelete.name}</strong> urununu kalici olarak silmek istiyor musunuz?</p>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={actions.closeDelete} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Vazgec</button>
              <button type="button" onClick={actions.confirmDelete} className="rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">Urunu sil</button>
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