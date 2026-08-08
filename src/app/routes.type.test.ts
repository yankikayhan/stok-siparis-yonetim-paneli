import { describe, expectTypeOf, it } from 'vitest'
import { ROUTE_SEGMENTS, type RoutePath, type RouteSegment } from './routes'

// NOT: Vitest tip denetimi yapmaz; bu assert'lerin gercek guvencesi `npm run build` icindeki `tsc -b`'dir.

describe('route tip turetmeleri', () => {
  it('template literal type segmentlerden mutlak path union uretir', () => {
    expectTypeOf<RoutePath>().toEqualTypeOf<
      '/' | '/urunler' | '/musteriler' | '/siparisler' | '/ayarlar'
    >()
  })

  it('noUncheckedIndexedAccess dizi destructuring kapsamindadir', () => {
    // Bayrak kapsamdaysa tip `| undefined` alir ve assert gecer; kapsamda degilse
    // `RouteSegment` cikar ve bu satir derleme hatasi verir. Probe degil, kalici regresyon agi.
    const [firstSegment] = ROUTE_SEGMENTS.slice()

    expectTypeOf(firstSegment).toEqualTypeOf<RouteSegment | undefined>()
  })
})
