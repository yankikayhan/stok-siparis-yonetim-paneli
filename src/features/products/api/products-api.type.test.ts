import { describe, expectTypeOf, it } from 'vitest'
import {
  productQueryKeys,
  type Product,
  type ProductFormValues,
  type ProductListParams,
  type ProductUpdateValues,
} from './products-api'

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

describe('query key factory as const daraltmasi', () => {
  it('as const tuple tipini literal uyelerle sabitler', () => {
    expectTypeOf(productQueryKeys.all).toEqualTypeOf<readonly ['products']>()

    // Karsitlik: as const olmadan ayni literal genis string[] tipine yayilir.
    const withoutConst = ['products']
    expectTypeOf(withoutConst).toEqualTypeOf<string[]>()
  })

  it('spread ile kurulan alt key literal hiyerarsiyi korur', () => {
    expectTypeOf(productQueryKeys.categories()).toEqualTypeOf<readonly ['products', 'categories']>()
    // as const nesne literalini derinlemesine daraltir: scope alani da readonly literal olur.
    expectTypeOf(productQueryKeys.listAll()).toEqualTypeOf<
      readonly ['products', 'list', { readonly scope: 'all' }]
    >()
  })

  it('parametreli key tipi ReturnType ile cikarilir', () => {
    // Son uye literal degil: params disaridan genis ProductListParams tipiyle gelir.
    type ProductListKey = ReturnType<typeof productQueryKeys.list>
    expectTypeOf<ProductListKey>().toEqualTypeOf<readonly ['products', 'list', ProductListParams]>()
  })
})
