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
          <p className="font-medium text-slate-950 dark:text-slate-50">
            {product.name}
            {!product.active && (
              <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Pasif
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
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
          <span className={isLowStock ? 'font-semibold text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}>
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
        // Gizleme yalniz hover destekleyen ortamda kurulur (B4 onceden karari): `hover` varyanti
        // kurallari zaten @media (hover: hover) icine sarar (KAYNAK: lib.mjs @192103), bu yuzden
        // dokunmatikte (hover: none) butonlar hic gizlenmez; klavye icin group-focus-within.
        // opacity yerine hidden/invisible secilmedi: alan korunur (G2-13), odaklanma bozulmaz (G2-10).
        <div className="flex justify-end gap-3 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
          <button type="button" onClick={() => onEdit(product.id)} className="text-sm font-medium text-brand-700 hover:text-brand-900 dark:text-brand-200 dark:hover:text-brand-100">Duzenle</button>
          <button type="button" onClick={() => onDelete(product)} className="text-sm font-medium text-rose-700 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300">Sil</button>
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
      rowClassName="group text-slate-700 dark:text-slate-300"
    />
  )
}
