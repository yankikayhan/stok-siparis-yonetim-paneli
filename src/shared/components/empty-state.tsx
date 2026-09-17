import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description: string
}

// "Liste bos" durumu icindir. Detay bolmesi yer tutucusu ve kart ici tek paragrafli bos
// metinler bilerek disarida birakildi: ayni gorunum degil, ayri anlamlar.
export function EmptyState({ description, icon: Icon, title }: EmptyStateProps) {
  return (
    <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-600 dark:bg-slate-900">
      {Icon && <Icon size={28} className="mx-auto text-slate-400 dark:text-slate-500" aria-hidden="true" />}
      <h2 className={`text-base font-semibold text-slate-950 dark:text-slate-50 ${Icon ? 'mt-3' : ''}`}>{title}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  )
}
