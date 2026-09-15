import { ArrowDown, ArrowUp, Minus, Plus, X } from 'lucide-react'
import { cloneElement, useId } from 'react'
import { FormProvider, useFormContext, useWatch, type Control } from 'react-hook-form'
import { Dialog } from '../../../shared/components/dialog'
import { type Customer } from '../../customers/api/customers-api'
import { type Product } from '../../products/api/products-api'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'
import { useOrderCreateForm } from '../hooks/use-order-create-form'
import { type OrderFormInput } from '../api/orders-api'

type OrderCreateDialogProps = {
  customers: Customer[]
  products: Product[]
  onClose: () => void
}

export function OrderCreateDialog({ customers, products, onClose }: OrderCreateDialogProps) {
  const { form, orderItems, createOrderMutation, requestClose, submit, hasDraft, discardDraft } = useOrderCreateForm({ products, onClose })

  return (
    <Dialog titleId="order-create-title" onClose={requestClose} className="max-w-3xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 id="order-create-title" className="text-base font-semibold text-slate-950">Yeni siparis</h2>
        <button type="button" onClick={requestClose} className="grid size-8 place-items-center text-slate-500 hover:bg-slate-100 hover:text-slate-950" aria-label="Pencereyi kapat"><X size={18} aria-hidden="true" /></button>
      </div>
      <FormProvider {...form}>
        <form className="space-y-5 p-5" onSubmit={submit}>
        {hasDraft && (
          <div className="flex items-center justify-between gap-3 border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-900" role="status">
            <span>Taslaktan devam ediliyor.</span>
            <button type="button" onClick={discardDraft} className="font-medium underline hover:opacity-70">Taslagi temizle</button>
          </div>
        )}
        <FormField label="Musteri" error={form.formState.errors.customerId?.message}>
          <select {...form.register('customerId')} className="form-input">
            <option value="">Musteri secin</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} - {customer.company}</option>)}
          </select>
        </FormField>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold text-slate-950">Siparis kalemleri</h3>
            {/* shouldFocus: odak yeni satirin ilk kayitli alanina (urun select) gider; index hesabi + zamanlama isteyen elle setFocus'a gerek kalmaz. */}
            <button type="button" onClick={() => orderItems.append({ productId: '', quantity: 1 }, { shouldFocus: true })} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus size={16} aria-hidden="true" /> Kalem ekle</button>
          </div>
          <div className="space-y-3">
            {orderItems.fields.map((field, index) => (
              <OrderItemRow
                key={field.id}
                index={index}
                products={products}
                isFirst={index === 0}
                isLast={index === orderItems.fields.length - 1}
                isOnly={orderItems.fields.length === 1}
                onMoveUp={() => orderItems.move(index, index - 1)}
                onMoveDown={() => orderItems.move(index, index + 1)}
                onRemove={() => orderItems.remove(index)}
              />
            ))}
          </div>
          {form.formState.errors.items?.message && <p className="mt-2 text-xs text-rose-700">{form.formState.errors.items.message}</p>}
        </div>

        <OrderTotal control={form.control} products={products} />

        {form.formState.errors.root?.serverError && <p className="text-sm text-rose-700">{form.formState.errors.root.serverError.message}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={requestClose} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Vazgec</button>
          {/* Kilit "kaydedilecek is var mi"yi sorar: bu oturumdaki degisiklik (isDirty) ya da onceki oturumdan tasinan taslak (hasDraft) —
              taslaktan dogan form baseline oldugu icin isDirty false baslar. isSubmitting degil mutation.isPending:
              mutate senkron doner, gercek istek suresini mutation state'i bilir. */}
          <button type="submit" disabled={(!form.formState.isDirty && !hasDraft) || createOrderMutation.isPending} className="rounded-md bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">{createOrderMutation.isPending ? 'Olusturuluyor...' : 'Siparisi olustur'}</button>
        </div>
        </form>
      </FormProvider>
    </Dialog>
  )
}

type OrderItemRowProps = {
  index: number
  products: Product[]
  isFirst: boolean
  isLast: boolean
  isOnly: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

// Form nesnesi prop yerine context'ten gelir (FormProvider); satir kendi aboneligini tasir.
function OrderItemRow({ index, products, isFirst, isLast, isOnly, onMoveUp, onMoveDown, onRemove }: OrderItemRowProps) {
  const form = useFormContext<OrderFormInput>()
  // Tek abonelik stok gostergesini ve duplike kontrolunu besler. Tus vurusu artik dialog
  // govdesini degil yalnizca satirlari render eder; duplike kontrolu DIGER satirlarin
  // secimine bagli oldugu icin satir basina daha dar abonelik mumkun degil.
  const items = useWatch({ control: form.control, name: 'items' })
  const selectedProduct = products.find((product) => product.id === items[index]?.productId)

  return (
    <div className="grid gap-3 border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-start">
      <FormField label={`Urun ${index + 1}`} error={form.formState.errors.items?.[index]?.productId?.message}>
        <select {...form.register(`items.${index}.productId`)} className="form-input">
          <option value="">Urun secin</option>
          {products.filter((product) => product.active).map((product) => (
            // Baska satirda secili urun disabled: duplike kalem UI'da engellenir,
            // superRefine'daki toplam-stok kurali guvenlik agi olarak kalir.
            <option
              key={product.id}
              value={product.id}
              disabled={items.some((item, itemIndex) => itemIndex !== index && item?.productId === product.id)}
            >
              {product.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField
        label="Miktar"
        error={form.formState.errors.items?.[index]?.quantity?.message}
        hint={selectedProduct ? `Kullanilabilir: ${selectedProduct.stock}` : undefined}
      >
        {/* valueAsNumber yok (K2 simetrisi): donusum tek noktada Zod coerce, NaN yolu kapali —
            bos input '' -> coerce 0 -> positive() bizim ozel mesaji uretir. */}
        <input {...form.register(`items.${index}.quantity`)} type="number" min="1" step="1" className="form-input" />
      </FormField>
      {/* move, alan degerini hata/touched state'iyle birlikte tasir; key={field.id} DOM eslesmesini korur. */}
      <div className="mt-6 flex gap-1">
        <button type="button" onClick={onMoveUp} disabled={isFirst} className="grid size-10 place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Kalem ${index + 1} yukari tasi`}><ArrowUp size={17} aria-hidden="true" /></button>
        <button type="button" onClick={onMoveDown} disabled={isLast} className="grid size-10 place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Kalem ${index + 1} asagi tasi`}><ArrowDown size={17} aria-hidden="true" /></button>
        <button type="button" onClick={onRemove} disabled={isOnly} className="grid size-10 place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Kalem ${index + 1} sil`}><Minus size={17} aria-hidden="true" /></button>
      </div>
    </div>
  )
}

// useWatch bu bilesene izole: her tus vurusu yalnizca burayi render eder, dialog agacini degil.
// getValues ile yazilsaydi deger render'a bagli okunan reaktif olmayan snapshot'ta kalirdi.
function OrderTotal({ control, products }: { control: Control<OrderFormInput>; products: Product[] }) {
  const items = useWatch({ control, name: 'items' })
  const currencyFormatter = useCurrencyFormatter()

  const total = items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.id === item?.productId)
    const quantity = Number(item?.quantity)

    return product && Number.isInteger(quantity) && quantity > 0 ? sum + product.price * quantity : sum
  }, 0)

  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
      {/* Sunucu fiyati kayitli urunden alir; toplam bu yuzden 'tahmini'dir. */}
      <span className="text-slate-600">Tahmini toplam</span>
      <strong className="text-base text-slate-950">{currencyFormatter.format(total)}</strong>
    </div>
  )
}

type FieldElementProps = { id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }

// Implicit label hata metnini alana BAGLAMAZ; explicit id + aria-describedby/aria-invalid
// iliskiyi ekran okuyucuya programatik bildirir. hint de describedby zincirine girer.
function FormField({ children, error, hint, label }: { children: React.ReactElement<FieldElementProps>; error?: string; hint?: string; label: string }) {
  const fieldId = useId()
  const errorId = `${fieldId}-error`
  const hintId = `${fieldId}-hint`
  const describedBy = [hint ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(' ') || undefined

  return (
    <div className="block text-sm font-medium text-slate-700">
      <label htmlFor={fieldId}>{label}</label>
      <span className="mt-1 block">
        {cloneElement(children, { id: fieldId, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      </span>
      {hint && <span id={hintId} className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>}
      {error && <span id={errorId} className="mt-1 block text-xs font-normal text-rose-700">{error}</span>}
    </div>
  )
}