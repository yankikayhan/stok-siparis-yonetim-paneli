import { Dialog } from '../../../shared/components/dialog'
import { type Product } from '../api/products-api'

type ProductDeleteDialogProps = {
  product: Product
  onCancel: () => void
  onConfirm: () => void
}

export function ProductDeleteDialog({ onCancel, onConfirm, product }: ProductDeleteDialogProps) {
  return (
    <Dialog titleId="product-delete-title" onClose={onCancel} className="max-w-md p-5">
      <h2 id="product-delete-title" className="text-base font-semibold text-slate-950">Urunu sil</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600"><strong>{product.name}</strong> urununu kalici olarak silmek istiyor musunuz?</p>
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Vazgec</button>
        <button type="button" onClick={onConfirm} className="rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">Urunu sil</button>
      </div>
    </Dialog>
  )
}
