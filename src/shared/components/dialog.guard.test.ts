/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// B21 (Rapor A): dialog.tsx'in odak guard'i reaktif (focusout + lastTabWasShift + rAF)
// DEGIL, onleyici (capture-phase keydown) olmali. Statik icerik kontrolu: DOM degil,
// kaynak metin. Emsal: app-shell.dialog-guard.test.ts (K6) ve server/seed.test.js.
const dialogSource = readFileSync(new URL('./dialog.tsx', import.meta.url), 'utf8')

describe('dialog odak guard (B21)', () => {
  it('onleyici capture-phase keydown dinleyicisi tasir', () => {
    // addEventListener('keydown', handler, true) — ucuncu arguman capture.
    expect(dialogSource).toMatch(/addEventListener\('keydown',\s*\w+,\s*true\)/)
  })

  it('reaktif focusout guard\'i kalkmistir', () => {
    // Kod-duzeyi kontrol: yorum metni degil, addEventListener/removeEventListener
    // cagrisi ve lastTabWasShift degisken adi aranir (yorumda "focusout" gecebilir).
    expect(dialogSource).not.toMatch(/addEventListener\('focusout'/)
    expect(dialogSource).not.toMatch(/removeEventListener\('focusout'/)
    expect(dialogSource).not.toMatch(/lastTabWasShift/)
  })
})
