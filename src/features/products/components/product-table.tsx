import { TriangleAlert } from 'lucide-react'
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

  return (
    <div
      aria-busy={isPlaceholderData}
      className={`overflow-x-auto border border-slate-200 bg-white ${isPlaceholderData ? 'opacity-60' : ''}`}
    >
      <table className="w-full min-w-180 text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">Urun</th>
            <th className="px-5 py-3">Kategori</th>
            <th className="px-5 py-3 text-right">Fiyat</th>
            <th className="px-5 py-3 text-right">Stok</th>
            <th className="px-5 py-3"><span className="sr-only">Islemler</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product) => {
            const isLowStock = product.stock <= product.reorderLevel

            return (
              <tr key={product.id} className="text-slate-700">
                <td className={`px-5 ${tableCellPadding}`}>
                  <p className="font-medium text-slate-950">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
                </td>
                <td className={`px-5 ${tableCellPadding}`}>{categoryNames.get(product.categoryId) ?? '-'}</td>
                <td className={`px-5 ${tableCellPadding} text-right font-medium`}>{currencyFormatter.format(product.price)}</td>
                <td className={`px-5 ${tableCellPadding} text-right`}>
                  <span className={isLowStock ? 'font-semibold text-amber-700' : 'text-slate-700'}>
                    {isLowStock && <TriangleAlert className="mr-1 inline size-4" aria-hidden="true" />}
                    {product.stock} adet
                  </span>
                </td>
                <td className={`px-5 ${tableCellPadding} text-right`}>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => onEdit(product.id)} className="text-sm font-medium text-teal-700 hover:text-teal-900">Duzenle</button>
                    <button type="button" onClick={() => onDelete(product)} className="text-sm font-medium text-rose-700 hover:text-rose-900">Sil</button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
