import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { isApiError } from '../../../shared/api/api-error'
import { customerQueryKeys } from '../../customers/api/customers-api'
import {
  applyOrderItemsToListAllCache,
  productListAllOptions,
  productQueryKeys,
  type Product,
} from '../../products/api/products-api'
import {
  createOrder,
  createOrderFormSchema,
  orderMutationKeys,
  orderQueryKeys,
  type OrderFormInput,
  type OrderFormValues,
} from '../api/orders-api'
import { useOrderDraftStore } from '../stores/order-draft-store'

const emptyOrderForm: OrderFormInput = {
  customerId: '',
  items: [{ productId: '', quantity: 1 }],
}

type UseOrderCreateFormOptions = {
  products: Product[]
  onClose: () => void
}

// Form kurulumu, mutation, server hata eslemesi ve kapatma akisi tek yerde;
// dialog bileseni yalnizca gorunumden sorumlu kalir.
export function useOrderCreateForm({ products, onClose }: UseOrderCreateFormOptions) {
  const queryClient = useQueryClient()
  const draft = useOrderDraftStore((state) => state.draft)
  const saveDraft = useOrderDraftStore((state) => state.saveDraft)
  const clearDraft = useOrderDraftStore((state) => state.clearDraft)
  // Sema fabrikasi memoize: superRefine + Map kurulumu her render'da degil,
  // yalnizca products referansi degisince calisir (refine performans bilinci).
  const schema = useMemo(() => createOrderFormSchema(products), [products])
  const form = useForm<OrderFormInput, unknown, OrderFormValues>({
    resolver: zodResolver(schema),
    // onTouched dengesi: onSubmit ilk hatayi cok gec, onChange dokunulmamis alanda cok erken gosterir.
    mode: 'onTouched',
    // Hata bir kez gorunduginde duzeltme geri bildirimi tus vurusunda gelir.
    reValidateMode: 'onChange',
    // defaultValues yalnizca mount'ta okunur: acilista taslak varsa form ondan dogar.
    defaultValues: draft ?? emptyOrderForm,
  })
  const orderItems = useFieldArray({ control: form.control, name: 'items' })
  const createOrderMutation = useMutation({
    // Key, mutation'i cache'te adreslenebilir yapar: header gostergesi useMutationState ile izler.
    mutationKey: orderMutationKeys.create,
    mutationFn: createOrder,
    // Dialog acik kaldigi icin hata inline gosterilir; global toast susturulur.
    meta: { suppressErrorToast: true, successMessage: 'Siparis olusturuldu.' },
    onSuccess: async (order) => {
      // P2: listAll siparisler sayfasinda AKTIF gozlemleniyor (useOrderList → productListAllOptions);
      // dusuk maliyetli yol invalidation degil, siparis kalemleriyle DOGRUDAN guncelleme.
      queryClient.setQueryData<Product[]>(productListAllOptions().queryKey, (data) =>
        applyOrderItemsToListAllCache(data, order.items),
      )

      // listAll (yukarida elle guncellendi) ve activeCount (siparisten ETKILENMEZ, aktif urun
      // sayisi degismez) invalidation'dan haric tutulur; paged liste + dashboard dusuk-stok
      // listesi orders sayfasindayken mounted olmadigi icin mark-stale zaten ucretsiz kalir.
      const excludedFromInvalidation = [productQueryKeys.listAll(), productQueryKeys.activeCount()]

      // Dashboard ayni siparis/urun cache'lerini okudugu icin ayrica invalidate edilmez.
      // orders prefix'i tam listeyle birlikte filtre basina infinite girdileri de kapsar.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: orderQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: productQueryKeys.lists(),
          predicate: (query) =>
            !excludedFromInvalidation.some((key) => JSON.stringify(key) === JSON.stringify(query.queryKey)),
        }),
        queryClient.invalidateQueries({ queryKey: customerQueryKeys.all }),
      ])
      // Siparis kaydedildi; yarim is kalmadigi icin taslak da silinir.
      clearDraft()
      onClose()
    },
    // Mock sozlesmesi geregi alan cikarimi mesaj metninden yapilir (bilinçli kirilganlik);
    // gercek bir API alan bazli yapisal hata govdesi dondururdu.
    onError: (error) => {
      if (isApiError(error) && error.status === 404 && error.message === 'Musteri bulunamadi.') {
        form.setError('customerId', { type: 'server', message: error.message })
        return
      }

      if (isApiError(error) && error.status === 409) {
        // Mesaj urun adiyla baslar; startsWith, bir adin digerinin alt dizesi olmasina yanilmaz.
        const failingProduct = products.find((product) => error.message.startsWith(`${product.name} `))
        // Index guncel form dizisinde aranir: istek ucustayken satir eklenebilir/silinebilir,
        // submit aninin index'i kaymis olabilir. Ayni urun birden fazla kalemdeyse ILK satir (bilinçli kural).
        const index = form.getValues('items').findIndex((item) => item.productId === failingProduct?.id)

        if (index !== -1) {
          form.setError(`items.${index}.quantity`, { type: 'server', message: error.message })
          return
        }
      }

      form.setError('root.serverError', { type: 'server', message: error.message })
    },
  })

  // K4'un confirm'i evrildi: kaydedilmemis degisiklik kapatmayi engellemez, taslaga yazilir
  // (urun dialogunda confirm bilinçli birakildi — ayni probleme iki cozumun karsilastirmasi).
  // Basari kapanisi onSuccess'ta dogrudan onClose cagirir; oradan taslak da silinir.
  const requestClose = () => {
    if (form.formState.isDirty) saveDraft(form.getValues())
    onClose()
  }

  // Taslagi atmak formu da sifirlar; yeni baseline bos form olur.
  const discardDraft = () => {
    clearDraft()
    form.reset(emptyOrderForm)
  }

  const submit = form.handleSubmit((values) => createOrderMutation.mutate(values))

  return { form, orderItems, createOrderMutation, requestClose, submit, hasDraft: draft !== null, discardDraft }
}
