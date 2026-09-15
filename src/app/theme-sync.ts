import { useUiStore } from '../shared/stores/ui-store'

// Tema -> <html> sinifi esitlemesi React DISINDA yurur: React render dongusune bagimli degildir
// ve main.tsx modul zinciri yuklenir yuklenmez kurulur. fireImmediately abonelik aninda
// SENKRON cagrilir (zustand subscribeWithSelector): persist sync hydration'i ayni modul
// degerlendirmesinde tamamladigi icin dogru deger ilk cagriyla uygulanir; tekrar idempotenttir.
// index.html'deki bootstrap ilk boyamadan once calisir; bu abonelik onun uzerine degil,
// ayni hedefe kenetlenir (classList.toggle additive'dir, baska siniflari ezmez).
useUiStore.subscribe(
  (state) => state.theme,
  (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  },
  { fireImmediately: true },
)
