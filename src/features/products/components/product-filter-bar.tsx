import { Search } from 'lucide-react'
import { type Category, type ProductStockFilter } from '../api/products-api'

type ProductFilterBarProps = {
  search: string
  onSearchChange: (search: string) => void
  categoryId: string
  onCategoryChange: (categoryId: string) => void
  stock: ProductStockFilter
  onStockChange: (stock: ProductStockFilter) => void
  categories: Category[]
}

// `search` HAM degerdir: deferredSearch yalniz sorgu anahtarini besler ve hook'un disina cikmaz,
// yoksa yazma ekranda gorunur bicimde gecikirdi.
export function ProductFilterBar({
  categories,
  categoryId,
  onCategoryChange,
  onSearchChange,
  onStockChange,
  search,
  stock,
}: ProductFilterBarProps) {
  return (
    <div className="grid gap-3 border border-slate-200 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
      <label className="relative block">
        <span className="sr-only">Urun ara</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Urun adi veya SKU ara"
          className="h-10 w-full border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <label>
        <span className="sr-only">Kategori filtrele</span>
        <select
          value={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
        >
          <option value="all">Tum kategoriler</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Stok durumu filtrele</span>
        <select
          value={stock}
          onChange={(event) => onStockChange(event.target.value as ProductStockFilter)}
          className="h-10 w-full border border-slate-300 bg-white px-3 text-sm outline-none focus:border-brand-700 focus:ring-2 focus:ring-brand-100"
        >
          <option value="all">Tum stok durumlari</option>
          <option value="low">Dusuk stok</option>
          <option value="in-stock">Yeterli stok</option>
        </select>
      </label>
    </div>
  )
}
