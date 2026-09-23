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
  onDelete: (productId: string) => void
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
  // Uc deger kapsanir: compact py-2.5 · spacious py-5 · comfortable (varsayilan) py-4.
  const tableCellPadding = tableDensity === 'compact' ? 'py-2.5' : tableDensity === 'spacious' ? 'py-5' : 'py-4'

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
          <button type="button" onClick={() => onEdit(product.id)} className="text-sm font-medium text-brand-700 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-brand-200 dark:hover:text-brand-100 dark:focus-visible:outline-brand-200">Duzenle</button>
          <button type="button" onClick={() => onDelete(product.id)} className="text-sm font-medium text-rose-700 hover:text-rose-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-rose-400 dark:hover:text-rose-300 dark:focus-visible:outline-brand-200">Sil</button>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* Mobil kart gorunumu (T11, OrderTable deseni): tablo lg'de kalir, kart listesi
          altinda gizlenir. Tum bilgi korunur; eylemler kartta buton olarak gorunur. */}
      <div
        aria-busy={isPlaceholderData}
        className={`space-y-3 lg:hidden ${isPlaceholderData ? 'opacity-60' : ''}`}
      >
        {products.map((product) => {
          const isLowStock = product.stock <= product.reorderLevel
          return (
            <div key={product.id} className="border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-950 dark:text-slate-50">
                  {product.name}
                  {!product.active && (
                    <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Pasif
                    </span>
                  )}
                </p>
                <p className="shrink-0 text-sm font-semibold text-slate-950 dark:text-slate-50">{currencyFormatter.format(product.price)}</p>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{categoryNames.get(product.categoryId) ?? '-'}</p>
              <p className={`mt-2 text-sm ${isLowStock ? 'font-semibold text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                {isLowStock && <TriangleAlert className="mr-1 inline size-4" aria-hidden="true" />}
                {product.stock} adet
              </p>
              <div className="mt-3 flex justify-end gap-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                <button type="button" onClick={() => onEdit(product.id)} className="text-sm font-medium text-brand-700 hover:text-brand-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-brand-200 dark:hover:text-brand-100 dark:focus-visible:outline-brand-200">Duzenle</button>
                <button type="button" onClick={() => onDelete(product.id)} className="text-sm font-medium text-rose-700 hover:text-rose-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-rose-400 dark:hover:text-rose-300 dark:focus-visible:outline-brand-200">Sil</button>
              </div>
            </div>
          )
        })}
      </div>
      {/* Mevcut tablo lg ve uzerinde kalir; sarici div gerekir (DataTable wrapper sinif almaz). */}
      <div className="hidden lg:block">
        <DataTable
          columns={columns}
          data={products}
          getRowKey={(product) => product.id}
          isPlaceholderData={isPlaceholderData}
          tableClassName="min-w-180"
          bodyCellClassName={tableCellPadding}
          rowClassName="group text-slate-700 dark:text-slate-300"
        />
      </div>
    </>
  )
}
