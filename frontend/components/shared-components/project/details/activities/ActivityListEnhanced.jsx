// components/shared-components/project/project-details/ActivityListEnhanced.jsx
'use client';

import { useState, useMemo } from 'react';
import {
   Filter,
   Search,
   X,
   Hammer,
   Truck,
   Move,
   Calendar,
   Building,
   User,
   MapPin,
   Clock,
   CheckCircle,
   AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';

const ActivityListEnhanced = ({ activities = [], sites = [] }) => {
   const [search, setSearch] = useState('');
   const [typeFilter, setTypeFilter] = useState('all');
   const [statusFilter, setStatusFilter] = useState('all');
   const [siteFilter, setSiteFilter] = useState('all');

   // Filter activities
   const filteredActivities = useMemo(() => {
      return activities.filter(activity => {
         // Search filter
         if (search) {
            const searchLower = search.toLowerCase();
            const matchesSearch =
               activity.activityName?.toLowerCase().includes(searchLower) ||
               activity.dismantlingType?.toLowerCase().includes(searchLower) ||
               activity.relocationType?.toLowerCase().includes(searchLower) ||
               activity.description?.toLowerCase().includes(searchLower) ||
               activity.notes?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
         }

         // Type filter
         if (typeFilter !== 'all') {
            const activityType = activity.activityType?.type || activity.activityType?.name;
            if (activityType !== typeFilter) return false;
         }

         // Status filter
         if (statusFilter !== 'all') {
            const status = activity.status || activity.overallStatus;
            if (status !== statusFilter) return false;
         }

         // Site filter
         if (siteFilter !== 'all' && activity.siteId !== siteFilter) {
            return false;
         }

         return true;
      });
   }, [activities, search, typeFilter, statusFilter, siteFilter]);

   const getActivityIcon = (type) => {
      switch (type) {
         case 'dismantling':
            return <Hammer className="h-4 w-4 text-amber-500" />;
         case 'cow':
            return <Truck className="h-4 w-4 text-sky-500" />;
         case 'relocation':
            return <Move className="h-4 w-4 text-purple-500" />;
         default:
            return <AlertCircle className="h-4 w-4 text-slate-400" />;
      }
   };

   const getStatusColor = (status) => {
      switch (status) {
         case 'completed': return 'bg-green-100 text-green-700 border-green-200';
         case 'in-progress': return 'bg-sky-100 text-sky-700 border-sky-200';
         case 'planned': return 'bg-amber-100 text-amber-700 border-amber-200';
         case 'pending': return 'bg-slate-100 text-slate-700 border-slate-200';
         default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
   };

   const getStatusIcon = (status) => {
      switch (status) {
         case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
         case 'in-progress': return <Clock className="h-4 w-4 text-sky-500" />;
         case 'planned': return <Clock className="h-4 w-4 text-amber-500" />;
         default: return <AlertCircle className="h-4 w-4 text-slate-400" />;
      }
   };

   if (activities.length === 0) {
      return (
         <div className="text-center py-12 bg-linear-to-b from-slate-50 to-white rounded-xl">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-700 mb-2">No Activities</h4>
            <p className="text-slate-500 mb-4">Activities will appear here once added to project sites</p>
            <Button className="gap-2">
               <Hammer className="h-4 w-4" />
               Create First Activity
            </Button>
         </div>
      );
   }

   return (
      <div className="space-y-6">
         {/* Filters */}
         <Card className="border-slate-200">
            <CardContent className="p-6">
               <div className="space-y-4">
                  {/* Search */}
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                     <Input
                        placeholder="Search activities..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                     />
                     {search && (
                        <button
                           onClick={() => setSearch('')}
                           className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                           <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                        </button>
                     )}
                  </div>

                  {/* Filter Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Type</label>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                           <SelectTrigger>
                              <SelectValue placeholder="All Types" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              <SelectItem value="dismantling">Dismantling</SelectItem>
                              <SelectItem value="cow">COW Activity</SelectItem>
                              <SelectItem value="relocation">Relocation</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                           <SelectTrigger>
                              <SelectValue placeholder="All Statuses" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="planned">Planned</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Site</label>
                        <Select value={siteFilter} onValueChange={setSiteFilter}>
                           <SelectTrigger>
                              <SelectValue placeholder="All Sites" />
                           </SelectTrigger>
                           <SelectContent>
                              <SelectItem value="all">All Sites</SelectItem>
                              {sites.map(site => (
                                 <SelectItem key={site._id} value={site.siteId}>
                                    {site.name}
                                 </SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  {/* Active Filters */}
                  {(search || typeFilter !== 'all' || statusFilter !== 'all' || siteFilter !== 'all') && (
                     <div className="flex flex-wrap gap-2 pt-2">
                        {search && (
                           <Badge variant="secondary" className="gap-1">
                              Search: "{search}"
                              <button onClick={() => setSearch('')}>
                                 <X className="h-3 w-3" />
                              </button>
                           </Badge>
                        )}
                        {typeFilter !== 'all' && (
                           <Badge variant="secondary" className="gap-1">
                              Type: {typeFilter}
                              <button onClick={() => setTypeFilter('all')}>
                                 <X className="h-3 w-3" />
                              </button>
                           </Badge>
                        )}
                        {statusFilter !== 'all' && (
                           <Badge variant="secondary" className="gap-1">
                              Status: {statusFilter}
                              <button onClick={() => setStatusFilter('all')}>
                                 <X className="h-3 w-3" />
                              </button>
                           </Badge>
                        )}
                        {siteFilter !== 'all' && (
                           <Badge variant="secondary" className="gap-1">
                              Site: {siteFilter}
                              <button onClick={() => setSiteFilter('all')}>
                                 <X className="h-3 w-3" />
                              </button>
                           </Badge>
                        )}
                        <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => {
                              setSearch('');
                              setTypeFilter('all');
                              setStatusFilter('all');
                              setSiteFilter('all');
                           }}
                           className="h-6 text-xs"
                        >
                           Clear All
                        </Button>
                     </div>
                  )}
               </div>
            </CardContent>
         </Card>

         {/* Results Count */}
         <div className="flex items-center justify-between">
            <div>
               <h4 className="font-semibold text-slate-900">Activities</h4>
               <p className="text-slate-600 text-sm">
                  Showing {filteredActivities.length} of {activities.length} activities
               </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
               <Filter className="h-4 w-4" />
               Sort by: Date
            </Button>
         </div>

         {/* Activities List */}
         <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
               const status = activity.status || activity.overallStatus || 'pending';
               const activityType = activity.activityType?.type || activity.activityType?.name;

               return (
                  <Card key={activity._id || index} className="hover:shadow-md transition-shadow">
                     <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                           <div className="flex items-start gap-3">
                              <div className="p-2 bg-linear-to-br from-slate-50 to-white rounded-lg">
                                 {getActivityIcon(activityType)}
                              </div>
                              <div>
                                 <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-slate-900">
                                       {activity.activityName || activity.dismantlingType || `Relocation - ${activity.relocationType}`}
                                    </h4>
                                    <Badge className={getStatusColor(status)}>
                                       <span className="flex items-center gap-1">
                                          {getStatusIcon(status)}
                                          {status?.charAt(0).toUpperCase() + status?.slice(1)}
                                       </span>
                                    </Badge>
                                 </div>

                                 <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                                    <div className="flex items-center gap-1">
                                       <Building className="h-3 w-3" />
                                       <span>{activity.siteName}</span>
                                    </div>
                                    {activity.createdAt && (
                                       <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3" />
                                          <span>{format(new Date(activity.createdAt), 'MMM dd, yyyy')}</span>
                                       </div>
                                    )}
                                    {activity.location?.address && (
                                       <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          <span className="line-clamp-1">{activity.location.address}</span>
                                       </div>
                                    )}
                                 </div>

                                 {(activity.description || activity.notes) && (
                                    <p className="text-sm text-slate-700 line-clamp-2">
                                       {activity.description || activity.notes}
                                    </p>
                                 )}
                              </div>
                           </div>

                           <Button variant="ghost" size="sm" className="text-slate-600 hover:text-sky-600">
                              View Details
                           </Button>
                        </div>

                        {/* Progress for Dismantling Activities */}
                        {activityType === 'dismantling' && activity.completionPercentage !== undefined && (
                           <div className="mt-4 pt-4 border-t border-slate-100">
                              <div className="flex items-center justify-between text-sm mb-2">
                                 <span className="text-slate-600">Activity Progress</span>
                                 <span className="font-semibold text-slate-900">{activity.completionPercentage}%</span>
                              </div>
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                 <div
                                    className="h-full bg-linear-to-r from-amber-500 to-amber-600"
                                    style={{ width: `${activity.completionPercentage}%` }}
                                 />
                              </div>
                           </div>
                        )}
                     </CardContent>
                  </Card>
               );
            })}
         </div>

         {/* Empty State for Filters */}
         {filteredActivities.length === 0 && activities.length > 0 && (
            <div className="text-center py-12">
               <Filter className="h-12 w-12 text-slate-300 mx-auto mb-3" />
               <h4 className="font-semibold text-slate-700 mb-2">No Matching Activities</h4>
               <p className="text-slate-500">Try adjusting your filters to see more results</p>
            </div>
         )}
      </div>
   );
};

export default ActivityListEnhanced;