'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Building2, CheckCircle2, Package, Factory } from 'lucide-react';

export function VendorStats({ vendors }) {
  const totalVendors = vendors?.length || 0;
  const activeVendors = (vendors || []).filter((v) => !v.isDeleted).length;
  const suppliers = (vendors || []).filter((v) => v.type === 'supplier').length;
  const manufacturers = (vendors || []).filter(
    (v) => v.type === 'manufacturer'
  ).length;

  const statCards = [
    {
      label: 'Total Vendors',
      value: totalVendors,
      bg: 'bg-cyan-50',
      border: 'border-l-cyan-500',
      icon: <Building2 className="h-6 w-6 text-cyan-700" />,
    },
    {
      label: 'Active Vendors',
      value: activeVendors,
      bg: 'bg-emerald-50',
      border: 'border-l-emerald-500',
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-700" />,
    },
    {
      label: 'Suppliers',
      value: suppliers,
      bg: 'bg-amber-50',
      border: 'border-l-amber-500',
      icon: <Package className="h-6 w-6 text-amber-700" />,
    },
    {
      label: 'Manufacturers',
      value: manufacturers,
      bg: 'bg-violet-50',
      border: 'border-l-violet-500',
      icon: <Factory className="h-6 w-6 text-violet-700" />,
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
