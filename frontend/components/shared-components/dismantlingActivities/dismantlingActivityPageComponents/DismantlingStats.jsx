'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Package, ClipboardCheck, TrendingUp, Calendar } from 'lucide-react';

export default function DismantlingStats({ stats = {} }) {
  const { total = 0, completed = 0, inProgress = 0, pending = 0 } = stats;

  const statCards = [
    {
      key: 'total',
      label: 'Total Activities',
      value: total,
      bg: 'bg-cyan-50',
      border: 'border-l-cyan-500',
      icon: <Package className="h-6 w-6 text-cyan-700" />,
    },
    {
      key: 'completed',
      label: 'Completed',
      value: completed,
      bg: 'bg-emerald-50',
      border: 'border-l-emerald-500',
      icon: <ClipboardCheck className="h-6 w-6 text-emerald-700" />,
    },
    {
      key: 'inProgress',
      label: 'In Progress',
      value: inProgress,
      bg: 'bg-amber-50',
      border: 'border-l-amber-500',
      icon: <TrendingUp className="h-6 w-6 text-amber-700" />,
    },
    {
      key: 'pending',
      label: 'Pending',
      value: pending,
      bg: 'bg-slate-50',
      border: 'border-l-slate-500',
      icon: <Calendar className="h-6 w-6 text-slate-700" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat) => (
        <Card
          key={stat.key}
          className={`
            group
            border-l-4 ${stat.border}
            ${stat.bg}
            shadow-sm
            rounded-xl
            hover:shadow-lg
            hover:-translate-y-1
            hover:border-opacity-80
            transition-all duration-300 ease-out
          `}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {stat.label}
                </div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {stat.value}
                </div>
              </div>
              <div className="transition-transform duration-300 group-hover:scale-125 group-hover:rotate-3">
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
