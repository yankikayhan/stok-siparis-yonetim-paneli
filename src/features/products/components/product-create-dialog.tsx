import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { dashboardQueryKeys } from '../../dashboard/api/dashboard-api'
import {
  createProduct,
  productFormSchema,
  productQueryKeys,
  type Category,
  type Product,
  type ProductFormInput,
  type ProductFormValues,
  updateProduct,
} from '../api/products-api'

type ProductCreateDialogProps = {
  categories: Category[]
  product?: Product
  onClose: () => void
}

export function ProductCreateDialog({ categories, product, onClose }: ProductCreateDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = product !== undefined
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      categoryId: product?.categoryId ?? '',
      price: product?.price ?? 0,
      stock: product?.stock ?? 0,
      reorderLevel: product?.reorderLevel ?? 0,
    },
  })
  const createProductMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      isEditing ? updateProduct(product.id, values) : createProduct(values),
    // Dialog acik kaldigi icin hata inline gosterilir; global toast susturulur.
    meta: { suppressErrorToast: true, successMessage: isEditing ? 'Urun guncellendi.' : 'Urun eklendi.' },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.summary() }),
      ])
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="product-create-title" className="w-full max-w-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="product-create-title" className="text-base font-semibold text-slate-950">{isEditing ? 'Urunu duzenle' : 'Yeni urun'}</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center text-slate-500 hover:bg-slate-100 hover:text-slate-950" aria-label="Pencereyi kapat">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <form
          className="space-y-4 p-5"
          onSubmit={form.handleSubmit((values) => createProductMutation.mutate(values))}
        >
          <FormField label="Urun adi" error={form.formState.errors.name?.message}>
            <input {...form.register('name')} autoFocus className="form-input" />
          </FormField>
          <FormField label="SKU" error={form.formState.errors.sku?.message}>
            <input {...form.register('sku')} className="form-input" />
          </FormField>
          <FormField label="Kategori" error={form.formState.errors.categoryId?.message}>
            <select {...form.register('categoryId')} className="form-input">
              <option value="">Kategori secin</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Fiyat" error={form.formState.errors.price?.message}>
              <input {...form.register('price', { valueAsNumber: true })} type="number" min="0" step="0.01" className="form-input" />
            </FormField>
            <FormField label="Stok" error={form.formState.errors.stock?.message}>
              <input {...form.register('stock', { valueAsNumber: true })} type="number" min="0" step="1" className="form-input" />
            </FormField>
            <FormField label="Yeniden siparis" error={form.formState.errors.reorderLevel?.message}>
              <input {...form.register('reorderLevel', { valueAsNumber: true })} type="number" min="0" step="1" className="form-input" />
            </FormField>
          </div>
          {createProductMutation.isError && <p className="text-sm text-rose-700">{createProductMutation.error.message}</p>}
          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Vazgec</button>
            <button type="submit" disabled={createProductMutation.isPending} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60">
              {createProductMutation.isPending ? 'Kaydediliyor...' : isEditing ? 'Degisiklikleri kaydet' : 'Urunu ekle'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function FormField({ children, error, label }: { children: React.ReactNode; error?: string; label: string }) {
  return <label className="block text-sm font-medium text-slate-700"><span>{label}</span><span className="mt-1 block">{children}</span>{error && <span className="mt-1 block text-xs font-normal text-rose-700">{error}</span>}</label>
}