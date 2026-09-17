type PageHeaderProps = {
  eyebrow: string
  title: string
  description: string
}

// Yalnizca baslik blogunu sahiplenir; sayfa aksiyonlari (or. "Urun ekle") cagri yerindeki
// flex satirinda kalir — iki tuketici icin slot acmak soyutlamayi gereksiz genisletirdi.
export function PageHeader({ description, eyebrow, title }: PageHeaderProps) {
  return (
    <div>
      <p className="text-sm font-medium text-brand-700 dark:text-brand-200">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  )
}
