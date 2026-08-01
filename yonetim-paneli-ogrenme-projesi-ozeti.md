# Yonetim Paneli Ogrenme Projesi - Kalici Baglam Ozeti

> Bu belge, yeni bir sohbet/oturum acildiginda projeye ayni hedef ve kararlarla devam etmek icin yazildi. Uygulama henuz baslatilmadi; bu metin baslangic sozlesmesidir.

---

## 1. Kullanici Profili ve Asil Ihtiyac

Kullanici frontend developer adayi. Su teknolojileri daha once ogrendi:

- HTML, CSS, Sass, Tailwind
- JavaScript
- React
- TypeScript
- Zod
- Zustand
- TanStack Query
- React Hook Form (RHF)

Kullanici henuz Next.js ogrenmedi. Bu proje Next.js ogrenme projesi degildir; odak yukaridaki teknolojilerin birlikte, gercek bir uygulama icinde nasil calistigini anlamaktir.

Tek tek konular ust uste ogrenildigi icin unutulan ve birbirine karisan noktalar var. Hedef, tum notlari bastan okumak degil; gercek bir yapi uzerinde tekrar yaparak su sorulara net cevap verebilmektir:

- Hangi veri TanStack Query'de olmali?
- Hangi veri Zustand'da olmali?
- Hangi veri yalnizca RHF form state'i olarak kalmali?
- Zod hangi sinirlarda calismali?
- Mutation sonrasi cache nasil guncellenmeli?
- Loading, error, empty state, retry, cache ve refetch pratikte nasil davranir?

Bu nedenle ayri ayri dort kucuk proje yerine, tum teknolojileri tekrar tekrar kullanan **tek, buyuk ve calisan proje** istendi.

---

## 2. Kesinlesen Proje Fikri

Proje, kucuk isletmeler icin bir **siparis ve stok yonetim paneli** olacak.

Bu, sadece gostermelik bir CRUD ekrani degil; gercek frontend problemlerini iceren, veri akislarini gozlemlemeye uygun bir uygulama olacak:

- Urun listesi, arama, filtreleme, siralama ve sayfalama
- Urun ekleme, duzenleme ve silme
- Stok miktari ve dusuk stok uyarilari
- Musteri listesi ve musteri detaylari
- Musteriye ait siparisleri gosterme
- Siparis listesi ve durum filtreleme
- Dinamik siparis olusturma
- Siparis durumunu guncelleme (`pending -> paid -> shipped` gibi)
- Dashboard metrikleri, son siparisler ve dusuk stok uyarilari
- Profil/uygulama ayarlari
- Tema, sidebar, tablo gorunumu ve toast bildirimleri
- Loading, empty, error, retry ve basarili durumlar

Proje, frontend developer portfolyosuna uygun gercekci bir yonetim paneli davranisi sergilemeli; fakat ilk amac gosteri tasarimi degil, saglam uygulama mimarisi ve ogrenme degeri olmali.

---

## 3. Backend ve Gozlemlenebilirlik Karari

TanStack Query'yi gercekten ogrenmek icin frontend'in HTTP API ile konusmasi gerekir. Statik JSON import etmek yetersizdir; bu durumda caching, stale data, refetch, mutation, invalidation, retry, network error ve optimistic update gercekten gorulemez.

Ilk surumde ayri bir production backend yazmak zorunlu degil. Bunun yerine **`json-server` ile calisan mock REST API** kullanilacak.

Bu karar "backend varmis gibi" davranmak degildir. Frontend acisindan gercek REST API davranisi alinir:

- `GET`, `POST`, `PATCH`, `DELETE` HTTP istekleri gider.
- Tarayicinin Network panelinde istekler gorulur.
- Veri `db.json` dosyasina yazilabildigi icin yenilemeden sonra da degisiklik gozlemlenir.
- Gecikme ve hata durumlari kontrollu olarak uretilebilir.
- TanStack Query Devtools ile cache'in yasam dongusu incelenebilir.

Baslangicta dusunulen API kaynaklari:

```json
{
  "products": [],
  "customers": [],
  "orders": [],
  "profile": {},
  "categories": []
}
```

Olası endpoint ornekleri:

- `GET /products?search=&category=&stock=&_page=&_limit=`
- `POST /products`, `PATCH /products/:id`, `DELETE /products/:id`
- `GET /customers`, `GET /customers/:id`
- `GET /orders?customerId=&status=`
- `POST /orders`, `PATCH /orders/:id`
- `GET /profile`, `PATCH /profile`

Ileride ayni frontend, Supabase, Firebase, Appwrite veya kucuk bir Express API'ye tasinabilir. Ilk asamada bunu yapmak zorunlu degildir; ogrenme hedefi frontend state ve API entegrasyonudur.

---

## 4. Teknolojilerin Kesin Sorumluluk Sinirlari

### React

- Sayfalar, layout, bilesen kompozisyonu ve kullanici etkilesimleri.
- Ekranin nasil gorundugu ve kullanicinin eylemlerine nasil cevap verdigi.

### TypeScript

- Domain modelleri: `Product`, `Customer`, `Order`, `Profile`, `Category`.
- API request/response tipleri.
- Form input tipleri ve bilesen prop sozlesmeleri.
- Derleme zamaninda yanlis veri kullaniminin yakalanmasi.

### React Hook Form

- Urun, musteri, profil ve siparis formlarinin alan state'i.
- Form gonderimi, touched/dirty state, alan hatalari.
- Siparis kalemleri icin `useFieldArray`: kalem ekleme, silme, urun secme, miktar degistirme.
- Form degerleri, gerekli olmadikca Zustand'a veya TanStack Query cache'ine tasinmaz.

### Zod

- RHF form kurallarinin tek dogruluk kaynagi.
- Ornek kurallar: zorunlu alanlar, pozitif miktar, gecerli fiyat, stok yeterliligi, siparis kalemi sayisi.
- Kritik API response'larinin runtime'da beklenen sekilde geldigini dogrulama.
- Zod semasindan TypeScript tiplerinin turetilebilmesi.
- TypeScript yalnizca derleme zamani varsayimini guvenceye alir; API'den calisma aninda gelen verinin sekli Zod ile kontrol edilir.

### TanStack Query

- Sunucunun gercegi olan veriler: urunler, musteriler, siparisler, profil, kategoriler, dashboard metrikleri.
- Fetching, cache, stale time, retry, background refetch, loading/error state, mutation ve cache senkronizasyonu.
- Query function'lar bilesenlerin icinde yazilmaz; feature'a ait API/data katmaninda tanimlanir.
- Query key'ler merkezî ve tutarli olmali; filtre ve sayfalama parametrelerini kapsamalidir.
- Mutation basarisindan sonra ihtiyaca gore `invalidateQueries` veya `setQueryData` uygulanir.

### Zustand

- Server verisinin kopyasi icin kullanilmaz.
- Uygulama capindaki client/UI state icin kullanilir:
  - tema
  - sidebar acik/kapali durumu
  - toast/bildirim kuyrugu
  - tablo yogunlugu veya gorunum tercihi
  - gerekiyorsa gonderilmemis siparis taslagi
- Tercihler uygun oldugunda `persist` middleware ile `localStorage`'da saklanabilir.

### `json-server`

- Frontend'in gercek HTTP uzerinden konusacagi, kalici mock REST API.
- Backend ayrintilarina odaklanmadan frontend veri akislarini gercekci bicimde denemeyi saglar.

Kisa sinir ozeti:

```ts
// Server state: TanStack Query
products;
customers;
orders;

// Form state: React Hook Form
orderFormValues;

// Global UI/client state: Zustand
isSidebarOpen;
theme;
toastQueue;
selectedTableDensity;
```

---

## 5. Ana Sayfalar ve Ogrenme Amaclari

### Dashboard

- Toplam urun, dusuk stoklu urun, acik siparis ve toplam satis metrikleri.
- Son siparisler ve dusuk stok uyarilari.
- Birden fazla query'nin paralel calismasi icin alan.

### Urunler

- Arama, kategori filtresi, stok filtresi, siralama ve sayfalama.
- Urun ekleme/duzenleme formu: RHF + Zod + mutation.
- Silme onay modali.
- Query key'in filtre parametreleriyle nasil degistigini inceleme.
- Basarili mutation sonrasi urun listesinin invalidate edilmesi veya cache'in dogrudan guncellenmesi.

### Musteriler

- Musteri listesi ve musteri detay ekrani.
- Musteri secilmeden calismayan siparis sorgusu ile dependent query.
- Musteriye ait siparisleri gosterme.

### Siparisler

- Siparis listesi ve durum filtresi.
- Siparis olusturma, projenin en zengin form akisi:
  - Musteri secimi
  - Dinamik kalemler (`useFieldArray`)
  - Urun secimi, miktar degistirme, kalem silme
  - Stok ve toplamla ilgili Zod kurallari
  - `POST /orders` mutation'i
  - Basari sonrasi orders ve products cache'inin senkronizasyonu
- Siparis durumunu degistirme.
- Optimistic update ve basarisiz istek sonrasi rollback deneyi icin uygun alan.

### Ayarlar

- Profil getirme ve guncelleme.
- Tema ve tablo yogunlugu gibi Zustand tercihleri.
- `persist` middleware'in gozlemlenmesi.

---

## 6. Siparis Olusturma: Teknolojilerin Birlikte Akisi

Bu akis, tum teknolojilerin nasil etkilesime girdigini gosteren ana ornektir:

1. Sayfa acilir.
2. TanStack Query paralel olarak `GET /products` ve `GET /customers` gonderir.
3. Gelen veriler TanStack Query cache'ine yazilir; loading/error/basari durumu ekranda gorunur.
4. RHF siparis formunun input degerlerini yonetir.
5. `useFieldArray` ile kullanici siparis kalemi ekler, siler ve miktar degistirir.
6. Zod; musteri secimi, pozitif miktar, gecerli urun, en az bir kalem ve stok kurallarini dogrular.
7. Form gecerliyse TanStack Query mutation'i `POST /orders` istegini gonderir.
8. Basarili cevapta orders query invalidate edilir veya cache dogrudan guncellenir.
9. Siparis stok dusuruyorsa products cache'i de guncellenir ya da yeniden cekilir.
10. Zustand, basari/hata toast'ini gosterir ve gerekiyorsa siparis taslagini temizler.
11. Kullanici siparis listesine gectiginde yeni siparisi gorur.

---

## 7. Bilerek Yapilacak Gozlem ve Deneyler

Proje bitmis bir ekran koleksiyonu olmamalidir. Her deney, belirli bir kavrami Network paneli ve TanStack Query Devtools uzerinden gorunur hale getirmelidir:

- `staleTime` degerini degistirip sayfalar arasi geciste request sayisini incelemek.
- Urun eklemeden sonra `invalidateQueries` kullanarak refetch'i izlemek.
- Ayni akisi `setQueryData` ile yapip UI'in refetch olmadan guncellenmesini karsilastirmak.
- API'ye yapay gecikme ekleyip loading/skeleton davranisini incelemek.
- Endpoint'i kontrollu bicimde `400`, `404` veya `500` hatasi dondurur hale getirip retry, error state ve "tekrar dene" akisini denemek.
- Urun listesini prefetch edip kullanici sayfaya gectiginde verinin daha hizli gorunmesini incelemek.
- Siparis durumu icin optimistic update uygulayip hata halinde rollback'i gostermek.
- TanStack Query Devtools ile query cache'inin olusumunu, stale olmasini ve invalidate edilmesini izlemek.
- Server verisini Zustand'a kopyalamanin neden iki farkli dogruluk kaynagi olusturdugunu kucuk bir deneyle gormek.

---

## 8. Profesyonel Mimari Beklentileri

Kullanici tasarimin onemsiz oldugunu belirtti: arayuz sade, okunabilir ve bozuk olmayacak; fakat guzel gorunsun diye zaman harcanmayacak. Oncelik kesin olarak mimari, veri akisi ve profesyonel yaklasimdir.

Proje "acemi elinden cikmis" gibi degil, senior bir frontend developer'in tasarladigi gibi olmalidir. Bu, gereksiz soyutlamalar veya cok sayida klasor demek degildir. Beklenenler:

- **Feature-based klasor yapisi:** `products`, `customers`, `orders`, `dashboard`, `settings` gibi alanlar kendi API, hook, schema, type ve bilesenlerini yakinda tutar.
- **Merkezî veri katmani:** Tek HTTP client, merkezî base URL yapilandirmasi, standart API hata donusumu ve ortak response dogrulama yaklasimi.
- **Environment yonetimi:** API URL gibi degerler `.env` dosyasindan gelir; kod icine gomulmez.
- **Merkezî QueryClient ayarlari:** Default retry, stale time ve hata davranislari amacli sekilde belirlenir.
- **Merkezî query key yaklasimi:** Key'ler tutarli, okunabilir ve filtre/sayfalama girdilerini kapsar.
- **Hata yonetimi:** Network, validation, beklenmeyen response ve mutation hatalari kullaniciya anlasilir bicimde gosterilir.
- **Error boundary ve retry:** Query hatalarini toparlayan, yeniden denemeye izin veren akislara yer verilir.
- **Loading/empty/error state:** Her veri ekrani bu dort yolu kapsar; sadece basarili veri gelmesi durumu yazilmaz.
- **Tek dogruluk kaynagi:** Server state, form state ve UI state birbirine kopyalanmaz.
- **Test edilebilirlik:** Saf donusturuculer, Zod semalari ve kritik is kurallari izole edilir. Testler gostermelik degil, riskli noktalar icin anlamli olur.
- **Sorumluluk ayirimi:** Bilesenler veri cekme, response parse etme ve karmasik donusturme isiyle sisirilmez; bunlar uygun katmanda kalir.
- **Olculu soyutlama:** "Her sey generic olsun" yaklasimi uygulanmaz. Soyutlama, gercek tekrar veya karmasikligi azalttiginda eklenir.

Mimari hedef: buyumeye dayanabilecek, bagimlilik yonleri kontrollu, hata durumlari dusunulmus ve kullanicinin her kararini aciklayabilecegi bir frontend kod tabani.

---

## 9. Uygulama Sirasi

Ekran yapmaya hemen baslanmayacak. Ilk asamada proje omurgasi kurulacak; sonraki feature'lar ayni kurallari izleyerek eklenecek.

Onerilen sira:

1. Proje yapisini ve arac secimlerini kesinlestir.
2. `json-server` veri modeli, seed verisi ve endpoint ihtiyaclarini tanimla.
3. TypeScript domain tipleri ve Zod semalarini tasarla.
4. Environment config, HTTP client, API error modeli ve response parsing katmanini kur.
5. `QueryClient`, query key kurallari ve TanStack Query Devtools'u yapilandir.
6. Zustand UI store'larini minimal sorumluluklarla kur.
7. Ortak uygulama altyapisini ekle: router, layout, hata/loading/empty state bilesenleri.
8. Once Urunler feature'ini uctan uca tamamla.
9. Musteriler feature'i ve dependent query akisini ekle.
10. Siparisler feature'ini, `useFieldArray`, mutation ve cache senkronizasyonuyla tamamla.
11. Dashboard, ayarlar, persist ve deney senaryolarini ekle.
12. Kritik alanlar icin odakli testler, README ve calistirma/gözlem dokumantasyonu ekle.

Her adimda once kucuk, test edilebilir bir parcaya degisiklik yapilacak; davranis odakli bir kontrol calistirildiktan sonra sonraki parcaya gecilecek.

---

## 10. Henuz Kesinlesmemis Teknik Kararlar

Asagidaki noktalar konusuldu ancak kesin secim yapilmadi. Yeni oturumda bunlar varsayim yapmadan karara baglanmali:

- React projesinin Vite ile mi baslatilacagi (muhtemel), yoksa baska bir bundler kullanilacagi.
- Router tercihi (`react-router-dom` mu, baska bir cozum mu).
- Test araci ve test kapsami (muhtemelen Vitest + React Testing Library, fakat henuz karar degil).
- `json-server` hata/gecikme senaryolarinin hangi middleware veya yardimci yapiyla uretilecegi.
- API response formati ve `json-server`'in pagination/filter kisitlari nedeniyle gerekecek hafif uyarlamalar.
- Auth'un ilk surumde olup olmayacagi. Ilk ogrenme kapsami icin zorunlu degildir.
- Siparis olusturuldugunda stok dusurme kuralinin mock API katmaninda mi, yoksa kontrollu frontend deney akisi olarak mi uygulanacagi.

Bu kararlar, proje baslangicinda gereksinimlere gore alinmali; henuz alinmis gibi davranilmamalidir.

---

## 11. Basari Olcutu

Proje basarili sayilacaksa kullanici, her ekran icin su aciklamalari rahatca yapabilmelidir:

- Bu veri neden TanStack Query'de, Zustand'da veya RHF'de?
- Bu query key neden bu parametreleri iceriyor?
- Mutation basarisindan sonra neden invalidate veya `setQueryData` secildi?
- API response'u nerede ve neden Zod ile dogrulaniyor?
- Hata olursa kullanici ne gorur, tekrar deneme nasil calisir?
- Gecikme, stale cache, background refetch, prefetch ve optimistic update ekranda nasil gozlemlenir?

Basari olcutu yalnizca "uygulama calisiyor" degildir. State sinirlarini, veri akislarini ve teknik tercihleri mulakatta aciklayabilecek duzeyde anlamaktir.