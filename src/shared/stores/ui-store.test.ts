import { beforeEach, describe, expect, it } from 'vitest'
import { migrateUiPersistedState, useUiStore } from './ui-store'

// Persist, Vitest'in node ortaminda window.localStorage'a erisemedigi icin console.warn + no-op
// dalda calisir (middleware.mjs:343-357); test store'u yalniz bellekteki state'i ve saf migrate
// fonksiyonunu sinar — storage davranisi burada assert edilmez.
describe('useUiStore actionlari', () => {
  beforeEach(() => {
    useUiStore.setState({ theme: 'light', isSidebarOpen: true, tableDensity: 'comfortable' })
  })

  it('setTheme temayi gunceller', () => {
    useUiStore.getState().setTheme('dark')

    expect(useUiStore.getState().theme).toBe('dark')
  })

  it('toggleSidebar acikligi tersine cevirir', () => {
    useUiStore.getState().toggleSidebar()

    expect(useUiStore.getState().isSidebarOpen).toBe(false)
  })

  it('setTableDensity yogunlugu gunceller', () => {
    useUiStore.getState().setTableDensity('compact')

    expect(useUiStore.getState().tableDensity).toBe('compact')
  })
})

describe('migrateUiPersistedState (v0 -> v1)', () => {
  it("'comfortable' tercihini 'spacious'a map eder, diger alanlari korur", () => {
    const result = migrateUiPersistedState(
      { theme: 'dark', isSidebarOpen: false, tableDensity: 'comfortable' },
      0,
    )

    expect(result).toEqual({ theme: 'dark', isSidebarOpen: false, tableDensity: 'spacious' })
  })

  it("'compact' tercihini aynen birakir", () => {
    const result = migrateUiPersistedState(
      { theme: 'light', isSidebarOpen: true, tableDensity: 'compact' },
      0,
    )

    expect(result.tableDensity).toBe('compact')
  })

  it('govde undefined/bosken patlamaz ve varsayilanlara duser', () => {
    expect(() => migrateUiPersistedState(undefined, 0)).not.toThrow()
    expect(migrateUiPersistedState(undefined, 0)).toEqual({
      theme: 'light',
      isSidebarOpen: true,
      tableDensity: 'comfortable',
    })
  })
})
