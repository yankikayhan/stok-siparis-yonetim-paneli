import { z } from 'zod'
import { formatZodError } from '../../shared/lib/format-zod-error'

const environmentSchema = z.object({
  VITE_API_URL: z.url('Gecerli bir URL olmali (or. http://localhost:3001).').default('http://localhost:3001'),
})

const result = environmentSchema.safeParse(import.meta.env)

// Bozuk config ile calismak yerine boot aninda anlasilir mesajla durulur.
if (!result.success) {
  throw new Error(`Ortam degiskenleri gecersiz. .env dosyanizi kontrol edin:\n${formatZodError(result.error)}`)
}

export const environment = result.data