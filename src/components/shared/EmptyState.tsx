import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-700 bg-ink-900/30 px-6 py-20 text-center">
      <div className="mb-4 rounded-full bg-ink-800 p-4">
        <Icon className="h-7 w-7 text-ink-400" />
      </div>
      <h3 className="text-lg font-medium text-ink-100">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-ink-400">{description}</p>
      )}
    </div>
  )
}
