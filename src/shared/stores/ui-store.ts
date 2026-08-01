import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  persist(
    (set) => ({
      theme: 'light',
      isSidebarOpen: true,
      tableDensity: 'comfortable',
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setTableDensity: (tableDensity) => set({ tableDensity }),
    }),
    {
      name: 'stok-siparis-yonetim-paneli-preferences',
      partialize: (state) => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
        tableDensity: state.tableDensity,
      }),
    },
  ),
)