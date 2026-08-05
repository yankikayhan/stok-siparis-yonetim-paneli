# Teknoloji Derinlestirme Plani

> Bu belge, mevcut stok/siparis yonetim paneli uzerinde her teknolojiyi derinlemesine ogrenmek icin hazirlanmis yol haritasidir. Maddeler genel konu listesi degildir; her biri bu projedeki somut bir dosya veya akis uzerinden uygulanacak sekilde yazilmistir. Siralama, her teknoloji icinde kolaydan zora dogru gider.

---

## 1. TanStack Query

Mevcut durum: `useQuery` + `useMutation` + `invalidateQueries`, siparis durumunda tek bir optimistic update ornegi. Tum filtreleme client-side; query key'ler parametre icermiyor.

- [x] **Server-side filtreleme + parametreli query key:** Urunler sayfasindaki arama/kategori/stok filtrelerini `GET /products?name_like=&categoryId=` gibi query string'e tasi. `productQueryKeys.list()` yerine `list(filters)` yap; filtre degisince yeni key'in yeni cache girdisi olusturdugunu Devtools'ta izle.
- [x] **`queryOptions` helper:** Her feature'in API dosyasinda `queryOptions({ queryKey, queryFn })` tanimla; sayfalarda `useQuery(productListOptions(filters))` seklinde kullan. Tip cikarimi ve tekrar kullanimin farkini gor.
- [x] **Sayfalama + `placeholderData: keepPreviousData`:** Urun listesine `_page`/`_limit` ile server-side sayfalama ekle. Sayfa degisirken eski verinin ekranda kalmasini ve `isPlaceholderData` ile "soluk" gosterimi uygula.
- [x] **`select` ile veri donusumu:** Dashboard'daki `getDashboardSummary` hesaplamasini `select` opsiyonuna tasiyarak karsilastir; `select`'in referans kararliligi ve yeniden hesaplama davranisini incele.
- [ ] **Prefetching:** Sidebar'daki "Urunler" linkine hover'da `queryClient.prefetchQuery` ekle. Network panelinde istegin onceden gittigini, sayfaya gecince cache'ten okundugunu izle.
- [ ] **Dependent query'yi derinlestir:** Musteriler sayfasindaki `enabled` kullanimini koru; buna ek olarak secilen musteri icin `initialData` veya `placeholderData`'yi liste cache'inden besle (`queryClient.getQueryData` ile seed).
- [ ] **Para birimi tercihini islevsel yap:** Profildeki `currency` (TRY/USD/EUR) su an kaydediliyor ama hicbir seyi etkilemiyor; tum `Intl.NumberFormat` cagrilari TRY'ye sabit. Formatlayicilari profil query'sindeki `currency` degerinden besle (or. `useCurrencyFormatter()` hook'u profile cache'ini okur). Server verisinden turetilmis degerin bilesenlere kopyasiz tasinmasini pratik et.
- [x] **Global hata yonetimi:** `QueryClient`'a `QueryCache.onError` / `MutationCache.onError` ekle; ApiError'lari Zustand toast kuyruguna bagla. Sayfa ici hata gosterimi ile global toast'in sorumluluk ayrimini kur.
- [ ] **`setQueryData` vs `invalidateQueries` deneyi:** Urun olusturma mutation'inda once `invalidateQueries` (mevcut), sonra ayni akisi `setQueryData` ile cache'e dogrudan yazarak yap. Network panelinde refetch farkini gozlemle, notunu belgeye ekle.
- [ ] **Optimistic update'i yayginlastir:** Siparis durumundaki pattern'i urun silmeye uygula (listeden aninda kaldir, hatada geri getir). `onMutate`/`onError`/`onSettled` akisini ezber degil kavrayarak yazdigini test et.
- [ ] **`useSuspenseQuery` + Suspense:** Dashboard'u `useSuspenseQuery`'ye gecir; loading state'i `<Suspense fallback>` ile, hata durumunu Error Boundary ile yakala. Klasik `isPending` yaklasimiyla farkini karsilastir.
- [ ] **`useQueries` ile paralel sorgular:** Siparisler sayfasindaki uc ayri `useQuery`'yi `useQueries`'e cevir; `combine` opsiyonu ile tek sonuc nesnesi uret.
- [ ] **Infinite query:** Siparis listesini `useInfiniteQuery` + "daha fazla yukle" butonuna cevir (json-server `_page` destegiyle). `getNextPageParam` ve `pages` yapisini incele.
- [x] **`staleTime`/`gcTime` deneyleri:** Farkli degerlerle sayfalar arasi gecislerde request sayisini olc; kategoriler gibi nadiren degisen veriye uzun `staleTime` ver ve karari yorum satiriyla gerekcelendir.
- [ ] **Mutation state paylasimi:** `useMutationState` ile devam eden siparis olusturma mutation'ini baska bir bilesenden (or. header'da "kaydediliyor..." gostergesi) izle.

---

## 2. Zod

Mevcut durum: Response parse, form semalari, bir `superRefine` (stok kurali). Sema tekrari var (dashboard-api urun/siparis semasini kopyalamis).

- [x] **Sema tekilligi ve paylasim:** `dashboard-api.ts` icindeki kopya `productSchema`/`orderSchema`'yi kaldir; semalari tek yerden (ilgili feature'dan veya `shared/schemas`'tan) import et. "Tek dogruluk kaynagi" ilkesini semalara uygula.
- [x] **`z.input` vs `z.output` ayrimini netlestir:** `z.coerce` iceren form semalarinda iki tipin neden farkli oldugunu kucuk bir ornekle belgeye not et; RHF generic'lerinde (`useForm<Input, unknown, Output>`) bu ayrimin rolunu acikla.
- [x] **Sema kompozisyonu:** `productFormSchema`'yi `productSchema.pick(...)` / `omit(...)` / `extend(...)` ile turet; create ve update senaryolari icin `partial()` kullanarak fark yaratmayi dene.
- [x] **`transform` ve `pipe`:** API'den gelen `createdAt` ISO string'ini `z.iso.datetime().pipe(...)` veya `transform` ile `Date` nesnesine cevir; formatlamanin bilesenden sema katmanina tasinmasinin etkisini degerlendir.
- [x] **`discriminatedUnion`:** Siparis durumlarina bagli farkli alanlar kurgula (or. `shipped` siparislerde zorunlu `trackingNumber`, `cancelled` siparislerde `cancelReason`). Semayi `z.discriminatedUnion('status', [...])` ile yaz, UI'da tip daraltmayla kullan.
- [x] **Server hata govdesini parse et:** `http-client.ts`'te `!response.ok` durumunda `{ message: string }` govdesini bir `errorBodySchema` ile parse edip `ApiError.message`'a tasi. Su an server'in dondurdugu anlamli mesajlar (or. "yeterli stok yok") kayboluyor.
- [x] **Ortak hata haritasi:** Zod v4 `z.config()` / hata ozelleştirme ile Turkce varsayilan hata mesajlarini merkezi tanimla; sema basina tekrar eden mesajlari azalt.
- [x] **Env dogrulamayi derinlestir:** `app/config/env.ts`'i incele; `import.meta.env`'i `z.object` ile parse eden, eksik degiskende build/boot aninda anlamli hata firlatan yapiya donustur (yoksa kur).
- [x] **`safeParse` sonucunu isleme:** `result.error.issues`'u kullaniciya donusturen kucuk bir `formatZodError` yardimcisi yaz ve test et; `flatten`/`treeifyError` cikti farklarini incele.
- [ ] **Refine performans bilinci:** `createOrderFormSchema(products)`'in her render'da yeniden olusmasinin maliyetini `useMemo` ile karsilastir; sema fabrikasi pattern'inin arti/eksisini not et.

---

## 3. React Hook Form

Mevcut durum: `useForm` + `zodResolver` + `useFieldArray` + `useWatch`. Validasyon modu, server hatasi eslestirme, reset stratejileri yok.

- [ ] **Validasyon modlari:** Siparis formunda `mode: 'onTouched'`, `reValidateMode: 'onChange'` gibi kombinasyonlari dene; kullanici deneyimi farkini gozlemleyip sectigin stratejiyi gerekcesiyle sabitle.
- [ ] **Server hatasini alana esle:** `POST /orders` 409 dondugunde ("yeterli stok yok") `form.setError('items.0.quantity', ...)` veya `setError('root.serverError', ...)` ile hatayi forma tasi; generic hata paragrafi yerine alan bazli gosterim yap.
- [ ] **`formState` derinligi:** `isDirty`, `dirtyFields`, `isSubmitting`, `isSubmitSuccessful`'i kullan: kaydedilmemis degisiklik varken dialog kapatilirken onay iste; submit butonunu `isDirty` degilse pasif yap.
- [ ] **Reset pattern'leri:** Urun duzenleme dialogunda `reset(product)` ile formu doldur; basarili submit sonrasi `reset()` cagrisinin `defaultValues` ile iliskisini incele. `values` prop'u ile `reset` farkini karsilastir.
- [ ] **`price` varsayilan degeri celiskisini coz:** Urun formunda `defaultValues.price` `0` ama sema `positive()` istiyor; alana dokunmayan kullanici dogrudan hata gorur. Sayisal alanlarda "bos" baslangic degerinin (`''`/`undefined`/`NaN`) `valueAsNumber` ve Zod `coerce` ile etkilesimini incele; secimini gerekcesiyle not et.
- [ ] **`useWatch` vs `watch` vs `getValues`:** Siparis dialogundaki canli toplam tutari hesapla (kalem sayisi × birim fiyat). Once `watch` ile yap, render sayisini olc; sonra `useWatch`'i izole bir `<OrderTotal>` bilesenine tasiyip farki gor.
- [ ] **`Controller` ihtiyacini gor:** Native olmayan bir input ekle (or. urun formuna basit bir toggle/segmented control) ve `Controller` ile bagla; register/Controller ayrimini netlestir.
- [ ] **`useFieldArray` ileri kullanim:** Kalem satirlarinda `replace`, `insert`, `move` operasyonlarini dene; ayni urunun ikinci kez secilmesini engelleyen veya mevcut kaleme miktar ekleyen akil yurut.
- [ ] **Form bilesenini ayristir:** `OrderCreateDialog` icindeki form mantigini `useOrderCreateForm` custom hook'una cikar; `FormProvider` + `useFormContext` ile kalem satirini ayri bilesene tasi ve prop drilling'i kaldir.
- [ ] **Odak yonetimi:** `setFocus` ile ilk hatali alana odaklan; yeni kalem eklendiginde yeni satirin urun secimine odak ver.
- [ ] **Cok adimli form (opsiyonel buyuk egzersiz):** Siparis olusturmayi 2 adima bol (musteri secimi → kalemler + ozet). Adimlar arasi state'in RHF'te nasil korunacagini, `trigger` ile adim bazli validasyonu ogren.

---

## 4. Zustand

Mevcut durum: Tek store, `persist` + `partialize`. Belgede planlanan toast kuyrugu hic yazilmamis.

- [x] **Toast kuyrugu store'u:** `toast-store.ts` kur: `toasts: Toast[]`, `addToast`, `dismissToast`, otomatik kapanma. Mutation basari/hatalarini buraya bagla. Server verisi TASIMADIGINA dikkat et — sadece UI olayi.
- [x] **Store'a component disindan erisim:** `QueryCache.onError` icinden (React disi kod) `useToastStore.getState().addToast(...)` cagir; hook ile `getState` farkini ve nerede hangisinin dogru oldugunu ogren.
- [x] **Selector disiplini:** `useUiStore((s) => s.theme)` gibi dar selector'larin neden onemli oldugunu olc: tum store'u alan bir bilesenle (`useUiStore()`) karsilastirip gereksiz render'lari React DevTools Profiler'da izle.
- [x] **`useShallow`:** Birden fazla alani tek selector'la alirken `useShallow` kullan; obje donduren selector'un her render'da yeni referans uretme tuzagini bizzat yasa ve coz.
- [ ] **Slice pattern:** UI store'u buyudugunde (tema + sidebar + tablo + toast) slice'lara bol: `createThemeSlice`, `createToastSlice`... Tek store icinde birlesecek sekilde tipleriyle kur.
- [ ] **`subscribeWithSelector`:** Tema degistiginde `document.documentElement`'e `dark` class'ini yazan bir subscription kur (React render dongusu disinda yan etki). Tailwind dark mode ile birlestir.
- [ ] **Persist derinligi:** `version` + `migrate` ekle: store semasi degistiginde (or. `tableDensity`'ye yeni deger) eski localStorage verisinin nasil goc ettirildigini dene. `onRehydrateStorage` ile hydration anini logla.
- [ ] **Siparis taslagi (draft) store'u:** Dialog kapaninca kaybolan siparis formunu opsiyonel olarak taslak store'una yaz ("kaldigin yerden devam et"). Form state ↔ client state sinirini bilerek ihlal edip geri duzelterek sinirin nedenini kavra.
- [x] **Store testi:** Vitest ile toast store'unun saf logigini test et (`useToastStore.getState()` uzerinden, render gerektirmeden). Store'larin test edilebilirlik avantajini gor.
- [x] **Devtools middleware:** `devtools` middleware ekleyip Redux DevTools uzantisinda action akisini izle; action'lara isim ver.

---

## 5. TypeScript

Mevcut durum: Zod'dan turetilen tipler, generic `request<TSchema>`. Ileri tip pattern'leri az.

- [ ] **`satisfies` operatoru:** `orderStatusLabels: Record<OrderStatus, string>` tanimlarini `satisfies` ile yeniden yaz; tip genislemesini (widening) onlemenin ve eksik key yakalamanin farkini gor.
- [ ] **Discriminated union ile UI state:** Sayfa durumlarini `{ status: 'loading' } | { status: 'error'; error: ApiError } | { status: 'success'; data: ... }` seklinde modelleyen kucuk bir deney yap; TanStack Query'nin kendi tiplerinin bunu zaten nasil yaptigini incele (`isPending` daralttiktan sonra `data`'nin tanimli olmasi).
- [ ] **Generic bilesen:** Urunler ve siparisler tablosundaki tekrar icin `DataTable<T>` generic bileseni yaz: `columns: Array<{ header: string; cell: (row: T) => ReactNode }>`. Generic constraint'leri ve JSX'te generic sozdizimini ogren.
- [x] **`as const` + tip turetme:** Query key factory'lerdeki `as const` kullaniminin donus tiplerini nasil daralttigini incele; bir key'in tipini `ReturnType<typeof orderQueryKeys.list>` ile cikar.
- [x] **Tip daraltma fonksiyonlari:** `ApiError` icin `isApiError(error: unknown): error is ApiError` type guard'i yaz; `instanceof` kontrollerinin dagildigi yerlerde kullan.
- [x] **Utility type pratigi:** `ProductFormValues`'tan `Partial`, `Pick`, `Omit` ile update payload tipleri turet; kendi `Nullable<T>` gibi kucuk bir mapped type yaz.
- [ ] **Template literal types:** Route path'lerini (`'/urunler' | '/musteriler' | ...`) tek bir union'dan turet; sidebar linklerinin yanlis path almasini derleme zamaninda engelle.
- [x] **`unknown` disiplini:** `http-client.ts`'teki `payload: unknown` akisini takip et; `any` kullanmadan unknown → parse → tipli veri zincirinin neden guvenli oldugunu belgele.
- [ ] **Strict ayarlar:** `tsconfig`'e `noUncheckedIndexedAccess` ekle; patlayan yerleri (or. `watchedItems[index]`) duzgun sekilde coz. Bu ayarin gercek hatalari nasil yakaladigini not et.

---

## 6. React

Mevcut durum: Fonksiyonel bilesenler, `useState`, `useDeferredValue`. Sayfalar sisman; Suspense, Error Boundary, code splitting, portal yok.

- [ ] **Custom hook'lara ayristirma:** `ProductsPage` icindeki filtre + query + mutation mantigini `useProductsPage()` (veya `useProductFilters` + `useProductMutations`) hook'larina cikar. Bilesenin sadece gorunumden sorumlu kalmasini sagla.
- [ ] **Bilesen ayristirma:** Sayfa dosyalarindaki tablo, filtre cubugu, bos/hata durumlarini ayri bilesenlere bol (`shared/components/` altina ortak `EmptyState`, `ErrorState`, `PageHeader`). Uc sayfada kopyalanan hata bloklarini tekillestir.
- [ ] **Error Boundary:** `react-error-boundary` ile route seviyesinde boundary kur; TanStack Query'nin `throwOnError` + `QueryErrorResetBoundary` entegrasyonuyla "tekrar dene" akisini boundary uzerinden calistir.
- [ ] **Suspense + `lazy`:** Route bilesenlerini `React.lazy` ile bolup `<Suspense>` fallback'iyle yukle; Network panelinde chunk'larin gecikmeli indigini izle. Dialog bilesenlerini de lazy yuklemeyi dene.
- [ ] **Portal ile dialog:** Dialoglari `createPortal` ile `document.body`'ye tasi; ardindan native `<dialog>` elementi + `showModal()` yaklasimiyla karsilastir. Focus trap, `Escape` ile kapanma ve arka plan scroll kilidi ekle.
- [ ] **`useEffect` disiplinini gor:** Projede su an neredeyse hic `useEffect` yok — bu iyi. Hangi isler icin effect'in GEREKMEDIGINI (veri cekme → Query, abonelik → Zustand subscribe) kisa notlarla belgele; gercekten gereken bir ornek ekle (or. dialog acikken `Escape` dinleme).
- [ ] **Memoizasyon bilinci:** `useMemo`/`useCallback`/`memo`'yu once OLCMEDEN ekleme; Profiler ile urun listesinde gercek bir yeniden render sorunu bul, sonra hedefli optimize et. "Her seyi memo'la" anti-pattern'ini not et.
- [ ] **`useId` ve erisilebilirlik:** Dialog ve form alanlarindaki elle yazilmis id'leri (`order-status-${order.id}` vb.) gozden gecir; form label iliskilerinde `useId` kullan.
- [ ] **Concurrent ozellikler:** Mevcut `useDeferredValue`'ya ek olarak filtre degisimini `useTransition` ile sarmala; `isPending` gostergesiyle iki yaklasimin farkini karsilastir.
- [ ] **Liste render optimizasyonu (opsiyonel):** Urun listesi buyurse (seed'i 500 kayda cikar) sanal liste (`@tanstack/react-virtual`) dene.

---

## 7. Tailwind CSS (v4)

Mevcut durum: Utility'ler dogrudan; class tekrari cok; dark mode store'da var ama hic uygulanmiyor.

- [ ] **Dark mode'u gercekten uygula:** `@custom-variant dark` (v4) ile class tabanli dark mode kur; Zustand `theme` degerini `<html>` class'ina bagla (Zustand `subscribeWithSelector` maddesiyle birlikte). Tum sayfalarin dark varyantlarini ekle.
- [ ] **`@theme` ile design token:** `index.css`'te `@theme` blogu tanimla: marka rengi (`--color-brand-*`) olarak teal'i tokenlestir; `bg-teal-700` gibi dogrudan renk kullanimlarini `bg-brand-700`'e cevir. Tema degisiminin tek noktadan yonetilmesini sagla.
- [ ] **Class tekrarini bilesenle coz:** `rounded-md bg-teal-700 px-3 py-2 text-sm...` butonu her yerde kopyalanmis. Once `Button` bileseni yaz (variant: primary/secondary/danger); utility-first dunyada tekrarin CSS ile degil bilesenle cozuldugunu kavra.
- [ ] **`data-*` variant'lari:** Secili musteri satiri gibi durumlari `data-selected` attribute + `data-selected:bg-teal-50` variant'iyla yaz; template literal ile class birlestirmeye kiyasla okunabilirligi degerlendir.
- [ ] **`group` ve `peer`:** Tablo satiri hover'inda islem butonlarini gosterme (`group-hover:opacity-100`) gibi bir etkilesim ekle; `peer` ile input durumuna bagli label stili dene.
- [ ] **Container queries:** Dashboard kartlarini viewport yerine kapsayici genisligine gore diz (`@container` + `@lg:grid-cols-2`); media query ile farkini gor.
- [ ] **`form-input` ozel class'ini incele:** `index.css`'teki mevcut ozel class'in nasil tanimlandigina bak; v4'te `@layer components` + `@apply` kullanimini, ne zaman tercih edilip ne zaman kacinilmasi gerektigini not et.
- [ ] **Animasyon ve gecisler:** Toast'lara giris/cikis animasyonu (`transition`, `starting-style` veya keyframe) ekle; dialog acilisina da uygula.
- [ ] **Responsive denetim:** Tum sayfalari mobil genislikte gozden gecir; tablolarin `overflow-x-auto` disinda mobil kart gorunumune donusmesi gibi bir kirilim dene.
- [ ] **`clsx`/`tailwind-merge` (opsiyonel):** `Button` bileseninde variant + disaridan gelen `className` birlesimini `tailwind-merge` ile coz; class cakismasi sorununu bizzat gor.

---

## Uygulama Adimlari: Branch ve Commit Plani

### Adim 1 — Zod ve veri katmani temeli

- **Branch:** `refactor/zod-veri-katmani`
- **Amac:** Tum sonraki adimlarin uzerine kurulacagi sema ve hata altyapisini saglamlastirmak.
- **Maddeler:**
  - Sema tekilligi ve paylasim (Zod)
  - Sema kompozisyonu (Zod)
  - Server hata govdesini parse et (Zod)
  - Ortak hata haritasi (Zod)
  - `safeParse` sonucunu isleme (Zod)
  - Env dogrulamayi derinlestir (Zod)
  - `z.input` vs `z.output` ayrimini netlestir (Zod)
  - `transform` ve `pipe` (Zod)
  - `discriminatedUnion` (Zod)
  - Tip daraltma fonksiyonlari — `isApiError` (TypeScript)
  - `unknown` disiplini (TypeScript)
  - Utility type pratigi (TypeScript)

### Adim 2 — Zustand temeli: toast ve global hata

- **Branch:** `feature/toast-global-hata`
- **Amac:** Tum mutation ve query hatalarinin tek merkezden kullaniciya bildirilmesi.
- **Maddeler:**
  - Toast kuyrugu store'u (Zustand)
  - Store'a component disindan erisim (Zustand)
  - Store testi (Zustand)
  - Devtools middleware (Zustand)
  - Selector disiplini (Zustand)
  - `useShallow` (Zustand)
  - Global hata yonetimi — `QueryCache.onError` / `MutationCache.onError` (TanStack Query)

### Adim 3 — TanStack Query I: parametreli key'ler, filtre ve sayfalama

- **Branch:** `feature/query-filtre-sayfalama`
- **Amac:** Client-side filtrelemeyi server-side'a tasiyip cache anahtarlarini parametrelestirmek.
- **Maddeler:**
  - Server-side filtreleme + parametreli query key (TanStack Query)
  - `queryOptions` helper (TanStack Query)
  - Sayfalama + `placeholderData: keepPreviousData` (TanStack Query)
  - `select` ile veri donusumu (TanStack Query)
  - `staleTime`/`gcTime` deneyleri (TanStack Query)
  - `as const` + tip turetme (TypeScript)

### Adim 4 — TanStack Query II: cache stratejileri ve gelismis sorgular

- **Branch:** `feature/query-cache-stratejileri`
- **Amac:** Cache'i bilincli yonetmek; okuma/yazma stratejilerini ve gelismis sorgu araclarini ogrenmek.
- **Maddeler:**
  - `setQueryData` vs `invalidateQueries` deneyi (TanStack Query)
  - Optimistic update'i yayginlastir (TanStack Query)
  - Prefetching (TanStack Query)
  - Dependent query'yi derinlestir (TanStack Query)
  - Para birimi tercihini islevsel yap (TanStack Query)
  - `useQueries` ile paralel sorgular (TanStack Query)
  - Mutation state paylasimi (TanStack Query)
  - Infinite query (TanStack Query)

### Adim 5 — React Hook Form derinligi

- **Branch:** `feature/rhf-derinligi`
- **Amac:** Form davranislarini profesyonellestirmek; form state sinirlarini pratikte kavramak.
- **Maddeler:**
  - Validasyon modlari (RHF)
  - Server hatasini alana esle (RHF — Adim 1'deki hata govdesi parse'ina dayanir)
  - `formState` derinligi (RHF)
  - Reset pattern'leri (RHF)
  - `price` varsayilan degeri celiskisini coz (RHF)
  - `useWatch` vs `watch` vs `getValues` (RHF)
  - `Controller` ihtiyacini gor (RHF)
  - `useFieldArray` ileri kullanim (RHF)
  - Odak yonetimi (RHF)
  - Form bilesenini ayristir (RHF)
  - Cok adimli form (RHF)
  - Refine performans bilinci (Zod — siparis formu baglaminda)
  - `useId` ve erisilebilirlik (React — form label iliskileri baglaminda)
  - Siparis taslagi (draft) store'u (Zustand — form state ↔ client state siniri)

### Adim 6 — React yapisal iyilestirme

- **Branch:** `refactor/react-yapisal`
- **Amac:** Sisman sayfalari ayristirmak; Suspense, Error Boundary ve code splitting'e gecmek.
- **Maddeler:**
  - Custom hook'lara ayristirma (React)
  - Bilesen ayristirma (React)
  - Error Boundary (React)
  - Suspense + `lazy` (React)
  - `useSuspenseQuery` + Suspense (TanStack Query — bilerek bu adimda: Error Boundary on kosuludur)
  - Portal ile dialog (React)
  - `useEffect` disiplinini gor (React)
  - Memoizasyon bilinci (React)
  - Concurrent ozellikler (React)
  - Liste render optimizasyonu (React)
  - `satisfies` operatoru (TypeScript)
  - Discriminated union ile UI state (TypeScript)
  - Generic bilesen — `DataTable<T>` (TypeScript)
  - Template literal types (TypeScript)
  - Strict ayarlar — `noUncheckedIndexedAccess` (TypeScript)

### Adim 7 — Tailwind: tema ve gorunum

- **Branch:** `feature/tema-gorunum`
- **Amac:** Dark mode'u uctan uca kurmak, tasarim token'lari ve gorsel etkilesimleri tamamlamak.
- **Maddeler:**
  - `subscribeWithSelector` (Zustand — dark mode'un on kosulu)
  - Dark mode'u gercekten uygula (Tailwind)
  - `@theme` ile design token (Tailwind)
  - Class tekrarini bilesenle coz (Tailwind)
  - `clsx`/`tailwind-merge` (Tailwind — `Button` bileseniyle birlikte)
  - `data-*` variant'lari (Tailwind)
  - `group` ve `peer` (Tailwind)
  - Container queries (Tailwind)
  - `form-input` ozel class'ini incele (Tailwind)
  - Animasyon ve gecisler (Tailwind — Adim 2'deki toast'lara uygulanir)
  - Responsive denetim (Tailwind)
  - Slice pattern (Zustand — store artik tema + sidebar + tablo + toast + taslak icerir)
  - Persist derinligi (Zustand)

