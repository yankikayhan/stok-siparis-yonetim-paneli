import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '../lib/cn'

type DialogProps = {
  titleId: string
  onClose: () => void
  className?: string
  children: ReactNode
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// showModal()/close() imperatif DOM API'leridir, React'in deklaratif render'inin disinda kalir;
// mount'ta acilip unmount'ta kapanmalari icin bu yuzden bir effect GEREKIR (boya oncesi calissin
// diye useLayoutEffect: aksi halde ilk boyamada kapali/gizli bir <dialog> bir kare gorunurdu).
// Escape ise effect'siz cozulur: native `cancel` olayi asagida onCancel prop'uyla yakalanir.
export function Dialog({ children, className = '', onClose, titleId }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useLayoutEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  // showModal() arka plan scroll'unu KENDILIGINDEN kilitlemiyor (runtime'da OLCULDU: dialog
  // acikken sayfa kayiyordu) — bu yuzden ayri, tek amacli bir effect: mount'ta body'yi kilitler,
  // unmount'ta onceki degere doner (birden fazla dialog ust uste acilirsa ic ice guvenlidir).
  useLayoutEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // B21 (Rapor A, 2026-09-25): reaktif focusout guard'i KALDIRILDI, yerine onleyici
  // capture-phase keydown konur. OLCULDU (Rapor A: Playwright izole + kullanicinin gercek
  // tarayicisi): son elemanda (Shift'siz) Tab -> ilk elemana, ilk elemanda Shift+Tab ->
  // son elemana; odak hic dialog disina cikmaz (preventDefault OS/chrome'a kacis firsati
  // birakmaz). Fantom durak (dialog elementinin kendisi) da ortadan kalkar. ESC akisi
  // degismez: native onCancel -> requestClose/onClose.
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      // Liste bos degil (her dialog en az bir kapat butonu tasir); yine de no-op guvenli.
      if (!event.shiftKey && active === last) {
        event.preventDefault()
        first?.focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last?.focus()
      }
    }

    // Capture-phase: native dialog'un kendi Tab dispatch'inden ONCE calisir (ZAMAN §2.9).
    dialog.addEventListener('keydown', handleKeyDown, true)
    return () => dialog.removeEventListener('keydown', handleKeyDown, true)
  }, [])

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Native kapanmayi engelleyip cagiranin requestClose/onCancel mantigina yonlendiriyoruz;
        // aksi halde React state'i "acik" kalirken DOM'daki dialog kapanmis olurdu.
        event.preventDefault()
        onClose()
      }}
      className={cn(
        // dark:border: golge koyu zeminde gorunmezlesir, yuzey ayrimi dark'ta kenarlikla kurulur (tasarim D1/§C).
        // Acilis animasyonu yalniz sinif duzeyinde (starting-style): effect'lere dokunulmaz;
        // boylece B21 odak guard'inin zamanlamasi (K2) korunur. Backdrop ayni surede solar.
        'm-auto max-h-[90vh] w-full overflow-y-auto bg-white shadow-xl backdrop:bg-slate-950/35 dark:border dark:border-slate-700 dark:bg-slate-900 dark:backdrop:bg-slate-950/60',
        'transition-opacity duration-200 motion-safe:starting:opacity-0 backdrop:transition-opacity backdrop:duration-200 backdrop:motion-safe:starting:opacity-0',
        className,
      )}
    >
      {children}
    </dialog>
  )
}
