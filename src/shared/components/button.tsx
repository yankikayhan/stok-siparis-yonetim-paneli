import { type ComponentProps } from 'react'
import { cn } from '../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'md' | 'sm'

// Taban + varyant tablolari bilesen icinde kalir: react-refresh kurali, bilesen export eden
// modulden bilesen-olmayan export'u sinirlar (kalici-bulgular §5); disa acilacak tek sozlesme
// Button'in kendisidir.
const baseClass = 'rounded-md text-sm font-medium'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
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
