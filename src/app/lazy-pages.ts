import { lazy } from 'react'

// Ayri dosya, react-refresh kuralinin sarti: bir modul ya YALNIZ bilesen export eder ya hic etmez.
// router.tsx `router` nesnesini export ettigi icin lazy bilesenler orada duramaz.
// lazy() default export ister; sayfalar named export oldugu icin kopru .then icinde kurulur
// (sayfa dosyalarina export default eklemek, kod tabaninin named-export konvansiyonunu bozardi).
export const ProductsPage = lazy(() =>
  import('../features/products/pages/products-page').then((module) => ({ default: module.ProductsPage })),
)

export const CustomersPage = lazy(() =>
  import('../features/customers/pages/customers-page').then((module) => ({ default: module.CustomersPage })),
)

export const OrdersPage = lazy(() =>
  import('../features/orders/pages/orders-page').then((module) => ({ default: module.OrdersPage })),
)

export const SettingsPage = lazy(() =>
  import('../features/settings/pages/settings-page').then((module) => ({ default: module.SettingsPage })),
)
