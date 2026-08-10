type OrderLoadMoreProps = {
  totalCount: number
  loadedCount: number
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isPlaceholderData: boolean
  onLoadMore: () => void
}

export function OrderLoadMore({
  hasNextPage,
  isFetchingNextPage,
  isPlaceholderData,
  loadedCount,
  onLoadMore,
  totalCount,
}: OrderLoadMoreProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-t-0 border-slate-200 bg-white px-5 py-3">
      <p className="text-sm text-slate-600">
        Toplam {totalCount} siparisin {loadedCount} tanesi goruntuleniyor
      </p>
      {hasNextPage && (
        <button
          type="button"
          onClick={onLoadMore}
          // Placeholder'da eski filtrenin listesi gorunur; yeni key'in ilk sayfasi gelmeden devami istenmez.
          disabled={isFetchingNextPage || isPlaceholderData}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isFetchingNextPage ? 'Yukleniyor...' : 'Daha fazla yukle'}
        </button>
      )}
    </div>
  )
}
