import { z } from 'zod'
import { request } from '../../../shared/api/http-client'

const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  phone: z.string(),
  company: z.string(),
  createdAt: z.iso.datetime(),
})

const orderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled']),
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

const customersSchema = z.array(customerSchema)
const ordersSchema = z.array(orderSchema)

export type Customer = z.output<typeof customerSchema>
export type CustomerOrder = z.output<typeof orderSchema>

export const customerQueryKeys = {
  all: ['customers'] as const,
  list: () => [...customerQueryKeys.all, 'list'] as const,
  orders: (customerId: string) => [...customerQueryKeys.all, 'orders', customerId] as const,
}

export function getCustomers() {
  return request('/customers', { schema: customersSchema })
}

export function getCustomerOrders(customerId: string) {
  const searchParams = new URLSearchParams({ customerId })
  return request(`/orders?${searchParams.toString()}`, { schema: ordersSchema })
}