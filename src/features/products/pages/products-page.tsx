import { useQuery } from '@tanstack/react-query'
import { lazy, Suspense } from 'react'
import { Button } from '../../../shared/components/button'
import { EmptyState } from '../../../shared/components/empty-state'
import { PageHeader } from '../../../shared/components/page-header'
import { StaleBanner } from '../../../shared/components/stale-banner'
import { retryableImport } from '../../../shared/lib/retryable-import'
import { DialogErrorBoundary } from '../../../shared/components/dialog-error-boundary'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'
import { productListOptions } from '../api/products-api'
import { ProductFilterBar } from '../components/product-filter-bar'
import { ProductPagination } from '../components/product-pagination'
import { ProductTable } from '../components/product-table'
import { useProductActions } from '../hooks/use-product-actions'
import { useProductFilters } from '../hooks/use-product-filters'
import { useProductList } from '../hooks/use-product-list'

// B1 (Adim 8 / IB2): dialog lazy — named export koprusu + retryableImport (B2).
// Fallback null: kullanici sayfayi goruyor; dialog'un kendi starting-style animasyonu gelir.
// mapModule: retry yolunda (?retry=1) ham modul named export tasir, React.lazy default ister.
const ProductCreateDialog = lazy(
  retryableImport(
    () => import('../components/product-create-dialog'),
    (module) => ({ default: module.ProductCreateDialog as typeof import('../components/product-create-dialog').ProductCreateDialog }),
  ),
)

const ProductDeleteDialog = lazy(
  retryableImport(
    () => import('../components/product-delete-dialog'),
    (module) => ({ default: module.ProductDeleteDialog as typeof import('../components/product-delete-dialog').ProductDeleteDialog }),
  ),
)

export function ProductsPage() {
  const filters = useProductFilters()
  // Sira korunur: /profile sorgusu urun ve kategori sorgularindan once kurulur.
  const currencyFormatter = useCurrencyFormatter()
  const list = useProductList(filters.listParams)
  const actions = useProductActions(list, filters.page)
  // B5 rozeti: ProductListState union'i status tasimadigi icin ayni queryKey'e ikinci bir
  // abone kurulur. Opsiyonlar AYNEN gecilir (ek queryFn/enabled YOK): boylece birinci
  // aboneye katilir (dedup — ayni key'de ek istek uretmez, cache'i paylasir) ve arka plan
  // refetch hatasini gorur. Yalniz refetch hatasinda yanar (isError + veri dolu); ilk
  // yukleme hatasi boundary'ye gider (veri yok), buraya dusmez.
  const productsStaleQuery = useQuery(productListOptions(filters.listParams))
  const isStale = productsStaleQuery.isError && productsStaleQuery.data !== undefined

  if (list.status === 'loading') {
    return <ProductsLoadingState />
  }

  filters.clampPage(list.totalPages, list.isPlaceholderData)

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Envanter"
          title="Urunler"
          description="Urun katalogunu ve stok seviyelerini yonetin."
        />
        <Button type="button" onClick={actions.openCreate}>
          Urun ekle
        </Button>
      </div>

      <StaleBanner isError={isStale} hasData />

      <ProductFilterBar
        search={filters.search}
        onSearchChange={filters.setSearch}
        categoryId={filters.categoryId}
        onCategoryChange={filters.setCategoryId}
        stock={filters.stock}
        onStockChange={filters.setStock}
        categories={list.categories}
      />

      {list.totalCount === 0 ? (
        <EmptyState title="Eslesen urun yok" description="Arama veya filtre secimlerinizi degistirin." />
      ) : (
        <>
          <ProductTable
            products={list.products}
            categoryNames={list.categoryNames}
            currencyFormatter={currencyFormatter}
            isPlaceholderData={list.isPlaceholderData || filters.isPending}
            onEdit={actions.openEdit}
            onDelete={actions.openDelete}
          />
          <ProductPagination
            page={filters.page}
            totalPages={list.totalPages}
            totalCount={list.totalCount}
            isPlaceholderData={list.isPlaceholderData || filters.isPending}
            onPageChange={filters.setPage}
          />
        </>
      )}
      {actions.isCreateOpen && (
        <DialogErrorBoundary onReset={actions.closeCreate}>
          <Suspense fallback={null}>
            <ProductCreateDialog categories={list.categories} onClose={actions.closeCreate} />
          </Suspense>
        </DialogErrorBoundary>
      )}
      {actions.productToEdit && (
        <DialogErrorBoundary onReset={actions.closeEdit}>
          <Suspense fallback={null}>
            <ProductCreateDialog categories={list.categories} product={actions.productToEdit} onClose={actions.closeEdit} />
          </Suspense>
        </DialogErrorBoundary>
      )}
      {actions.deleteId !== null && (
        <DialogErrorBoundary onReset={actions.closeDelete}>
          <Suspense fallback={null}>
            <ProductDeleteDialog
              productName={actions.productToDeleteName}
              onCancel={actions.closeDelete}
              onConfirm={actions.confirmDelete}
            />
          </Suspense>
        </DialogErrorBoundary>
      )}
    </section>
  )
}

function ProductsLoadingState() {
  return (
    <section aria-busy="true" className="space-y-6">
      <div className="h-8 w-40 animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div className="h-18 animate-pulse border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
      <div className="h-80 animate-pulse border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
    </section>
  )
}