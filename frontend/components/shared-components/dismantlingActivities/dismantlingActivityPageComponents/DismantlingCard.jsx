// components/dismantling/DismantlingCard.jsx
'use client';

import { useState } from 'react';
import {
  MapPin,
  Users,
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Wrench,
  Truck,
  MoreVertical,
  Eye,
  Trash2,
  BarChart3,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { getStatusColor, getTypeColor } from '../utils';

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const getPhaseTone = (s) => {
  const v = String(s || '').toLowerCase();
  if (v === 'completed') return 'text-status-completed';
  if (v === 'in-progress' || v === 'in-transit' || v === 'received')
    return 'text-status-in-progress';
  return 'text-muted-foreground';
};

// Small reusable “info row” like Location
const MetaItem = ({ icon: Icon, label, value, tooltip }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-primary/80" />
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground/80">
            {label}
          </div>
          <div className="text-sm font-medium text-foreground/90 truncate">
            {value}
          </div>
        </div>
      </div>
    </TooltipTrigger>
    {!!tooltip && <TooltipContent>{tooltip}</TooltipContent>}
  </Tooltip>
);

const DismantlingCard = ({ activity, onDelete, onOpenDetail }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = () => onOpenDetail?.(activity?._id);

  const city = activity?.location?.[0]?.city || '—';
  const state = activity?.location?.[0]?.state || '—';
  const address = activity?.location?.[0]?.address || '—';

  const assignedNames =
    (activity?.assignment?.assignedTo || [])
      .map((u) => u?.name)
      .filter(Boolean)
      .join(', ') || 'Not assigned';

  const createdAt = activity?.createdAt ? formatDate(activity.createdAt) : '—';

  const progress = activity?.completionPercentage ?? 0;

  return (
    <TooltipProvider>
      <div
        className="group relative bg-card rounded-2xl border border-border/60 shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden hover:-translate-y-0.5"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        {/* top accent */}
        <div className="absolute inset-x-0 top-0" />

        {/* subtle hover wash */}
        <div className="absolute inset-0 bg-linear-to-r from-primary/0 via-primary/0 to-primary/0 transition-all duration-500 group-hover:from-primary/6 group-hover:via-primary/3 group-hover:to-primary/6" />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`px-2.5 py-0.5 text-xs font-medium ${getTypeColor(
                    activity?.dismantlingType
                  )}`}
                >
                  {activity?.dismantlingType || '—'}
                </Badge>
                <Badge
                  variant="outline"
                  className={`px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                    activity?.status
                  )}`}
                >
                  {activity?.status || '—'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 min-w-0  ">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-primary/80" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {activity?.site?.name || 'No Site Name'}
                  </h3>
                
                </div>
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-9 w-9 rounded-full transition-all ${isHovered
                        ? 'bg-muted/70 opacity-100'
                        : 'opacity-60 group-hover:opacity-100'
                      }`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => onOpenDetail?.(activity?._id)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-destructive cursor-pointer focus:text-destructive"
                    onClick={() => onDelete?.(activity?._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Meta (boxed for better structure) */}
          <div className="mb-5 rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <MetaItem
              icon={MapPin}
              label="Location"
              value={`${city}, ${state}`}
              tooltip={`${city}, ${state}, ${address}`}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MetaItem icon={Users} label="Manager" value={assignedNames} />
              <MetaItem icon={Calendar} label="Created" value={createdAt} />
            </div>

            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>

          {/* Phases */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/60">
            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border/60 bg-background/60 ${getPhaseTone(
                activity?.survey?.status
              )}`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span className="font-medium">Survey</span>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground" />

            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border/60 bg-background/60 ${getPhaseTone(
                activity?.dismantling?.status
              )}`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span className="font-medium">Dismantling</span>
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground" />

            <div
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border/60 bg-background/60 ${getPhaseTone(
                activity?.dispatch?.status
              )}`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span className="font-medium">Dispatch</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 px-2.5 text-muted-foreground hover:text-primary hover:bg-primary/5"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail?.(activity?._id);
              }}
            >
              Details
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </div>

        {/* bottom accent */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary/80 to-primary transform transition-transform duration-300 ${isHovered ? 'translate-y-0' : 'translate-y-full'
            }`}
        />
      </div>
    </TooltipProvider>
  );
};

export default DismantlingCard;
