'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  TrendingUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const PerformanceCards = ({
  performance,
  isLoading,
  overdueTasks,
  dueTodayTasks,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <Card
            key={index}
            className="border-l-4 border-l-slate-200 bg-slate-50 shadow-sm rounded-xl"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-24 bg-slate-200 rounded animate-pulse" />
                  <div className="h-7 w-12 bg-slate-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                </div>
                <div className="h-10 w-10 rounded-lg bg-slate-200 flex items-center justify-center animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const completionRateNumber = performance?.completionRate
    ? Math.round(performance.completionRate * 100)
    : 0;

  const completionRate = `${completionRateNumber}%`;

  const statCards = [
    {
      label: 'Total Tasks',
      value: performance?.totalTasks ?? 0,
      description: `${performance?.completedTasks ?? 0} completed`,
      bg: 'bg-cyan-50',
      border: 'border-l-cyan-500',
      icon: <ListTodo className="h-6 w-6 text-cyan-700" />,
    },
    {
      label: 'Completion Rate',
      value: completionRate,
      description: `Avg. ${performance?.avgCompletionTimeDays ?? 0} days`,
      bg: 'bg-emerald-50',
      border: 'border-l-emerald-500',
      icon: <TrendingUp className="h-6 w-6 text-emerald-700" />,
    },
    {
      label: 'Due Today',
      value: dueTodayTasks ?? 0,
      description: 'Tasks need attention',
      bg: 'bg-amber-50',
      border: 'border-l-amber-500',
      icon: <Clock className="h-6 w-6 text-amber-700" />,
    },
    {
      label: 'Overdue',
      value: overdueTasks ?? 0,
      description: overdueTasks > 0 ? 'Immediate action required' : 'All clear',
      bg: overdueTasks > 0 ? 'bg-red-50' : 'bg-slate-50',
      border: overdueTasks > 0 ? 'border-l-red-500' : 'border-l-slate-300',
      icon: (
        <AlertCircle
          className={`h-6 w-6 ${
            overdueTasks > 0 ? 'text-red-700' : 'text-slate-600'
          }`}
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
      {statCards.map((stat, index) => (
        <Card
          key={index}
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
                {stat.description && (
                  <div className="text-xs text-slate-600 mt-1">
                    {stat.description}
                  </div>
                )}
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
};
