import { Button } from '../../../shared/components/button'

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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onLoadMore}
          // Placeholder'da eski filtrenin listesi gorunur; yeni key'in ilk sayfasi gelmeden devami istenmez.
          disabled={isFetchingNextPage || isPlaceholderData}
        >
          {isFetchingNextPage ? 'Yukleniyor...' : 'Daha fazla yukle'}
        </Button>
      )}
    </div>
  )
}
