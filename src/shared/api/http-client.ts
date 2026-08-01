import { type z } from 'zod'
import { environment } from '../../app/config/env'
import { ApiError } from './api-error'

type RequestOptions<TSchema extends z.ZodType> = Omit<RequestInit, 'body'> & {
  body?: unknown
  schema: TSchema
}

/*
type RequestOptions<TSchema extends z.ZodType> = {
  method?: string
  headers?: HeadersInit
  signal?: AbortSignal | null
  credentials?: RequestCredentials
  cache?: RequestCache
  mode?: RequestMode
  redirect?: RequestRedirect
  referrer?: string
  referrerPolicy?: ReferrerPolicy
  integrity?: string
  keepalive?: boolean

  // RequestInit içindeki body çıkarıldı.
  // Onun yerine bizim body alanımız eklendi.
  body?: unknown

  // Bu alan zorunlu.
  // Hangi Zod şeması olacağı çağrı anında belirlenir.
  schema: TSchema
}
*/

export async function request<TSchema extends z.ZodType>(
  path: string,
  { body, headers, schema, ...options }: RequestOptions<TSchema>,
): Promise<z.output<TSchema>> {
  let response: Response

  try {
    response = await fetch(`${environment.VITE_API_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    throw new ApiError('Sunucuya baglanilamadi. Baglantinizi kontrol edip tekrar deneyin.', undefined, cause)
  }

  if (!response.ok) {
    throw new ApiError(`Istek basarisiz oldu (${response.status}).`, response.status)
  }

  const responseBody = await response.text()
  let payload: unknown

  try {
    payload = responseBody.length === 0 ? undefined : JSON.parse(responseBody)
  } catch (cause) {
    throw new ApiError('Sunucudan gecersiz JSON alindi.', response.status, cause)
  }

  const result = schema.safeParse(payload)

  if (!result.success) {
    throw new ApiError('Sunucudan beklenmeyen bir veri formati alindi.', response.status, result.error)
  }

  return result.data
}