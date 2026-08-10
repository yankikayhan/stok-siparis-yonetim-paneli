import { infiniteQueryOptions, queryOptions, type InfiniteData } from '@tanstack/react-query'
import { z } from 'zod'
import { request, requestPage, type Page } from '../../../shared/api/http-client'
import { isoDateTimeSchema } from '../../../shared/api/iso-date'
import type { Product } from '../../products/api/products-api'

// API response schemas
// NOT: Bu liste orderSchema'daki z.literal'lerle ayni kalmali; birini degistirirken digerini guncelle.
const orderStatusSchema = z.enum(['pending', 'paid', 'shipped', 'cancelled'])

const orderBaseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  total: z.number().nonnegative(),
  createdAt: isoDateTimeSchema,
  items: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      quantity: z.number().int().positive(),
      unitPrice: z.number().nonnegative(),
      lineTotal: z.number().nonnegative(),
    }),
  ),
})

// Durum bazli alanlar: shipped -> trackingNumber, cancelled -> cancelReason.
export const orderSchema = z.discriminatedUnion('status', [
  orderBaseSchema.extend({ status: z.literal('pending') }),
  orderBaseSchema.extend({ status: z.literal('paid') }),
  orderBaseSchema.extend({ status: z.literal('shipped'), trackingNumber: z.string() }),
  orderBaseSchema.extend({ status: z.literal('cancelled'), cancelReason: z.string() }),
])

// customers-api.ts da bu semayi kullanir (musteri siparis gecmisi ayni kaynak/sekil).
export const ordersSchema = z.array(orderSchema)
const orderStatusUpdateSchema = z.object({ status: orderStatusSchema })

export type Order = z.output<typeof orderSchema>
// Tek kaynak: union'in discriminant'indan turer, enum'la ayrisirsa derleme hatasi cikar.
export type OrderStatus = Order['status']
// 'all' filtre yok anlamina gelir ve query string'e yazilmaz.
export type OrderStatusFilter = 'all' | OrderStatus

// Form validation schemas
const orderItemFormSchema = z.object({
  productId: z.string().min(1, 'Urun secin.'),
  quantity: z.coerce.number().int().positive('Miktar en az 1 olmali.'),
})

export const orderFormSchema = z.object({
  customerId: z.string().min(1, 'Musteri secin.'),
  items: z.array(orderItemFormSchema).min(1, 'En az bir siparis kalemi ekleyin.'),
})

export type OrderFormInput = z.input<typeof orderFormSchema>
export type OrderFormValues = z.output<typeof orderFormSchema>

// TanStack Query cache keys
export const orderQueryKeys = {
  all: ['orders'] as const,
  list: () => [...orderQueryKeys.all, 'list'] as const,
  // Invalidation prefix'i: infinites() tum durum filtresi girdilerini kapsar.
  infinites: () => [...orderQueryKeys.all, 'infinite'] as const,
  infinite: (status: OrderStatusFilter) => [...orderQueryKeys.infinites(), status] as const,
}

// useMutationState filtreleri bu key ile eslesir; string literal tuketicilere dagitilmaz.
export const orderMutationKeys = {
  create: ['orders', 'create'] as const,
}

// API operations
export function getOrders() {
  return request('/orders', { schema: ordersSchema })
}

export function ordersOptions() {
  return queryOptions({
    queryKey: orderQueryKeys.list(),
    queryFn: getOrders,
  })
}

export const ORDERS_PAGE_SIZE = 10

export function getOrdersPage({ status, page }: { status: OrderStatusFilter; page: number }) {
  const searchParams = new URLSearchParams({
    // Varsayilan siralama ekleme sirasiydi; yeni siparis ustte gorunsun diye tarihe cevrildi.
    _sort: 'createdAt',
    _order: 'desc',
    _page: String(page),
    _limit: String(ORDERS_PAGE_SIZE),
  })

  if (status !== 'all') searchParams.set('status', status)

  return requestPage(`/orders?${searchParams.toString()}`, { itemSchema: orderSchema })
}

export function ordersInfiniteOptions(status: OrderStatusFilter) {
  return infiniteQueryOptions({
    queryKey: orderQueryKeys.infinite(status),
    queryFn: ({ pageParam }) => getOrdersPage({ status, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const loadedCount = allPages.reduce((total, page) => total + page.items.length, 0)
      // Sunucunun bildirdigi toplama ulasildiysa siradaki sayfa yoktur.
      return loadedCount < lastPage.totalCount ? lastPageParam + 1 : undefined
    },
  })
}

export function updateOrderStatus({ id, status }: { id: string; status: OrderStatus }) {
  return request(`/orders/${id}`, {
    method: 'PATCH',
    body: { status },
    schema: orderSchema,
  })
}

// Optimistic update icin gecerli bir union uyesi kurar; gercek degerler onSettled refetch'iyle gelir.
export function applyStatus(order: Order, status: OrderStatus): Order {
  const base = {
    id: order.id,
    customerId: order.customerId,
    total: order.total,
    createdAt: order.createdAt,
    items: order.items,
  }

  switch (status) {
    case 'pending':
    case 'paid':
      return { ...base, status }
    case 'shipped':
      return { ...base, status, trackingNumber: order.status === 'shipped' ? order.trackingNumber : 'Ataniyor...' }
    case 'cancelled':
      return { ...base, status, cancelReason: order.status === 'cancelled' ? order.cancelReason : 'Belirtilmedi' }
  }
}

// 'orders' prefix'i altinda iki farkli sekil yasar: list() -> Order[], infinite girdileri ->
// InfiniteData<Page<Order>>; updater sekle gore dallanir (products'taki pattern'in muadili).
export type OrdersCache = Order[] | InfiniteData<Page<Order>>

export function applyStatusToCache(data: OrdersCache, id: string, status: OrderStatus): OrdersCache {
  if (Array.isArray(data)) {
    return data.map((order) => (order.id === id ? applyStatus(order, status) : order))
  }

  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.map((order) => (order.id === id ? applyStatus(order, status) : order)),
    })),
  }
}

export const orderStatuses = orderStatusUpdateSchema.shape.status.options

// satisfies: Record<OrderStatus, string> ile uyumu kontrol eder ama literal key tiplerini
// GENISLETMEZ; OrderStatus'a yeni deger eklenirse veya bir key yanlis/eksik yazilirsa derleme hatasi verir.
export const orderStatusLabels = {
  pending: 'Beklemede',
  paid: 'Odendi',
  shipped: 'Kargoda',
  cancelled: 'Iptal',
} satisfies Record<OrderStatus, string>

// Stock-aware order form validation
export function createOrderFormSchema(products: Product[]) {
  const productsById = new Map(products.map((product) => [product.id, product]))

  return orderFormSchema.superRefine((values, context) => {
    const requestedQuantities = new Map<string, number>()

    values.items.forEach((item, index) => {
      const product = productsById.get(item.productId)

      if (!product) {
        context.addIssue({ code: 'custom', message: 'Urun bulunamadi.', path: ['items', index, 'productId'] })
        return
      }

      // UI zaten pasif urunleri secim listesinden gizler; bu ikinci katman, taslaktan geri
      // yuklenen eski bir siparis satirinin arka planda pasiflesmis bir urune isaret etmesi gibi
      // kenar durumlar icin savunma hattidir (sunucunun ayni kural icin 404 dondurdugu politikayla ayni).
      if (!product.active) {
        context.addIssue({
          code: 'custom',
          message: `${product.name} pasif, siparis verilemez.`,
          path: ['items', index, 'productId'],
        })
        return
      }

      requestedQuantities.set(item.productId, (requestedQuantities.get(item.productId) ?? 0) + item.quantity)
    })

    values.items.forEach((item, index) => {
      const product = productsById.get(item.productId)
      const requestedQuantity = requestedQuantities.get(item.productId)

      if (product && requestedQuantity !== undefined && requestedQuantity > product.stock) {
        context.addIssue({
          code: 'custom',
          message: `${product.name} icin en fazla ${product.stock} adet siparis verilebilir.`,
          path: ['items', index, 'quantity'],
        })
      }
    })
  })
}

export function createOrder(values: OrderFormValues) {
  return request('/orders', {
    method: 'POST',
    body: values,
    schema: orderSchema,
  })
}