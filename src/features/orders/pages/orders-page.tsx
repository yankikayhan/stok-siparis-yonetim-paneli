import { useInfiniteQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { ordersInfiniteOptions, type OrderStatusFilter } from '../api/orders-api'
import { OrderCreateDialog } from '../components/order-create-dialog'
import { OrderLoadMore } from '../components/order-load-more'
import { OrderStatusFilterBar } from '../components/order-status-filter'
import { OrderTable } from '../components/order-table'
import { useOrderList } from '../hooks/use-order-list'
import { useOrderStatusUpdate } from '../hooks/use-order-status-update'
import { Button } from '../../../shared/components/button'
import { EmptyState } from '../../../shared/components/empty-state'
import { PageHeader } from '../../../shared/components/page-header'
import { StaleBanner } from '../../../shared/components/stale-banner'

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const list = useOrderList(statusFilter)
  const statusUpdate = useOrderStatusUpdate()
  // B5 rozeti: OrderListState union'i status tasimadigi icin ayni infinite queryKey'e
  // ikinci abone kurulur (opsiyonlar aynen — dedup; ek queryFn/enabled yok). Yalniz arka
  // plan refetch hatasinda yanar (isError + veri dolu); ilk yukleme hatasi boundary'de.
  const ordersStaleQuery = useInfiniteQuery(ordersInfiniteOptions(statusFilter))
  const isStale = ordersStaleQuery.isError && ordersStaleQuery.data !== undefined

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
        <Button type="button" onClick={() => setIsCreateDialogOpen(true)}>Siparis olustur</Button>
      </div>

      <StaleBanner isError={isStale} hasData />

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
  return <section aria-busy="true" className="space-y-6"><div className="h-8 w-40 animate-pulse bg-slate-200 dark:bg-slate-800" /><div className="h-18 animate-pulse border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" /><div className="h-80 animate-pulse border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" /></section>
}