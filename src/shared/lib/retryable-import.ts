// B2 (Adim 8 / IB2): React.lazy'in kalici-hata semantigini asmak icin loader'i sarar.
// OLCULDU (S7, Deney 1): tarayicinin modul haritasi basarisiz chunk'i URL bazinda
// onbellege alir — ayni URL'ye ikinci import() aga CIKMADAN ayni reddi dondurur.
// OLCULDU (S7, Deney 2): ayni dosyanin `?retry=N` sonekli URL'si YENI bir modul haritasi
// girdisi acar, gercek bir ag istegi uretir ve basarili olabilir.
// OLCULDU (S7, uctan uca): retry import'unun ham modulu named export tasir — React.lazy
// `default` ister (React error #306). Bu yuzden ikinci import'un sonucu da ayni
// default-koprusunden (mapModule) gecer; lazy-pages.ts'teki `.then((m) => ({ default: m.X }))`
// kalibinin aynisi uygulanir.
// React.lazy hala ilk cagriyi bir kez yapar (kalici hata kaydi — react.development.js:460-496);
// bu sarmalayici ilk cagrinin ICINDE gercek retry'i uretir. ErrorBoundary'nin "Tekrar dene"si
// (DialogErrorBoundary) ayri katmandir (I5).
// Bildirim politikasi: hata toast URETMEZ — chunk hatasi query degildir, ErrorBoundary'ye
// duser (Gecis 2 §2.12, KACAK'TAN §8d'nin ongorusu).

// "Failed to fetch dynamically imported module: <url>" — Chromium formati (S7 Deney 3).
// Tarayici bu formatta yazmazsa retry yapilmaz, orijinal hata aynen firlatilir.
const CHUNK_URL_REGEX = /dynamically imported module: (\S+)/

type ModuleMap<T> = (module: Record<string, unknown>) => { default: T }

// T, mapModule'un donus tipinden cikarilir — cagri yerinde `(module) => ({ default: m.X })`
// yazmak yeterli, generic elle verilmez. `as T` gerekli cunku Record'in degerleri unknown'dur.
export function retryableImport<T>(
  loader: () => Promise<Record<string, unknown>>,
  mapModule: ModuleMap<T>,
): () => Promise<{ default: T }> {
  return async () => {
    try {
      const module = await loader()
      return mapModule(module)
    } catch (error) {
      const url = error instanceof Error ? CHUNK_URL_REGEX.exec(error.message)?.[1] : undefined
      if (url === undefined) throw error
      // Cache-busting: ayni icerik, farkli modul haritasi girdisi (Deney 2).
      // Sonuc ayni default-koprusunden gecer (React #306 onlemi).
      const module = (await import(/* @vite-ignore */ `${url}?retry=1`)) as Record<string, unknown>
      return mapModule(module)
    }
  }
}
