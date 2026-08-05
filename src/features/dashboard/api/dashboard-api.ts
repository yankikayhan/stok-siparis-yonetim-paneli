import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'
import { request } from '../../../shared/api/http-client'
import { orderSchema } from '../../orders/api/orders-api'
import { productSchema, type Product } from '../../products/api/products-api'

const productsSchema = z.array(productSchema)
const ordersSchema = z.array(orderSchema)

export type DashboardSummary = {
  totalProducts: number
  lowStockProducts: Product[]
  openOrders: number
  totalRevenue: number
}

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardQueryKeys.all, 'summary'] as const,
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [products, orders] = await Promise.all([
    request('/products', { schema: productsSchema }),
    request('/orders', { schema: ordersSchema }),
  ])

  return {
    totalProducts: products.length,
    lowStockProducts: products.filter((product) => product.stock <= product.reorderLevel),
    openOrders: orders.filter((order) => order.status === 'pending' || order.status === 'paid').length,
    totalRevenue: orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((total, order) => total + order.total, 0),
  }
}

export function dashboardSummaryOptions() {
  return queryOptions({
    queryKey: dashboardQueryKeys.summary(),
    queryFn: getDashboardSummary,
  })
}