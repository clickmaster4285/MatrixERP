'use client';

import { useState } from 'react';
import {
  MapPin,
  Users,
  Calendar,
  Building2,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ClipboardCheck,
  Hammer,
  Wrench,
  Package,
  ArrowRightLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getRelocationTypeColor = (type) => {
  switch (type) {
    case 'B2S':
      return 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200';
    case 'OMO':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    case 'StandAlone':
      return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'active':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getWorkTypeIcon = (type) => {
  const icons = {
    survey: ClipboardCheck,
    dismantling: Package,
    storeOperator: Package,
    civil: Hammer,
    telecom: Wrench
  };
  return icons[type] || ClipboardCheck;
};

const collectAssignedUsers = (activity) => {
  const assigned = [];

  const collectFromSite = (site) => {
    if (!site) return;
    ['surveyWork', 'dismantlingWork', 'storeOperatorWork', 'civilWork', 'telecomWork'].forEach(workType => {
      const work = site[workType];
      if (work?.assignedUsers) {
        assigned.push(...work.assignedUsers);
      }
    });
  };

  collectFromSite(activity.sourceSite);
  collectFromSite(activity.destinationSite);

  return assigned;
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

const RelocationCard = ({
  activity,
  onView,
  onEdit,
  onDelete,
  users = [],
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const sourceAddress = activity.sourceSite?.address;
  const destinationAddress = activity.destinationSite?.address;
  const sourceCity = sourceAddress?.city || 'N/A';
  const destCity = destinationAddress?.city || 'N/A';

  const siteLabel = activity.siteId?.name ||
    activity.siteId?.siteId ||
    activity.siteId?._id ||
    'Unknown Site';

  const assignedUsers = collectAssignedUsers(activity);
  const uniqueAssignedUsers = [...new Set(assignedUsers.map(u => u.userId))];

  const assignedCount = uniqueAssignedUsers.length;
  const assignedNames = uniqueAssignedUsers.map(userId => {
    const user = users.find(u => u._id === userId);
    return user?.name || 'Unknown';
  }).slice(0, 2).join(', ');

  const createdAt = formatDate(activity.createdAt);

  const getWorkTypes = (site) => {
    if (!site?.workTypes?.length) return [];
    return site.workTypes.map(type => ({
      type,
      label: type === 'te' ? 'Telecom' : type.charAt(0).toUpperCase() + type.slice(1),
      Icon: getWorkTypeIcon(type)
    }));
  };

  const sourceWorkTypes = getWorkTypes(activity.sourceSite);
  const destWorkTypes = getWorkTypes(activity.destinationSite);

  return (
    <TooltipProvider>
      <div
        className="group relative bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-sky-300 transition-all duration-300 cursor-pointer overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onView && onView(activity._id)}
      >
        {/* Hover Effect Border */}
        <div className={`absolute inset-0 border-2 border-transparent rounded-xl transition-all duration-300 ${isHovered ? 'border-sky-400' : ''}`} />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={`${getRelocationTypeColor(activity.relocationType)} transition-colors`}
                >
                  {activity.relocationType}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(activity.overallStatus)}`}
                >
                  {activity.overallStatus}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-sky-600 transition-colors truncate">
                  {siteLabel}
                </h3>
              </div>
            </div>

            {/* Action Menu */}
            <div onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onView && onView(activity._id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit && onEdit(activity._id)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Activity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => onDelete && onDelete(activity._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Activity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Route Information */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <ArrowRightLeft className="w-4 h-4 shrink-0" />
              <span className="font-medium">Route</span>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500">Source</div>
                <div className="font-medium truncate">{sourceCity}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 mx-2" />
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-500">Destination</div>
                <div className="font-medium truncate">{destCity}</div>
              </div>
            </div>
          </div>

          {/* Assigned Team */}
          {assignedCount > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Users className="w-4 h-4 shrink-0" />
                <span className="font-medium">Team ({assignedCount})</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="bg-sky-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 truncate">
                      {assignedNames}
                      {assignedCount > 2 && ` +${assignedCount - 2} more`}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{assignedNames}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Work Types */}
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Work Types</div>
            <div className="flex flex-wrap gap-2">
              {sourceWorkTypes.map(({ type, label, Icon }) => (
                <Badge key={`source-${type}`} variant="secondary" className="gap-1">
                  <Icon className="w-3 h-3" />
                  Source: {label}
                </Badge>
              ))}
              {destWorkTypes.map(({ type, label, Icon }) => (
                <Badge key={`dest-${type}`} variant="secondary" className="gap-1">
                  <Icon className="w-3 h-3" />
                  Dest: {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Created {createdAt}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="group-hover:text-sky-600"
              onClick={(e) => {
                e.stopPropagation();
                onView && onView(activity._id);
              }}
            >
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default RelocationCard;