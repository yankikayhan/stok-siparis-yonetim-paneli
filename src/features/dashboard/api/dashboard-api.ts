import type { Order } from '../../orders/api/orders-api'

// Dashboard kendi endpoint'ini tutmaz: siparis cache'inden select ile turetir.
// Modul seviyesinde tanim, select referansini stabil tutar (memoization + structural sharing).
// Urun tarafinda (toplam sayim + dusuk stok) artik ayri secici gerekmiyor: sunucu active=true
// ile onceden filtrelenmis sayim/liste dondurur (bkz. products-api.ts, P1).
export function selectOrderStats(orders: Order[]) {
  return {
    openOrders: orders.filter((order) => order.status === 'pending' || order.status === 'paid').length,
    totalRevenue: orders
      .filter((order) => order.status !== 'cancelled')
      .reduce((total, order) => total + order.total, 0),
  }
}