'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const variantTheme = {
  default: {
    bg: 'bg-slate-50',
    border: 'border-l-slate-400',
    icon: 'text-slate-700',
  },
  primary: {
    bg: 'bg-cyan-50',
    border: 'border-l-cyan-500',
    icon: 'text-cyan-700',
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    icon: 'text-emerald-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-l-amber-500',
    icon: 'text-amber-700',
  },
  info: {
    bg: 'bg-violet-50',
    border: 'border-l-violet-500',
    icon: 'text-violet-700',
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}) {
  const safeValue = Number(value ?? 0);
  const theme = variantTheme[variant] || variantTheme.default;

  return (
    <Card
      className={cn(
        `
          group
          border-l-4 ${theme.border}
          ${theme.bg}
          shadow-sm
          rounded-xl
          hover:shadow-lg
          hover:-translate-y-1
          hover:border-opacity-80
          transition-all duration-300 ease-out
        `,
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {title}
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-900">
                {safeValue.toLocaleString()}
              </div>

              {trend && typeof trend?.value === 'number' && (
                <span
                  className={cn(
                    'text-xs font-semibold',
                    trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? '+' : '-'}
                  {Math.abs(trend.value)}%
                </span>
              )}
            </div>

            {subtitle ? (
              <div className="mt-1 text-xs text-slate-500 truncate">
                {subtitle}
              </div>
            ) : null}
          </div>

          <div className="transition-transform duration-300 group-hover:scale-125 group-hover:rotate-3">
            {Icon ? <Icon className={cn('h-6 w-6', theme.icon)} /> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
