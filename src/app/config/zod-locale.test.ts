import { describe, expect, it } from 'vitest'
import { z } from 'zod'

// B13 (Rapor A): setupFiles ile zod.ts (z.config(z.locales.tr())) test ortaminda yuklenir;
// bu probe custom mesaj KULLANMAYAN bir Zod hatasinin TR mesaj tasidigini assert eder.
// setupFiles OLMADAN kosulursa EN mesaj gelir (kirmizi); eklendikten sonra TR (yesil).
describe('zod TR locale (setupFiles)', () => {
  it('custom mesajsiz Zod hatasi TR mesaj tasir', () => {
    const result = z.string().safeParse(42)

    expect(result.success).toBe(false)

    if (!result.success) {
      // TR locale: "Geçersiz değer: beklenen string, alınan number"
      expect(result.error.issues[0]?.message).toContain('Geçersiz değer')
    }
  })
})
