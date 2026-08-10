import { TriangleAlert } from 'lucide-react'
import { DataTable, type DataTableColumn } from '../../../shared/components/data-table'
import { type Product } from '../api/products-api'
import { useUiStore } from '../../../shared/stores/ui-store'

type ProductTableProps = {
  products: Product[]
  categoryNames: Map<string, string>
  currencyFormatter: Intl.NumberFormat
  isPlaceholderData: boolean
  onEdit: (productId: string) => void
  onDelete: (product: Product) => void
}

// tableDensity burada okunur (prop degil): hucre dolgusu tablonun ic meselesi.
// currencyFormatter ise prop iner — hook'u kosullu render edilen bu bilesene tasimak
// /profile sorgusunun bos liste dalinda hic kurulmamasina yol acardi.
export function ProductTable({
  categoryNames,
  currencyFormatter,
  isPlaceholderData,
  onDelete,
  onEdit,
  products,
}: ProductTableProps) {
  const tableDensity = useUiStore((state) => state.tableDensity)
  const tableCellPadding = tableDensity === 'compact' ? 'py-2.5' : 'py-4'

  // DataTable'a verilen sozlesme: ProductTable'in kendi disa donuk props'lari degismedi,
  // yalniz JSX satiri kurma sorumlulugu kolon tanimlamaya donustu.
  const columns: DataTableColumn<Product>[] = [
    {
      header: 'Urun',
      cell: (product) => (
        <>
          <p className="font-medium text-slate-950">{product.name}</p>
          <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
        </>
      ),
    },
    {
      header: 'Kategori',
      cell: (product) => categoryNames.get(product.categoryId) ?? '-',
    },
    {
      header: 'Fiyat',
      headerClassName: 'text-right',
      cellClassName: 'text-right font-medium',
      cell: (product) => currencyFormatter.format(product.price),
    },
    {
      header: 'Stok',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (product) => {
        const isLowStock = product.stock <= product.reorderLevel

        return (
          <span className={isLowStock ? 'font-semibold text-amber-700' : 'text-slate-700'}>
            {isLowStock && <TriangleAlert className="mr-1 inline size-4" aria-hidden="true" />}
            {product.stock} adet
          </span>
        )
      },
    },
    {
      header: <span className="sr-only">Islemler</span>,
      cellClassName: 'text-right',
      cell: (product) => (
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => onEdit(product.id)} className="text-sm font-medium text-teal-700 hover:text-teal-900">Duzenle</button>
          <button type="button" onClick={() => onDelete(product)} className="text-sm font-medium text-rose-700 hover:text-rose-900">Sil</button>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={products}
      getRowKey={(product) => product.id}
      isPlaceholderData={isPlaceholderData}
      tableClassName="min-w-180"
      bodyCellClassName={tableCellPadding}
      rowClassName="text-slate-700"
    />
  )
}
