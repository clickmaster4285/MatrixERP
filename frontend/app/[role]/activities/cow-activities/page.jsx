'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCOWActivityManagement } from '@/hooks/useCOWActivityManagement';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
   Select,
   SelectTrigger,
   SelectValue,
   SelectContent,
   SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
   Search,
   Plus,
   Filter,
   X,
   RefreshCw,
   Download,
   Settings,
   Grid3x3,
   List,
   ChevronDown,
   TowerControl,
   Trash2,
} from 'lucide-react';
import COWStats from '@/components/shared-components/cowActivities/card/COWStats';
import COWActivityCard from '@/components/shared-components/cowActivities/card/COWActivityCard';

const COWActivitiesPage = () => {
   const router = useRouter();
   const { user } = useAuth();
   const role = user?.role || '';

   const {
      activities,
      pagination,
      isLoading,
      error,
      filters,
      updateFilters,
      clearFilters,
      getStatusColor,
      formattedUsers,
      deleteActivity,
      refetchActivities,
   } = useCOWActivityManagement();

   const [searchQuery, setSearchQuery] = useState('');
   const [localStatusFilter, setLocalStatusFilter] = useState('all');
   const [localPurposeFilter, setLocalPurposeFilter] = useState('all');
   const [showFilters, setShowFilters] = useState(false);
   const [viewMode, setViewMode] = useState('grid');
   const [selectedActivities, setSelectedActivities] = useState([]);

   useEffect(() => {
      if (error) {
         toast.error(error?.message || 'Error loading COW activities');
      }
   }, [error]);

   useEffect(() => {
      const backendFilters = {};
      if (localStatusFilter !== 'all') backendFilters.status = localStatusFilter;
      if (localPurposeFilter !== 'all') backendFilters.purpose = localPurposeFilter;
      if (searchQuery.trim()) backendFilters.search = searchQuery.trim();
      updateFilters(backendFilters);
   }, [localStatusFilter, localPurposeFilter, searchQuery, updateFilters]);

   const handleClearFilters = () => {
      setSearchQuery('');
      setLocalStatusFilter('all');
      setLocalPurposeFilter('all');
      setShowFilters(false);
      clearFilters();
      setSelectedActivities([]);
   };

   const stats = useMemo(() => {
      const list = activities || [];
      const total = list.length;
      const planned = list.filter(a => a.overallStatus === 'planned').length;
      const inProgress = list.filter(a => a.overallStatus === 'in-progress').length;
      const completed = list.filter(a => a.overallStatus === 'completed').length;
      return { total, planned, inProgress, completed };
   }, [activities]);

   const handleViewDetail = (id) => {
      router.push(`/${role}/activities/cow-activities/${id}`);
   };

   const handleEditActivity = (id) => {
      router.push(`/${role}/activities/cow-activities/${id}/edit`);
   };

   const handleDeleteActivity = async (id) => {
      if (confirm('Are you sure you want to delete this COW activity?')) {
         try {
            await deleteActivity(id);
            toast.success('COW activity deleted successfully');
            refetchActivities();
         } catch (error) {
            toast.error('Failed to delete COW activity');
         }
      }
   };

   const handleCreateCOW = () => {
      router.push(`/${role}/activities/cow-activities/create`);
   };

   const handlePageChange = (direction) => {
      const currentPage = pagination?.page || 1;
      const totalPages = pagination?.pages || 1;

      if (direction === 'prev' && currentPage > 1) {
         updateFilters({ page: currentPage - 1 });
      }
      if (direction === 'next' && currentPage < totalPages) {
         updateFilters({ page: currentPage + 1 });
      }
   };

   const handleSelectActivity = (id) => {
      setSelectedActivities(prev =>
         prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
   };

   const handleBulkDelete = async () => {
      if (selectedActivities.length === 0) {
         toast.warning('No activities selected');
         return;
      }

      if (confirm(`Delete ${selectedActivities.length} selected activities?`)) {
         try {
            for (const id of selectedActivities) {
               await deleteActivity(id);
            }
            toast.success(`${selectedActivities.length} activities deleted`);
            setSelectedActivities([]);
            refetchActivities();
         } catch (error) {
            toast.error('Failed to delete activities');
         }
      }
   };

   if (isLoading) {
      return (
         <div className="min-h-screen p-8 space-y-6">
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-2xl font-semibold">COW Activities</h1>
                  <p className="text-sm text-muted-foreground">Loading activities...</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
               ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
               {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
               ))}
            </div>
         </div>
      );
   }

   const hasActiveFilters = localStatusFilter !== 'all' || localPurposeFilter !== 'all' || searchQuery.trim();
   const hasSelection = selectedActivities.length > 0;

   return (
      <div className="min-h-screen">
         <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
               <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                     COW Activities
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                     Manage Cell on Wheels deployments and activities
                  </p>
               </div>

               <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => refetchActivities()} className="gap-2">
                     <RefreshCw className="w-4 h-4" />
                     Refresh
                  </Button>
                  <Button onClick={handleCreateCOW} className="gap-2 bg-sky-600 hover:bg-sky-700">
                     <Plus className="w-4 h-4" />
                     Create COW Activity
                  </Button>
               </div>
            </div>
         </header>

         <main className="space-y-8">
            <COWStats stats={stats} />

            {hasSelection && (
               <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                           <span className="text-sky-600 font-medium">{selectedActivities.length}</span>
                        </div>
                        <span className="text-sm text-sky-800">
                           {selectedActivities.length} activity{selectedActivities.length !== 1 ? 'ies' : ''} selected
                        </span>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedActivities([])}>
                           Clear Selection
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                           <Trash2 className="w-4 h-4" />
                           Delete Selected
                        </Button>
                     </div>
                  </div>
               </div>
            )}

            <div className="space-y-4">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                     <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <Input
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           placeholder="Search activities by name, site, or description..."
                           className="pl-10"
                        />
                        {searchQuery && (
                           <button
                              onClick={() => setSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                           >
                              <X className="w-4 h-4" />
                           </button>
                        )}
                     </div>
                  </div>

                  <div className="flex items-center gap-3">
                     <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                        <Button
                           variant={viewMode === 'grid' ? 'default' : 'ghost'}
                           size="sm"
                           onClick={() => setViewMode('grid')}
                           className="rounded-none border-r border-gray-300"
                        >
                           <Grid3x3 className="w-4 h-4" />
                        </Button>
                        <Button
                           variant={viewMode === 'list' ? 'default' : 'ghost'}
                           size="sm"
                           onClick={() => setViewMode('list')}
                           className="rounded-none"
                        >
                           <List className="w-4 h-4" />
                        </Button>
                     </div>
                  </div>
               </div>
            </div>

            <section>
               {activities.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
                     <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                           <TowerControl className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                           No COW activities found
                        </h3>
                        <p className="text-gray-600 mb-6">
                           {hasActiveFilters
                              ? 'Try adjusting your filters or clear them to see all activities.'
                              : 'Create your first COW activity to get started.'
                           }
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                           {hasActiveFilters && (
                              <Button variant="outline" onClick={handleClearFilters}>
                                 Clear Filters
                              </Button>
                           )}
                           <Button onClick={handleCreateCOW} className="gap-2 bg-sky-600 hover:bg-sky-700">
                              <Plus className="w-4 h-4" />
                              Create COW Activity
                           </Button>
                        </div>
                     </div>
                  </div>
               ) : (
                  <>
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                           <p className="text-sm text-gray-600">
                              Showing {activities.length} of {pagination?.totalItems || activities.length} activities
                           </p>
                           {hasActiveFilters && (
                              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={handleClearFilters}>
                                 <X className="w-3 h-3" />
                                 Clear Filters
                              </Badge>
                           )}
                        </div>

                        <div className="flex items-center gap-2">
                           <span className="text-sm text-gray-600">Show:</span>
                           <Select
                              value={filters.limit?.toString() || '12'}
                              onValueChange={(value) => updateFilters({ limit: parseInt(value), page: 1 })}
                           >
                              <SelectTrigger className="w-20 h-8">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="12">12</SelectItem>
                                 <SelectItem value="24">24</SelectItem>
                                 <SelectItem value="48">48</SelectItem>
                                 <SelectItem value="96">96</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                     </div>

                     {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {activities.map((activity) => (
                              <COWActivityCard
                                 key={activity._id}
                                 activity={activity}
                                 onView={handleViewDetail}
                                 onEdit={handleEditActivity}
                                 onDelete={handleDeleteActivity}
                                 users={formattedUsers}
                              />
                           ))}
                        </div>
                     )}

                     {viewMode === 'list' && (
                        <div className="space-y-3">
                           {activities.map((activity) => (
                              <div
                                 key={activity._id}
                                 className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                 onClick={() => handleViewDetail(activity._id)}
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <TowerControl className="w-5 h-5 text-gray-500" />
                                       <div>
                                          <h4 className="font-medium">{activity.activityName}</h4>
                                          <p className="text-sm text-gray-600">{activity.purpose} • {activity.overallStatus}</p>
                                       </div>
                                    </div>
                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </>
               )}
            </section>

            {pagination?.pages > 1 && (
               <section className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t">
                  <div className="mb-4 sm:mb-0">
                     <p className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.pages} • {pagination.totalItems} total activities
                     </p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() => handlePageChange('prev')}
                     >
                        Previous
                     </Button>
                     <div className="flex items-center">
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                           const pageNum = i + 1;
                           const isCurrent = pageNum === pagination.page;
                           return (
                              <Button
                                 key={pageNum}
                                 variant={isCurrent ? "default" : "outline"}
                                 size="sm"
                                 className="w-10"
                                 onClick={() => updateFilters({ page: pageNum })}
                              >
                                 {pageNum}
                              </Button>
                           );
                        })}
                        {pagination.pages > 5 && (
                           <span className="px-3 text-sm text-gray-600">...</span>
                        )}
                     </div>
                     <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.pages}
                        onClick={() => handlePageChange('next')}
                     >
                        Next
                     </Button>
                  </div>
               </section>
            )}
         </main>
      </div>
   );
};

export default COWActivitiesPage;