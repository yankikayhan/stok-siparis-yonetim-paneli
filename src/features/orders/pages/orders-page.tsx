import { ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { type OrderStatusFilter } from '../api/orders-api'
import { OrderCreateDialog } from '../components/order-create-dialog'
import { OrderLoadMore } from '../components/order-load-more'
import { OrderStatusFilterBar } from '../components/order-status-filter'
import { OrderTable } from '../components/order-table'
import { useOrderList } from '../hooks/use-order-list'
import { useOrderStatusUpdate } from '../hooks/use-order-status-update'
import { EmptyState } from '../../../shared/components/empty-state'
import { PageHeader } from '../../../shared/components/page-header'

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const list = useOrderList(statusFilter)
  const statusUpdate = useOrderStatusUpdate()

  // isError degil: veri varsa sayfa cizilir, hata toast kanalinda kalir (throwOnError ile ayni yuklem).
  if (list.status === 'loading') {
    return <OrdersLoadingState />
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          eyebrow="Satislar"
          title="Siparisler"
          description="Siparis durumlarini takip edin ve operasyon akisini yonetin."
        />
        <button type="button" onClick={() => setIsCreateDialogOpen(true)} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">Siparis olustur</button>
      </div>

      <OrderStatusFilterBar value={statusFilter} onChange={setStatusFilter} />

      {list.orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Eslesen siparis yok"
          description="Durum filtresini degistirerek tekrar deneyin."
        />
      ) : (
        <>
          <OrderTable
            orders={list.orders}
            customerNames={list.customerNames}
            isPlaceholderData={list.isPlaceholderData}
            isUpdatingStatus={statusUpdate.isPending}
            onStatusChange={statusUpdate.updateStatus}
          />
          <OrderLoadMore
            totalCount={list.totalCount}
            loadedCount={list.orders.length}
            hasNextPage={list.hasNextPage}
            isFetchingNextPage={list.isFetchingNextPage}
            isPlaceholderData={list.isPlaceholderData}
            onLoadMore={list.fetchNextPage}
          />
        </>
      )}
      {isCreateDialogOpen && <OrderCreateDialog customers={list.customers} products={list.products} onClose={() => setIsCreateDialogOpen(false)} />}
    </section>
  )
}

function OrdersLoadingState() {
  return <section aria-busy="true" className="space-y-6"><div className="h-8 w-40 animate-pulse bg-slate-200" /><div className="h-18 animate-pulse border border-slate-200 bg-white" /><div className="h-80 animate-pulse border border-slate-200 bg-white" /></section>
}