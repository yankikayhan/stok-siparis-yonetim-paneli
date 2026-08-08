import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQueryClient,
  type InfiniteData,
  type UseQueryResult,
} from '@tanstack/react-query'
import { ArrowUpDown, ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { type Page } from '../../../shared/api/http-client'
import { customerQueryKeys, customersOptions, type Customer } from '../../customers/api/customers-api'
import { productListAllOptions, type Product } from '../../products/api/products-api'
import { OrderCreateDialog } from '../components/order-create-dialog'
import {
  ordersInfiniteOptions,
  orderQueryKeys,
  orderStatuses,
  type Order,
  type OrderStatus,
  type OrderStatusFilter,
  updateOrderStatus,
} from '../api/orders-api'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'
import { EmptyState } from '../../../shared/components/empty-state'
import { PageHeader } from '../../../shared/components/page-header'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' })

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Beklemede',
  paid: 'Odendi',
  shipped: 'Kargoda',
  cancelled: 'Iptal',
}

// Optimistic update icin gecerli bir union uyesi kurar; gercek degerler onSettled refetch'iyle gelir.
function applyStatus(order: Order, status: OrderStatus): Order {
  const base = {
    id: order.id,
    customerId: order.customerId,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items,
  }

  switch (status) {
    case 'pending':
    case 'paid':
      return { ...base, status }
    case 'shipped':
      return { ...base, status, trackingNumber: order.status === 'shipped' ? order.trackingNumber : 'Ataniyor...' }
    case 'cancelled':
      return { ...base, status, cancelReason: order.status === 'cancelled' ? order.cancelReason : 'Belirtilmedi' }
  }
}

// 'orders' prefix'i altinda iki farkli sekil yasar: list() -> Order[], infinite girdileri ->
// InfiniteData<Page<Order>>; updater sekle gore dallanir (products'taki pattern'in muadili).
type OrdersCache = Order[] | InfiniteData<Page<Order>>

function applyStatusToCache(data: OrdersCache, id: string, status: OrderStatus): OrdersCache {
  if (Array.isArray(data)) {
    return data.map((order) => (order.id === id ? applyStatus(order, status) : order))
  }

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((order) => (order.id === id ? applyStatus(order, status) : order)),
    })),
  }
}

// Modul seviyesi tanim sarttir (dashboard select emsali): memoizasyon guard'i combine'in
// KENDI referansina da bakar; inline tanim + icinde uretilen closure'lar (refetchAll)
// her render'da yeni sonuc nesnesi dogururdu.
function combineReferenceQueries([customersResult, productsResult]: [
  UseQueryResult<Customer[]>,
  UseQueryResult<Product[]>,
]) {
  return {
    isPending: customersResult.isPending || productsResult.isPending,
    error: customersResult.error ?? productsResult.error ?? undefined,
    // isSuccess daraltmalari data'lari undefined'siz tipler; biri bile degilse sayfa veri gostermez.
    data:
      customersResult.isSuccess && productsResult.isSuccess
        ? {
            customers: customersResult.data,
            products: productsResult.data,
          }
        : undefined,
    refetchAll: () => {
      void customersResult.refetch()
      void productsResult.refetch()
    },
  }
}

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const currencyFormatter = useCurrencyFormatter()
  const queryClient = useQueryClient()
  const referenceQueries = useQueries({
    queries: [customersOptions(), productListAllOptions()],
    combine: combineReferenceQueries,
  })
  // Filtre degisimi = yeni key; eski liste keepPreviousData ile soluk kalir (urunler sayfasi pattern'i).
  const ordersQuery = useInfiniteQuery({
    ...ordersInfiniteOptions(statusFilter),
    placeholderData: keepPreviousData,
  })
  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    // Tetikle-ve-devam-et aksiyonu: hata inline degil toast'la bildirilir; rollback bilgisi eklenir.
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

  if (referenceQueries.isPending || ordersQuery.isPending) {
    return <OrdersLoadingState />
  }

  if (referenceQueries.data === undefined || ordersQuery.data === undefined) {
    return (
      <section className="border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-base font-semibold text-rose-950">Siparisler yuklenemedi</h1>
        <p className="mt-2 text-sm text-rose-800">{(referenceQueries.error ?? ordersQuery.error)?.message ?? 'Beklenmeyen bir hata olustu.'}</p>
        <button
          type="button"
          onClick={() => {
            referenceQueries.refetchAll()
            void ordersQuery.refetch()
          }}
          className="mt-4 rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800"
        >
          Tekrar dene
        </button>
      </section>
    )
  }

  const { customers, products } = referenceQueries.data
  const customerNames = new Map(customers.map((customer) => [customer.id, customer.name]))
  const orders = ordersQuery.data.pages.flatMap((page) => page.items)
  // useInfiniteQuery ilk sayfayi initialPageParam ile daima yukler; dizi bos olamaz.
  const totalCount = ordersQuery.data.pages[0]?.totalCount ?? 0

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

      <div className="flex items-center gap-3 border border-slate-200 bg-white p-4">
        <ArrowUpDown size={18} className="text-slate-500" aria-hidden="true" />
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          Durum
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as OrderStatusFilter)} className="form-input w-48">
            <option value="all">Tum durumlar</option>
            {orderStatuses.map((status) => <option key={status} value={status}>{orderStatusLabels[status]}</option>)}
          </select>
        </label>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Eslesen siparis yok"
          description="Durum filtresini degistirerek tekrar deneyin."
        />
      ) : (
        <>
          <div
            aria-busy={ordersQuery.isPlaceholderData}
            className={`overflow-x-auto border border-slate-200 bg-white ${ordersQuery.isPlaceholderData ? 'opacity-60' : ''}`}
          >
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Siparis</th><th className="px-5 py-3">Musteri</th><th className="px-5 py-3">Tarih</th><th className="px-5 py-3 text-right">Toplam</th><th className="px-5 py-3">Durum</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">{order.id.toUpperCase()}</td>
                  <td className="px-5 py-4 text-slate-700">{customerNames.get(order.customerId) ?? '-'}</td>
                  <td className="px-5 py-4 text-slate-700">{dateFormatter.format(order.createdAt)}</td>
                  <td className="px-5 py-4 text-right font-medium text-slate-950">{currencyFormatter.format(order.total)}</td>
                  <td className="px-5 py-4">
                    <label className="sr-only" htmlFor={`order-status-${order.id}`}>Siparis durumu</label>
                    <select id={`order-status-${order.id}`} value={order.status} disabled={updateStatusMutation.isPending} onChange={(event) => updateStatusMutation.mutate({ id: order.id, status: event.target.value as OrderStatus })} className="h-9 border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:opacity-60">
                      {orderStatuses.map((status) => <option key={status} value={status}>{orderStatusLabels[status]}</option>)}
                    </select>
                    {order.status === 'shipped' && <p className="mt-1 text-xs text-slate-500">Takip: {order.trackingNumber}</p>}
                    {order.status === 'cancelled' && <p className="mt-1 text-xs text-slate-500">Neden: {order.cancelReason}</p>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-slate-200 bg-white px-5 py-3">
            <p className="text-sm text-slate-600">Toplam {totalCount} siparisin {orders.length} tanesi goruntuleniyor</p>
            {ordersQuery.hasNextPage && (
              <button
                type="button"
                onClick={() => void ordersQuery.fetchNextPage()}
                // Placeholder'da eski filtrenin listesi gorunur; yeni key'in ilk sayfasi gelmeden devami istenmez.
                disabled={ordersQuery.isFetchingNextPage || ordersQuery.isPlaceholderData}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ordersQuery.isFetchingNextPage ? 'Yukleniyor...' : 'Daha fazla yukle'}
              </button>
            )}
          </div>
        </>
      )}
      {isCreateDialogOpen && <OrderCreateDialog customers={customers} products={products} onClose={() => setIsCreateDialogOpen(false)} />}
    </section>
  )
}

function OrdersLoadingState() {
  return <section aria-busy="true" className="space-y-6"><div className="h-8 w-40 animate-pulse bg-slate-200" /><div className="h-18 animate-pulse border border-slate-200 bg-white" /><div className="h-80 animate-pulse border border-slate-200 bg-white" /></section>
}