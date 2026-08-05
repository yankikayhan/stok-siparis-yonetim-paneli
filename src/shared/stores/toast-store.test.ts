import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToastStore } from './toast-store'

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
    expect(toasts[0].id).not.toBe('')
  })

  it('ayni icerikli toastlar farkli id alir', () => {
    useToastStore.getState().addToast({ type: 'info', message: 'Ayni mesaj' })
    useToastStore.getState().addToast({ type: 'info', message: 'Ayni mesaj' })

    const { toasts } = useToastStore.getState()

    expect(toasts).toHaveLength(2)
    expect(toasts[0].id).not.toBe(toasts[1].id)
  })

  it('dismissToast sadece verilen id\'li toast\'i kaldirir', () => {
    useToastStore.getState().addToast({ type: 'error', message: 'Birinci' })
    useToastStore.getState().addToast({ type: 'error', message: 'Ikinci' })

    const [first] = useToastStore.getState().toasts
    useToastStore.getState().dismissToast(first.id)

    const { toasts } = useToastStore.getState()

    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Ikinci')
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

    const [toast] = useToastStore.getState().toasts
    useToastStore.getState().dismissToast(toast.id)

    expect(() => vi.runAllTimers()).not.toThrow()
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
