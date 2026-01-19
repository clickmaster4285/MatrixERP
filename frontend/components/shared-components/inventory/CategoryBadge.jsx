import { cn } from '@/lib/utils';

import {
  Building2,
  Radio,
  TowerControl,
  Home,
  Zap,
  Wind,
  Shield,
  Armchair,
  Package,
} from 'lucide-react';

const categoryConfig = {
  civil: {
    label: 'Civil',
    icon: Building2,
    color: 'bg-orange-500/10 text-orange-600',
  },
  telecom: {
    label: 'Telecom',
    icon: Radio,
    color: 'bg-sky-500/10 text-sky-600',
  },
  tower: {
    label: 'Tower',
    icon: TowerControl,
    color: 'bg-slate-500/10 text-slate-600',
  },
  shelter: {
    label: 'Shelter',
    icon: Home,
    color: 'bg-amber-500/10 text-amber-600',
  },
  power: {
    label: 'Power',
    icon: Zap,
    color: 'bg-yellow-500/10 text-yellow-600',
  },
  air_conditioning: {
    label: 'AC',
    icon: Wind,
    color: 'bg-cyan-500/10 text-cyan-600',
  },
  security: {
    label: 'Security',
    icon: Shield,
    color: 'bg-red-500/10 text-red-600',
  },
  furniture: {
    label: 'Furniture',
    icon: Armchair,
    color: 'bg-purple-500/10 text-purple-600',
  },
  others: {
    label: 'Others',
    icon: Package,
    color: 'bg-gray-500/10 text-gray-600',
  },
};


export function CategoryBadge({
  category,
  showIcon = true,
  className,
}) {
  const config = categoryConfig[category] || categoryConfig.others;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
    </span>
  );
}
