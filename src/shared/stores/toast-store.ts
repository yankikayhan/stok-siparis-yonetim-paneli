import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type Toast = {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

const AUTO_DISMISS_MS = 5000

// B15 yigin siniri: ayni anda en fazla 3 toast. Asimda en eski aktif erken kapanir;
// cikis animasyonu store'da degil Toaster'da yasar (store saf kalir, toast-store.test.ts'in
// bes senaryosu korunur) — buradan dusen toast oradaki exiting akisina girer.
const MAX_VISIBLE_TOASTS = 3

type ToastState = {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
}

export const useToastStore = create<ToastState>()(
  devtools(
    (set, get) => ({
      toasts: [],
      addToast: (toast) => {
        const id = crypto.randomUUID()
        set(
          (state) => ({ toasts: [...state.toasts, { ...toast, id }].slice(-MAX_VISIBLE_TOASTS) }),
          false,
          'addToast',
        )
        // Elle kapatilan toast icin gec tetiklenen timer no-op'tur; dismissToast idempotent.
        setTimeout(() => get().dismissToast(id), AUTO_DISMISS_MS)
      },
      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }), false, 'dismissToast'),
    }),
    { name: 'toast-store', enabled: import.meta.env.DEV },
  ),
)
