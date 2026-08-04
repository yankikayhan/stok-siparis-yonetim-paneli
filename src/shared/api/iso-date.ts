import { z } from 'zod'

// ISO format dogrulamasindan gecen string, coerce ile Date'e cevrilip tekrar dogrulanir.
export const isoDateTimeSchema = z.iso.datetime().pipe(z.coerce.date())
