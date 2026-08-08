type ErrorStateProps = {
  title: string
  message: string
  onRetry: () => void
}

// Kap sinifi bilincli olarak `rounded-lg`siz: bes eski hata blogundan dordu boyleydi ve
// uygulamanin geri kalani (kartlar, tablolar, dialoglar) kosesiz.
export function ErrorState({ message, onRetry, title }: ErrorStateProps) {
  return (
    <section className="border border-rose-200 bg-rose-50 p-6">
      <h1 className="text-base font-semibold text-rose-950">{title}</h1>
      <p className="mt-2 text-sm text-rose-800">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-800"
      >
        Tekrar dene
      </button>
    </section>
  )
}
