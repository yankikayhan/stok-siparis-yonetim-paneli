import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { cloneElement, useId, type Ref } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Dialog } from '../../../shared/components/dialog'
import {
  createProduct,
  productFormSchema,
  productQueryKeys,
  replaceProductInListCache,
  type Category,
  type Product,
  type ProductFormInput,
  type ProductFormValues,
  type ProductListCache,
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
    // onTouched dengesi: onSubmit ilk hatayi cok gec, onChange dokunulmamis alanda cok erken gosterir.
    mode: 'onTouched',
    // Hata bir kez gorunduginde duzeltme geri bildirimi tus vurusunda gelir.
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      sku: '',
      categoryId: '',
      // 0 varsayilani positive() kuralinda dokunulmamis alani pesinen hatali yapiyordu;
      // '' bos baslar, Zod coerce submit'te sayiya cevirir. stock/reorderLevel'da 0 gecerli deger.
      price: '',
      stock: 0,
      reorderLevel: 0,
      active: true,
    },
    // values, reaktif reset'tir: duzenlemede arkaplan refetch'i yeni product referansi getirirse
    // form server verisiyle senkronlanir ve kaydedilmemis girdiler bilerek ezilir.
    // Product'in fazla alanlari (id, createdAt...) form state'ine sizmasin diye form sekline daraltilir.
    values: product && {
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      price: product.price,
      stock: product.stock,
      reorderLevel: product.reorderLevel,
      active: product.active,
    },
  })
  const createProductMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      isEditing ? updateProduct(product.id, values) : createProduct(values),
    // Dialog acik kaldigi icin hata inline gosterilir; global toast susturulur.
    meta: { suppressErrorToast: true, successMessage: isEditing ? 'Urun guncellendi.' : 'Urun eklendi.' },
    onSuccess: async (savedProduct) => {
      // Dashboard ayni urun cache'ini okudugu icin ayrica invalidate edilmez.
      if (isEditing) {
        // Hibrit strateji: setQueriesData refetch beklemeden anlik boyar (UI hizi); ardindan
        // invalidation dogrulugu garanti eder — filtre uyeligi (ad/kategori/stok) server-side
        // belirlendigi icin yerinde boyama tek basina urunu ait olmadigi filtrede gosterebilirdi.
        queryClient.setQueriesData<ProductListCache>({ queryKey: productQueryKeys.lists() }, (data) =>
          data === undefined ? undefined : replaceProductInListCache(data, savedProduct),
        )
        // Liste zaten dogru boyandi; dialog refetch'i beklemeden kapanir.
        onClose()
        await queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
        return
      }

      // Yeni urunun hangi sayfa/filtre girdisine dusecegini istemci bilemez (totalCount dahil);
      // create icin dogru arac invalidation'dir.
      await queryClient.invalidateQueries({ queryKey: productQueryKeys.lists() })
      onClose()
    },
  })

  // Yalnizca kullanici kaynakli kapatmalar (X / Vazgec) buradan gecer; basari kapanisi
  // onSuccess icinde dogrudan onClose cagirir — veri kaydedildigi icin onay anlamsizdir.
  // isSubmitSuccessful guard olamaz: mutate senkron dondugu icin mutation sonucundan bagimsiz true olur.
  const requestClose = () => {
    if (form.formState.isDirty && !window.confirm('Kaydedilmemis degisiklikler var. Kapatilsin mi?')) return
    onClose()
  }

  return (
    <Dialog titleId="product-create-title" onClose={requestClose} className="max-w-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 id="product-create-title" className="text-base font-semibold text-slate-950">{isEditing ? 'Urunu duzenle' : 'Yeni urun'}</h2>
        <button type="button" onClick={requestClose} className="grid size-8 place-items-center text-slate-500 hover:bg-slate-100 hover:text-slate-950" aria-label="Pencereyi kapat">
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
          {/* valueAsNumber yok: string -> sayi donusumu tek noktada (Zod coerce), NaN yolu kapali. */}
          <FormField label="Fiyat" error={form.formState.errors.price?.message}>
            <input {...form.register('price')} type="number" min="0" step="0.01" className="form-input" />
          </FormField>
          <FormField label="Stok" error={form.formState.errors.stock?.message}>
            <input {...form.register('stock')} type="number" min="0" step="1" className="form-input" />
          </FormField>
          <FormField label="Yeniden siparis" error={form.formState.errors.reorderLevel?.message}>
            <input {...form.register('reorderLevel')} type="number" min="0" step="1" className="form-input" />
          </FormField>
        </div>
        {/* Controller: register ref+DOM event'i olan native input ister; buton tabanli
            segmented control'un boyle bir elemani yok, deger RHF'e field.onChange ile akar. */}
        <Controller
          control={form.control}
          name="active"
          render={({ field }) => (
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Durum</legend>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {/* field.ref Aktif butonuna baglanir: semada active icin refine yok, errors.active
                    pratikte hic tetiklenmez — baglanti yalniz yapisal butunluk icindir. */}
                <SegmentButton ref={field.ref} active={field.value === true} label="Aktif" onClick={() => field.onChange(true)} />
                <SegmentButton active={field.value === false} label="Pasif" onClick={() => field.onChange(false)} />
              </div>
              <p className="mt-1 text-xs font-normal text-slate-500">Pasif urunler siparis formunda secilemez.</p>
              {form.formState.errors.active?.message && (
                <p className="mt-1 text-xs font-normal text-rose-700">{form.formState.errors.active.message}</p>
              )}
            </fieldset>
          )}
        />
        {createProductMutation.isError && <p className="text-sm text-rose-700">{createProductMutation.error.message}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={requestClose} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Vazgec</button>
          {/* isDirty: degisiklik yokken submit anlamsiz; isSubmitting degil mutation.isPending —
              mutate senkron doner, gercek istek suresini mutation state'i bilir. */}
          <button type="submit" disabled={!form.formState.isDirty || createProductMutation.isPending} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
            {createProductMutation.isPending ? 'Kaydediliyor...' : isEditing ? 'Degisiklikleri kaydet' : 'Urunu ekle'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ref?: React 19'da fonksiyon bilesenleri ref'i duz prop olarak alir, forwardRef gerekmez.
function SegmentButton({
  active,
  label,
  onClick,
  ref,
}: {
  active: boolean
  label: string
  onClick: () => void
  ref?: Ref<HTMLButtonElement>
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex h-10 items-center justify-center border text-sm font-medium ${
        active ? 'border-teal-700 bg-teal-50 text-teal-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

type FieldElementProps = { id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }

// Implicit label hata metnini alana BAGLAMAZ; explicit id + aria-describedby/aria-invalid
// iliskiyi ekran okuyucuya programatik bildirir. useId cakismasiz ve render'lar arasi stabildir.
function FormField({ children, error, label }: { children: React.ReactElement<FieldElementProps>; error?: string; label: string }) {
  const fieldId = useId()
  const errorId = `${fieldId}-error`

  return (
    <div className="block text-sm font-medium text-slate-700">
      <label htmlFor={fieldId}>{label}</label>
      <span className="mt-1 block">
        {cloneElement(children, { id: fieldId, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errorId : undefined })}
      </span>
      {error && <span id={errorId} className="mt-1 block text-xs font-normal text-rose-700">{error}</span>}
    </div>
  )
}