import { type ComponentProps } from 'react'
import { cn } from '../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'md' | 'sm'

// Taban + varyant tablolari bilesen icinde kalir: react-refresh kurali, bilesen export eden
// modulden bilesen-olmayan export'u sinirlar (kalici-bulgular §5); disa acilacak tek sozlesme
// Button'in kendisidir.
// IB4 Katman 1 (B25): ortak odak halkasi — focus-visible (klavye odaginda belirir, mouse
// tiklamasinda cikmaz), outline tabanli (ring degil): elemandan bagimsiz cizilir, boyut/
// kenarlik duzenini degistirmez (Gecis 3 YOL). Iki tema: acikta brand-700, koyuda brand-200.
// twMerge cakismasi yok (Gecis 3 OLCULDU): outline siniflari ne birbirini ne tabani ezer.
const baseClass =
  'rounded-md text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:focus-visible:outline-brand-200'

const variantClasses: Record<ButtonVariant, string> = {
  // primary/danger aynen kalir: koyu zemin ustu renkli zemin + text-white iki temada da calisir.
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800',
  danger: 'bg-rose-700 text-white hover:bg-rose-800',
}

const sizeClasses: Record<ButtonSize, string> = {
  md: 'px-3 py-2',
  sm: 'px-3 py-1.5',
}

// disabled opacity bu proje boyunca 60'a birlestirildi (eski 50/40 kalintilari bu geciste
// kapandi); cursor-not-allowed her varyantta ortak.
const disabledClass = 'disabled:cursor-not-allowed disabled:opacity-60'

// type prop'u icin varsayilan YOK: form icinde submit istenen butonla dialogdaki type="button"
// ayni varsayilani paylasamaz; unutulmasi sessiz submit uretir. ComponentProps<'button'>
// kalan tum native attribute'lari (onClick, disabled, aria-*, autoFocus...) tasir.
export type ButtonProps = ComponentProps<'button'> & {
  type: 'button' | 'submit' | 'reset'
  variant?: ButtonVariant
  size?: ButtonSize
}

// React 19: ref duz prop olarak gelir, forwardRef gerekmez (emsal: SegmentButton).
export function Button({
  children,
  className,
  ref,
  size = 'md',
  type,
  variant = 'primary',
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(baseClass, variantClasses[variant], sizeClasses[size], disabledClass, className)}
      {...rest}
    >
      {children}
    </button>
  )
}
