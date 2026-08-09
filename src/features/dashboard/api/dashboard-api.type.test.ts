import type { UseQueryResult, UseSuspenseQueryResult } from '@tanstack/react-query'
import { describe, expectTypeOf, it } from 'vitest'
import { selectProductStats } from './dashboard-api'

// NOT: Vitest tip denetimi yapmaz; bu assert'lerin gercek guvencesi `npm run build` icindeki `tsc -b`'dir.
// Testler runtime'da no-op olarak gecer; tip bozulursa build derleme hatasiyla durur.

type ProductStats = ReturnType<typeof selectProductStats>

describe('sorgu sonucu tiplerinde daraltma', () => {
  it('useSuspenseQuery data alanini daraltmaya gerek kalmadan tanimli dondurur', () => {
    expectTypeOf<UseSuspenseQueryResult<ProductStats>['data']>().toEqualTypeOf<ProductStats>()
  })

  it('useQuery sonucu daraltilmadan undefined tasir', () => {
    expectTypeOf<UseQueryResult<ProductStats>['data']>().toEqualTypeOf<ProductStats | undefined>()
  })

  it('discriminated union success dalinda data tanimlidir', () => {
    type SuccessResult = Extract<UseQueryResult<ProductStats>, { status: 'success' }>

    expectTypeOf<SuccessResult['data']>().toEqualTypeOf<ProductStats>()
  })

  it('error dalinda data DOLU olabilir', () => {
    // Iki uye birlikte yasar: ilk yukleme hatasi (data undefined) ve arka plan refetch hatasi
    // (data korunur). `isError` ile dallanan bir sayfa bu yuzden bayat veriyi hata ekranina cevirir.
    type ErrorResult = Extract<UseQueryResult<ProductStats>, { status: 'error' }>

    expectTypeOf<ErrorResult['data']>().toEqualTypeOf<ProductStats | undefined>()
  })
})
