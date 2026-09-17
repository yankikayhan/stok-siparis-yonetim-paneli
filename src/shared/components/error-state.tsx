import { Button } from './button'

type ErrorStateProps = {
  title: string
  message: string
  onRetry: () => void
}

// Kap sinifi bilincli olarak `rounded-lg`siz: bes eski hata blogundan dordu boyleydi ve
// uygulamanin geri kalani (kartlar, tablolar, dialoglar) kosesiz.
export function ErrorState({ message, onRetry, title }: ErrorStateProps) {
  return (
    <section className="border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-950">
      <h1 className="text-base font-semibold text-rose-950 dark:text-rose-100">{title}</h1>
      <p className="mt-2 text-sm text-rose-800 dark:text-rose-300">{message}</p>
      <Button type="button" variant="danger" onClick={onRetry} className="mt-4">
        Tekrar dene
      </Button>
    </section>
  )
}
