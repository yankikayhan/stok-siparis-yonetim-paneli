import { useDeferredValue, useState, useTransition } from 'react'
import {
  DEFAULT_PRODUCT_LIST_PARAMS,
  type ProductListParams,
  type ProductStockFilter,
} from '../api/products-api'

export function useProductFilters() {
  const [search, setSearch] = useState(DEFAULT_PRODUCT_LIST_PARAMS.search)
  const [categoryId, setCategoryId] = useState(DEFAULT_PRODUCT_LIST_PARAMS.categoryId)
  const [stock, setStock] = useState<ProductStockFilter>(DEFAULT_PRODUCT_LIST_PARAMS.stock)
  const [page, setPage] = useState(DEFAULT_PRODUCT_LIST_PARAMS.page)
  const deferredSearch = useDeferredValue(search)
  // isPending yalniz kategori/stok/sayfa gecisi icindir; arama metni zaten useDeferredValue'da
  // (ayni degere iki mekanizma binmesin — useTransition/useDeferredValue karsilastirmasi IB9).
  const [isPending, startTransition] = useTransition()
  // Key ve istek ayni nesneden beslenir; trim key kurulmadan once yapilir.
  const listParams: ProductListParams = { search: deferredSearch.trim(), categoryId, stock, page }

  // Render sirasinda state uyarlama: reset deferredSearch'ten turedigi icin
  // eski arama + page 1 kombinasyonu fetch'e donusmeden atilan render'da kalir.
  const [prevFilters, setPrevFilters] = useState({ search: listParams.search, categoryId, stock })
  if (
    prevFilters.search !== listParams.search ||
    prevFilters.categoryId !== categoryId ||
    prevFilters.stock !== stock
  ) {
    setPrevFilters({ search: listParams.search, categoryId, stock })
    setPage(1)
  }

  // Bos kalan son sayfadan taze veriye gore geri cekilir; placeholder'in eski totalCount'u
  // clamp'i yaniltmasin diye karar cagri yerinden gelen guncel sorgu durumuna baglidir.
  const clampPage = (totalPages: number, isPlaceholderData: boolean) => {
    if (!isPlaceholderData && page > totalPages) {
      setPage(totalPages)
    }
  }

  return {
    search,
    setSearch,
    categoryId,
    // K1 (kontrolcu): bu transition-sarmali guncelleme yukaridaki render-fazi
    // prevFilters/setPage(1) uyarlamasini AYNI render'da tetikler; o cagri KENDISI
    // sarmalanmadi — React kurali geregi mevcut render'in lane'ini devralmasi beklenir
    // (AKIL YURUTME, RAPOR'da Profiler/console kanitiyla dogrulanacak).
    setCategoryId: (value: string) => startTransition(() => setCategoryId(value)),
    stock,
    setStock: (value: ProductStockFilter) => startTransition(() => setStock(value)),
    page,
    setPage: (value: number) => startTransition(() => setPage(value)),
    listParams,
    clampPage,
    isPending,
  }
}
