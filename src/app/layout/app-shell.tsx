import { QueryErrorResetBoundary, useMutationState, useQueryClient } from '@tanstack/react-query'
import { ChartNoAxesCombined, LoaderCircle, Menu, Package, Settings, ShoppingCart, UsersRound } from 'lucide-react'
import { Suspense } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { orderMutationKeys } from '../../features/orders/api/orders-api'
import {
  categoriesOptions,
  DEFAULT_PRODUCT_LIST_PARAMS,
  productListOptions,
} from '../../features/products/api/products-api'
import { isApiError } from '../../shared/api/api-error'
import { ErrorState } from '../../shared/components/error-state'
import { Toaster } from '../../shared/components/toaster'
import { useUiStore } from '../../shared/stores/ui-store'
import { type RoutePath } from '../routes'

const navigationItems: Array<{ to: RoutePath; label: string; icon: typeof Package }> = [
  { to: '/', label: 'Genel Bakis', icon: ChartNoAxesCombined },
  { to: '/urunler', label: 'Urunler', icon: Package },
  { to: '/musteriler', label: 'Musteriler', icon: UsersRound },
  { to: '/siparisler', label: 'Siparisler', icon: ShoppingCart },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings },
]

export function AppShell() {
  const queryClient = useQueryClient()
  const { pathname } = useLocation()
  const { theme, isSidebarOpen, toggleSidebar } = useUiStore(
    useShallow((state) => ({
      theme: state.theme,
      isSidebarOpen: state.isSidebarOpen,
      toggleSidebar: state.toggleSidebar,
    })),
  )

  // prefetchQuery staleTime'a saygilidir: cache'te taze veri varken tekrarlanan hover istek atmaz.
  const prefetchProductsPage = () => {
    void queryClient.prefetchQuery(productListOptions(DEFAULT_PRODUCT_LIST_PARAMS))
    void queryClient.prefetchQuery(categoriesOptions())
  }

  // Dialog'un disindan, mutation cache'i uzerinden izleme: dialog kapansa bile gosterge dogru kalir.
  const pendingOrderCreations = useMutationState({
    filters: { mutationKey: orderMutationKeys.create, status: 'pending' },
  })
  const isCreatingOrder = pendingOrderCreations.length > 0

  return (
    <div data-theme={theme} className={theme === 'dark' ? 'flex min-h-screen flex-col bg-slate-950 text-slate-50' : 'flex min-h-screen flex-col bg-slate-50 text-slate-950'}>
      <header className={theme === 'dark' ? 'flex h-16 shrink-0 items-center border-b border-slate-700 bg-slate-900 px-4 sm:px-6' : 'flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-4 sm:px-6'}>
        <button
          type="button"
          onClick={toggleSidebar}
          className={theme === 'dark' ? 'grid size-9 place-items-center rounded-md text-slate-300 hover:bg-slate-800 hover:text-white' : 'grid size-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-950'}
          aria-label="Gezinme menusunu ac veya kapat"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <p className={theme === 'dark' ? 'ml-3 text-sm font-semibold tracking-wide text-white' : 'ml-3 text-sm font-semibold tracking-wide text-slate-900'}>Noktasi Isletme</p>
        {isCreatingOrder && (
          <span role="status" className={theme === 'dark' ? 'ml-auto flex items-center gap-2 text-sm text-slate-300' : 'ml-auto flex items-center gap-2 text-sm text-slate-600'}>
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Siparis kaydediliyor...
          </span>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-screen-2xl flex-1">
        <aside
          className={`shrink-0 overflow-hidden transition-[width] duration-200 ${theme === 'dark' ? 'border-r border-slate-700 bg-slate-900' : 'border-r border-slate-200 bg-white'} ${
            isSidebarOpen ? 'w-60' : 'w-0 border-r-0'
          }`}
        >
          <nav className="w-60 p-3" aria-label="Ana gezinme">
            {navigationItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onMouseEnter={to === '/urunler' ? prefetchProductsPage : undefined}
                onFocus={to === '/urunler' ? prefetchProductsPage : undefined}
                className={({ isActive }) =>
                  `mb-1 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-800'
                      : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                  }`
                }
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {/* Boundary yalnizca sayfa icerigini sarar: header, sidebar ve Toaster disarida
              kalir, boylece hata ekranindayken gezinme ve toast'lar calismaya devam eder. */}
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary onReset={reset} resetKeys={[pathname]} FallbackComponent={RouteErrorFallback}>
                {/* Suspense boundary'nin ICINDE: chunk indirme hatasi da veri hatasi da ayni
                    ekrana duser. Kurtarilabilirlikleri farklidir — veri hatasinda "Tekrar dene"
                    gercekten yeniden dener, basarisiz chunk'i React kaliciya yazar (tek cikis: yenileme). */}
                <Suspense fallback={<RouteChunkFallback />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </main>
      </div>
      <Toaster />
    </div>
  )
}

// Bilincli olarak iskelet DEGIL: sayfalarin kendi veri iskeletleriyle karismasin, boylece
// "chunk iniyor" ile "veri geliyor" ekranda ayirt edilebilsin.
function RouteChunkFallback() {
  return (
    <p role="status" className="text-sm text-slate-600">
      Sayfa yukleniyor...
    </p>
  )
}

// Export edilmez: AppShell disinda tuketicisi yok.
function RouteErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorState
      title="Sayfa yuklenemedi"
      message={isApiError(error) ? error.message : 'Beklenmeyen bir hata olustu.'}
      onRetry={resetErrorBoundary}
    />
  )
}