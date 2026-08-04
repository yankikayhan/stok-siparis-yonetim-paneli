import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { Building2, Mail, Phone, ReceiptText, UsersRound } from 'lucide-react'
import { useState } from 'react'
import {
  customerQueryKeys,
  getCustomerOrders,
  getCustomers,
  type Customer,
  type CustomerOrder,
} from '../api/customers-api'

const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
})

const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' })

const orderStatusLabels = {
  pending: 'Beklemede',
  paid: 'Odendi',
  shipped: 'Kargoda',
  cancelled: 'Iptal',
} as const

export function CustomersPage() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const customersQuery = useQuery({
    queryKey: customerQueryKeys.list(),
    queryFn: getCustomers,
  })
  const customerOrdersQuery = useQuery({
    queryKey: customerQueryKeys.orders(selectedCustomerId ?? ''),
    queryFn: () => getCustomerOrders(selectedCustomerId!),
    enabled: selectedCustomerId !== null,
  })

  if (customersQuery.isPending) {
    return <CustomersLoadingState />
  }

  if (customersQuery.isError) {
    return <QueryErrorState title="Musteriler yuklenemedi" message={customersQuery.error.message} onRetry={() => void customersQuery.refetch()} />
  }

  const selectedCustomer = customersQuery.data.find((customer) => customer.id === selectedCustomerId) ?? null

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Iliskiler</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Musteriler</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Musteri kayitlarini ve siparis gecmislerini inceleyin.</p>
      </div>

      {customersQuery.data.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-base font-semibold text-slate-950">Henuz musteri yok</h2>
          <p className="mt-2 text-sm text-slate-600">Musteri kayitlari eklendiginde burada gorunecek.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(17rem,0.9fr)_minmax(0,1.5fr)]">
          <div className="border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
              <UsersRound size={18} className="text-teal-700" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-slate-950">Musteri listesi</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {customersQuery.data.map((customer) => {
                const isSelected = customer.id === selectedCustomerId

                return (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`w-full px-5 py-4 text-left transition-colors ${
                        isSelected ? 'bg-teal-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-semibold text-slate-950">{customer.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{customer.company}</p>
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
  if (!customer) {
    return (
      <div className="grid min-h-80 place-items-center border border-dashed border-slate-300 bg-white p-6 text-center">
        <div>
          <ReceiptText size={28} className="mx-auto text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-slate-950">Bir musteri secin</h2>
          <p className="mt-2 text-sm text-slate-600">Siparis gecmisini goruntulemek icin listeden bir kayit secin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">{customer.name}</h2>
        <p className="mt-1 text-sm text-slate-600">{customer.company}</p>
      </div>
      <dl className="grid gap-4 border-b border-slate-200 p-5 sm:grid-cols-2">
        <DetailItem icon={Mail} label="E-posta" value={customer.email} />
        <DetailItem icon={Phone} label="Telefon" value={customer.phone} />
        <DetailItem icon={Building2} label="Kayit tarihi" value={dateFormatter.format(customer.createdAt)} />
      </dl>
      <div className="p-5">
        <h3 className="text-sm font-semibold text-slate-950">Siparis gecmisi</h3>
        {ordersQuery.isPending ? (
          <div className="mt-4 h-24 animate-pulse bg-slate-100" />
        ) : ordersQuery.isError ? (
          <div className="mt-4 border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-800">{ordersQuery.error instanceof Error ? ordersQuery.error.message : 'Siparisler yuklenemedi.'}</p>
            <button type="button" onClick={() => void ordersQuery.refetch()} className="mt-3 text-sm font-medium text-rose-800 underline">Tekrar dene</button>
          </div>
        ) : ordersQuery.data?.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Bu musteriye ait siparis bulunmuyor.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 border-y border-slate-100">
            {ordersQuery.data?.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{order.id.toUpperCase()}</p>
                  <p className="mt-1 text-xs text-slate-500">{dateFormatter.format(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-950">{currencyFormatter.format(order.total)}</p>
                  <p className="mt-1 text-xs font-medium text-teal-700">{orderStatusLabels[order.status]}</p>
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
      <Icon size={17} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="mt-1 break-words text-sm text-slate-800">{value}</dd>
      </div>
    </div>
  )
}

function QueryErrorState({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <section className="border border-rose-200 bg-rose-50 p-6">
      <h1 className="text-base font-semibold text-rose-950">{title}</h1>
      <p className="mt-2 text-sm text-rose-800">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800">Tekrar dene</button>
    </section>
  )
}

function CustomersLoadingState() {
  return (
    <section aria-busy="true" className="space-y-6">
      <div className="h-8 w-40 animate-pulse bg-slate-200" />
      <div className="h-96 animate-pulse border border-slate-200 bg-white" />
    </section>
  )
}

