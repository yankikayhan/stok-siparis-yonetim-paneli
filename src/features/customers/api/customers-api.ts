import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { request } from '../../../shared/api/http-client'
import { isoDateTimeSchema } from '../../../shared/api/iso-date'
import { orderSchema, type Order } from '../../orders/api/orders-api'

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  phone: z.string(),
  company: z.string(),
  createdAt: isoDateTimeSchema,
})

const customersSchema = z.array(customerSchema)
const ordersSchema = z.array(orderSchema)

export type Customer = z.output<typeof customerSchema>
export type CustomerOrder = Order

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

export function customersOptions() {
  return queryOptions({
    queryKey: customerQueryKeys.list(),
    queryFn: getCustomers,
  })
}

export function customerOrdersOptions(customerId: string) {
  return queryOptions({
    queryKey: customerQueryKeys.orders(customerId),
    queryFn: () => getCustomerOrders(customerId),
  })
}