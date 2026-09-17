import { useSuspenseQueries } from '@tanstack/react-query'
import { AlertTriangle, CircleDollarSign, PackageCheck, ShoppingBag } from 'lucide-react'
import { Suspense } from 'react'
import { ordersOptions } from '../../orders/api/orders-api'
import { activeLowStockProductsOptions, activeProductCountOptions } from '../../products/api/products-api'
import { selectOrderStats } from '../api/dashboard-api'
import { useCurrencyFormatter } from '../../settings/hooks/use-currency-formatter'
import { PageHeader } from '../../../shared/components/page-header'

const numberFormatter = new Intl.NumberFormat('tr-TR')

export function DashboardPage() {
  // Askiya ALINMAYAN bilesende kalir: ic bilesen suspend olurken bu render commit eder,
  // boylece /profile abonesi kurulur ve istek diger iki sorguyla paralel gider.
  const currencyFormatter = useCurrencyFormatter(0)

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Genel Bakis"
        title="Isletme durumu"
        description="Operasyonun bugunku gorunumu ve dikkat gerektiren stok seviyeleri."
      />

      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardContent currencyFormatter={currencyFormatter} />
      </Suspense>
    </section>
  )
}

function DashboardContent({ currencyFormatter }: { currencyFormatter: Intl.NumberFormat }) {
  // Uc sorgu da BIRINCIL: useSuspenseQueries sabit defaultThrowOnError gecer, veri yoksa ucu
  // de kosulsuz boundary'ye firlar (KOSUL 3.2). Dashboard artik 1000 kayitlik listAll'i
  // cekmez: sunucu active=true ile onceden filtrelenmis sayim + dusuk-stok listesi dondurur (P1).
  const [{ data: activeProductCount }, { data: lowStockProducts }, { data: orderStats }] = useSuspenseQueries({
    queries: [
      activeProductCountOptions(),
      activeLowStockProductsOptions(),
      { ...ordersOptions(), select: selectOrderStats },
    ],
  })

  const { openOrders, totalRevenue } = orderStats

  return (
    <>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Toplam urun" value={numberFormatter.format(activeProductCount)} icon={PackageCheck} />
        <MetricCard label="Dusuk stok" value={numberFormatter.format(lowStockProducts.length)} icon={AlertTriangle} />
        <MetricCard label="Acik siparis" value={numberFormatter.format(openOrders)} icon={ShoppingBag} />
        <MetricCard label="Toplam satis" value={currencyFormatter.format(totalRevenue)} icon={CircleDollarSign} />
      </dl>

      <div className="border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">Dusuk stok uyarilari</h2>
        </div>
        {lowStockProducts.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-600 dark:text-slate-300">Yeniden siparis gerektiren urun bulunmuyor.</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {lowStockProducts.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{product.name}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{product.sku}</p>
                </div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  {product.stock} / {product.reorderLevel} adet
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
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
    <div className="border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</dt>
        <Icon size={18} className="text-brand-700 dark:text-brand-200" aria-hidden="true" />
      </div>
      <dd className="mt-4 text-2xl font-semibold text-slate-950 dark:text-slate-50">{value}</dd>
    </div>
  )
}

function DashboardContentSkeleton() {
  // Baslik yer tutucusu yok: gercek PageHeader Suspense'in disinda, zaten ekranda.
  return (
    <div aria-busy="true" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-64 animate-pulse border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
    </div>
  )
}