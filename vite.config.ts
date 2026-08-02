import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // json-server'in db.json yazimlari tam sayfa yenilemeye yol acmasin.
      ignored: ['**/server/db.json'],
    },
  },
})
