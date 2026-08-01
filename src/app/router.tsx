import { createBrowserRouter } from 'react-router-dom'
import { CustomersPage } from '../features/customers/pages/customers-page'
import { DashboardPage } from '../features/dashboard/pages/dashboard-page'
import { OrdersPage } from '../features/orders/pages/orders-page'
import { ProductsPage } from '../features/products/pages/products-page'
import { SettingsPage } from '../features/settings/pages/settings-page'
import { AppShell } from './layout/app-shell'

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'urunler', element: <ProductsPage /> },
      { path: 'musteriler', element: <CustomersPage /> },
      { path: 'siparisler', element: <OrdersPage /> },
      { path: 'ayarlar', element: <SettingsPage /> },
    ],
  },
])