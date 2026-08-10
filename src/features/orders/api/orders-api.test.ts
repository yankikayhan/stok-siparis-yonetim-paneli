import { describe, expect, it } from 'vitest'
import { createOrderFormSchema } from './orders-api'

const products = [
  {
    id: 'prd-keyboard',
    name: 'Kablosuz Klavye',
    sku: 'ELK-KLV-001',
    categoryId: 'cat-electronics',
    price: 1499.9,
    stock: 18,
    reorderLevel: 8,
    active: true,
    // Product['createdAt'] artik Date; sema output'u degistigi icin fixture da degisti.
    createdAt: new Date('2026-06-02T09:30:00.000Z'),
    updatedAt: new Date('2026-07-10T10:00:00.000Z'),
  },
]

const passiveProduct = {
  id: 'prd-mouse-old',
  name: 'Eski Model Kablosuz Mouse',
  sku: 'ELK-MSE-000',
  categoryId: 'cat-electronics',
  price: 349.9,
  stock: 10,
  reorderLevel: 5,
  active: false,
  createdAt: new Date('2026-01-02T09:00:00.000Z'),
  updatedAt: new Date('2026-02-01T09:00:00.000Z'),
}

describe('createOrderFormSchema', () => {
  it('stok seviyesine esit miktardaki siparisi gecerli kabul eder', () => {
    const result = createOrderFormSchema(products).safeParse({
      customerId: 'cus-001',
      items: [{ productId: 'prd-keyboard', quantity: 18 }],
    })

    expect(result.success).toBe(true)
  })

  it('stok seviyesini asan bir kalemi reddeder', () => {
    const result = createOrderFormSchema(products).safeParse({
      customerId: 'cus-001',
      items: [{ productId: 'prd-keyboard', quantity: 19 }],
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['items', 0, 'quantity'] }),
      )
    }
  })

  it('ayni urunun ayri kalemlerdeki toplam stok asimini reddeder', () => {
    const result = createOrderFormSchema(products).safeParse({
      customerId: 'cus-001',
      items: [
        { productId: 'prd-keyboard', quantity: 11 },
        { productId: 'prd-keyboard', quantity: 8 },
      ],
    })

    expect(result.success).toBe(false)
  })

  it('pasif urunu reddeder', () => {
    const result = createOrderFormSchema([...products, passiveProduct]).safeParse({
      customerId: 'cus-001',
      items: [{ productId: 'prd-mouse-old', quantity: 1 }],
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ['items', 0, 'productId'] }),
      )
    }
  })
})