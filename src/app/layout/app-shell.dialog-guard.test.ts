/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// K6 (B28+B33 / Gecis 4): app-shell'deki overlay native <dialog>/showModal/createPortal
// KULLANMAZ — B21'in (ileri Tab kacisi, cozulmedi) aside'a tasinmasini engelleyen
// negatif-kosul regresyon testi. Statik icerik kontrolu: DOM layout degil, kaynak metin.
// Emsal: server/seed.test.js ayni desenle (readFileSync) fixture okur.
const appShellSource = readFileSync(new URL('./app-shell.tsx', import.meta.url), 'utf8')

describe('app-shell overlay guard (K6)', () => {
  it('app-shell.tsx native dialog / showModal / createPortal icermez', () => {
    expect(appShellSource).not.toMatch(/showModal|HTMLDialogElement|createPortal/)
  })
})
