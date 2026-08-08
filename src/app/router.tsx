import type { ReactElement } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { CustomersPage } from '../features/customers/pages/customers-page'
import { DashboardPage } from '../features/dashboard/pages/dashboard-page'
import { OrdersPage } from '../features/orders/pages/orders-page'
import { ProductsPage } from '../features/products/pages/products-page'
import { SettingsPage } from '../features/settings/pages/settings-page'
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