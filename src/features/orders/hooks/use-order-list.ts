import { keepPreviousData, useInfiniteQuery, useQueries, type UseQueryResult } from '@tanstack/react-query'
import { customersOptions, type Customer } from '../../customers/api/customers-api'
import { productListAllOptions, type Product } from '../../products/api/products-api'
import { ordersInfiniteOptions, type Order, type OrderStatusFilter } from '../api/orders-api'

// Modul seviyesi tanim sarttir (dashboard select emsali): memoizasyon guard'i combine'in
// KENDI referansina da bakar; inline tanim her render'da yeni sonuc nesnesi dogururdu.
// Tek alanli kalmasinin sebebi asagidaki daraltma: iki sorgu tek ya-hep-ya-hic nesnesine iner.
function combineReferenceQueries([customersResult, productsResult]: [
  UseQueryResult<Customer[]>,
  UseQueryResult<Product[]>,
]) {
  return {
    // isSuccess degil: veri varsa sayfa cizilir, hata toast kanalinda kalir (throwOnError ile ayni yuklem).
    data:
      customersResult.data !== undefined && productsResult.data !== undefined
        ? {
            customers: customersResult.data,
            products: productsResult.data,
          }
        : undefined,
  }
}

// Discriminated union: sayfa guard'dan sonra daraltarak okur, non-null assertion'a gerek kalmaz.
export type OrderListState =
  | { status: 'loading' }
  | {
      status: 'ready'
      orders: Order[]
      customers: Customer[]
      products: Product[]
      customerNames: Map<string, string>
      totalCount: number
      isPlaceholderData: boolean
      hasNextPage: boolean
      isFetchingNextPage: boolean
      fetchNextPage: () => void
    }

export function useOrderList(statusFilter: OrderStatusFilter): OrderListState {
  const referenceQueries = useQueries({
    queries: [customersOptions(), productListAllOptions()],
    combine: combineReferenceQueries,
  })
  // Filtre degisimi = yeni key; eski liste keepPreviousData ile soluk kalir (urunler sayfasi pattern'i).
  const ordersQuery = useInfiniteQuery({
    ...ordersInfiniteOptions(statusFilter),
    placeholderData: keepPreviousData,
  })

  // isError degil: veri varsa sayfa cizilir, hata toast kanalinda kalir (throwOnError ile ayni yuklem).
  if (referenceQueries.data === undefined || ordersQuery.data === undefined) {
    return { status: 'loading' }
  }

  const { customers, products } = referenceQueries.data
  // useInfiniteQuery ilk sayfayi initialPageParam ile daima yukler; dizi bos olamaz.
  const totalCount = ordersQuery.data.pages[0]?.totalCount ?? 0

  return {
    status: 'ready',
    orders: ordersQuery.data.pages.flatMap((page) => page.items),
    customers,
    products,
    customerNames: new Map(customers.map((customer) => [customer.id, customer.name])),
    totalCount,
    isPlaceholderData: ordersQuery.isPlaceholderData,
    hasNextPage: ordersQuery.hasNextPage,
    isFetchingNextPage: ordersQuery.isFetchingNextPage,
    fetchNextPage: () => void ordersQuery.fetchNextPage(),
  }
}
