import { QueryErrorResetBoundary, useMutationState, useQueryClient } from '@tanstack/react-query'
import { ChartNoAxesCombined, LoaderCircle, Menu, Package, Settings, ShoppingCart, UsersRound } from 'lucide-react'
import { Suspense, useEffect, useId, useRef, useState } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { orderMutationKeys } from '../../features/orders/api/orders-api'
import {
  categoriesOptions,
  DEFAULT_PRODUCT_LIST_PARAMS,
  productListOptions,
} from '../../features/products/api/products-api'
import { isApiError } from '../../shared/api/api-error'
import { ErrorState } from '../../shared/components/error-state'
import { Toaster } from '../../shared/components/toaster'
import { cn } from '../../shared/lib/cn'
import { useUiStore } from '../../shared/stores/ui-store'
import { type RoutePath } from '../routes'

const navigationItems: Array<{ to: RoutePath; label: string; icon: typeof Package }> = [
  { to: '/', label: 'Genel Bakis', icon: ChartNoAxesCombined },
  { to: '/urunler', label: 'Urunler', icon: Package },
  { to: '/musteriler', label: 'Musteriler', icon: UsersRound },
  { to: '/siparisler', label: 'Siparisler', icon: ShoppingCart },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings },
]

export function AppShell() {
  const queryClient = useQueryClient()
  const { pathname } = useLocation()
  // Tema artik bu bilesende okunmaz: <html class="dark"> + dark: varyantlari
  // (index.css @custom-variant) esitlemeyi CSS'e tasidi; tema degisiminde bu agac
  // yeniden render OLMAZ. data-theme attribute'u da kalkti.
  const { isSidebarOpen, toggleSidebar } = useUiStore(
    useShallow((state) => ({
      isSidebarOpen: state.isSidebarOpen,
      toggleSidebar: state.toggleSidebar,
    })),
  )

  // prefetchQuery staleTime'a saygilidir: cache'te taze veri varken tekrarlanan hover istek atmaz.
  const prefetchProductsPage = () => {
    void queryClient.prefetchQuery(productListOptions(DEFAULT_PRODUCT_LIST_PARAMS))
    void queryClient.prefetchQuery(categoriesOptions())
  }

  // B4 (Adim 8 / IB2): hover'da chunk prefetch — veri prefetch'inin dogal esi (bekleyenler B4).
  // import() fire-and-forget: sonuc kullanilmaz, yalnizca tarayicinin chunk'i onceden indirmesi
  // saglanir. Hata sessizdir (prefetch hatasi kullaniciyi etkilemez; gercek yukleme tiklamada
  // baslar ve o zaman ErrorBoundary'ye duser). Ust uste hover'da tarayici HTTP cache'i ayni
  // chunk icin ikinci istek atmaz (KAYNAK: MDN HTTP caching; bu projede OLCULMEDI — S7'de
  // Network panelinde dogrulanir).
  const prefetchPageChunk = (to: RoutePath) => {
    if (to === '/urunler') void import('../../features/products/pages/products-page')
    if (to === '/musteriler') void import('../../features/customers/pages/customers-page')
    if (to === '/siparisler') void import('../../features/orders/pages/orders-page')
    if (to === '/ayarlar') void import('../../features/settings/pages/settings-page')
  }

  // Dialog'un disindan, mutation cache'i uzerinden izleme: dialog kapansa bile gosterge dogru kalir.
  const pendingOrderCreations = useMutationState({
    filters: { mutationKey: orderMutationKeys.create, status: 'pending' },
  })
  const isCreatingOrder = pendingOrderCreations.length > 0

  // B28+B33 (2026-09-24, fix/app-shell-kabuk-duzeni): overlay odak/klavye yonetimi.
  // Native <dialog> KULLANILMAZ (B21 kacinma — aktif-tasarim REDDEDILENLER 3): aside bir
  // gezinme katmanidir, modal diyalog degil; odak tuzagi YAZILMAZ (ilk-odak + ESC + geri
  // donus yeterlidir; md3 drawer emsali). aria-expanded/controls: menu butonu.
  const navId = useId()
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const asideRef = useRef<HTMLElement>(null)

  // I7 KACAK duzeltmesi (B1'in koda yansitilmasi): overlay modunda (lg alti) aside ilk
  // mount'ta KAPALI dogar — persisted `isSidebarOpen: true` olsa bile. Kullanici lg altinda
  // menu butonuna ilk kez bastiginda `overlayActivated` true olur ve overlay ancak o zaman
  // acilabilir. Push modunda (lg ustu) bu bayrak DEVRE DISI: `lg:...` siniflari yalniz
  // isSidebarOpen'a bakar (mevcut davranis aynen — persist true = acik baslar, dogru).
  // Oturum-ici bayrak: persist YOK, ui-store sozlesmesi DEGISMEZ (REDDEDILENLER 5 korunur).
  const [overlayActivated, setOverlayActivated] = useState(false)
  // I9 KACAK duzeltmesi: overlay gorunurlugu isSidebarOpen'dan TAMAMEN BAGIMSIZ —
  // yalniz overlayActivated. AND kapisinda (isSidebarOpen && overlayActivated) persist false
  // iken (kullanici genis ekranda kapatmisti) dar ekranda menu butonu HICBIR SEY yapmazdi
  // (KIRMIZI olculdu: persist false + 768px + tikla → expanded false, aside hidden).
  // B1'in kendi metni bunu boyle istiyordu: "isSidebarOpen'i gormezden gelen CSS gizliligi".
  // isSidebarOpen YALNIZ push modunda (lg ustu) kullanilir; overlay'de persist kirlenmez.
  const overlayOpen = overlayActivated

  // I7 v2: lg altinda menu butonu yalniz overlayActivated'i toggle eder, persist'e DOKUNMAZ —
  // boylece persisted true + ilk tikta "kapatma" gibi ters davranis dogmaz (yesil2'de goruldu:
  // persist true iken toggle isSidebarOpen'i false yapiyor, overlay acilmiyordu). lg ustu icin
  // eskisi gibi toggleSidebar calisir (push davranisi aynen).
  const onMenuToggle = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      toggleSidebar()
      return
    }
    setOverlayActivated((v) => !v)
  }
  // Overlay kapanislari (ESC, backdrop) lg altinda overlayActivated'i false yapar; persist
  // isSidebarOpen korunur (kullanicinin genis-ekran tercihi kirlenmez).

  // Overlay modunda (lg alti) aside acilirken odak ilk NavLink'e gider; kapanis (ESC,
  // backdrop, toggle veya route degisimi) odagi menu butonuna geri verir. push modunda
  // (lg ustu) aside normal akista kalir, odak yonetimi devreye girmez (akillanma:
  // genis ekranda aside sayfanin parcasidir, katman degil).
  useEffect(() => {
    if (!overlayOpen) return
    const aside = asideRef.current
    if (aside === null) return
    // lg kirilmasi altinda degilse overlay degiliz — odak tasinmaz (push modu).
    if (window.matchMedia('(min-width: 1024px)').matches) return

    const firstLink = aside.querySelector<HTMLElement>('nav a')
    firstLink?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOverlayActivated(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [overlayOpen])

  // Overlay kapanisinin SEBEBINDEN bagimsiz odak iadesi: overlayOpen false'a dustugunde
  // (ESC, backdrop, toggle) odak menu butonuna geri doner. Kosul: overlay modu + odak aside
  // icinde (ya da body'de) kalmissa — kullanici baska yere tikladiysa odagi calmamak icin
  // aside ici kontrolu yapilir.
  const prevOverlayOpen = useRef(overlayOpen)
  useEffect(() => {
    const wasOpen = prevOverlayOpen.current
    prevOverlayOpen.current = overlayOpen
    if (!wasOpen || overlayOpen) return
    if (window.matchMedia('(min-width: 1024px)').matches) return
    const active = document.activeElement
    const aside = asideRef.current
    if (aside !== null && active !== null && (active === document.body || aside.contains(active))) {
      menuButtonRef.current?.focus()
    }
  }, [overlayOpen])

  // Overlay acikken arka plan scroll kilitlenir (dialog.tsx emsali — B3 onceden karari).
  // Yalniz overlay modunda anlamli: push'ta aside akista oldugundan kilide gerek yok.
  useEffect(() => {
    if (!overlayOpen) return
    if (window.matchMedia('(min-width: 1024px)').matches) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [overlayOpen])

  // aria-expanded: overlay'de overlayOpen, push'ta isSidebarOpen — iki modun gercek gorunur
  // durumu neyse o (yoksa lg ustu aside acikken buton "false" der — ekran okuyucu icin yanlis).
  const [isWide, setIsWide] = useState(() => window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = (e: MediaQueryListEvent) => setIsWide(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const expandedState = isWide ? isSidebarOpen : overlayOpen

  // B33 (BULGU 1): genislik/hizalama sozlesmesi KOK'TE DEGIL — kokte kalsaydi header'i
  // (ve Toaster'i) da kutuya hapsederdi (I5): max-w-screen-2xl = 1536px, ustu ekranlarda
  // header kutulu kalirdi. Kural: header ARKAPLANI edge-to-edge kalir; sozlesme YALNIZ iki
  // icerik blogunda yasar — header icerigi (ic kap) VE aside+main satiri (eski g2 konumu).
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <header className="shrink-0 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {/* Header icerigi: ortak kaba oturur; header'in kendisi (arkaplan) tam genislikte kalir. */}
        <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center px-4 sm:px-6">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onMenuToggle}
            aria-expanded={expandedState}
            aria-controls={navId}
            className="grid size-9 place-items-center rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-brand-200"
            aria-label="Gezinme menusunu ac veya kapat"
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <p className="ml-3 text-sm font-semibold tracking-wide text-slate-900 dark:text-white">Noktasi Isletme</p>
          {isCreatingOrder && (
            <span role="status" className="ml-auto flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              Siparis kaydediliyor...
            </span>
          )}
        </div>
      </header>

      {/* B33: genislik sozlesmesi bu satirda (eski g2 konumu) — kokte DEGIL. */}
      <div className="mx-auto flex w-full max-w-screen-2xl flex-1">
        {/* B28 (BULGU 2): aside iki modda TEK JSX dalinda. lg ustu: mevcut push davranisi
            (normal akista, w-60/w-0, transition-[width]). lg alti: normal akistan cikar,
            fixed overlay (z-40, translate-x ile giris/cikis) — main'den HIC pay calmaz.
            Kapali overlay'de -translate-x-full + invisible: gorunmez ve odaklanamaz
            (invisible = visibility:hidden, tab sirasindan duser). aria-hidden yalniz
            overlay-kapali durumda (push'ta akista kalir, ekran okuyucu icin erisilebilir). */}
        <aside
          ref={asideRef}
          id={navId}
          aria-hidden={!overlayOpen ? true : undefined}
          className={cn(
            'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
            // push modu (lg ustu): mevcut davranis aynen
            'lg:shrink-0 lg:overflow-hidden lg:transition-[width] lg:duration-200 lg:border-r',
            isSidebarOpen ? 'lg:w-60' : 'lg:w-0 lg:border-r-0',
            // overlay modu (lg alti): fixed katman; backdrop z-30, panel z-40, toast z-50 ustte kalir.
            // inset-y-0 DEGIL top-16 bottom-0: header (h-16) overlay'in USTUNDE kalir — aksi
            // halde panel header'i kapsar ve menu butonu tiklanamaz (I5 sonrasi gozlem).
            // I7: gorunurluk overlayOpen'dan okunur (persist true + ilk mount'ta kapali).
            'max-lg:fixed max-lg:top-16 max-lg:bottom-0 max-lg:left-0 max-lg:z-40 max-lg:w-60 max-lg:overflow-y-auto max-lg:border-r max-lg:shadow-xl',
            'max-lg:motion-safe:transition-transform max-lg:duration-200',
            overlayOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full max-lg:invisible',
          )}
        >
          {/* KACAK duzeltmesi (S7): nav w-60 (240px sabit) + aside border-r (1px) aside icinde
              240>239 yatay tasma uretiyordu (aside scrollWidth 240 > clientWidth 239). w-full ile
              nav aside'in IC genisligine baglanir; push'ta da aynen calisir (aside zaten w-60). */}
          <nav className="w-full p-3" aria-label="Ana gezinme">
            {navigationItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onMouseEnter={() => {
                  if (to === '/urunler') prefetchProductsPage()
                  prefetchPageChunk(to)
                }}
                onFocus={() => {
                  if (to === '/urunler') prefetchProductsPage()
                  prefetchPageChunk(to)
                }}
                // Aktif boyama aria-current uzerinden (T6): NavLink aktifken aria-current="page" yazar
                // (KAYNAK: chunk-KS7C4IRE.mjs:10616); className fonksiyonu boylece sabit string'e iner.
                // not-aria-[...]:hover dislayiciligi eski ternary'nin davranisini korur; aktifte hover
                // icin acik aktif-hover zinciri gerekir (denetim v1/I1): hover +1 ozgulluk kazandigi
                // icin inaktif hover kurallari (media hover:hover) aktif duz kurallari ezerdi.
                className="mb-1 flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-950 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-800 aria-[current=page]:hover:bg-brand-50 aria-[current=page]:hover:text-brand-800 not-aria-[current=page]:hover:bg-slate-100 not-aria-[current=page]:hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:aria-[current=page]:bg-brand-900 dark:aria-[current=page]:text-brand-100 dark:aria-[current=page]:hover:bg-brand-900 dark:aria-[current=page]:hover:text-brand-100 dark:not-aria-[current=page]:hover:bg-slate-800 dark:not-aria-[current=page]:hover:text-white"
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        {/* B28 overlay backdrop: yalniz lg alti + aside acikken. Tiklamayla kapanir
            (toggleSidebar'a yazar — tek boolean sozlesme, REDDEDILENLER 5). z-30:
            panel (z-40) altinda, sayfa uzerinde, toast (z-50) her zaman en ustte. */}
        {overlayOpen && (
          <div
            aria-hidden="true"
            onClick={onMenuToggle}
            className="fixed top-16 right-0 bottom-0 left-0 z-30 bg-slate-950/35 motion-safe:starting:opacity-0 transition-opacity duration-200 lg:hidden dark:bg-slate-950/60"
          />
        )}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {/* Boundary yalnizca sayfa icerigini sarar: header, sidebar ve Toaster disarida
              kalir, boylece hata ekranindayken gezinme ve toast'lar calismaya devam eder. */}
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary onReset={reset} resetKeys={[pathname]} FallbackComponent={RouteErrorFallback}>
                {/* Suspense boundary'nin ICINDE: chunk indirme hatasi da veri hatasi da ayni
                    ekrana duser. Kurtarilabilirlikleri farklidir — veri hatasinda "Tekrar dene"
                    gercekten yeniden dener, basarisiz chunk'i React kaliciya yazar (tek cikis: yenileme). */}
                <Suspense fallback={<RouteChunkFallback />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </main>
      </div>
      <Toaster />
    </div>
  )
}

// Bilincli olarak iskelet DEGIL: sayfalarin kendi veri iskeletleriyle karismasin, boylece
// "chunk iniyor" ile "veri geliyor" ekranda ayirt edilebilsin.
function RouteChunkFallback() {
  return (
    <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
      Sayfa yukleniyor...
    </p>
  )
}

// Export edilmez: AppShell disinda tuketicisi yok.
function RouteErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <ErrorState
      title="Sayfa yuklenemedi"
      message={isApiError(error) ? error.message : 'Beklenmeyen bir hata olustu.'}
      onRetry={resetErrorBoundary}
    />
  )
}