import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { StateCreator } from 'zustand'

type Theme = 'light' | 'dark'
type TableDensity = 'compact' | 'comfortable' | 'spacious'

type UiState = {
  theme: Theme
  isSidebarOpen: boolean
  tableDensity: TableDensity
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setTableDensity: (density: TableDensity) => void
}

// Persist'in localStorage'a yazdigi govdenin (state alaninin) sekli — migrate girdisi.
// Varsayilan sig merge ile action'lar hic yazilmadigi icin yalniz uc tercih alani tasinir.
type UiPersistedState = Pick<UiState, 'theme' | 'isSidebarOpen' | 'tableDensity'>

// v0 -> v1: 'comfortable' tercihi ucuncu deger 'spacious'a MAP edilir; 'compact' aynen kalir.
// Ayri export edilir ki birim test (ui-store.test.ts) store kurmadan dogrudan cagirabilsin.
// SYNC tutulur: async migrate hydration'i Promise zincirine kaydirir ve theme-sync'in
// fireImmediately'sinin varsayilanla calisip sonra tekrar cizilmesine (cift boyama) yol acar.
export function migrateUiPersistedState(persisted: unknown, fromVersion: number): UiPersistedState {
  // fromVersion su an tek kaynak (0) oldugu icin dallanmaz; gelecek surumlerde switch'e donusur.
  void fromVersion
  const state = (persisted ?? {}) as Partial<UiPersistedState>

  return {
    theme: state.theme ?? 'light',
    isSidebarOpen: state.isSidebarOpen ?? true,
    tableDensity: state.tableDensity === 'comfortable' ? 'spacious' : (state.tableDensity ?? 'comfortable'),
  }
}

// Slice'a ayrilan store'un StateCreator imzasi middleware listesini TASIMALI; yoksa
// create()(devtools(persist(subscribeWithSelector(...)))) cagrisi tip hatasi uretir.
type UiSliceCreator<T> = StateCreator<
  UiState,
  [['zustand/subscribeWithSelector', never], ['zustand/persist', unknown], ['zustand/devtools', never]],
  [],
  T
>

// Eksen bazli bolum (g8): theme-sync yalniz theme, app-shell yalniz sidebar, product-table
// yalniz tableDensity okur. Varsayilanlar her slice'in kendi creator'inda yasar.
const createThemeSlice: UiSliceCreator<Pick<UiState, 'theme' | 'setTheme'>> = (set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }, false, 'setTheme'),
})

const createSidebarSlice: UiSliceCreator<Pick<UiState, 'isSidebarOpen' | 'toggleSidebar'>> = (set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }), false, 'toggleSidebar'),
})

const createTableDensitySlice: UiSliceCreator<Pick<UiState, 'tableDensity' | 'setTableDensity'>> = (set) => ({
  tableDensity: 'comfortable',
  setTableDensity: (tableDensity) => set({ tableDensity }, false, 'setTableDensity'),
})

export const useUiStore = create<UiState>()(
  devtools(
    // subscribeWithSelector persist'in ICINDE: subscribeWithSelector creator'i sarar, persist
    // onun disinda set'i sarar ve yazimi ustenir; subscribeWithSelector api.subscribe'i
    // selector'lu hale getirir (theme-sync.ts'in baglandigi kanal).
    persist(
      subscribeWithSelector((...args) => ({
        ...createThemeSlice(...args),
        ...createSidebarSlice(...args),
        ...createTableDensitySlice(...args),
      })),
      {
        name: 'stok-siparis-yonetim-paneli-preferences',
        // version 0 -> 1: mevcut zarf'lara migrateUiPersistedState uygulanir; name ve
        // partialize DEGISMEZ (K4: anahtar senkronu index.html/README ile bozulmaz).
        version: 1,
        migrate: migrateUiPersistedState,
        // Hydration BITTIGINDE (storage okunduktan sonraki callback) yalniz DEV'de loglanir;
        // uretim bundle'inda ifade agacindan duser.
        onRehydrateStorage: () => (state) => {
          if (import.meta.env.DEV) console.info('[ui-store] rehydrated', state)
        },
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