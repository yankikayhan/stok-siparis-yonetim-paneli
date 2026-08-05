import { z } from 'zod'
import { request, requestPage } from '../../../shared/api/http-client'
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
  .pick({ name: true, sku: true, categoryId: true, price: true, stock: true, reorderLevel: true })
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
}

export const productQueryKeys = {
  all: ['products'] as const,
  // Invalidation prefix'i: lists() tum filtre kombinasyonlarini kapsar.
  lists: () => [...productQueryKeys.all, 'list'] as const,
  list: (params: ProductListParams) => [...productQueryKeys.lists(), params] as const,
  // Tam liste tuketicileri (siparis dialogu, stok dogrulamasi) icin sabit anahtar;
  // gercek uygulamada dialog kendi arama endpoint'ini kullanirdi.
  listAll: () => [...productQueryKeys.lists(), { scope: 'all' }] as const,
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

  const queryString = searchParams.toString()

  return requestPage(queryString === '' ? '/products' : `/products?${queryString}`, {
    itemSchema: productSchema,
  })
}

export function getCategories() {
  return request('/categories', { schema: categoriesSchema })
}

export function createProduct(values: ProductFormValues) {
  const now = new Date().toISOString()

  return request('/products', {
    method: 'POST',
    body: {
      ...values,
      active: true,
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