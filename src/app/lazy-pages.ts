import { lazy } from 'react'
import { retryableImport } from '../shared/lib/retryable-import'

// Ayri dosya, react-refresh kuralinin sarti: bir modul ya YALNIZ bilesen export eder ya hic etmez.
// router.tsx `router` nesnesini export ettigi icin lazy bilesenler orada duramaz.
// lazy() default export ister; sayfalar named export oldugu icin kopru .then icinde kurulur
// (sayfa dosyalarina export default eklemek, kod tabaninin named-export konvansiyonunu bozardi).
// B2 (Adim 8 / IB2): tum kopruler retryableImport'tan gecer — chunk hatasi kalici olmaktan cikar.
// Ikinci arguman (mapModule) named->default koprusudur; retry yolunda (?retry=1) ham modul
// named export tasir, React.lazy default ister (React #306 onlemi).
export const ProductsPage = lazy(
  retryableImport(
    () => import('../features/products/pages/products-page'),
    (module) => ({ default: module.ProductsPage as typeof import('../features/products/pages/products-page').ProductsPage }),
  ),
)

export const CustomersPage = lazy(
  retryableImport(
    () => import('../features/customers/pages/customers-page'),
    (module) => ({ default: module.CustomersPage as typeof import('../features/customers/pages/customers-page').CustomersPage }),
  ),
)

export const OrdersPage = lazy(
  retryableImport(
    () => import('../features/orders/pages/orders-page'),
    (module) => ({ default: module.OrdersPage as typeof import('../features/orders/pages/orders-page').OrdersPage }),
  ),
)

export const SettingsPage = lazy(
  retryableImport(
    () => import('../features/settings/pages/settings-page'),
    (module) => ({ default: module.SettingsPage as typeof import('../features/settings/pages/settings-page').SettingsPage }),
  ),
)
