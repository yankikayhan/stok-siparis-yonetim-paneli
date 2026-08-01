import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpDown, ClipboardList } from 'lucide-react'
import { useState } from 'react'
import { ApiError } from '../../../shared/api/api-error'
import { customerQueryKeys, getCustomers } from '../../customers/api/customers-api'
import { dashboardQueryKeys } from '../../dashboard/api/dashboard-api'
import { getProducts, productQueryKeys } from '../../products/api/products-api'
import { OrderCreateDialog } from '../components/order-create-dialog'
import {
  getOrders,
  orderQueryKeys,
  orderStatuses,
  type Order,
  type OrderStatus,
  updateOrderStatus,
} from '../api/orders-api'

const currencyFormatter = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' })

const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Beklemede',
  paid: 'Odendi',
  shipped: 'Kargoda',
  cancelled: 'Iptal',
}

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const ordersQuery = useQuery({ queryKey: orderQueryKeys.list(), queryFn: getOrders })
  const customersQuery = useQuery({ queryKey: customerQueryKeys.list(), queryFn: getCustomers })
  const productsQuery = useQuery({ queryKey: productQueryKeys.list(), queryFn: getProducts })
  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: orderQueryKeys.list() })
      const previousOrders = queryClient.getQueryData<Order[]>(orderQueryKeys.list())

      queryClient.setQueryData<Order[]>(orderQueryKeys.list(), (orders) =>
        orders?.map((order) => (order.id === id ? { ...order, status } : order)),
      )

      return { previousOrders }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(orderQueryKeys.list(), context.previousOrders)
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderQueryKeys.list() }),
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.summary() }),
      ])
    },
  })

  if (ordersQuery.isPending || customersQuery.isPending || productsQuery.isPending) {
    return <OrdersLoadingState />
  }

  if (ordersQuery.isError || customersQuery.isError || productsQuery.isError) {
    const error = ordersQuery.error ?? customersQuery.error ?? productsQuery.error
    return (
      <section className="border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-base font-semibold text-rose-950">Siparisler yuklenemedi</h1>
        <p className="mt-2 text-sm text-rose-800">{error?.message ?? 'Beklenmeyen bir hata olustu.'}</p>
        <button type="button" onClick={() => { void ordersQuery.refetch(); void customersQuery.refetch(); void productsQuery.refetch() }} className="mt-4 rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">Tekrar dene</button>
      </section>
    )
  }

  const customerNames = new Map(customersQuery.data.map((customer) => [customer.id, customer.name]))
  const orders = statusFilter === 'all' ? ordersQuery.data : ordersQuery.data.filter((order) => order.status === statusFilter)

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-teal-700">Satislar</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Siparisler</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Siparis durumlarini takip edin ve operasyon akisini yonetin.</p>
        </div>
        <button type="button" onClick={() => setIsCreateDialogOpen(true)} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800">Siparis olustur</button>
      </div>

      <div className="flex items-center gap-3 border border-slate-200 bg-white p-4">
        <ArrowUpDown size={18} className="text-slate-500" aria-hidden="true" />
        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          Durum
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | OrderStatus)} className="form-input w-48">
            <option value="all">Tum durumlar</option>
            {orderStatuses.map((status) => <option key={status} value={status}>{orderStatusLabels[status]}</option>)}
          </select>
        </label>
      </div>

      {updateStatusMutation.isError && (
        <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {updateStatusMutation.error instanceof ApiError ? updateStatusMutation.error.message : 'Siparis durumu guncellenemedi. Degisiklik geri alindi.'}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <ClipboardList size={28} className="mx-auto text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-slate-950">Eslesen siparis yok</h2>
          <p className="mt-2 text-sm text-slate-600">Durum filtresini degistirerek tekrar deneyin.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 bg-white">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Siparis</th><th className="px-5 py-3">Musteri</th><th className="px-5 py-3">Tarih</th><th className="px-5 py-3 text-right">Toplam</th><th className="px-5 py-3">Durum</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">{order.id.toUpperCase()}</td>
                  <td className="px-5 py-4 text-slate-700">{customerNames.get(order.customerId) ?? '-'}</td>
                  <td className="px-5 py-4 text-slate-700">{dateFormatter.format(new Date(order.createdAt))}</td>
                  <td className="px-5 py-4 text-right font-medium text-slate-950">{currencyFormatter.format(order.total)}</td>
                  <td className="px-5 py-4">
                    <label className="sr-only" htmlFor={`order-status-${order.id}`}>Siparis durumu</label>
                    <select id={`order-status-${order.id}`} value={order.status} disabled={updateStatusMutation.isPending} onChange={(event) => updateStatusMutation.mutate({ id: order.id, status: event.target.value as OrderStatus })} className="h-9 border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:opacity-60">
                      {orderStatuses.map((status) => <option key={status} value={status}>{orderStatusLabels[status]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {isCreateDialogOpen && <OrderCreateDialog customers={customersQuery.data} products={productsQuery.data} onClose={() => setIsCreateDialogOpen(false)} />}
    </section>
  )
}

function OrdersLoadingState() {
  return <section aria-busy="true" className="space-y-6"><div className="h-8 w-40 animate-pulse bg-slate-200" /><div className="h-18 animate-pulse border border-slate-200 bg-white" /><div className="h-80 animate-pulse border border-slate-200 bg-white" /></section>
}