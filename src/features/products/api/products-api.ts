import { z } from 'zod'
import { request } from '../../../shared/api/http-client'

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
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

const productsSchema = z.array(productSchema)
const categoriesSchema = z.array(categorySchema)

export type Product = z.output<typeof productSchema>
export type Category = z.output<typeof categorySchema>

export const productFormSchema = z.object({
  name: z.string().trim().min(2, 'Urun adi en az 2 karakter olmali.'),
  sku: z.string().trim().min(3, 'SKU en az 3 karakter olmali.'),
  categoryId: z.string().min(1, 'Kategori secin.'),
  price: z.coerce.number().positive('Fiyat sifirdan buyuk olmali.'),
  stock: z.coerce.number().int().nonnegative('Stok negatif olamaz.'),
  reorderLevel: z.coerce.number().int().nonnegative('Yeniden siparis seviyesi negatif olamaz.'),
})

export type ProductFormValues = z.infer<typeof productFormSchema>
export type ProductFormInput = z.input<typeof productFormSchema>

export const productQueryKeys = {
  all: ['products'] as const,
  list: () => [...productQueryKeys.all, 'list'] as const,
  categories: () => [...productQueryKeys.all, 'categories'] as const,
}

export function getProducts() {
  return request('/products', { schema: productsSchema })
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

export function updateProduct(id: string, values: ProductFormValues) {
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
    schema: z.undefined(),
  })
}