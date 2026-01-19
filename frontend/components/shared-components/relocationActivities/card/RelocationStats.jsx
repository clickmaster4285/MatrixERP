'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart3,
  Activity,
  CheckCircle,
  FileClock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, bgColor, textColor, trend, trendValue }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {trend && (
                <div className="flex items-center gap-1">
                  {getTrendIcon()}
                  <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {trendValue}%
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className={`p-3 rounded-lg ${bgColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
            <Icon className={`w-6 h-6 ${textColor}`} />
          </div>
        </div>

        {/* Progress bar (for active/completed) */}
        {(label === 'Active' || label === 'Completed') && value > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span>{value}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${label === 'Active' ? 'bg-sky-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(value * 10, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function RelocationStats({ stats }) {
  const { total = 0, active = 0, completed = 0, draft = 0 } = stats;

  const statCards = [
    {
      label: 'Total Activities',
      value: total,
      icon: BarChart3,
      bgColor: 'bg-sky-100',
      textColor: 'text-sky-600',
      trend: total > 0 ? 'up' : 'stable',
      trendValue: 15
    },
    {
      label: 'Active',
      value: active,
      icon: Activity,
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-600',
      trend: active > 0 ? 'up' : 'stable',
      trendValue: 25
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle,
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      trend: completed > 0 ? 'up' : 'stable',
      trendValue: 10
    },
    {
      label: 'Draft',
      value: draft,
      icon: FileClock,
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      trend: draft > 0 ? 'up' : 'stable',
      trendValue: 5
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
}