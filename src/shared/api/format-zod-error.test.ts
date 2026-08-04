import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { formatZodError } from './format-zod-error'

// Custom mesajlar sayesinde assert'ler locale'den bagimsizdir.
const orderLikeSchema = z.object({
  name: z.string().min(1, 'Ad zorunludur.'),
  items: z
    .array(z.object({ quantity: z.number().positive('Miktar pozitif olmali.') }))
    .min(1, 'En az bir kalem gerekli.'),
})

function parseError(schema: z.ZodType, value: unknown): z.ZodError {
  const result = schema.safeParse(value)

  if (result.success) {
    throw new Error('Test verisi gecersiz olmaliydi.')
  }

  return result.error
}

describe('formatZodError', () => {
  it('ic ice path icin "path: mesaj" satiri uretir', () => {
    const error = parseError(orderLikeSchema, {
      name: 'Klavye',
      items: [{ quantity: 0 }],
    })

    expect(formatZodError(error)).toBe('items.0.quantity: Miktar pozitif olmali.')
  })

  it('birden fazla issue durumunda satirlari yeni satirla birlestirir', () => {
    const error = parseError(orderLikeSchema, {
      name: '',
      items: [{ quantity: 0 }],
    })

    expect(formatZodError(error)).toBe(
      'name: Ad zorunludur.\nitems.0.quantity: Miktar pozitif olmali.',
    )
  })

  it('bos array icin min mesajini array path\'iyle uretir', () => {
    const error = parseError(orderLikeSchema, { name: 'Klavye', items: [] })

    expect(formatZodError(error)).toBe('items: En az bir kalem gerekli.')
  })

  it('kok seviyedeki issue\'da path oneki eklemez', () => {
    const rootSchema = z.string({ error: 'Metin bekleniyordu.' })
    const error = parseError(rootSchema, 42)

    expect(formatZodError(error)).toBe('Metin bekleniyordu.')
  })
})
