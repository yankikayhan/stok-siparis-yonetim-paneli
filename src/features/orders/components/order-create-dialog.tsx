import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, X } from 'lucide-react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { dashboardQueryKeys } from '../../dashboard/api/dashboard-api'
import { customerQueryKeys, type Customer } from '../../customers/api/customers-api'
import { productQueryKeys, type Product } from '../../products/api/products-api'
import {
  createOrder,
  createOrderFormSchema,
  orderQueryKeys,
  type OrderFormInput,
  type OrderFormValues,
} from '../api/orders-api'

type OrderCreateDialogProps = {
  customers: Customer[]
  products: Product[]
  onClose: () => void
}

export function OrderCreateDialog({ customers, products, onClose }: OrderCreateDialogProps) {
  const queryClient = useQueryClient()
  const form = useForm<OrderFormInput, unknown, OrderFormValues>({
    resolver: zodResolver(createOrderFormSchema(products)),
    defaultValues: {
      customerId: '',
      items: [{ productId: '', quantity: 1 }],
    },
  })
  const orderItems = useFieldArray({ control: form.control, name: 'items' })
  const watchedItems = useWatch({ control: form.control, name: 'items' })
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    // Dialog acik kaldigi icin hata inline gosterilir; global toast susturulur.
    meta: { suppressErrorToast: true, successMessage: 'Siparis olusturuldu.' },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderQueryKeys.list() }),
        queryClient.invalidateQueries({ queryKey: productQueryKeys.list() }),
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.summary() }),
      ])
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/35 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="order-create-title" className="mx-auto my-8 w-full max-w-3xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="order-create-title" className="text-base font-semibold text-slate-950">Yeni siparis</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center text-slate-500 hover:bg-slate-100 hover:text-slate-950" aria-label="Pencereyi kapat"><X size={18} aria-hidden="true" /></button>
        </div>
        <form className="space-y-5 p-5" onSubmit={form.handleSubmit((values) => createOrderMutation.mutate(values))}>
          <FormField label="Musteri" error={form.formState.errors.customerId?.message}>
            <select {...form.register('customerId')} className="form-input">
              <option value="">Musteri secin</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} - {customer.company}</option>)}
            </select>
          </FormField>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-slate-950">Siparis kalemleri</h3>
              <button type="button" onClick={() => orderItems.append({ productId: '', quantity: 1 })} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><Plus size={16} aria-hidden="true" /> Kalem ekle</button>
            </div>
            <div className="space-y-3">
              {orderItems.fields.map((field, index) => {
                const selectedProduct = products.find((product) => product.id === watchedItems[index]?.productId)

                return (
                  <div key={field.id} className="grid gap-3 border border-slate-200 p-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto] sm:items-start">
                    <FormField label={`Urun ${index + 1}`} error={form.formState.errors.items?.[index]?.productId?.message}>
                      <select {...form.register(`items.${index}.productId`)} className="form-input">
                        <option value="">Urun secin</option>
                        {products.filter((product) => product.active).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Miktar" error={form.formState.errors.items?.[index]?.quantity?.message}>
                      <input {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} type="number" min="1" step="1" className="form-input" />
                      {selectedProduct && <span className="mt-1 block text-xs font-normal text-slate-500">Kullanilabilir: {selectedProduct.stock}</span>}
                    </FormField>
                    <button type="button" onClick={() => orderItems.remove(index)} disabled={orderItems.fields.length === 1} className="mt-6 grid size-10 place-items-center border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Kalem ${index + 1} sil`}><Minus size={17} aria-hidden="true" /></button>
                  </div>
                )
              })}
            </div>
            {form.formState.errors.items?.message && <p className="mt-2 text-xs text-rose-700">{form.formState.errors.items.message}</p>}
          </div>

          {createOrderMutation.isError && <p className="text-sm text-rose-700">{createOrderMutation.error.message}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Vazgec</button>
            <button type="submit" disabled={createOrderMutation.isPending} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">{createOrderMutation.isPending ? 'Olusturuluyor...' : 'Siparisi olustur'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FormField({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return <label className="block text-sm font-medium text-slate-700"><span>{label}</span><span className="mt-1 block">{children}</span>{error && <span className="mt-1 block text-xs font-normal text-rose-700">{error}</span>}</label>
}