import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { useToastStore, type Toast } from '../stores/toast-store'

// Cikis animasyonunun suresi; giris siniflarindaki duration-200 ile ayni tutulur.
const EXIT_DURATION_MS = 200

// Yerel gorunum listesi: store'daki Toast'a cikis durumu eklenmis hali.
type DisplayedToast = Toast & { exiting: boolean }

const toastStyles: Record<Toast['type'], string> = {
  success: 'border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-800 dark:bg-brand-900 dark:text-brand-100',
  error: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200',
  info: 'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white',
}

const toastIcons: Record<Toast['type'], typeof Info> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismissToast = useToastStore((state) => state.dismissToast)
  const [displayed, setDisplayed] = useState<DisplayedToast[]>([])

  // Render-fazi mutabakati (IB5'teki resolveEditTarget konvansiyonu — temizleme render
  // fazinda, liste senkronu icin ayrik bir "izleme" effect'i YOK): store'dan dusen toast
  // hemen silinmez, exiting isaretlenir; cikis animasyonu boylece store'a gecikme eklemeden
  // gorunum katmaninda kalir. "Hareketi azalt" tercihinde exiting hic kurulmaz, store'dan
  // dusen hemen kaldirilir (DENETIM v1 I1); tercih degisimi dinlenmez — toast 5 sn omurlu
  // oldugu icin statik okuma yeterlidir. Yeni liste tamamen SAF parcalardan kurulur
  // (flatMap/filter/spread): react-hooks/immutability kurali callback icinden dis scope'a
  // yazmayi yasaklar.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const storeIds = new Set(toasts.map((toast) => toast.id))
  const survivorsAndExiting = displayed.flatMap((item): DisplayedToast[] =>
    storeIds.has(item.id) || item.exiting ? [item] : reduceMotion ? [] : [{ ...item, exiting: true }],
  )
  const entered = toasts.filter((toast) => !displayed.some((item) => item.id === toast.id))
  const next: DisplayedToast[] = [
    ...survivorsAndExiting,
    ...entered.map((toast): DisplayedToast => ({ ...toast, exiting: false })),
  ]
  // Degisiklik tespiti saf karsilastirmayla: uzunluk degisti ya da bir elemanin referansi
  // degisti (exiting isareti yeni nesne uretir). Atlanan render'da setState cagrilmaz.
  const changed = next.length !== displayed.length || next.some((item, index) => item !== displayed[index])
  if (changed) setDisplayed(next)

  // Exiting toast'larin kaldirisini zamanlayan tek effect. Bagimlilik yalnizca "exiting var
  // mi" durumu: yeni toast gelmesi timer'i resetlemez. Tek toplu timer: timer ILK exiting
  // goruldugunde kurulur, hasExiting degismedikce devam eder, TUM exiting'leri tek seferde
  // toplu kaldirir. Sonuc (DENETIM I1 ile netlestirildi): sonradan exiting'e giren bir toast
  // timer kalanina KATILIR — kendi baslangicindan itibaren 200ms'den DAHA ERKEN kalkabilir;
  // ardisik kapatmalarda garanti per-toast 200ms DEGIL, ilk-exiting anindan itibaren en fazla
  // 2 x EXIT_DURATION_MS'lik bir penceredir (erken toplu kaldirma bilincli davranis).
  const hasExiting = displayed.some((toast) => toast.exiting)
  useEffect(() => {
    if (!hasExiting) return
    const timer = setTimeout(() => {
      setDisplayed((current) => current.filter((toast) => !toast.exiting))
    }, EXIT_DURATION_MS)
    return () => clearTimeout(timer)
  }, [hasExiting])

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {displayed.map((toast) => {
        const Icon = toastIcons[toast.type]

        return (
          <div
            key={toast.id}
            role={toast.type === 'error' ? 'alert' : 'status'}
            aria-hidden={toast.exiting || undefined}
            className={cn(
              'pointer-events-auto flex items-start gap-3 border p-4 text-sm shadow-lg transition-[opacity,translate] duration-200 motion-safe:starting:opacity-0 motion-safe:starting:translate-y-2',
              toastStyles[toast.type],
              // Exiting: transition sayesinde 200 ms icinde solup listeden duser.
              toast.exiting && 'opacity-0',
            )}
          >
            <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              disabled={toast.exiting}
              className="grid size-6 shrink-0 place-items-center hover:opacity-70 disabled:opacity-60"
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
