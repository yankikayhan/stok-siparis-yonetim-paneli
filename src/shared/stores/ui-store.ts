import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'

type Theme = 'light' | 'dark'
type TableDensity = 'compact' | 'comfortable'

type UiState = {
  theme: Theme
  isSidebarOpen: boolean
  tableDensity: TableDensity
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setTableDensity: (density: TableDensity) => void
}

export const useUiStore = create<UiState>()(
  devtools(
    // subscribeWithSelector persist'in DISINDA: persist yalniz set'i sarar; bu middleware
    // api.subscribe'i selector'lu hale getirir (theme-sync.ts'in baglandigi kanal).
    persist(
      subscribeWithSelector((set) => ({
        theme: 'light',
        isSidebarOpen: true,
        tableDensity: 'comfortable',
        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }), false, 'toggleSidebar'),
        setTableDensity: (tableDensity) => set({ tableDensity }, false, 'setTableDensity'),
      })),
      {
        name: 'stok-siparis-yonetim-paneli-preferences',
        partialize: (state) => ({
          theme: state.theme,
          isSidebarOpen: state.isSidebarOpen,
          tableDensity: state.tableDensity,
        }),
      },
    ),
    { name: 'ui-store', enabled: import.meta.env.DEV },
  ),
)