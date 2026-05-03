import { cn } from '@/lib/utils'

interface RootLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function RootLogo({ className, size = 'md' }: RootLogoProps) {
  const sizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
  }

  return (
    <span
      className={cn(
        'inline-flex items-baseline font-mono select-none',
        sizes[size],
        className
      )}
    >
      <span className="font-light text-sys-500 tracking-tight">/</span>
      <span className="font-medium text-ink-100 tracking-tight -ml-0.5">
        root
      </span>
    </span>
  )
}
