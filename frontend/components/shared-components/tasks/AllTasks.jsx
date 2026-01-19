// shared-components/tasks/AllTasks.jsx - Updated
'use client';

import { useTaskManagement } from '@/hooks/useTaskManagement';
import { PerformanceCards } from '@/components/shared-components/tasks/PerformanceCards';
import { TaskFilters } from '@/components/shared-components/tasks/TaskFilters';
import { TaskList } from '@/components/shared-components/tasks/TaskList';

const AllTasks = () => {
   const {
      tasks,
      performance,
      overdueTasks,
      dueTodayTasks,
      byStatus,
      byModule,
      filters,
      updateFilters,
      resetFilters,
      isLoading,
      tasksLoading,
   } = useTaskManagement();

   // Transform filters for the TaskFilters component
   const transformedFilters = {
      ...filters,
      module: filters.activityType, // Map activityType to module for filters
   };

   // Handle filter updates
   const handleFilterUpdate = (newFilters) => {
      if (typeof newFilters === 'function') {
         updateFilters(prev => {
            const updated = newFilters({ ...prev, activityType: prev.module });
            return {
               ...updated,
               activityType: updated.module || prev.activityType
            };
         });
      } else {
         // Handle direct object updates
         const updatedFilters = { ...filters };

         if (newFilters.module !== undefined) {
            updatedFilters.activityType = newFilters.module === 'all' ? 'all' : newFilters.module;
         }
         if (newFilters.status !== undefined) {
            updatedFilters.status = newFilters.status === 'all' ? 'all' : newFilters.status;
         }
         if (newFilters.search !== undefined) {
            updatedFilters.search = newFilters.search;
         }
         if (newFilters.page !== undefined) {
            updatedFilters.page = newFilters.page;
         }

         updateFilters(updatedFilters);
      }
   };

   // Handle reset filters
   const handleResetFilters = () => {
      resetFilters();
   };

   return (
      <div className="">
         <header className="">
            <div className="mx-auto px-4 sm:px-6 py-4">
               <div className="flex items-center gap-3">
                  <div>
                     <h1>Task Management</h1>
                     <p className="text-sm text-muted-foreground">
                        Track and manage your assigned tasks
                     </p>
                  </div>
               </div>
            </div>
         </header>

         <main className="mx-auto px-4 sm:px-6 py-4 space-y-8">
            <section>
               <PerformanceCards
                  performance={performance}
                  isLoading={isLoading}
                  overdueTasks={overdueTasks.length}
                  dueTodayTasks={dueTodayTasks.length}
               />
            </section>

            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
               <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                     <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                           Tasks
                           {!tasksLoading && (
                              <span className="ml-2 text-foreground">
                                 ({tasks.length})
                              </span>
                           )}
                        </h2>
                     </div>

                     <TaskFilters
                        filters={transformedFilters}
                        updateFilters={handleFilterUpdate}
                        resetFilters={handleResetFilters}
                        byStatus={byStatus}
                        byModule={byModule}
                     />

                     <TaskList tasks={tasks} isLoading={tasksLoading} />
                  </div>
               </div>
            </section>
         </main>
      </div>
   );
};

export default AllTasks;