import { z } from 'zod'
import { environment } from '../../app/config/env'
import { ApiError } from './api-error'
import { formatZodError } from '../lib/format-zod-error'

const errorBodySchema = z.object({ message: z.string() })

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
  options: RequestOptions<TSchema>,
): Promise<z.output<TSchema>> {
  const { data } = await execute(path, options)
  return data
}

export type Page<TItem> = {
  items: TItem[]
  totalCount: number
}

// Liste yanitlari icin: govdeye ek olarak X-Total-Count header'ini okur.
// `itemSchema` tek elemanin semasidir; diziye sarma burada yapilir.
export async function requestPage<TItemSchema extends z.ZodType>(
  path: string,
  { itemSchema, ...options }: Omit<RequestOptions<z.ZodType>, 'schema'> & { itemSchema: TItemSchema },
): Promise<Page<z.output<TItemSchema>>> {
  const { data, response } = await execute(path, { ...options, schema: z.array(itemSchema) })

  const headerValue = response.headers.get('X-Total-Count')

  if (headerValue === null) {
    // Number(null) sessizce 0 olurdu; eksik header'i hata olarak yuzeye cikar.
    throw new ApiError('Sunucu toplam kayit sayisini dondurmedi.', response.status)
  }

  const totalCount = Number(headerValue)

  if (!Number.isInteger(totalCount) || totalCount < 0) {
    throw new ApiError('Sunucudan gecersiz toplam kayit sayisi alindi.', response.status)
  }

  return { items: data, totalCount }
}

async function execute<TSchema extends z.ZodType>(
  path: string,
  { body, headers, schema, ...options }: RequestOptions<TSchema>,
): Promise<{ data: z.output<TSchema>; response: Response }> {
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
    let message = `Istek basarisiz oldu (${response.status}).`

    try {
      const errorPayload: unknown = JSON.parse(await response.text())
      const result = errorBodySchema.safeParse(errorPayload)
      if (result.success) message = result.data.message
    } catch {
      // Govde JSON degilse genel mesaj kullanilir.
    }

    throw new ApiError(message, response.status)
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
    // Kullaniciya sabit mesaj gider; alan bazli detay yalnizca gelistirme ortaminda loglanir.
    if (import.meta.env.DEV) {
      console.error(`Sema hatasi (${path}):\n${formatZodError(result.error)}`)
    }

    throw new ApiError('Sunucudan beklenmeyen bir veri formati alindi.', response.status, result.error)
  }

  return { data: result.data, response }
}