import { useQueryClient } from '@tanstack/react-query'
import { ChartNoAxesCombined, Menu, Package, Settings, ShoppingCart, UsersRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import {
  categoriesOptions,
  DEFAULT_PRODUCT_LIST_PARAMS,
  productListOptions,
} from '../../features/products/api/products-api'
import { Toaster } from '../../shared/components/toaster'
import { useUiStore } from '../../shared/stores/ui-store'

const navigationItems = [
  { to: '/', label: 'Genel Bakis', icon: ChartNoAxesCombined },
  { to: '/urunler', label: 'Urunler', icon: Package },
  { to: '/musteriler', label: 'Musteriler', icon: UsersRound },
  { to: '/siparisler', label: 'Siparisler', icon: ShoppingCart },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings },
]

export function AppShell() {
  const queryClient = useQueryClient()
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
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}