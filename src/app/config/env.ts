import { z } from 'zod'

const environmentSchema = z.object({
  VITE_API_URL: z.url().default('http://localhost:3001'),
})

export const environment = environmentSchema.parse(import.meta.env)