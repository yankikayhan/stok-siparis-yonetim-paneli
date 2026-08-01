import { z } from 'zod'
import { request } from '../../../shared/api/http-client'
import type { Product } from '../../products/api/products-api'

// API response schemas
const orderStatusSchema = z.enum(['pending', 'paid', 'shipped', 'cancelled'])

const orderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  status: orderStatusSchema,
  total: z.number().nonnegative(),
  createdAt: z.iso.datetime(),
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

const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const ordersSchema = z.array(orderSchema)
const orderStatusUpdateSchema = z.object({ status: orderStatusSchema })
const customerNamesSchema = z.array(customerSchema)

export type Order = z.output<typeof orderSchema>
export type OrderStatus = z.output<typeof orderStatusSchema>

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
  customerNames: () => [...orderQueryKeys.all, 'customer-names'] as const,
}

// API operations
export function getOrders() {
  return request('/orders', { schema: ordersSchema })
}

export function getCustomerNames() {
  return request('/customers', { schema: customerNamesSchema })
}

export function updateOrderStatus({ id, status }: { id: string; status: OrderStatus }) {
  return request(`/orders/${id}`, {
    method: 'PATCH',
    body: { status },
    schema: orderSchema,
  })
}

export const orderStatuses = orderStatusUpdateSchema.shape.status.options

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