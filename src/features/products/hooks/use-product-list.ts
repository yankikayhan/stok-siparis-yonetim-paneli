import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  categoriesOptions,
  PRODUCTS_PAGE_SIZE,
  productListOptions,
  type Category,
  type Product,
  type ProductListParams,
} from '../api/products-api'

// Discriminated union: sayfa guard'dan sonra daraltarak okur, non-null assertion'a gerek kalmaz.
export type ProductListState =
  | { status: 'loading' }
  | {
      status: 'ready'
      products: Product[]
      categories: Category[]
      categoryNames: Map<string, string>
      totalCount: number
      totalPages: number
      isPlaceholderData: boolean
    }

export function useProductList(params: ProductListParams): ProductListState {
  const productsQuery = useQuery({
    ...productListOptions(params),
    // Sunum davranisi veri sozlesmesine degil cagri yerine aittir; spread ile eklenir.
    placeholderData: keepPreviousData,
  })
  const categoriesQuery = useQuery(categoriesOptions())

  // isError degil: veri varsa sayfa cizilir, hata toast kanalinda kalir (throwOnError ile ayni yuklem).
  if (productsQuery.data === undefined || categoriesQuery.data === undefined) {
    return { status: 'loading' }
  }

  const { items, totalCount } = productsQuery.data

  return {
    status: 'ready',
    products: items,
    categories: categoriesQuery.data,
    categoryNames: new Map(categoriesQuery.data.map((category) => [category.id, category.name])),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PRODUCTS_PAGE_SIZE)),
    isPlaceholderData: productsQuery.isPlaceholderData,
  }
}
