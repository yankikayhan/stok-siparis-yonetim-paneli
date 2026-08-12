import { describe, expect, it } from 'vitest'
import { applyOrderItemsToListAllCache, type Product } from './products-api'

const keyboard: Product = {
  id: 'prd-keyboard',
  name: 'Kablosuz Klavye',
  sku: 'ELK-KLV-001',
  categoryId: 'cat-electronics',
  price: 1499.9,
  stock: 18,
  reorderLevel: 8,
  active: true,
  createdAt: new Date('2026-06-02T09:30:00.000Z'),
  updatedAt: new Date('2026-07-10T10:00:00.000Z'),
}

const mouse: Product = {
  id: 'prd-mouse',
  name: 'Kablosuz Mouse',
  sku: 'ELK-MSE-001',
  categoryId: 'cat-electronics',
  price: 649.9,
  stock: 30,
  reorderLevel: 10,
  active: true,
  createdAt: new Date('2026-06-02T09:30:00.000Z'),
  updatedAt: new Date('2026-07-10T10:00:00.000Z'),
}

describe('applyOrderItemsToListAllCache', () => {
  it('cache tanimsizsa no-op doner', () => {
    expect(applyOrderItemsToListAllCache(undefined, [{ productId: keyboard.id, quantity: 1 }])).toBeUndefined()
  })

  it('tek kalemin stogunu dusurur', () => {
    const result = applyOrderItemsToListAllCache([keyboard, mouse], [{ productId: keyboard.id, quantity: 3 }])

    expect(result?.find((product) => product.id === keyboard.id)?.stock).toBe(15)
    expect(result?.find((product) => product.id === mouse.id)?.stock).toBe(30)
  })

  it('birden fazla farkli urunu ayni anda dusurur', () => {
    const result = applyOrderItemsToListAllCache(
      [keyboard, mouse],
      [
        { productId: keyboard.id, quantity: 2 },
        { productId: mouse.id, quantity: 5 },
      ],
    )

    expect(result?.find((product) => product.id === keyboard.id)?.stock).toBe(16)
    expect(result?.find((product) => product.id === mouse.id)?.stock).toBe(25)
  })

  it('ayni urun icin tekrarlanan kalemleri toplar', () => {
    const result = applyOrderItemsToListAllCache(
      [keyboard],
      [
        { productId: keyboard.id, quantity: 2 },
        { productId: keyboard.id, quantity: 1 },
      ],
    )

    expect(result?.find((product) => product.id === keyboard.id)?.stock).toBe(15)
  })

  it('cache\'te olmayan urun kalemini sessizce yok sayar', () => {
    const result = applyOrderItemsToListAllCache([keyboard], [{ productId: 'prd-silinmis', quantity: 1 }])

    expect(result).toEqual([keyboard])
  })
})
