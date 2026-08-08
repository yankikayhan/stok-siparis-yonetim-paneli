import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CircleDollarSign, PackageCheck, ShoppingBag } from 'lucide-react'
import { ordersOptions } from '../../orders/api/orders-api'
import { productListAllOptions } from '../../products/api/products-api'
import { selectOrderStats, selectProductStats } from '../api/dashboard-api'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'
import { PageHeader } from '../../../shared/components/page-header'

const numberFormatter = new Intl.NumberFormat('tr-TR')

export function DashboardPage() {
  const currencyFormatter = useCurrencyFormatter(0)
  const productStatsQuery = useQuery({ ...productListAllOptions(), select: selectProductStats })
  const orderStatsQuery = useQuery({ ...ordersOptions(), select: selectOrderStats })

  if (productStatsQuery.isPending || orderStatsQuery.isPending) {
    return <DashboardLoadingState />
  }

  if (productStatsQuery.isError || orderStatsQuery.isError) {
    const error = productStatsQuery.error ?? orderStatsQuery.error

    return (
      <section className="rounded-lg border border-rose-200 bg-rose-50 p-6">
        <h1 className="text-base font-semibold text-rose-950">Dashboard verileri yuklenemedi</h1>
        <p className="mt-2 text-sm text-rose-800">{error?.message ?? 'Beklenmeyen bir hata olustu.'}</p>
        <button
          type="button"
          onClick={() => {
            void productStatsQuery.refetch()
            void orderStatsQuery.refetch()
          }}
          className="mt-4 rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800"
        >
          Tekrar dene
        </button>
      </section>
    )
  }

  const { totalProducts, lowStockProducts } = productStatsQuery.data
  const { openOrders, totalRevenue } = orderStatsQuery.data

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Genel Bakis"
        title="Isletme durumu"
        description="Operasyonun bugunku gorunumu ve dikkat gerektiren stok seviyeleri."
      />

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Toplam urun" value={numberFormatter.format(totalProducts)} icon={PackageCheck} />
        <MetricCard label="Dusuk stok" value={numberFormatter.format(lowStockProducts.length)} icon={AlertTriangle} />
        <MetricCard label="Acik siparis" value={numberFormatter.format(openOrders)} icon={ShoppingBag} />
        <MetricCard label="Toplam satis" value={currencyFormatter.format(totalRevenue)} icon={CircleDollarSign} />
      </dl>

      <div className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-950">Dusuk stok uyarilari</h2>
        </div>
        {lowStockProducts.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-600">Yeniden siparis gerektiren urun bulunmuyor.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {lowStockProducts.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{product.sku}</p>
                </div>
                <p className="text-sm font-semibold text-amber-700">
                  {product.stock} / {product.reorderLevel} adet
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PackageCheck
  label: string
  value: string
}) {
  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-sm font-medium text-slate-600">{label}</dt>
        <Icon size={18} className="text-teal-700" aria-hidden="true" />
      </div>
      <dd className="mt-4 text-2xl font-semibold text-slate-950">{value}</dd>
    </div>
  )
}

function DashboardLoadingState() {
  return (
    <section aria-busy="true" className="space-y-6">
      <p className="text-sm font-medium text-teal-700">Genel Bakis</p>
      <div className="h-8 w-56 animate-pulse bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse border border-slate-200 bg-white" />
        ))}
      </div>
    </section>
  )
}