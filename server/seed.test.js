import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { customerSchema } from '../src/features/customers/api/customers-api'
import { orderSchema } from '../src/features/orders/api/orders-api'
import { categorySchema, productSchema } from '../src/features/products/api/products-api'
import { profileSchema } from '../src/features/settings/api/profile-api'
import { buildDatabase } from './seed.js'

const fixture = JSON.parse(readFileSync(new URL('./seed-fixture.json', import.meta.url), 'utf8'))
const database = buildDatabase(fixture)

function countBy(items, resolveKey) {
  return items.reduce((counts, item) => {
    const key = resolveKey(item)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

describe('buildDatabase determinizmi', () => {
  it('iki cagri bayt bayt ayni ciktiyi uretir', () => {
    expect(JSON.stringify(buildDatabase(fixture))).toBe(JSON.stringify(buildDatabase(fixture)))
  })

  it('uretilen tarihler gelecege tasmaz', () => {
    const timestamps = [
      ...database.products.flatMap((product) => [product.createdAt, product.updatedAt]),
      ...database.orders.map((order) => order.createdAt),
    ]

    expect(Math.max(...timestamps.map(Date.parse))).toBeLessThan(Date.parse('2026-08-01T00:00:00.000Z'))
  })
})

describe('bes kaynak uygulamanin semalariyla dogrulanir', () => {
  it('categories', () => {
    expect(() => z.array(categorySchema).parse(database.categories)).not.toThrow()
  })

  it('products', () => {
    expect(() => z.array(productSchema).parse(database.products)).not.toThrow()
  })

  it('customers', () => {
    expect(() => z.array(customerSchema).parse(database.customers)).not.toThrow()
  })

  it('orders', () => {
    // Discriminated union: tek cagri dort dali da denetler (shipped/cancelled zorunlu alanlari dahil).
    expect(() => z.array(orderSchema).parse(database.orders)).not.toThrow()
  })

  it('profile', () => {
    expect(() => profileSchema.parse(database.profile)).not.toThrow()
  })
})

describe('urun dagilimi', () => {
  const lowStock = database.products.filter((product) => product.stock <= product.reorderLevel)
  const passive = database.products.filter((product) => !product.active)

  it('1000 urun uretir ve id\'ler benzersizdir', () => {
    expect(database.products).toHaveLength(1000)
    expect(new Set(database.products.map((product) => product.id)).size).toBe(1000)
    expect(new Set(database.products.map((product) => product.sku)).size).toBe(1000)
  })

  it('dusuk stok 200, pasif 120', () => {
    expect(lowStock).toHaveLength(200)
    expect(passive).toHaveLength(120)
  })

  it('pasif ve dusuk stok kesisimi 20, active-only dusuk stok 180', () => {
    // IB7 icin kritik: kesisim bos olsaydi `active` filtresi eklemek ile eklememek ayni sonucu verirdi.
    expect(passive.filter((product) => product.stock <= product.reorderLevel)).toHaveLength(20)
    expect(lowStock.filter((product) => product.active)).toHaveLength(180)
  })

  it('urunler uc kategoriye yayilir', () => {
    expect(countBy(database.products, (product) => product.categoryId)).toEqual({
      'cat-electronics': 334,
      'cat-office': 333,
      'cat-packaging': 333,
    })
  })
})

describe('siparis dagilimi', () => {
  const statusCounts = countBy(database.orders, (order) => order.status)

  it('id\'ler benzersizdir', () => {
    expect(new Set(database.orders.map((order) => order.id)).size).toBe(database.orders.length)
  })

  it('sayfa boyutunun (10) uc yaninda da statu vardir', () => {
    // >10 ikinci sayfa, =10 tam sinir (hasNextPage false), <10 tek sayfa.
    expect(statusCounts).toEqual({ pending: 18, paid: 12, shipped: 10, cancelled: 5 })
  })

  it('durum bazli alanlar yalniz kendi dallarinda bulunur', () => {
    for (const order of database.orders) {
      expect('trackingNumber' in order).toBe(order.status === 'shipped')
      expect('cancelReason' in order).toBe(order.status === 'cancelled')
    }
  })

  it('kalemler yalniz aktif urunlere isaret eder ve sipariste tekrar etmez', () => {
    const activeProductIds = new Set(
      database.products.filter((product) => product.active).map((product) => product.id),
    )

    for (const order of database.orders) {
      const productIds = order.items.map((item) => item.productId)

      expect(productIds.every((productId) => activeProductIds.has(productId))).toBe(true)
      expect(new Set(productIds).size).toBe(productIds.length)
    }
  })

  it('toplam, kalem toplamlarinin toplamidir', () => {
    for (const order of database.orders) {
      expect(order.total).toBe(order.items.reduce((total, item) => total + item.lineTotal, 0))
    }
  })
})

describe('musteri dagilimi', () => {
  const orderCounts = countBy(database.orders, (order) => order.customerId)

  it('bir musteri sifir siparislidir (empty state yolu)', () => {
    expect(database.customers.some((customer) => orderCounts[customer.id] === undefined)).toBe(true)
  })

  it('bir musteride 10+ siparis vardir (uzun liste yolu)', () => {
    expect(Math.max(...Object.values(orderCounts))).toBeGreaterThanOrEqual(10)
  })

  it('siparisler var olmayan musteriye baglanmaz', () => {
    const customerIds = new Set(database.customers.map((customer) => customer.id))

    expect(Object.keys(orderCounts).every((customerId) => customerIds.has(customerId))).toBe(true)
  })
})
