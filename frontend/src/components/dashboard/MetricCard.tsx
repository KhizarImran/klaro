import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: 'positive' | 'negative' | 'neutral'
  loading?: boolean
  formatter?: (value: number) => string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  loading = false,
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'positive':
        return 'text-emerald-500'
      case 'negative':
        return 'text-red-500'
      default:
        return 'text-[oklch(65%_0.01_240)]'
    }
  }

  const valueColor = getTrendColor()

  return (
    <div className="border border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)] p-6 rounded-lg hover:border-[oklch(30%_0.01_240)] transition-all">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-[oklch(65%_0.01_240)]">{title}</h3>
        <div className="bg-emerald-500/10 rounded-lg p-2">
          <Icon className="h-5 w-5 text-emerald-500" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-8 bg-[oklch(20%_0.01_240)] rounded animate-pulse"></div>
          <div className="h-4 bg-[oklch(20%_0.01_240)] rounded w-2/3 animate-pulse"></div>
        </div>
      ) : (
        <>
          <p className={`text-3xl font-bold ${valueColor} mb-2`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-[oklch(55%_0.01_240)]">
              {subtitle}
            </p>
          )}
        </>
      )}
    </div>
  )
}

interface StatItemProps {
  label: string
  value: string | number
  trend?: 'positive' | 'negative' | 'neutral'
  tooltip?: string
}

export function StatItem({ label, value, trend = 'neutral', tooltip }: StatItemProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'positive':
        return 'text-emerald-500'
      case 'negative':
        return 'text-red-500'
      default:
        return 'text-white'
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-[oklch(20%_0.01_240)] last:border-b-0">
      <span className="text-sm text-[oklch(65%_0.01_240)] flex items-center">
        {label}
        {tooltip && (
          <span className="ml-2 text-xs text-[oklch(50%_0.01_240)]" title={tooltip}>
            ⓘ
          </span>
        )}
      </span>
      <span className={`text-sm font-semibold ${getTrendColor()}`}>
        {value}
      </span>
    </div>
  )
}
