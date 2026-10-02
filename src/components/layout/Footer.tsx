import { RootLogo } from '@/components/shared/RootLogo'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-ink-800 bg-ink-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-ink-400">
          <span>Desarrollado por</span>
          <RootLogo size="sm" />
          <span className="text-ink-500">·</span>
          <span className="text-ink-200">Eduardo Canelo</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <span>© {year} /root · Eduardo Canelo.</span>
          <span
            className="font-mono text-ink-600"
            title={`Commit ${__GIT_HASH__}`}
          >
            v{__GIT_COUNT__} · {__GIT_HASH__}
          </span>
        </div>
      </div>
    </footer>
  )
}
