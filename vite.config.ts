import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// IB1a (B22): nesne literal'den fonksiyon formuna gecis — yalnizca bilincli cagrilan
// profiling build'de (command 'build' VE mode 'profiling') react-dom'u profiling girisine
// baglar. Standart build/dev/test/preview etkilenmez (Gecis 2 §16 geriliminin cozumu:
// g10'un onceden karari "dev-only"den "build-only + mode-only"ye revize edildi).
// Kosulsuz kisim (plugins + server.watch.ignored) mevcut nesne literalinin AYNISIDIR (K1).
export default defineConfig(({ command, mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias:
      command === 'build' && mode === 'profiling'
        ? [{ find: /^react-dom$/, replacement: 'react-dom/profiling' }]
        : [],
  },
  server: {
    watch: {
      // json-server'in db.json yazimlari tam sayfa yenilemeye yol acmasin.
      ignored: ['**/server/db.json'],
    },
  },
}))
