import type { ReactNode } from 'react'

export type DataTableColumn<T> = {
  header: ReactNode
  headerClassName?: string
  cellClassName?: string
  cell: (row: T) => ReactNode
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
  isPlaceholderData?: boolean
  tableClassName?: string
  bodyCellClassName?: string
  rowClassName?: string
}

// T icin kisitlama yok: satir anahtari getRowKey ile disaridan saglaniyor, bilesen T'nin
// sekli hakkinda varsayim yapmiyor. Arrow degil `function DataTable<T>(...)`: .tsx'te
// `<T,>() =>` virgul-hack'ine gerek kalmadan derleyici <T>'yi JSX baslangici sanmiyor.
export function DataTable<T>({
  bodyCellClassName = 'py-4',
  columns,
  data,
  getRowKey,
  isPlaceholderData = false,
  rowClassName = '',
  tableClassName = '',
}: DataTableProps<T>) {
  return (
    <div
      aria-busy={isPlaceholderData}
      className={`overflow-x-auto border border-slate-200 bg-white ${isPlaceholderData ? 'opacity-60' : ''}`}
    >
      <table className={`w-full text-left text-sm ${tableClassName}`}>
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((column, index) => (
              <th key={index} className={`px-5 py-3 ${column.headerClassName ?? ''}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row) => (
            <tr key={getRowKey(row)} className={rowClassName}>
              {columns.map((column, index) => (
                <td key={index} className={`px-5 ${bodyCellClassName} ${column.cellClassName ?? ''}`}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
