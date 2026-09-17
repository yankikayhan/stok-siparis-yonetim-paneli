import { DataTable, type DataTableColumn } from '../../../shared/components/data-table'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'
import { orderStatusLabels, orderStatuses, type Order, type OrderStatus } from '../api/orders-api'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' })

type OrderTableProps = {
  orders: Order[]
  customerNames: Map<string, string>
  isPlaceholderData: boolean
  isUpdatingStatus: boolean
  onStatusChange: (orderId: string, status: OrderStatus) => void
}

export function OrderTable({
  customerNames,
  isPlaceholderData,
  isUpdatingStatus,
  onStatusChange,
  orders,
}: OrderTableProps) {
  const currencyFormatter = useCurrencyFormatter()

  const columns: DataTableColumn<Order>[] = [
    {
      header: 'Siparis',
      cellClassName: 'font-medium text-slate-950 dark:text-slate-50',
      cell: (order) => order.id.toUpperCase(),
    },
    {
      header: 'Musteri',
      cellClassName: 'text-slate-700 dark:text-slate-300',
      cell: (order) => customerNames.get(order.customerId) ?? '-',
    },
    {
      header: 'Tarih',
      cellClassName: 'text-slate-700 dark:text-slate-300',
      cell: (order) => dateFormatter.format(order.createdAt),
    },
    {
      header: 'Toplam',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-medium text-slate-950 dark:text-slate-50',
      cell: (order) => currencyFormatter.format(order.total),
    },
    {
      header: 'Durum',
      cell: (order) => (
        <>
          <label className="sr-only" htmlFor={`order-status-${order.id}`}>
            Siparis durumu
          </label>
          <select
            id={`order-status-${order.id}`}
            value={order.status}
            disabled={isUpdatingStatus}
            onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}
            className="h-9 border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:focus:ring-brand-900"
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabels[status]}
              </option>
            ))}
          </select>
          {order.status === 'shipped' && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Takip: {order.trackingNumber}</p>}
          {order.status === 'cancelled' && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Neden: {order.cancelReason}</p>}
        </>
      ),
    },
  ]

  return (
    <>
      {/* Mobil kart gorunumu (T11 denemesi): tablo lg'de kalir, kart listesi altinda gizlenir.
          Karttaki durum secici id/htmlFor TASIMAZ — tabloyla cakismamak icin aria-label (I3). */}
      <div
        aria-busy={isPlaceholderData}
        className={`space-y-3 lg:hidden ${isPlaceholderData ? 'opacity-60' : ''}`}
      >
        {orders.map((order) => (
          <div key={order.id} className="border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-slate-950 dark:text-slate-50">{order.id.toUpperCase()}</p>
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{currencyFormatter.format(order.total)}</p>
            </div>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{customerNames.get(order.customerId) ?? '-'}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{dateFormatter.format(order.createdAt)}</p>
            <select
              aria-label="Siparis durumu"
              value={order.status}
              disabled={isUpdatingStatus}
              onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}
              className="mt-3 h-9 w-full border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:focus:ring-brand-900"
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabels[status]}
                </option>
              ))}
            </select>
            {order.status === 'shipped' && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Takip: {order.trackingNumber}</p>}
            {order.status === 'cancelled' && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Neden: {order.cancelReason}</p>}
          </div>
        ))}
      </div>
      {/* Mevcut tablo lg ve uzerinde kalir; sarici div gerekir (DataTable wrapper sinif almaz — G1). */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={orders}
          getRowKey={(order) => order.id}
          isPlaceholderData={isPlaceholderData}
          tableClassName="min-w-190"
        />
      </div>
    </>
  )
}
