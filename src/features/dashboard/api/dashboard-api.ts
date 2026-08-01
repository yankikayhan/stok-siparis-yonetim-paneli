import { z } from 'zod'
import { request } from '../../../shared/api/http-client'

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  categoryId: z.string(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
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

const productsSchema = z.array(productSchema)
const ordersSchema = z.array(orderSchema)

export type DashboardSummary = {
  totalProducts: number
  lowStockProducts: Array<z.output<typeof productSchema>>
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