import type { UseQueryResult, UseSuspenseQueryResult } from '@tanstack/react-query'
import { describe, expectTypeOf, it } from 'vitest'
import type { Product } from '../../products/api/products-api'

// NOT: Vitest tip denetimi yapmaz; bu assert'lerin gercek guvencesi `npm run build` icindeki `tsc -b`'dir.
// Testler runtime'da no-op olarak gecer; tip bozulursa build derleme hatasiyla durur.
// P1 sonrasi dashboard artik urun verisini secici (select) ile turetmiyor: sunucu active=true
// ile onceden filtrelenmis sayim (number) ve dusuk-stok listesi (Product[]) dondurur; discriminated
// union davranisi jenerik oldugu icin hangi tipe uygulandigi degismez, yalniz tip degisti.

describe('sorgu sonucu tiplerinde daraltma — aktif urun sayimi (number)', () => {
  it('useSuspenseQuery data alanini daraltmaya gerek kalmadan tanimli dondurur', () => {
    expectTypeOf<UseSuspenseQueryResult<number>['data']>().toEqualTypeOf<number>()
  })

  it('useQuery sonucu daraltilmadan undefined tasir', () => {
    expectTypeOf<UseQueryResult<number>['data']>().toEqualTypeOf<number | undefined>()
  })

  it('discriminated union success dalinda data tanimlidir', () => {
    type SuccessResult = Extract<UseQueryResult<number>, { status: 'success' }>

    expectTypeOf<SuccessResult['data']>().toEqualTypeOf<number>()
  })

  it('error dalinda data DOLU olabilir', () => {
    // Iki uye birlikte yasar: ilk yukleme hatasi (data undefined) ve arka plan refetch hatasi
    // (data korunur). `isError` ile dallanan bir sayfa bu yuzden bayat veriyi hata ekranina cevirir.
    type ErrorResult = Extract<UseQueryResult<number>, { status: 'error' }>

    expectTypeOf<ErrorResult['data']>().toEqualTypeOf<number | undefined>()
  })
})

describe('sorgu sonucu tiplerinde daraltma — aktif dusuk-stok listesi (Product[])', () => {
  it('useSuspenseQuery data alanini daraltmaya gerek kalmadan tanimli dondurur', () => {
    expectTypeOf<UseSuspenseQueryResult<Product[]>['data']>().toEqualTypeOf<Product[]>()
  })

  it('useQuery sonucu daraltilmadan undefined tasir', () => {
    expectTypeOf<UseQueryResult<Product[]>['data']>().toEqualTypeOf<Product[] | undefined>()
  })

  it('discriminated union success dalinda data tanimlidir', () => {
    type SuccessResult = Extract<UseQueryResult<Product[]>, { status: 'success' }>

    expectTypeOf<SuccessResult['data']>().toEqualTypeOf<Product[]>()
  })

  it('error dalinda data DOLU olabilir', () => {
    // Iki uye birlikte yasar: ilk yukleme hatasi (data undefined) ve arka plan refetch hatasi
    // (data korunur). `isError` ile dallanan bir sayfa bu yuzden bayat veriyi hata ekranina cevirir.
    type ErrorResult = Extract<UseQueryResult<Product[]>, { status: 'error' }>

    expectTypeOf<ErrorResult['data']>().toEqualTypeOf<Product[] | undefined>()
  })
})

