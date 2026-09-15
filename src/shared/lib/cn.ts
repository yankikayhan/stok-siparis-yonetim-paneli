import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Sinif birlestirmenin tek noktasi: clsx kosullu birlestirir, twMerge cakisan utility'leri
// cozumler (son kalan kazanir). Iki paket baska yerde ayri ayri import edilmez.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
