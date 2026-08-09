type ProductPaginationProps = {
  page: number
  totalPages: number
  totalCount: number
  isPlaceholderData: boolean
  onPageChange: (page: number) => void
}

// Kanonik veride 1000 urun / 10 = 100 sayfa, gezinme ise yalniz +-1 adim; sayfa atlama bir
// davranis eklemesi oldugu icin bu refactor'un disinda birakildi.
export function ProductPagination({
  isPlaceholderData,
  onPageChange,
  page,
  totalCount,
  totalPages,
}: ProductPaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-slate-200 bg-white px-5 py-3">
      <p className="text-sm text-slate-600">
        Toplam {totalCount} kayit · Sayfa {page} / {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Onceki
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          // Placeholder gosterilirken yeni verinin totalPages'i bilinmez; tasmayi onlemek icin kilitli.
          disabled={isPlaceholderData || page >= totalPages}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sonraki
        </button>
      </div>
    </div>
  )
}
