import { describe, expect, it } from 'vitest'
import { type Product } from '../api/products-api'
import { resolveEditTarget } from './use-product-actions'

const product: Product = {
  id: 'prd-0001',
  name: 'Kablosuz Klavye Standart',
  sku: 'ELK-KLV-0001',
  categoryId: 'cat-electronics',
  price: 1499.9,
  stock: 18,
  reorderLevel: 8,
  active: true,
  createdAt: new Date('2026-01-05T08:00:00.000Z'),
  updatedAt: new Date('2026-01-05T08:00:00.000Z'),
}

describe('resolveEditTarget', () => {
  it('editId yokken hicbir seye karar vermez', () => {
    expect(
      resolveEditTarget({
        products: [product],
        isPlaceholderData: false,
        isPageOutOfRange: false,
        editId: null,
      }),
    ).toEqual({ product: undefined, shouldClear: false })
  })

  it('liste henuz yuklenmemisken temizlemez', () => {
    expect(
      resolveEditTarget({
        products: undefined,
        isPlaceholderData: false,
        isPageOutOfRange: false,
        editId: 'prd-0001',
      }),
    ).toEqual({ product: undefined, shouldClear: false })
  })

  it('placeholder veride urun bulunamazsa karari erteler', () => {
    expect(
      resolveEditTarget({
        products: [],
        isPlaceholderData: true,
        isPageOutOfRange: false,
        editId: 'prd-0001',
      }),
    ).toEqual({ product: undefined, shouldClear: false })
  })

  it('placeholder veride urun bulunursa dialogu ayakta tutar', () => {
    expect(
      resolveEditTarget({
        products: [product],
        isPlaceholderData: true,
        isPageOutOfRange: false,
        editId: 'prd-0001',
      }),
    ).toEqual({ product, shouldClear: false })
  })

  it('sayfa aralik disiyken bos liste temizleme sebebi degildir', () => {
    // Sunucu aralik disi sayfada bos dizi + gercek totalCount dondurur; clamp henuz calismamistir.
    expect(
      resolveEditTarget({
        products: [],
        isPlaceholderData: false,
        isPageOutOfRange: true,
        editId: 'prd-0001',
      }),
    ).toEqual({ product: undefined, shouldClear: false })
  })

  it('sayfa aralik disiyken urun bulunursa dialog ayakta kalir', () => {
    expect(
      resolveEditTarget({
        products: [product],
        isPlaceholderData: false,
        isPageOutOfRange: true,
        editId: 'prd-0001',
      }),
    ).toEqual({ product, shouldClear: false })
  })

  it('taze ve gecerli listede urun yoksa TEMIZLER', () => {
    expect(
      resolveEditTarget({
        products: [],
        isPlaceholderData: false,
        isPageOutOfRange: false,
        editId: 'prd-0001',
      }),
    ).toEqual({ product: undefined, shouldClear: true })
  })

  it('taze ve gecerli listede urun varsa dialogu besler', () => {
    expect(
      resolveEditTarget({
        products: [product],
        isPlaceholderData: false,
        isPageOutOfRange: false,
        editId: 'prd-0001',
      }),
    ).toEqual({ product, shouldClear: false })
  })
})
