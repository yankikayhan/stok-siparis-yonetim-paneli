import { Component, type ReactNode } from 'react'
import { Button } from './button'

type Props = {
  children: ReactNode
  onReset?: () => void
}

type State = { hasError: boolean }

// I5 (Adim 8 / IB2): dialog-seviyesi ErrorBoundary — dialog chunk'i basarisiz olursa
// TUM SAYFA degil, yalniz dialog'un yeri hata gosterir. Route-seviyesi ErrorBoundary
// (app-shell.tsx) sayfa lazy'si icindir; dialog lazy'si kendi sinirini tasir.
export class DialogErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950">
          <p className="text-sm text-rose-800 dark:text-rose-300">Dialog yuklenemedi.</p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="mt-3"
            onClick={() => {
              this.setState({ hasError: false })
              this.props.onReset?.()
            }}
          >
            Tekrar dene
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
