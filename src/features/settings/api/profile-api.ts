import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { request } from '../../../shared/api/http-client'

export const profileSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(2, 'Ad en az 2 karakter olmali.'),
  email: z.email('Gecerli bir e-posta adresi girin.'),
  companyName: z.string().trim().min(2, 'Sirket adi en az 2 karakter olmali.'),
  currency: z.enum(['TRY', 'USD', 'EUR']),
})

export type Profile = z.output<typeof profileSchema>
export type ProfileFormValues = z.input<typeof profileSchema>

export const profileQueryKeys = {
  all: ['profile'] as const,
  detail: () => [...profileQueryKeys.all, 'detail'] as const,
}

export function getProfile() {
  return request('/profile', { schema: profileSchema })
}

export function profileOptions() {
  return queryOptions({
    queryKey: profileQueryKeys.detail(),
    queryFn: getProfile,
  })
}

export function updateProfile(values: ProfileFormValues) {
  return request('/profile', {
    method: 'PATCH',
    body: values,
    schema: profileSchema,
  })
}