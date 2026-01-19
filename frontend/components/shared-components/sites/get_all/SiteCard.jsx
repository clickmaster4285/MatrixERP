// components/shared-components/sites/SiteCard.jsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, TowerControl, FileText, Wifi, Activity, MapIcon, Map } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDeleteSite } from '@/features/siteApi';

// ---------- STATUS STYLES ----------
const getStatusStyles = (status) => {
  const map = {
    planned: 'bg-sky-50 text-sky-700 border-sky-200',
    surveyed: 'bg-amber-50 text-amber-700 border-amber-200',
    dismantling: 'bg-orange-50 text-orange-700 border-orange-200',
    'in-progress': 'bg-purple-50 text-purple-700 border-purple-200',
    installed: 'bg-sky-50 text-sky-700 border-sky-200',
    commissioned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-50 text-slate-700 border-slate-200',
    maintenance: 'bg-red-50 text-red-700 border-red-200',
  };
  return map[status] || map.planned;
};

// ---------- HELPERS ----------
const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function SiteCard({ site, onEdit, onDelete }) {
  const router = useRouter();
  const pathname = usePathname();
  const deleteSiteMutation = useDeleteSite();

  const status = site?.overallStatus || 'planned';
  const region = site?.region || '—';

  // icon theme only (fallback if region isn't Source/Destination)
  const isDestination = String(region).toLowerCase() === 'destination';

  const managerName = site?.siteManager?.name || 'Site Manager';
  const managerInitials =
    typeof managerName === 'string'
      ? managerName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
      : 'SM';

  const activityStats = {
    total: site?.activities?.length || 0,
    inProgress:
      site?.activities?.filter((a) => a?.workflow?.status === 'in-progress')?.length || 0,
    completed:
      site?.activities?.filter((a) => a?.workflow?.status === 'completed')?.length || 0,
  };

  const handleCardClick = (e) => {
    if (e.target.closest('[role="menuitem"]') || e.target.closest('[data-state="open"]')) return;

    const pathSegments = pathname.split('/');
    let basePath = '';

    if (pathSegments.includes('admin')) basePath = '/admin';
    else if (pathSegments.includes('manager')) basePath = '/manager';
    else if (pathSegments.includes('supervisor')) basePath = '/supervisor';
    else {
      const roleIndex = pathSegments.findIndex((seg) => seg === 'sites');
      if (roleIndex > 0) basePath = pathSegments.slice(0, roleIndex).join('/');
    }

    router.push(`${basePath}/sites/${site?._id}`);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit?.(site);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete site "${site?.name}"?`)) return;

    try {
      await deleteSiteMutation.mutateAsync(site?._id);
      toast.success('Site deleted successfully');
      onDelete?.(site?._id);
    } catch (error) {
      toast.error('Failed to delete site', {
        description: error?.message || 'Please try again.',
      });
    }
  };

  return (
    <Card
      className="group relative flex flex-col cursor-pointer overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30"
      onClick={handleCardClick}
    >
      {/* subtle hover wash */}
      <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/0 to-primary/0 transition-all duration-500 group-hover:from-primary/6 group-hover:via-primary/3 group-hover:to-primary/6" />

      <div className="relative">
        <CardHeader className="space-y-3">
          {/* TITLE ROW: Icon + Name + Right actions */}
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${isDestination
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-orange-50 text-orange-600 border-orange-100'
                }`}
            >
              {isDestination ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <TowerControl className="h-4 w-4" />
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base font-semibold text-slate-900 leading-tight truncate group-hover:text-primary transition-colors">
                    {site?.name || 'Unnamed Site'}
                  </CardTitle>
                
                </div>

                {/* RIGHT SIDE: Status + Menu */}
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={`px-2 py-0.5 text-[10px] font-semibold border rounded-full ${getStatusStyles(
                      status
                    )}`}
                  >
                    {String(status).replace('-', ' ')}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 rounded-full opacity-70 group-hover:opacity-100 hover:bg-muted/60"
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Site
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleDelete}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Site
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* Activities row - moved closer to title */}
          <div className="flex items-center justify-between gap-3 mt-1">
            {/* Activities badge */}
            {activityStats.total > 0 && (
              <Badge
                variant="outline"
                className="shrink-0 px-2 py-0.5 text-[10px] font-semibold border rounded-full bg-sky-50 text-sky-700 border-sky-200"
              >
                <Activity className="h-3 w-3 mr-1" />
                {activityStats.total} Activities
              </Badge>
            )}

            {/* Add more content here if needed, e.g., location or type */}
            <div className="flex-1"></div>
          </div>
        </CardHeader>

        <CardContent className=" pb-4 space-y-3 text-sm text-slate-600">

          {/* Manager */}
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/avatars/default.png" alt="Site manager" />
              <AvatarFallback className="bg-muted text-xs">
                {managerInitials}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {managerName}
              </span>
              <span className="text-[11px] text-slate-500">Site Manager</span>
            </div>
          </div>




          <div className='grid grid-cols-2 gap-3 mt-4'>
            {/* Project */}
            {site?.project && typeof site.project === 'object' && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                    Project
                  </div>
                  <div className="text-slate-800 font-medium truncate">
                    {site?.project?.name || '—'}
                  </div>
                </div>
              </div>
            )}

            {/* region */}
            <div className="flex items-start gap-2">
              <Map className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                  Region
                </div>
                <div className="text-slate-800 font-medium truncate">
                  {region}
                </div>
              </div>
            </div>
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                Created
              </div>
              <div className="text-slate-800 font-medium truncate">
                {formatDate(site?.createdAt)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                Updated
              </div>
              <div className="text-slate-800 font-medium truncate">
                {formatDate(site?.updatedAt)}
              </div>
            </div>
          </div>

          {/* Activity Summary */}
          {activityStats.total > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                  Activities
                </div>

                <div className="flex gap-2">
                  {activityStats.inProgress > 0 && (
                    <span className="text-xs text-amber-600">
                      {activityStats.inProgress} in progress
                    </span>
                  )}
                  {activityStats.completed > 0 && (
                    <span className="text-xs text-emerald-600">
                      {activityStats.completed} completed
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {site?.activities?.slice(0, 2).map((activity, i) => (
                  <Badge
                    key={activity?._id || i}
                    variant="outline"
                    className="text-[11px] font-medium border-slate-200 bg-slate-50"
                  >
                    {activity?.activityType?.name || 'Activity'}
                  </Badge>
                ))}

                {site?.activities?.length > 2 && (
                  <Badge
                    variant="outline"
                    className="text-[11px] font-medium border-slate-200 bg-white"
                  >
                    +{site.activities.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}