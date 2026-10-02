import { Component, type ErrorInfo, type ReactNode } from 'react'
import { isStaleChunkError } from '@/lib/chunkReload'

const ROOT_RELOAD_KEY = 'root_stale_reloads'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    if (isStaleChunkError(error)) {
      const count = Number(sessionStorage.getItem(ROOT_RELOAD_KEY) ?? 0)
      if (count < 3) {
        sessionStorage.setItem(ROOT_RELOAD_KEY, String(count + 1))
        window.location.reload()
        return
      }
      sessionStorage.removeItem(ROOT_RELOAD_KEY)
    }
  }

  handleReload = () => {
    sessionStorage.removeItem(ROOT_RELOAD_KEY)
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children

    const isStale = isStaleChunkError(this.state.error)

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink-950 p-6 text-center">
        <div className="max-w-sm">
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-ink-400">
            {isStale ? 'Nueva versión disponible' : 'Algo salió mal'}
          </p>
          <p className="text-ink-300">
            {isStale
              ? 'La aplicación se actualizó. Recargá para continuar.'
              : 'Ocurrió un error inesperado. Intentá recargar la página.'}
          </p>
        </div>
        <button
          onClick={this.handleReload}
          className="rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent-400"
        >
          Recargar
        </button>
      </div>
    )
  }
}
