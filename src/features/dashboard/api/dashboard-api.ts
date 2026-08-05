import type { Order } from '../../orders/api/orders-api'
import type { Product } from '../../products/api/products-api'

// Dashboard kendi endpoint'ini tutmaz: paylasilan urun/siparis cache'lerinden select ile turetir.
// Modul seviyesinde tanim, select referansini stabil tutar (memoization + structural sharing).
export function selectProductStats(products: Product[]) {
  return {
    totalProducts: products.length,
    lowStockProducts: products.filter((product) => product.stock <= product.reorderLevel),
  }
}

export function selectOrderStats(orders: Order[]) {
  return {
    openOrders: orders.filter((order) => order.status === 'pending' || order.status === 'paid').length,
    totalRevenue: orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((total, order) => total + order.total, 0),
  }
}