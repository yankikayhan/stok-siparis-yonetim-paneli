import { type UseQueryResult, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Mail, Phone, ReceiptText, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { isApiError } from '../../../shared/api/api-error'
import { orderStatusLabels, ordersOptions } from '../../orders/api/orders-api'
import {
  customerOrdersOptions,
  customersOptions,
  type Customer,
  type CustomerOrder,
} from '../api/customers-api'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'
import { EmptyState } from '../../../shared/components/empty-state'
import { PageHeader } from '../../../shared/components/page-header'

const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' })

export function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const customersQuery = useQuery(customersOptions())
  const customerOrdersQuery = useQuery({
    ...customerOrdersOptions(selectedCustomerId ?? ''),
    // Dependent query: enabled sayfa state'ine bagli oldugu icin cagri yerinde kalir.
    enabled: selectedCustomerId !== null,
    // Tam siparis listesi cache'inden (Dashboard doldurur) gosterimlik seed; fetch yine gider.
    // initialData bilerek secilmedi: cache'e gercek veri olarak yazilir ve staleTime boyunca
    // fetch'i bastirir — eksik/bayat liste "dogru veri" muamelesi gorurdu.
    placeholderData: () =>
      queryClient
        .getQueryData(ordersOptions().queryKey)
        ?.filter((order) => order.customerId === selectedCustomerId),
    // Ikincil veri: musteri listesi ayakta kalmali, hata yalnizca detay panelinde inline gosterilir.
    throwOnError: false,
  })

  // isError degil: veri varsa sayfa cizilir, hata toast kanalinda kalir (throwOnError ile ayni yuklem).
  if (customersQuery.data === undefined) {
    return <CustomersLoadingState />
  }

  const selectedCustomer = customersQuery.data.find((customer) => customer.id === selectedCustomerId) ?? null

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Iliskiler"
        title="Musteriler"
        description="Musteri kayitlarini ve siparis gecmislerini inceleyin."
      />

      {customersQuery.data.length === 0 ? (
        <EmptyState
          title="Henuz musteri yok"
          description="Musteri kayitlari eklendiginde burada gorunecek."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(17rem,0.9fr)_minmax(0,1.5fr)]">
          <div className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <UsersRound size={18} className="text-brand-700 dark:text-brand-200" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Musteri listesi</h2>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {customersQuery.data.map((customer) => {
                const isSelected = customer.id === selectedCustomerId

                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`w-full px-5 py-4 text-left transition-colors ${
                        isSelected ? 'bg-brand-50 dark:bg-brand-900' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{customer.name}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{customer.company}</p>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <CustomerDetail customer={selectedCustomer} ordersQuery={customerOrdersQuery} />
        </div>
      )}
    </section>
  )
}

function CustomerDetail({
  customer,
  ordersQuery,
}: {
  customer: Customer | null
  ordersQuery: UseQueryResult<CustomerOrder[], Error>
}) {
  const currencyFormatter = useCurrencyFormatter()

  if (!customer) {
    return (
      <div className="grid min-h-80 place-items-center border border-dashed border-slate-300 bg-white p-6 text-center dark:border-slate-600 dark:bg-slate-900">
        <div>
          <ReceiptText size={28} className="mx-auto text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-slate-950 dark:text-slate-50">Bir musteri secin</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Siparis gecmisini goruntulemek icin listeden bir kayit secin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{customer.name}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{customer.company}</p>
      </div>
      <dl className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2 dark:border-slate-700">
        <DetailItem icon={Mail} label="E-posta" value={customer.email} />
        <DetailItem icon={Phone} label="Telefon" value={customer.phone} />
        <DetailItem icon={Building2} label="Kayit tarihi" value={dateFormatter.format(customer.createdAt)} />
      </dl>
      <div className="p-5">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Siparis gecmisi</h3>
        {ordersQuery.isPending ? (
          <div className="mt-4 h-24 animate-pulse bg-slate-100 dark:bg-slate-800" />
        ) : ordersQuery.isError ? (
          <div className="mt-4 border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950">
            <p className="text-sm text-rose-800 dark:text-rose-300">{isApiError(ordersQuery.error) ? ordersQuery.error.message : 'Siparisler yuklenemedi.'}</p>
            <button type="button" onClick={() => void ordersQuery.refetch()} className="mt-3 text-sm font-medium text-rose-800 underline dark:text-rose-300">Tekrar dene</button>
          </div>
        ) : ordersQuery.data?.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Bu musteriye ait siparis bulunmuyor.</p>
        ) : (
          <ul
            aria-busy={ordersQuery.isPlaceholderData}
            className={`mt-4 divide-y divide-slate-100 border-y border-slate-100 dark:divide-slate-700 dark:border-slate-700 ${ordersQuery.isPlaceholderData ? 'opacity-60' : ''}`}
          >
            {ordersQuery.data?.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.id.toUpperCase()}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{dateFormatter.format(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{currencyFormatter.format(order.total)}</p>
                  <p className="mt-1 text-xs font-medium text-brand-700 dark:text-brand-200">{orderStatusLabels[order.status]}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <Icon size={17} className="mt-0.5 shrink-0 text-brand-700 dark:text-brand-200" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="mt-1 break-words text-sm text-slate-800 dark:text-slate-200">{value}</dd>
      </div>
    </div>
  )
}

function CustomersLoadingState() {
  return (
    <section aria-busy="true" className="space-y-6">
      <div className="h-8 w-40 animate-pulse bg-slate-200 dark:bg-slate-800" />
      <div className="h-96 animate-pulse border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
    </section>
  )
}

