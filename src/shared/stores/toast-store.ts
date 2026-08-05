import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type Toast = {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

const AUTO_DISMISS_MS = 5000

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
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }), false, 'addToast')
        // Elle kapatilan toast icin gec tetiklenen timer no-op'tur; dismissToast idempotent.
        setTimeout(() => get().dismissToast(id), AUTO_DISMISS_MS)
      },
      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }), false, 'dismissToast'),
    }),
    { name: 'toast-store', enabled: import.meta.env.DEV },
  ),
)
