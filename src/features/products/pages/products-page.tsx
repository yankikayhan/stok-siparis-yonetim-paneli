import { Button } from '../../../shared/components/button'
import { EmptyState } from '../../../shared/components/empty-state'
import { PageHeader } from '../../../shared/components/page-header'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'
import { ProductCreateDialog } from '../components/product-create-dialog'
import { ProductDeleteDialog } from '../components/product-delete-dialog'
import { ProductFilterBar } from '../components/product-filter-bar'
import { ProductPagination } from '../components/product-pagination'
import { ProductTable } from '../components/product-table'
import { useProductActions } from '../hooks/use-product-actions'
import { useProductFilters } from '../hooks/use-product-filters'
import { useProductList } from '../hooks/use-product-list'

export function ProductsPage() {
  const filters = useProductFilters()
  // Sira korunur: /profile sorgusu urun ve kategori sorgularindan once kurulur.
  const currencyFormatter = useCurrencyFormatter()
  const list = useProductList(filters.listParams)
  const actions = useProductActions(list, filters.page)

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
      {actions.isCreateOpen && <ProductCreateDialog categories={list.categories} onClose={actions.closeCreate} />}
      {actions.productToEdit && <ProductCreateDialog categories={list.categories} product={actions.productToEdit} onClose={actions.closeEdit} />}
      {actions.productToDelete && (
        <ProductDeleteDialog
          product={actions.productToDelete}
          onCancel={actions.closeDelete}
          onConfirm={actions.confirmDelete}
        />
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