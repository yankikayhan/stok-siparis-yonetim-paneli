import { CloudOff } from 'lucide-react'
import { cn } from '../lib/cn'

type StaleBannerProps = {
  // Sorgunun TanStack status'u: 'pending' | 'error' | 'success'. Rozet yalniz
  // arka plan REFETCH hatasinda yanar: status 'error' VE veri dolu (data !==
  // undefined) — yani ilk yukleme hatasi (veri yok → boundary) bu rozeti TETIKLEMEZ.
  // Bu kosul query-client.ts'in toast bastigi kosulun (`query.state.data !== undefined`
  // iken onError) ayna goruntusudur: ayni bilgi, iki omur — toast 5 sn ("olay oldu"),
  // rozet kalici ("sorun suruyor").
  isError: boolean
  hasData: boolean
  className?: string
}

// B5: sayfa bazli bayatlik rozeti. Ayri store YOK — query state'inden TURETILIR
// (derivasyon); sonraki basarili fetch status'u 'success'e cevirip rozeti kendiliginden
// kapatir. role="status": ekran okuyucuya duyurulur, toaster'in aria-live bolgesiyle
// cakismaz (ayri eleman, polite).
export function StaleBanner({ className, hasData, isError }: StaleBannerProps) {
  if (!(isError && hasData)) return null

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-2 border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
        className,
      )}
    >
      <CloudOff size={16} className="shrink-0" aria-hidden="true" />
      <p>Veriler guncellenemiyor — son basarili guncelleme sirasindaki veriler gosteriliyor.</p>
    </div>
  )
}
