# Stok ve Siparis Yonetim Paneli

Kucuk bir isletmenin urunlerini, stok seviyelerini, musterilerini ve siparislerini yonetmek icin gelistirilmis React tabanli bir yonetim panelidir. Uygulama ekranda duran sabit ornek verilerle calismaz: frontend, yerelde calisan bir REST API'ye HTTP istekleri gonderir. Yeni siparis olusturuldugunda API stoklari dusurur ve degisiklikleri `server/db.json` dosyasina yazar.

Bu proje, React uygulamalarinda server state, form state ve global UI state'in neden farkli araclarla yonetilmesi gerektigini calisan bir ornek uzerinden gostermek icin tasarlandi.

## Icindekiler

- [Neler yapilabilir?](#neler-yapilabilir)
- [Teknolojiler ve sorumluluklari](#teknolojiler-ve-sorumluluklari)
- [Hizli baslangic](#hizli-baslangic)
- [Komutlar](#komutlar)
- [Uygulama sayfalari](#uygulama-sayfalari)
- [Siparis akisi ve stok kurali](#siparis-akisi-ve-stok-kurali)
- [Mimari ve veri akisi](#mimari-ve-veri-akisi)
- [REST API](#rest-api)
- [Veri modeli](#veri-modeli)
- [Yapilandirma](#yapilandirma)
- [Klasor yapisi](#klasor-yapisi)
- [Test, kalite ve gelistirme](#test-kalite-ve-gelistirme)
- [Sinirlar ve bilincli tercihler](#sinirlar-ve-bilincli-tercihler)

## Neler yapilabilir?

- Dashboard'da toplam urun, dusuk stok, acik siparis ve toplam ciro metrikleri gorulur.
- Urunler aranabilir, kategoriye veya stok durumuna gore filtrelenebilir; urun eklenebilir, duzenlenebilir ve silinebilir.
- Musteri secilince iletisim bilgileri ve sadece o musterinin siparis gecmisi gorulur.
- Siparisler duruma gore filtrelenebilir; durumlari guncellenebilir.
- Yeni sipariste musteri secilir, birden fazla kalem eklenir veya silinir, urun ve miktar belirlenir.
- Form, ayni urun birden fazla kalemde secilmis olsa bile toplam istenen miktarin stogu asmamasini kontrol eder.
- Tema, yan menu aciklik durumu ve tablo yogunlugu tarayicida saklanir.
- Profil bilgileri ve para birimi tercihi API uzerinden guncellenebilir.

## Teknolojiler ve sorumluluklari

| Teknoloji | Bu projedeki gorevi |
| --- | --- |
| React 19 + TypeScript | Sayfalari, bilesenleri ve tip guvenli uygulama kodunu olusturur. |
| Vite | Gelistirme sunucusunu, HMR'i ve production derlemesini saglar. |
| React Router | Sayfalar arasinda gezinmeyi saglar. |
| TanStack Query | API verisini ceker, cache'ler, loading/error durumlarini yonetir ve mutation sonrasinda yeniler. |
| React Hook Form | Urun, siparis ve profil formlarindaki alan degerlerini yonetir. |
| Zod | Form girdilerini ve API cevaplarini calisma aninda dogrular. |
| Zustand | Tema, yan menu ve tablo yogunlugu gibi global UI tercihlerini tutar. |
| json-server | `server/db.json` dosyasini kullanan yerel mock REST API'dir. |
| Vitest | Siparis formunun stok dogrulama kurallarini test eder. |
| Tailwind CSS + Lucide React | Arayuz stillerini ve ikonlari saglar. |

## Hizli baslangic

### Gereksinimler

- Guncel bir Node.js LTS surumu ve onunla gelen `npm`
- Iki terminal penceresi: biri API, biri frontend icin

### 1. Bagimliliklari yukleyin

```bash
npm install
```

Bu komut sadece ilk kurulumda veya `package.json` degistiginde gerekir.

### 2. Mock API'yi baslatin

Birinci terminalde:

```bash
npm run api
```

Basarili oldugunda API `http://localhost:3001` adresinde dinler.

### 3. Frontend'i baslatin

Ikinci terminalde:

```bash
npm run dev
```

Terminalin gosterdigi Vite adresini tarayicida acin. Varsayilan adres genellikle `http://localhost:5173` olur.

> `npm run dev` tek basina yeterli degildir. Uygulamanin veri cekebilmesi icin API terminalinin de acik kalmasi gerekir.

## Komutlar

| Komut | Ne yapar? |
| --- | --- |
| `npm run dev` | Vite gelistirme sunucusunu HMR ile baslatir. |
| `npm run api` | Mock REST API'yi 3001 portunda baslatir. |
| `npm run api:delay` | API'yi her istekte 700 ms yapay gecikmeyle baslatir; loading durumlarini incelemek icindir. |
| `npm run seed` | `server/db.json`'i `server/seed-fixture.json`'dan bastan uretir; API kapaliyken calistirilir. |
| `npm run build` | TypeScript kontrolunu ve production Vite derlemesini calistirir; cikti `dist/` klasorune gider. |
| `npm run build:profile` | Profiling build uretir (`react-dom/profiling` alias'i ile); **su an CALISMIYOR** — uretilen bundle runtime'da boot-crash veriyor (IB1a, 2026-09-23). Kullanma. |
| `npm run preview` | Olusturulmus production derlemesini yerelde onizler. Once `npm run build` calistirilmalidir. |
| `npm run preview:profile` | Profiling build'i onizler; **su an CALISMIYOR** (ust satirla ayni sebep). |
| `npm run lint` | ESLint kurallarini `src/` (TS/TSX) ve `server/` (JS/CJS) dosyalarinda calistirir. |
| `npm run test` | Vitest testlerini bir kez calistirir. |

## Uygulama sayfalari

Tum sayfalar ortak bir uygulama kabugu icinde calisir. Kabuk; logo, acilip kapanabilen yan menu ve sayfa icerigi alanindan olusur.

| Adres | Sayfa | Davranis |
| --- | --- | --- |
| `/` | Dashboard | Urunler ve siparisler paralel cekilir. Dort metrik ve dusuk stok uyarilari gosterilir. |
| `/urunler` | Urunler | Isim/SKU aramasi, kategori ve stok filtresi; ekleme, duzenleme ve silme islemleri. |
| `/musteriler` | Musteriler | Soldan musteri secilir, sagda detaylari ve siparis gecmisi gorulur. Siparis sorgusu, musteri secilene kadar gonderilmez. |
| `/siparisler` | Siparisler | Durum filtreli siparis tablosu, durum guncelleme ve dinamik kalemli siparis olusturma formu. |
| `/ayarlar` | Ayarlar | Profil formu ile tema ve tablo yogunlugu tercihleri. |

### Dashboard hesaplari

- **Toplam urun:** Aktif urunlerin sayisi (sunucu `active=true` ile onceden filtreler; `_limit=1` isteginin `X-Total-Count` basligindan okunur).
- **Dusuk stok:** Aktif urunler icinde `stock` degeri `reorderLevel` degerine esit veya ondan az olanlar.
- **Acik siparis:** Durumu `pending` ya da `paid` olan siparisler.
- **Toplam ciro:** Durumu `cancelled` olmayan siparislerin `total` degerleri toplami.

Dashboard verisi 30 saniye boyunca fresh kabul edilir. Bu sure icinde ayni query tekrar kullanilirsa cache'deki deger kullanilabilir.

### Urunler

Urun formunda ad, SKU, kategori, birim fiyat, stok ve yeniden siparis seviyesi bulunur. Kurallar:

- Ad en az 2 karakter olmalidir.
- SKU en az 3 karakter olmalidir.
- Kategori secilmelidir.
- Fiyat sifirdan buyuk olmalidir.

Urun ekleme veya duzenleme basarili olunca urun listesi ve dashboard cache'i gecersiz kilinir. Silme islemi onay gerektirir.

### Musteriler

Musteri listesi ilk yuklemede getirilir. Bir musteri secilince `GET /orders?customerId=...` istegiyle sadece o musterinin siparisleri cekilir. Bu bir dependent query ornegidir: secili musteri yokken siparis gecmisi icin gereksiz istek atilmaz.

### Siparisler

Siparis listesindeki durum secicisi, kaydi API'ye gunceller. Arayuz once optimistic update ile yeni durumu gosterir. Istek basarisiz olursa onceki cache degeri geri yuklenir.

Siparis olusturma formunda:

1. Musteri secmek zorunludur.
2. En az bir siparis kalemi eklemek zorunludur.
3. Her kalemde urun ve en az 1 adet miktar secilir.
4. Ayni urun birden fazla kalemdeyse miktarlar toplanir.
5. Toplam miktar mevcut stogu asarsa form gonderilmez.
6. Form basariliysa API siparisi olusturur, urun stoklarini dusurur; ardindan siparis, urun, musteri siparisleri ve dashboard query'leri yenilenir.

### Ayarlar

Profil formu ad, e-posta, sirket adi ve para birimi alanlarini `PATCH /profile` ile kaydeder. Kaydet dugmesi formda degisiklik yoksa pasiftir.

Tema (`light`/`dark`), yan menu aciklik durumu ve tablo yogunlugu (`compact`/`comfortable`/`spacious`) API'ye gonderilmez. Bunlar Zustand `persist` middleware'i ile tarayicinin `localStorage` alaninda `stok-siparis-yonetim-paneli-preferences` anahtariyla saklanir.

## Siparis akisi ve stok kurali

Siparis olusturmak iki katmanda dogrulanir.

1. **Tarayici:** Zod semasi musteri, kalem ve miktar kurallarini kontrol eder. Formdaki urunler uzerinden ayni urunun toplam miktari hesaplanir; bu toplam eldeki stogu gecemez.
2. **Sunucu:** `POST /orders` istegi tekrar kontrol edilir. Musteri bulunamazsa, urun yoksa/pasifse, miktar gecersizse veya stok yetersizse istek hata ile sonlanir.
3. **Basarili sonuc:** Sunucu urunlerin o anki fiyatlarini siparis kalemlerine yazar, `lineTotal` ve siparis `total` degerini hesaplar, stoktan duserek yeni siparisi kaydeder ve `201 Created` doner.

Ornek: stokta 5 adet urun varsa, ayni urun iki farkli kalemde 3 ve 3 adet secildiginde toplam 6 olur. Form bu siparisi gondermez. Tarayicidaki stok eski kalmis olsa bile sunucu ayni kurali tekrar kontrol ettigi icin yetersiz stokla siparis kaydi olusmaz.

## Mimari ve veri akisi

### State'in sahibi kim?

| Veri turu | Nerede tutulur? | Ornek |
| --- | --- | --- |
| Server state | TanStack Query cache | Urunler, musteriler, siparisler, profil ve dashboard verileri |
| Form state | React Hook Form | Acik urun veya siparis formundaki henuz kaydedilmemis alanlar |
| Global UI state | Zustand | Tema, yan menu durumu, tablo yogunlugu |
| Kalici uygulama verisi | `server/db.json` | Urunler, musteriler, siparisler, kategoriler ve profil |

Bu ayrim ayni verinin birden fazla yerde kopyalanmasini onler. Ornegin urun listesi Zustand'a kopyalanmaz; API'den gelen tek kaynak TanStack Query cache'idir.

### HTTP istemcisi

Tum feature API dosyalari ortak `request` fonksiyonunu kullanir. Bu istemci API adresi ile endpoint yolunu birlestirir, istek govdesini JSON'a cevirir, HTTP ve ag hatalarini `ApiError` olarak iletir, ardindan donen cevabi Zod semasiyla dogrular.

Bu nedenle TypeScript tipi sadece kod yazarken degil, API cevabi geldikten sonra da kontrol edilir.

### Query davranisi

- Query verileri varsayilan olarak 30 saniye fresh kabul edilir.
- Pencereye yeniden odaklanmak otomatik refetch baslatmaz.
- HTTP `4xx` cevaplari tekrar denenmez.
- Ag hatalari ve `5xx` hatalari en fazla iki kez yeniden denenebilir.
- Mutation'lar otomatik tekrar denenmez; cift kayit olusmasi riski azaltilir.
- TanStack Query Devtools uygulamada bulunur ve baslangicta kapali gelir.

## REST API

Varsayilan taban adresi `http://localhost:3001` adresidir. `POST /orders` disindaki standart kaynak endpoint'leri `json-server` tarafindan saglanir.

| Method | Endpoint | Amac |
| --- | --- | --- |
| `GET` | `/products` | Urunleri getirir. Ozel handler: `search` (ad+SKU birlesik), `categoryId`, `active` (`true`/`false`), `stock` (`low`/`in-stock`) filtreleri ve `_page`/`_limit` sayfalama; `X-Total-Count` basligi dilimlemeden onceki filtrelenmis toplami tasir. |
| `POST` | `/products` | Yeni urun olusturur. |
| `PATCH` | `/products/:id` | Urunu gunceller. |
| `DELETE` | `/products/:id` | Urunu siler. |
| `GET` | `/categories` | Urun kategori listesini getirir. |
| `GET` | `/customers` | Musterileri getirir. |
| `GET` | `/orders` | Siparisleri getirir. |
| `GET` | `/orders?customerId=:id` | Bir musterinin siparislerini getirir. |
| `POST` | `/orders` | Siparis olusturur ve ilgili urun stoklarini dusurur. |
| `PATCH` | `/orders/:id` | Siparisin sadece durumunu gunceller; `shipped`'a geciste `trackingNumber` uretir, `cancelled`'da `cancelReason` yazar, diger durumlarda bu iki alani temizler. |
| `GET` | `/profile` | Profil bilgisini getirir. |
| `PATCH` | `/profile` | Profil bilgisini gunceller. |

### `POST /orders` istek ve cevap sozlesmesi

Istek govdesi yalnizca musteri kimligini ve kalemleri tasir:

```json
{
  "customerId": "cus-001",
  "items": [
    { "productId": "prd-001", "quantity": 2 },
    { "productId": "prd-003", "quantity": 1 }
  ]
}
```

Sunucu fiyatlari istemciden almaz. Kayitli urunun o anki fiyatini kullanir, kalem toplamlarini ve siparis toplamlarini kendi hesaplar. Basarili cevapta sunucu tarafinda uretilmis benzersiz siparis kimligi, `pending` durumu, ISO tarih, hesaplanmis `total` ve her kalemin `unitPrice`/`lineTotal` degerleri bulunur.

| Hata durumu | HTTP kodu |
| --- | --- |
| Musteri veya siparis kalemi eksik, urun kimligi/miktari gecersiz | `400` |
| Musteri bulunamadi; urun bulunamadi veya aktif degil | `404` |
| Urun stogu yetersiz | `409` |

## Veri modeli

Kanonik ornek veri `server/seed-fixture.json`'dan `npm run seed` ile uretilir: 3 kategori, 1000 urun, 8 musteri, 45 siparis ve 1 profil kaydi bulunur. Uretim deterministiktir; cikti `server/db.json`'dir.

| Kaynak | Alanlar |
| --- | --- |
| `categories` | `id`, `name` |
| `products` | `id`, `name`, `sku`, `categoryId`, `price`, `stock`, `reorderLevel`, `active`, `createdAt`, `updatedAt` |
| `customers` | `id`, `name`, `email`, `phone`, `company`, `createdAt` |
| `orders` | `id`, `customerId`, `status`, `total`, `createdAt`, `items` |
| `orders[].items[]` | `productId`, `productName`, `quantity`, `unitPrice`, `lineTotal` |
| `profile` | `id`, `name`, `email`, `companyName`, `currency` |

API uzerinden yaptiginiz olusturma, duzenleme ve silme islemleri `server/db.json` dosyasina yazilir. Bu nedenle sunucuyu kapatip acmak degisiklikleri geri almaz. Baslangic verisine donmek icin API'yi durdurup `npm run seed` calistirin (dosyayi bastan uretir); elinizle duzenlemeniz de mumkundur.

## Yapilandirma

Frontend API adresini `VITE_API_URL` ortami belirler. Deger verilmezse varsayilan olarak `http://localhost:3001` kullanilir.

Farkli bir API adresi kullanmak icin proje kokunde `.env` dosyasi olusturun:

```env
VITE_API_URL=http://localhost:3001
```

Bu deger tam bir URL olmalidir. Gecersiz bir URL, uygulama baslarken Zod tarafindan hata olarak yakalanir. `.env` degistiginde Vite gelistirme sunucusunu yeniden baslatin.

## Klasor yapisi

```text
src/
  app/
    config/env.ts              Ortam degiskeni dogrulamasi
    layout/app-shell.tsx       Ortak header, yan menu ve sayfa yerlesimi
    lazy-pages.ts              Route seviyesi React.lazy bilesenleri
    providers.tsx              QueryProvider ve Devtools
    query-client.ts            TanStack Query varsayilanlari
    router.tsx                 Uygulama rotalari
    routes.ts                  Tek segmentli route tipleri
    theme-sync.ts              Tema degisimini <html> sinifina baglayan abonelik
  features/
    dashboard/                 Dashboard API'si ve sayfasi
    products/                  Urun API'si, sayfasi, bilesenleri ve hook'lari
    customers/                 Musteri API'si ve detay sayfasi
    orders/                    Siparis API'si, formu, sayfasi, bilesenleri, hook'lari ve taslak store'u
    settings/                  Profil API'si ve ayarlar sayfasi
  shared/
    api/                       Ortak HTTP istemcisi, ApiError ve Zod hata bicimlendirme
    components/                Ortak bilesenler (button, data-table, dialog, empty-state, error-state, page-header, stale-banner, toaster)
    lib/cn.ts                  clsx + tailwind-merge birlesimi
    stores/                    ui-store (kalici UI tercihleri) ve toast-store (bildirim kuyrugu)
server/
  server.cjs                   json-server kurulumu ve ozel siparis/urun endpoint'leri
  db.json                      Kalici mock veri kaynagi (uretilmis cikti)
  seed.js                      Fixture'dan veritabani uretir (saf, yan etkisiz)
  seed-cli.js                  db.json'i bastan yazan CLI katmani
  seed-fixture.json            Kanonik seed verisinin kaynagi
  seed.test.js                 Seed uretiminin Vitest testleri
```

Her feature kendi API katmanini, sayfasini ve varsa bilesenlerini bir arada tutar. Sayfa bilesenleri HTTP ayrintilarini dogrudan yazmaz; bu is feature altindaki `api/` dosyalarinda kalir.

## Test, kalite ve gelistirme

```bash
npm run test
npm run lint
npm run build
```

Mevcut Vitest testleri (13 dosya; dordu tip-testi) siparis ve urun API'lerinin davranislarini, store'larin saf mantigini, Zod hata bicimlendirmesini ve seed uretimini kapsar:

- Stok miktarina esit siparisin kabul edilmesi.
- Stogu asan miktardaki siparisin reddedilmesi.
- Ayni urunun birden fazla kalemde secilmesi halinde toplam miktarin kontrol edilmesi.
- Optimistic silme/geri getirme, sayfalama sinirlari, migrate ve toast/store davranislari.

Loading durumlarini gozlemlemek icin normal API yerine `npm run api:delay` calistirin. Network, cache, invalidate ve retry davranislarini incelemek icin TanStack Query Devtools panelini acin.

## Sinirlar ve bilincli tercihler

- Bu bir mock backend'dir; production veritabani, kimlik dogrulama, yetkilendirme ve kullanici oturumu yoktur.
- Uygulama tek profil kaydi varsayar; `/profile` isteginde kullaniciya gore erisim kontrolu yapilmaz.
- Parasal tutarlar JavaScript'in `number` tipiyle (kayan nokta) hesaplanir. Carpma ve toplama islemlerinde `17998.800000000003` gibi hassasiyet sapmalari olusabilir; kurus duzeyinde kesinlik gereken gercek bir sistemde tutarlar en kucuk birim (kurus) uzerinden tamsayi olarak tutulmalidir.
- Siparis olusturulunca stok azalir. Bir siparisi `cancelled` yapmak stoklari otomatik geri eklemez; durum guncelleme endpoint'i yalnizca `status` alanini degistirir.
- Tema ve tablo yogunlugu profil kaydina degil, kullanilan tarayicinin `localStorage` alanina yazilir. Baska bir tarayiciya veya cihaza tasinmaz.
- API calismiyorsa frontend veri yukleyemez; ekranlarda hata ve tekrar deneme durumlari gorulur.

## Sik karsilasilan durumlar

| Belirti | Muhtemel neden ve cozum |
| --- | --- |
| Ekranda baglanti hatasi gorunuyor | API calismiyordur. Ayri terminalde `npm run api` calistirin ve 3001 portunun kullanilabilir oldugunu kontrol edin. |
| Yeni eklenen siparis veya urun daha sonra da gorunuyor | Beklenen davranistir. json-server degisikligi `server/db.json` dosyasina yazmistir. |
| Tema ya da tablo yogunlugu tarayiciyi kapatinca korunuyor | Beklenen davranistir. Tercihler `localStorage` icinde saklanir. |
| `.env` degistigi halde eski API adresi kullaniliyor | Vite sunucusunu durdurup `npm run dev` ile yeniden baslatin. |
| Siparis formu ayni urunu iki kez ekleyince hata veriyor | Iki kalemin miktari birlikte hesaplanir; toplam stoktan buyukse siparis bilincli olarak engellenir. |
