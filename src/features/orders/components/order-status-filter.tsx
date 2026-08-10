import { ArrowUpDown } from 'lucide-react'
import { orderStatusLabels, orderStatuses, type OrderStatusFilter } from '../api/orders-api'

type OrderStatusFilterBarProps = {
  value: OrderStatusFilter
  onChange: (value: OrderStatusFilter) => void
}

export function OrderStatusFilterBar({ onChange, value }: OrderStatusFilterBarProps) {
  return (
    <div className="flex items-center gap-3 border border-slate-200 bg-white p-4">
      <ArrowUpDown size={18} className="text-slate-500" aria-hidden="true" />
      <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
        Durum
        <select
          value={value}
          onChange={(event) => onChange(event.target.value as OrderStatusFilter)}
          className="form-input w-48"
        >
          <option value="all">Tum durumlar</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {orderStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
