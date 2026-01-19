// components/shared-components/project/ProjectStats.jsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  FolderOpen,
  MapPin,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ProjectStats = ({ stats }) => {
  const {
    totalProjects = 0,
    totalSites = 0,
    totalActivities = 0,
    avgProgress = 0,
  } = stats || {};

  const statCards = [
    {
      title: 'Total Projects',
      value: totalProjects,
      icon: <FolderOpen className="h-5 w-5 text-sky-600" />,
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-600',
      description: 'Active projects in system'
    },
    {
      title: 'Total Sites',
      value: totalSites,
      icon: <MapPin className="h-5 w-5 text-emerald-600" />,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-600',
      description: 'Across all projects'
    },
    {
      title: 'Total Activities',
      value: totalActivities,
      icon: <Activity className="h-5 w-5 text-amber-600" />,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-600',
      description: 'Dismantling, COW & Relocation'
    },
    {
      title: 'Avg. Progress',
      value: `${avgProgress}%`,
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-600',
      description: 'Overall project completion'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white/50 backdrop-blur-sm"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className={cn(
                    "inline-flex p-2 rounded-lg border",
                    stat.bgColor,
                    stat.borderColor
                  )}>
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {stat.value}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700">
                    {stat.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {stat.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
};

export default ProjectStats;