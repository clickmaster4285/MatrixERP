'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building,
  Users,
  MapPin,
  CalendarDays,
  Clock,
  ArrowRight,
  User,
  Briefcase,
  Calendar,
  AlertCircle,
  ChevronRight,
  Phone,
  Mail,
  Map,
  Globe,
} from 'lucide-react';

export default function OverviewTab({ task }) {
  const formatDate = (v) => (v ? new Date(v).toLocaleDateString() : 'N/A');
  const formatTime = (v) =>
    v
      ? new Date(v).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
      : '';

  const isOverdue = task?.dueDate ? new Date(task.dueDate) < new Date() : false;

  return (
    <div className="space-y-5">
      {/* Site Info & Relocation Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Site Information Card */}
        <Card className="border shadow-sm h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-sky-600" />
                <CardTitle className="text-base font-semibold">
                  Site Information
                </CardTitle>
              </div>

              <Badge variant="outline" className="text-xs px-2 py-1 shrink-0">
                ID: {task?.site?.siteId || task?.siteId || 'N/A'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0 pb-4">
            <div className="rounded-lg border bg-muted/10">
              {/* Site Name */}
              <div className="flex items-start gap-3 p-4">
                <div className="p-2 bg-sky-100 rounded-lg shrink-0">
                  <Building className="h-4 w-4 text-sky-700" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground leading-tight">
                    Site Name
                  </p>
                  <p className="text-sm font-semibold truncate mt-1">
                    {task?.site?.name || task?.siteName || 'Unknown Site'}
                  </p>
                </div>

                <Badge
                  variant="outline"
                  className="text-[11px] px-2 py-0.5 shrink-0"
                >
                  {task?.site?.siteId || task?.siteId || 'N/A'}
                </Badge>
              </div>

              <div className="h-px bg-border" />

              {/* Region & Area — SAME ROW */}
              <div className="grid grid-cols-2">
                <div className="flex items-center gap-3 p-4">
                  <MapPin className="h-4 w-4 text-slate-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground leading-tight">
                      Region
                    </p>
                    <p className="text-sm font-medium truncate mt-1">
                      {task?.site?.region || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 border-l">
                  <Globe className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground leading-tight">
                      Area
                    </p>
                    <p className="text-sm font-medium truncate mt-1">
                      {task?.site?.area || 'General'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relocation Card (if applicable) */}
        {task?.activityType === 'relocation' ? (
          <Card className="border shadow-sm h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base font-semibold">
                  Relocation Details
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-0 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Source Site */}
                <div className="p-3 rounded-lg border border-sky-200 bg-sky-50/50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2">
                      <div className="p-2 bg-sky-100 rounded-md shrink-0">
                        <Building className="h-4 w-4 text-sky-700" />
                      </div>
                      <div className="leading-tight">
                        <h4 className="text-sm font-semibold">Source Site</h4>
                        <p className="text-[11px] text-muted-foreground">
                          Moving from
                        </p>
                      </div>
                    </div>
                    <Badge variant="active" className="text-[11px] px-2 py-0.5">
                      FROM
                    </Badge>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">
                      Location
                    </p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium truncate">
                        {task?.sourceSite?.address?.city || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Destination Site */}
                <div className="p-3 rounded-lg border border-green-200 bg-green-50/50">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2">
                      <div className="p-2 bg-green-100 rounded-md shrink-0">
                        <Building className="h-4 w-4 text-green-700" />
                      </div>
                      <div className="leading-tight">
                        <h4 className="text-sm font-semibold">
                          Destination Site
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Moving to
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="inProgress"
                      className="text-[11px] px-2 py-0.5"
                    >
                      TO
                    </Badge>
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">
                      Location
                    </p>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="text-sm font-medium truncate">
                        {task?.destinationSite?.address?.city || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Placeholder for non-relocation tasks */
          <Card className="border shadow-sm h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-slate-600" />
                <CardTitle className="text-base font-semibold">
                  Location Details
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="p-6 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-slate-400" />
                </div>
                <h4 className="font-medium mb-2">Single Site Operation</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This task involves work at a single location. No relocation
                  required.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Team & Timeline Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Team Information */}
        <Card className="border shadow-sm lg:col-span-2 h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-base font-semibold">
                Team Information
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Team */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-indigo-100 bg-indigo-50/40 h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm font-semibold">Task Team</span>
                  </div>

                  <div className="space-y-2">
                    {task?.otherTeamMembers?.length > 0 ? (
                      task.otherTeamMembers.slice(0, 3).map((member, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-indigo-50/60 transition-colors"
                        >
                          <div className="h-7 w-7 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-indigo-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {member?.name || 'Unnamed Member'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate leading-tight">
                              {member?.role || 'Team Member'}
                            </p>
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No team members assigned
                      </p>
                    )}

                    {task?.otherTeamMembers?.length > 3 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground leading-tight">
                          +{task.otherTeamMembers.length - 3} more team members
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Department */}
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/40 h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-semibold">Department</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium">
                        {task?.department || 'Field Operations'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        Primary department
                      </p>
                    </div>

                    {task?.managerEmail && (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground truncate leading-tight">
                            {task.managerEmail}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="border shadow-sm h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base font-semibold">
                Timeline
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-3.5">
              {/* Created */}
              <div className="p-4 rounded-lg border border-sky-100 bg-sky-50/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-sky-600" />
                    <span className="text-sm font-medium">Created</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-right shrink-0">
                    {formatDate(task?.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-tight">
                  {formatTime(task?.createdAt)}
                </p>
              </div>

              {/* Updated */}
              <div className="p-4 rounded-lg border border-emerald-100 bg-emerald-50/40">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Last Updated</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-right shrink-0">
                    {task?.updatedAt ? formatDate(task.updatedAt) : 'Never'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-tight">
                  {task?.updatedAt ? formatTime(task.updatedAt) : ''}
                </p>
              </div>

              {/* Due Date */}
              <div
                className={`p-4 rounded-lg border ${task?.dueDate
                    ? isOverdue
                      ? 'border-red-200 bg-red-50/40'
                      : 'border-green-200 bg-green-50/40'
                    : 'border-slate-200 bg-slate-50/40'
                  }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock
                      className={`h-4 w-4 ${task?.dueDate
                          ? isOverdue
                            ? 'text-red-600'
                            : 'text-green-600'
                          : 'text-slate-500'
                        }`}
                    />
                    <span className="text-sm font-medium">Due Date</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-medium ${task?.dueDate
                          ? isOverdue
                            ? 'text-red-600'
                            : 'text-green-600'
                          : 'text-muted-foreground'
                        }`}
                    >
                      {task?.dueDate ? formatDate(task.dueDate) : 'No deadline'}
                    </span>

                    {task?.dueDate && isOverdue && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>

                {task?.dueDate && (
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">
                    {isOverdue ? 'Overdue' : 'Scheduled deadline'}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
