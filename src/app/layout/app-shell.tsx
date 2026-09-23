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
  // Tema artik bu bilesende okunmaz: <html class="dark"> + dark: varyantlari
  // (index.css @custom-variant) esitlemeyi CSS'e tasidi; tema degisiminde bu agac
  // yeniden render OLMAZ. data-theme attribute'u da kalkti.
  const { isSidebarOpen, toggleSidebar } = useUiStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen,
      toggleSidebar: state.toggleSidebar,
    })),
  )

  // prefetchQuery staleTime'a saygilidir: cache'te taze veri varken tekrarlanan hover istek atmaz.
  const prefetchProductsPage = () => {
    void queryClient.prefetchQuery(productListOptions(DEFAULT_PRODUCT_LIST_PARAMS))
    void queryClient.prefetchQuery(categoriesOptions())
  }

  // B4 (Adim 8 / IB2): hover'da chunk prefetch — veri prefetch'inin dogal esi (bekleyenler B4).
  // import() fire-and-forget: sonuc kullanilmaz, yalnizca tarayicinin chunk'i onceden indirmesi
  // saglanir. Hata sessizdir (prefetch hatasi kullaniciyi etkilemez; gercek yukleme tiklamada
  // baslar ve o zaman ErrorBoundary'ye duser). Ust uste hover'da tarayici HTTP cache'i ayni
  // chunk icin ikinci istek atmaz (KAYNAK: MDN HTTP caching; bu projede OLCULMEDI — S7'de
  // Network panelinde dogrulanir).
  const prefetchPageChunk = (to: RoutePath) => {
    if (to === '/urunler') void import('../../features/products/pages/products-page')
    if (to === '/musteriler') void import('../../features/customers/pages/customers-page')
    if (to === '/siparisler') void import('../../features/orders/pages/orders-page')
    if (to === '/ayarlar') void import('../../features/settings/pages/settings-page')
  }

  // Dialog'un disindan, mutation cache'i uzerinden izleme: dialog kapansa bile gosterge dogru kalir.
  const pendingOrderCreations = useMutationState({
    filters: { mutationKey: orderMutationKeys.create, status: 'pending' },
  })
  const isCreatingOrder = pendingOrderCreations.length > 0

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-4 sm:px-6 dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={toggleSidebar}
          className="grid size-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-brand-200"
          aria-label="Gezinme menusunu ac veya kapat"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <p className="ml-3 text-sm font-semibold tracking-wide text-slate-900 dark:text-white">Noktasi Isletme</p>
        {isCreatingOrder && (
          <span role="status" className="ml-auto flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            Siparis kaydediliyor...
          </span>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-screen-2xl flex-1">
        <aside
          className={`shrink-0 overflow-hidden transition-[width] duration-200 border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${
            isSidebarOpen ? 'w-60' : 'w-0 border-r-0'
          }`}
        >
          <nav className="w-60 p-3" aria-label="Ana gezinme">
            {navigationItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onMouseEnter={() => {
                  if (to === '/urunler') prefetchProductsPage()
                  prefetchPageChunk(to)
                }}
                onFocus={() => {
                  if (to === '/urunler') prefetchProductsPage()
                  prefetchPageChunk(to)
                }}
                // Aktif boyama aria-current uzerinden (T6): NavLink aktifken aria-current="page" yazar
                // (KAYNAK: chunk-KS7C4IRE.mjs:10616); className fonksiyonu boylece sabit string'e iner.
                // not-aria-[...]:hover dislayiciligi eski ternary'nin davranisini korur; aktifte hover
                // icin acik aktif-hover zinciri gerekir (denetim v1/I1): hover +1 ozgulluk kazandigi
                // icin inaktif hover kurallari (media hover:hover) aktif duz kurallari ezerdi.
                className="mb-1 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-950 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-800 aria-[current=page]:hover:bg-brand-50 aria-[current=page]:hover:text-brand-800 not-aria-[current=page]:hover:bg-slate-100 not-aria-[current=page]:hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:aria-[current=page]:bg-brand-900 dark:aria-[current=page]:text-brand-100 dark:aria-[current=page]:hover:bg-brand-900 dark:aria-[current=page]:hover:text-brand-100 dark:not-aria-[current=page]:hover:bg-slate-800 dark:not-aria-[current=page]:hover:text-white"
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
    <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
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