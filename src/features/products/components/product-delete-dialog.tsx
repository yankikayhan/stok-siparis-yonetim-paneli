import { Button } from '../../../shared/components/button'
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
      <h2 id="product-delete-title" className="text-base font-semibold text-slate-950 dark:text-slate-50">Urunu sil</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300"><strong>{product.name}</strong> urununu kalici olarak silmek istiyor musunuz?</p>
      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Vazgec</Button>
        <Button type="button" variant="danger" onClick={onConfirm}>Urunu sil</Button>
      </div>
    </Dialog>
  )
}
