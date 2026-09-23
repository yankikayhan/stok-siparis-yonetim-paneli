import { Button } from '../../../shared/components/button'
import { Dialog } from '../../../shared/components/dialog'

// B19 (Adim 8 / IB3): sozlesme Product nesnesinden yalniz gosterim adina daraldi — silme
// id ile yapilir (hook'ta), dialog yalniz adi GOSTERIR. Urun taze listeden dustuyse
// (or. baska sekmede silinmis) hook undefined gonderir ve fallback metin gorunur.
type ProductDeleteDialogProps = {
  productName: string | undefined
  onCancel: () => void
  onConfirm: () => void
}

export function ProductDeleteDialog({ onCancel, onConfirm, productName }: ProductDeleteDialogProps) {
  return (
    <Dialog titleId="product-delete-title" onClose={onCancel} className="max-w-md p-5">
      <h2 id="product-delete-title" className="text-base font-semibold text-slate-950 dark:text-slate-50">Urunu sil</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300"><strong>{productName ?? 'Bu urun'}</strong> urununu kalici olarak silmek istiyor musunuz?</p>
      <div className="mt-5 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Vazgec</Button>
        <Button type="button" variant="danger" onClick={onConfirm}>Urunu sil</Button>
      </div>
    </Dialog>
  )
}
