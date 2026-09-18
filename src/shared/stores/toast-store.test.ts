import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToastStore, type Toast } from './toast-store'

// noUncheckedIndexedAccess altinda index erisimi T | undefined doner; `?.` ile susturmak
// eksik elemani sessizce gecirirdi — assert'i zayiflatmamak icin burada patlatilir.
function toastAt(toasts: Toast[], index: number): Toast {
  const toast = toasts[index]

  if (toast === undefined) throw new Error(`Kuyrukta ${index}. toast yok.`)

  return toast
}

describe('useToastStore', () => {
  beforeEach(() => {
    // Store modul seviyesinde singleton; ayni dosyadaki testler arasi sizintiyi onlemek icin resetlenir.
    useToastStore.setState({ toasts: [] })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('addToast kuyruga id atanmis bir toast ekler', () => {
    useToastStore.getState().addToast({ type: 'success', message: 'Kaydedildi.' })

    const { toasts } = useToastStore.getState()

    expect(toasts).toHaveLength(1)
    expect(toasts[0]).toMatchObject({ type: 'success', message: 'Kaydedildi.' })
    expect(toastAt(toasts, 0).id).not.toBe('')
  })

  it('ayni icerikli toastlar farkli id alir', () => {
    useToastStore.getState().addToast({ type: 'info', message: 'Ayni mesaj' })
    useToastStore.getState().addToast({ type: 'info', message: 'Ayni mesaj' })

    const { toasts } = useToastStore.getState()

    expect(toasts).toHaveLength(2)
    expect(toastAt(toasts, 0).id).not.toBe(toastAt(toasts, 1).id)
  })

  it('dismissToast sadece verilen id\'li toast\'i kaldirir', () => {
    useToastStore.getState().addToast({ type: 'error', message: 'Birinci' })
    useToastStore.getState().addToast({ type: 'error', message: 'Ikinci' })

    const first = toastAt(useToastStore.getState().toasts, 0)
    useToastStore.getState().dismissToast(first.id)

    const { toasts } = useToastStore.getState()

    expect(toasts).toHaveLength(1)
    expect(toastAt(toasts, 0).message).toBe('Ikinci')
  })

  it('toast suresi dolunca otomatik kapanir', () => {
    useToastStore.getState().addToast({ type: 'success', message: 'Gecici' })

    vi.advanceTimersByTime(4999)
    expect(useToastStore.getState().toasts).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('elle kapatilan toast\'in gec tetiklenen timer\'i hata uretmez', () => {
    useToastStore.getState().addToast({ type: 'info', message: 'Elle kapatilacak' })

    const toast = toastAt(useToastStore.getState().toasts, 0)
    useToastStore.getState().dismissToast(toast.id)

    expect(() => vi.runAllTimers()).not.toThrow()
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('dorduncu toast eklendiginde en eski toast kuyruktan dusurulur (yigin siniri 3)', () => {
    useToastStore.getState().addToast({ type: 'info', message: 'Birinci' })
    useToastStore.getState().addToast({ type: 'info', message: 'Ikinci' })
    useToastStore.getState().addToast({ type: 'info', message: 'Ucuncu' })
    useToastStore.getState().addToast({ type: 'info', message: 'Dorduncu' })

    const { toasts } = useToastStore.getState()

    expect(toasts).toHaveLength(3)
    expect(toasts.map((toast) => toast.message)).toEqual(['Ikinci', 'Ucuncu', 'Dorduncu'])
  })
})
