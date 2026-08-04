import { describe, expectTypeOf, it } from 'vitest'
import type { Product, ProductFormValues, ProductUpdateValues } from './products-api'

// NOT: Vitest tip denetimi yapmaz; bu assert'lerin gercek guvencesi `npm run build` icindeki `tsc -b`'dir.
// Testler runtime'da no-op olarak gecer; tip bozulursa build derleme hatasiyla durur.

// Ornek mapped type; yalnizca bu tip testinde yasar, uretim kodunda kullanilmaz.
type Nullable<T> = { [K in keyof T]: T[K] | null }

describe('products-api tip turetmeleri', () => {
  it('Zod partial() ciktisi TS Partial<T> ile ayni tipi uretir', () => {
    expectTypeOf<ProductUpdateValues>().toEqualTypeOf<Partial<ProductFormValues>>()
  })

  it('Zod pick(...) ciktisi TS Pick<T, K> ile ayni tipi uretir', () => {
    expectTypeOf<ProductFormValues>().toEqualTypeOf<
      Pick<Product, 'name' | 'sku' | 'categoryId' | 'price' | 'stock' | 'reorderLevel'>
    >()
  })

  it('Omit ile alan cikarilinca keyof kalan alanlari verir', () => {
    expectTypeOf<keyof Omit<Product, 'createdAt' | 'updatedAt'>>().toEqualTypeOf<
      'id' | 'name' | 'sku' | 'categoryId' | 'price' | 'stock' | 'reorderLevel' | 'active'
    >()
  })

  it('Nullable mapped type her alani null ile birlestirir', () => {
    expectTypeOf<Nullable<Pick<Product, 'name' | 'stock'>>>().toEqualTypeOf<{
      name: string | null
      stock: number | null
    }>()
  })
})
