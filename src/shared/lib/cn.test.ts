import { describe, expect, it } from 'vitest'
import { cn } from './cn'

// Kapsam notu (T5'in "bizzat gor" sarti): yalniz standart gruplar sinanir (padding, metin
// rengi/boyutu). tailwind-merge'in v4-ozgu siniflari (size-*, min-w-190) ve brand token
// ailelerini ayni grupta cozup cozmedigi burada ASSERT EDILMEZ; twMerge tanimadigi sinifa
// dokunmaz (son-kalan sirasini korur) ve bu IB'de hicbir cagirida className ile renk ezme
// kullanilmaz.
describe('cn', () => {
  it('clsx davranisi: kosullu siniflari birlestirir, falsy degerleri atlar', () => {
    // Degisken uzerinden kosul kurulur: sabit literal `false && ...` no-constant-binary-expression
    // kuralina takilir; sinanmak istenen sey clsx'in runtime falsy davranisi.
    const kapali = false
    expect(cn('a', kapali && 'b', 'c')).toBe('a c')
    expect(cn('a', undefined, null)).toBe('a')
  })

  it('twMerge davranisi: ayni gruptaki cakisan siniflarda son kalan kazanir', () => {
    expect(cn('px-3', 'px-5')).toBe('px-5')
    expect(cn('text-slate-700', 'text-white')).toBe('text-white')
  })

  it('farkli gruplardaki siniflari korur', () => {
    expect(cn('text-sm', 'text-white')).toBe('text-sm text-white')
    expect(cn('px-3', 'py-2')).toBe('px-3 py-2')
  })

  it('kosul + cakisma birlikte calisir', () => {
    const isActive = true
    expect(cn('text-slate-700', isActive && 'text-brand-800', 'px-3')).toBe(
      'text-brand-800 px-3',
    )
  })
})
