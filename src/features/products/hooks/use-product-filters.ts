import { useDeferredValue, useState } from 'react'
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
    setCategoryId,
    stock,
    setStock,
    page,
    setPage,
    listParams,
    clampPage,
  }
}
