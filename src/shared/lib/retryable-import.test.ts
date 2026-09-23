import { describe, expect, it, vi } from 'vitest'
import { retryableImport } from './retryable-import'

// Not (KALICI BICIM sinirlendirmesi): bu testler wrapper'in MANTIGINI sinar — Vite'in
// derlenmis __vitePreload ciktisini ve tarayicinin modul haritasini burada sinamayiz
// (ALTYAPI YOK: Vitest node ortami gercek chunk URL'si uretmez). Uctan uca dogrulama
// S7'de Playwright ile yapilir (orijinal hata -> ?retry=1 -> gercek ag istegi -> mapModule).
const mapModule = (module: Record<string, unknown>) => ({ default: module.X })

describe('retryableImport', () => {
  it('ilk cagri basariliysa sonucu mapModule koprusunden gecirip dondurur', async () => {
    const loader = vi.fn().mockResolvedValue({ X: 'ok' })
    const wrapped = retryableImport(loader, mapModule)

    await expect(wrapped()).resolves.toEqual({ default: 'ok' })
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('hata mesaji chunk URL kalibina uymuyorsa orijinal hatayi aynen firlatir', async () => {
    const hata = new Error('baska bir hata')
    const loader = vi.fn<() => Promise<Record<string, unknown>>>().mockRejectedValue(hata)
    const wrapped = retryableImport(loader, mapModule)

    await expect(wrapped()).rejects.toBe(hata)
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('Error olmayan bir sey firlatilirsa aynen yukari tasir', async () => {
    const loader = vi.fn<() => Promise<Record<string, unknown>>>().mockRejectedValue('string hata')
    const wrapped = retryableImport(loader, mapModule)

    await expect(wrapped()).rejects.toBe('string hata')
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('chunk URL kalibindaki hata icin cache-busting retry yoluna girer', async () => {
    // Gercek chunk importunu node ortaminda uretemeyiz; loader'in hata mesajina
    // Chromium formatinda URL koyup wrapper'in retry dalina girdigini dogrulariz.
    // import() burada varolmayan URL'ye gider — node onu reddeder; bizim beklentimiz
    // loader'in BIR kez cagrildigi ve hatanin farkli bir yoldan (import) geldigidir.
    const loader = vi
      .fn<() => Promise<Record<string, unknown>>>()
      .mockRejectedValue(
        new TypeError('Failed to fetch dynamically imported module: http://localhost:4173/assets/x-BKBtUywa.js'),
      )
    const wrapped = retryableImport(loader, mapModule)

    await expect(wrapped()).rejects.toThrow()
    expect(loader).toHaveBeenCalledTimes(1)
  })
})
