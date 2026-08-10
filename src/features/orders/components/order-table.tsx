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
      cellClassName: 'font-medium text-slate-950',
      cell: (order) => order.id.toUpperCase(),
    },
    {
      header: 'Musteri',
      cellClassName: 'text-slate-700',
      cell: (order) => customerNames.get(order.customerId) ?? '-',
    },
    {
      header: 'Tarih',
      cellClassName: 'text-slate-700',
      cell: (order) => dateFormatter.format(order.createdAt),
    },
    {
      header: 'Toplam',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-medium text-slate-950',
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
            className="h-9 border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
          >
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabels[status]}
              </option>
            ))}
          </select>
          {order.status === 'shipped' && <p className="mt-1 text-xs text-slate-500">Takip: {order.trackingNumber}</p>}
          {order.status === 'cancelled' && <p className="mt-1 text-xs text-slate-500">Neden: {order.cancelReason}</p>}
        </>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={orders}
      getRowKey={(order) => order.id}
      isPlaceholderData={isPlaceholderData}
      tableClassName="min-w-190"
    />
  )
}
