// components/shared-components/tasks/TaskCard.jsx
'use client';

import { cn } from '@/lib/utils';
import {
  Calendar,
  MapPin,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Truck,
  Wrench,
  Users,
  User,
  Mail,
  ChevronRight,
  UserCheck,
  Target,
  Package,
  ClipboardList,
  HardHat,
  Settings,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import React from 'react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Status mapping
const statusConfig = {
  'draft': {
    label: 'Draft',
    icon: Clock,
    className: 'bg-gray-100 text-gray-700',
    color: 'text-gray-600',
  },
  'planned': {
    label: 'Planned',
    icon: Clock,
    className: 'bg-sky-100 text-sky-700',
    color: 'text-sky-600',
  },
  'dismantling': {
    label: 'Dismantling',
    icon: Loader2,
    className: 'bg-orange-100 text-orange-700',
    color: 'text-orange-600',
  },
  'completed': {
    label: 'Completed',
    icon: CheckCircle2,
    className: 'bg-green-100 text-green-700',
    color: 'text-green-600',
  },
  'pending': {
    label: 'Pending',
    icon: AlertCircle,
    className: 'bg-yellow-100 text-yellow-700',
    color: 'text-yellow-600',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Loader2,
    className: 'bg-indigo-100 text-indigo-700',
    color: 'text-indigo-600',
  },
  'not-started': {
    label: 'Not Started',
    icon: Clock,
    className: 'bg-gray-100 text-gray-700',
    color: 'text-gray-600',
  },
};

// Module mapping - ADDED COW
const moduleConfig = {
  'relocation': {
    label: 'Relocation',
    icon: Truck,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  'dismantling': {
    label: 'Dismantling',
    icon: Wrench,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  'cow': {
    label: 'COW',
    icon: HardHat,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
};

// Work type icons for COW
const workTypeConfig = {
  'survey': {
    icon: ClipboardList,
    color: 'text-sky-600',
    label: 'Survey'
  },
  'inventory': {
    icon: Package,
    color: 'text-violet-600',
    label: 'Inventory'
  },
  'transportation': {
    icon: Truck,
    color: 'text-amber-600',
    label: 'Transportation'
  },
  'installation': {
    icon: Settings,
    color: 'text-green-600',
    label: 'Installation'
  },
};

export const TaskCard = ({ task, index }) => {
  const {
    _id,
    activityType,
    title,
    siteId,
    siteName,
    status,
    completion,
    phase,
    myRole,
    assignedBy,
    assignedById,
    otherTeamMembers = [],
    updatedAt,
    createdAt,
    dismantlingType,
    location,
    survey,
    relocationType,
    sourceSite,
    destinationSite,
    site,
    siteAddress,
    // COW specific fields
    purpose,
    workType,
    workStatus,
    workData,
    siteLocation,
    plannedStartDate,
    plannedEndDate,
    destinationSite: cowDestinationSite,
    sourceSite: cowSourceSite,
  } = task;

  // Get configs
  const taskStatus = (status || '').toLowerCase();
  const statusMeta = statusConfig[taskStatus] || statusConfig.draft;
  const StatusIcon = statusMeta?.icon;
  const moduleMeta = moduleConfig[activityType] || moduleConfig.dismantling;
  const ModuleIcon = moduleMeta?.icon;

  // Get work type icon for COW
  const workTypeMeta = workTypeConfig[workType] || workTypeConfig.survey;
  const WorkTypeIcon = workTypeMeta?.icon;

  // Dates
  const updatedDate = new Date(updatedAt);
  const createdDate = new Date(createdAt);
  const timeAgo = formatDistanceToNow(updatedDate, { addSuffix: true });

  // Location info - UPDATED FOR COW
  const getLocationInfo = () => {
    // For COW activities
    if (activityType === 'cow') {
      const currentSite = siteLocation || site || {};
      if (currentSite?.address) {
        return {
          city: currentSite.address.city || 'Unknown',
          address: currentSite.address.street || currentSite.address.address || 'No address',
        };
      }
    }

    // For dismantling activities
    if (activityType === 'dismantling' && location) {
      return {
        city: location.city || 'Unknown',
        address: location.address || 'No address',
      };
    }
    // For relocation activities
    else if (activityType === 'relocation' && sourceSite?.address) {
      if (typeof sourceSite.address === 'string') {
        return { city: sourceSite.address, address: sourceSite.address };
      }
      return {
        city: sourceSite.address.city || 'Unknown',
        address: sourceSite.address.street || sourceSite.address.address || 'No address',
      };
    }
    // Fallback
    else if (siteAddress) {
      return {
        city: siteAddress.city || 'Unknown',
        address: siteAddress.street || siteAddress.address || 'No address',
      };
    }
    return { city: 'Unknown', address: 'No address' };
  };

  const locationInfo = getLocationInfo();
  const siteDisplayName = site?.name || siteName || locationInfo.city || 'Unknown Site';

  // Team members
  const allAssignedUsers = [
    { name: 'You', role: myRole, isYou: true },
    ...otherTeamMembers
  ];
  const avatarsToShow = allAssignedUsers.slice(0, 5);
  const remainingCount = Math.max(0, allAssignedUsers.length - 5);

  // Assigned By user
  const assignedByUser = {
    name: assignedBy || 'System',
    role: 'Project Lead',
  };

  // Get task description - UPDATED FOR COW
  const getTaskDescription = () => {
    if (activityType === 'dismantling') {
      return `${dismantlingType || 'Dismantling'} activity at ${locationInfo.city}. ${survey?.status === 'completed' ? 'Survey completed' : 'Survey pending'}.`;
    } else if (activityType === 'relocation') {
      return `Relocation from ${sourceSite?.address?.city || 'Source'} to ${destinationSite?.address?.city || 'Destination'}.`;
    } else if (activityType === 'cow') {
      return `${purpose || 'COW'} - ${workType || 'Work'} at ${siteDisplayName}. ${workStatus || 'Status'}: ${status || 'planned'}.`;
    }
    return 'Task in progress';
  };

  // Get work badge for COW
  const getWorkBadge = () => {
    if (activityType !== 'cow') return null;

    return (
      <span className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
        'bg-gray-50 text-gray-700'
      )}>
        <WorkTypeIcon className="h-3.5 w-3.5" />
        {workTypeMeta.label}
      </span>
    );
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl border bg-white p-5 transition-all duration-300',
          'hover:shadow-lg hover:border-primary/30 cursor-pointer',
          'animate-fade-in'
        )}
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Progress bar */}
        {completion > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-200">
            <div
              className={cn(
                'h-full transition-all duration-500',
                completion === 100 ? 'bg-green-500' : 'bg-sky-500'
              )}
              style={{ width: `${completion}%` }}
            />
          </div>
        )}

        <div className="space-y-5">
          {/* Header: Module, Status, Phase */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
              moduleMeta.bgColor,
              moduleMeta.color
            )}>
              <ModuleIcon className="h-3.5 w-3.5" />
              {moduleMeta.label}
            </span>

            <span className={cn(
              'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
              statusMeta.className
            )}>
              {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
              {statusMeta.label}
            </span>

            {/* Work type badge for COW */}
            {getWorkBadge()}

            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
              <Target className="h-3.5 w-3.5" />
              {phase || 'Not Started'}
            </span>
          </div>

          {/* Main Title and Info */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-900">
              {title}
            </h3>

            <p className="text-gray-600 text-sm">
              {getTaskDescription()}
            </p>

            {/* Site and Location */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{siteDisplayName}</span>
                {siteId && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {siteId}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{locationInfo.address}</span>
                {locationInfo.city && locationInfo.city !== locationInfo.address && (
                  <span className="text-gray-500">• {locationInfo.city}</span>
                )}
              </div>
            </div>
          </div>

          {/* Completion and Role */}
          <div className="flex items-center justify-between py-3 border-y border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Completion:</span>
              <span className="font-medium text-gray-900">{completion}%</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-900">{myRole || 'Team Member'}</span>
            </div>
          </div>

          {/* Assignment Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Assigned By */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Assigned By</span>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors cursor-pointer">
                    <UserAvatar
                      user={assignedByUser}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{assignedByUser.name}</p>
                      <p className="text-xs text-gray-500">Project Lead</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <UserAvatar user={assignedByUser} size="sm" />
                      <div>
                        <p className="font-semibold text-sm">{assignedByUser.name}</p>
                        <p className="text-xs text-gray-500">Project Lead</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Assigned this task to the team
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Assigned To */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Assigned To</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-auto">
                  {allAssignedUsers.length} members
                </span>
              </div>

              <div className="p-3 ">
                <div className="flex -space-x-2 mb-3">
                  {avatarsToShow.map((member, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <UserAvatar
                            user={member}
                            size="sm"
                            className={cn(
                              'ring-2 ring-white',
                              member.isYou && 'ring-emerald-500/20'
                            )}
                          />
                          {member.isYou && (
                            <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white">You</span>
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="p-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <UserAvatar user={member} size="sm" />
                            <div>
                              <p className="font-semibold text-sm">
                                {member.isYou ? 'You' : member.name}
                              </p>
                              <p className="text-xs text-gray-500">{member.role}</p>
                            </div>
                          </div>
                          {member.email && !member.isYou && (
                            <div className="flex items-center gap-1 text-xs">
                              <Mail className="h-3 w-3" />
                              <span className="text-gray-500">{member.email}</span>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}

                  {remainingCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-10 w-10 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            +{remainingCount}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="p-3">
                        <p className="text-sm">
                          {remainingCount} more team member{remainingCount !== 1 ? 's' : ''}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Dates Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {/* Start Date */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="font-medium text-gray-600 text-sm">{format(createdDate, 'MMM d, yyyy')}</p>
                <p className="text-xs text-gray-500">Created date</p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-50 border flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-600 text-sm">{format(updatedDate, 'MMM d, yyyy')}</p>
                <p className="text-xs text-gray-500">{timeAgo}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};