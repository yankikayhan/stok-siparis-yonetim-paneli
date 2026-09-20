import { Button } from '../../../shared/components/button'

type ProductPaginationProps = {
  page: number
  totalPages: number
  totalCount: number
  isPlaceholderData: boolean
  onPageChange: (page: number) => void
}

// B18 kapsaminda genisletildi: +-1 adimlarina iki uca hizli atlama (İlk/Son) eklendi.
// Asimetri bilinclidir: geriye yon (İlk/Onceki) her zaman guvenli, placeholder'da da serbest;
// ileriye yon (Son/Sonraki) placeholder'da kilitlidir cunku yeni verinin totalPages'i bilinmez.
export function ProductPagination({
  isPlaceholderData,
  onPageChange,
  page,
  totalCount,
  totalPages,
}: ProductPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-slate-200 bg-white px-5 py-3 dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Toplam {totalCount} kayit · Sayfa {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
        >
          İlk
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        >
          Onceki
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          // Placeholder gosterilirken yeni verinin totalPages'i bilinmez; tasmayi onlemek icin kilitli.
          disabled={isPlaceholderData || page >= totalPages}
        >
          Sonraki
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={isPlaceholderData || page >= totalPages}
        >
          Son
        </Button>
      </div>
    </div>
  )
}
