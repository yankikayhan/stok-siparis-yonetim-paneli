import type { ReactElement } from 'react'
import { createBrowserRouter } from 'react-router-dom'
// Index route bilincli olarak ana pakette: acilis rotasi zaten aninda gerekir, kod bolme
// onu ana paketten cikarip ilk boyamaya bir istek turu daha ekler — kazanc sifir, maliyet gercek.
import { DashboardPage } from '../features/dashboard/pages/dashboard-page'
import { CustomersPage, OrdersPage, ProductsPage, SettingsPage } from './lazy-pages'
import { AppShell } from './layout/app-shell'
import { ROUTE_SEGMENTS, type RouteSegment } from './routes'

// Record<RouteSegment, ...>: eksik segment de fazla segment de derleme hatasidir.
const routeElements: Record<RouteSegment, ReactElement> = {
  urunler: <ProductsPage />,
  musteriler: <CustomersPage />,
  siparisler: <OrdersPage />,
  ayarlar: <SettingsPage />,
}

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      ...ROUTE_SEGMENTS.map((segment) => ({ path: segment, element: routeElements[segment] })),
    ],
  },
])