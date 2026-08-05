import { describe, expectTypeOf, it } from 'vitest'
import { orderQueryKeys } from './orders-api'

// NOT: Vitest tip denetimi yapmaz; bu assert'lerin gercek guvencesi `npm run build` icindeki `tsc -b`'dir.
// Testler runtime'da no-op olarak gecer; tip bozulursa build derleme hatasiyla durur.

describe('orders-api query key tip turetmeleri', () => {
  it('as const kok key tipini literal tuple olarak sabitler', () => {
    expectTypeOf(orderQueryKeys.all).toEqualTypeOf<readonly ['orders']>()
  })

  it('bir key tipi ReturnType<typeof orderQueryKeys.list> ile cikarilir', () => {
    expectTypeOf<ReturnType<typeof orderQueryKeys.list>>().toEqualTypeOf<readonly ['orders', 'list']>()
  })
})
