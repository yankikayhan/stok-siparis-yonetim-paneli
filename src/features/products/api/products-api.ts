import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { request, requestPage, type Page } from '../../../shared/api/http-client'
import { isoDateTimeSchema } from '../../../shared/api/iso-date'

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const productSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  sku: z.string(),
  categoryId: z.string(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
  active: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
})

const productsSchema = z.array(productSchema)
const categoriesSchema = z.array(categorySchema)

export type Product = z.output<typeof productSchema>
export type Category = z.output<typeof categorySchema>

export const productFormSchema = productSchema
  .pick({ name: true, sku: true, categoryId: true, price: true, stock: true, reorderLevel: true, active: true })
  .extend({
    name: z.string().trim().min(2, 'Urun adi en az 2 karakter olmali.'),
    sku: z.string().trim().min(3, 'SKU en az 3 karakter olmali.'),
    categoryId: z.string().min(1, 'Kategori secin.'),
    price: z.coerce.number().positive('Fiyat sifirdan buyuk olmali.'),
    stock: z.coerce.number().int().nonnegative('Stok negatif olamaz.'),
    reorderLevel: z.coerce.number().int().nonnegative('Yeniden siparis seviyesi negatif olamaz.'),
  })

// PATCH kismi guncellemeye izin verir; tam nesne de gecerlidir.
export const productUpdateSchema = productFormSchema.partial()

export type ProductFormValues = z.infer<typeof productFormSchema>
export type ProductFormInput = z.input<typeof productFormSchema>
export type ProductUpdateValues = z.output<typeof productUpdateSchema>

export type ProductStockFilter = 'all' | 'low' | 'in-stock'

export type ProductListParams = {
  search: string
  // 'all' degerleri filtre yok anlamina gelir ve query string'e yazilmaz.
  categoryId: string
  stock: ProductStockFilter
  page: number
}

// Cagri basina degismedigi icin query key'e girmez; degisken olacagi gun parametreye tasinir.
export const PRODUCTS_PAGE_SIZE = 10

// Sayfanin baslangic state'i ile sidebar prefetch'i AYNI key'i kurmak zorunda; tek kaynak burasi.
export const DEFAULT_PRODUCT_LIST_PARAMS: ProductListParams = {
  search: '',
  categoryId: 'all',
  stock: 'all',
  page: 1,
}

export const productQueryKeys = {
  all: ['products'] as const,
  // Invalidation prefix'i: lists() tum filtre kombinasyonlarini kapsar.
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (params: ProductListParams) => [...productQueryKeys.lists(), params] as const,
  // Tam liste tuketicileri (siparis dialogu, stok dogrulamasi) icin sabit anahtar;
  // gercek uygulamada dialog kendi arama endpoint'ini kullanirdi.
  listAll: () => [...productQueryKeys.lists(), { scope: 'all' }] as const,
  // Dashboard'a ozel: sunucu tarafinda active=true ile onceden filtrelenmis sayim/liste (P1).
  activeCount: () => [...productQueryKeys.lists(), { scope: 'active-count' }] as const,
  activeLowStock: () => [...productQueryKeys.lists(), { scope: 'active-low-stock' }] as const,
  categories: () => [...productQueryKeys.all, 'categories'] as const,
}

export function getProducts() {
  return request('/products', { schema: productsSchema })
}

export function getProductsPage(params: ProductListParams) {
  const searchParams = new URLSearchParams()

  if (params.search !== '') searchParams.set('search', params.search)
  if (params.categoryId !== 'all') searchParams.set('categoryId', params.categoryId)
  if (params.stock !== 'all') searchParams.set('stock', params.stock)
  searchParams.set('_page', String(params.page))
  searchParams.set('_limit', String(PRODUCTS_PAGE_SIZE))

  return requestPage(`/products?${searchParams.toString()}`, {
    itemSchema: productSchema,
  })
}

export function getCategories() {
  return request('/categories', { schema: categoriesSchema })
}

// P1: dashboard'un 1000 kayitlik listAll'i cekmesi yerine sunucuda active=true ile onceden
// filtrelenmis, kucuk govdeli iki sorgu. X-Total-Count dilimlemeden ONCE yazildigi icin
// (kalici-bulgular.md §6) _limit=1 istegi bile dogru TOPLAM sayiyi dondurur.
export function getActiveProductCount() {
  return requestPage('/products?active=true&_page=1&_limit=1', { itemSchema: productSchema }).then(
    (page) => page.totalCount,
  )
}

export function getActiveLowStockProducts() {
  return request('/products?active=true&stock=low', { schema: productsSchema })
}

// queryOptions: key ve queryFn eslesmesini tip duzeyinde baglar; sunum davranislari
// (placeholderData, enabled) cagri yerinde spread ile eklenir.
export function productListOptions(params: ProductListParams) {
  return queryOptions({
    queryKey: productQueryKeys.list(params),
    queryFn: () => getProductsPage(params),
  })
}

export function productListAllOptions() {
  return queryOptions({
    queryKey: productQueryKeys.listAll(),
    queryFn: getProducts,
  })
}

export function categoriesOptions() {
  return queryOptions({
    queryKey: productQueryKeys.categories(),
    queryFn: getCategories,
    // Uygulamada kategori CRUD'u yok; veri ancak seed degisikligiyle degisir.
    // Oturum boyunca taze kabul edilir; sayfa yenilemesi tek tazeleme yoludur.
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

// Ikisi de BIRINCIL: dashboard bunlari useSuspenseQueries icinde cagirir, Suspense'in sabit
// gectigi defaultThrowOnError veri yoksa ikisini de kosulsuz boundary'ye firlatir (KOSUL 3.2).
export function activeProductCountOptions() {
  return queryOptions({
    queryKey: productQueryKeys.activeCount(),
    queryFn: getActiveProductCount,
  })
}

export function activeLowStockProductsOptions() {
  return queryOptions({
    queryKey: productQueryKeys.activeLowStock(),
    queryFn: getActiveLowStockProducts,
  })
}

// lists() prefix'i altinda iki farkli sekil yasar: list(params) -> Page<Product>, listAll() -> Product[].
// setQueriesData updater'lari bu yuzden sekle gore dallanmak zorundadir.
export type ProductListCache = Product[] | Page<Product>

export function replaceProductInListCache(data: ProductListCache, product: Product): ProductListCache {
  if (Array.isArray(data)) {
    return data.map((item) => (item.id === product.id ? product : item))
  }

  return { ...data, items: data.items.map((item) => (item.id === product.id ? product : item)) }
}

export function removeProductFromListCache(data: ProductListCache, productId: string): ProductListCache {
  if (Array.isArray(data)) {
    return data.filter((item) => item.id !== productId)
  }

  const items = data.items.filter((item) => item.id !== productId)

  return {
    items,
    // totalCount yalnizca urun bu girdide gorunuyorsa dusurulur: baska sayfadaki uyelik
    // istemcide bilinemez; kesin mutabakat onSettled invalidation'inin isidir.
    totalCount: items.length === data.items.length ? data.totalCount : data.totalCount - 1,
  }
}

// P2: siparis olusturma sonrasi listAll'i invalidation'dan haric tutup dogrudan bu fonksiyonla
// guncellemek icin (bkz. use-order-create-form.ts). listAll her zaman Product[] sekli tasir (Page degil).
export function applyOrderItemsToListAllCache(
  data: Product[] | undefined,
  items: Array<{ productId: string; quantity: number }>,
): Product[] | undefined {
  if (data === undefined) return undefined

  const orderedQuantities = new Map<string, number>()
  items.forEach((item) => {
    orderedQuantities.set(item.productId, (orderedQuantities.get(item.productId) ?? 0) + item.quantity)
  })

  return data.map((product) => {
    const quantity = orderedQuantities.get(product.id)
    return quantity === undefined ? product : { ...product, stock: product.stock - quantity }
  })
}

export function createProduct(values: ProductFormValues) {
  const now = new Date().toISOString()

  return request('/products', {
    method: 'POST',
    // active degerini form tasir; spread sonrasi sabit deger form secimini sessizce ezerdi.
    body: {
      ...values,
      createdAt: now,
      updatedAt: now,
    },
    schema: productSchema,
  })
}

export function updateProduct(id: string, values: ProductUpdateValues) {
  return request(`/products/${id}`, {
    method: 'PATCH',
    body: {
      ...values,
      updatedAt: new Date().toISOString(),
    },
    schema: productSchema,
  })
}

export function deleteProduct(id: string) {
  return request(`/products/${id}`, {
    method: 'DELETE',
    // json-server silme cevabinda `{}` dondurur; govde bizim icin anlamsizdir.
    schema: z.unknown(),
  })
}