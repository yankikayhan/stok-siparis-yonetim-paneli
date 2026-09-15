import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useToastStore, type Toast } from '../stores/toast-store'

const toastStyles: Record<Toast['type'], string> = {
  success: 'border-brand-200 bg-brand-50 text-brand-900',
  error: 'border-rose-200 bg-rose-50 text-rose-900',
  info: 'border-slate-200 bg-white text-slate-900',
}

const toastIcons: Record<Toast['type'], typeof Info> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = toastIcons[toast.type]

        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-3 border p-4 text-sm shadow-lg ${toastStyles[toast.type]}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="grid size-6 shrink-0 place-items-center hover:opacity-70"
              aria-label="Bildirimi kapat"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
