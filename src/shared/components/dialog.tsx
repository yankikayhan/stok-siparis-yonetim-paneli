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

  // OLCULDU (Playwright ile izole edilip dogrulandi): bu Chromium kurulumunda native odak-tuzagi
  // son etkin elemandan sonra DIALOG ELEMENTININ KENDISINE fantom bir durak birakiyor; gercek
  // pencerede bu durak tarayici arayuzune (adres cubugu vb.) kacisa donusuyordu. Guvenlik agi:
  // odak dialogun disina (ya da dialogun kendisine) tasarsa, son basilan tusun yonune gore
  // (Tab -> ilk eleman, Shift+Tab -> son eleman) geri cekilir; iki yon de Playwright'ta ayri
  // ayri dogrulandi.
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    let lastTabWasShift = false

    // Fonksiyon DEKLARASYONU degil ifadesi (const): hoisting yuzunden TypeScript'in yukaridaki
    // `if (!dialog) return` daraltmasini kaybetmemesi icin (derleyici bunu build'de yakaladi).
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') lastTabWasShift = event.shiftKey
    }

    const handleFocusOut = () => {
      requestAnimationFrame(() => {
        const active = document.activeElement
        const escaped = active === dialog || !dialog.contains(active)
        if (!dialog.open || !escaped) return

        const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        const target = lastTabWasShift ? focusables[focusables.length - 1] : focusables[0]
        target?.focus()
      })
    }

    dialog.addEventListener('keydown', handleKeyDown)
    dialog.addEventListener('focusout', handleFocusOut)
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      dialog.removeEventListener('focusout', handleFocusOut)
    }
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
        'm-auto max-h-[90vh] w-full overflow-y-auto bg-white shadow-xl backdrop:bg-slate-950/35 dark:border dark:border-slate-700 dark:bg-slate-900 dark:backdrop:bg-slate-950/60',
        className,
      )}
    >
      {children}
    </dialog>
  )
}
