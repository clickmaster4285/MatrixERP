'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { useRelocationManagement } from '@/hooks/useRelocationManagement';
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
  Building2,
} from 'lucide-react';
import RelocationStats from '@/components/shared-components/relocationActivities/card/RelocationStats';
import RelocationCard from '@/components/shared-components/relocationActivities/card/RelocationCard';

const RelocationPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || '';

  const {
    activities,
    pagination,
    isLoadingActivities,
    activitiesError,
    filters,
    updateFilters,
    clearFilters,
    getStatusColor,
    users,
    refetchActivities,
    deleteRelocation,
  } = useRelocationManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState('all');
  const [localTypeFilter, setLocalTypeFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [selectedActivities, setSelectedActivities] = useState([]);

  // Show error once if activitiesError appears
  useEffect(() => {
    if (activitiesError) {
      toast.error(
        activitiesError?.message || 'Error loading relocation activities'
      );
    }
  }, [activitiesError]);

  // Apply filters to backend query
  useEffect(() => {
    const backendFilters = {};

    if (localStatusFilter !== 'all') {
      backendFilters.status = localStatusFilter;
    }

    if (localTypeFilter !== 'all') {
      backendFilters.relocationType = localTypeFilter;
    }

    if (searchQuery.trim()) {
      backendFilters.search = searchQuery.trim();
    }

    updateFilters(backendFilters);
  }, [localStatusFilter, localTypeFilter, searchQuery, updateFilters]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setLocalStatusFilter('all');
    setLocalTypeFilter('all');
    setShowFilters(false);
    clearFilters();
    setSelectedActivities([]);
  };

  // Stats
  const stats = useMemo(() => {
    const list = activities || [];
    const total = list.length;
    const active = list.filter((a) => a.overallStatus === 'active').length;
    const completed = list.filter(
      (a) => a.overallStatus === 'completed'
    ).length;
    const draft = list.filter((a) => a.overallStatus === 'draft').length;

    return { total, active, completed, draft };
  }, [activities]);

  const handleViewDetail = (id) => {
    router.push(`/admin/activities/relocation-activities/${id}`);
  };

  const handleEditActivity = (id) => {
    router.push(`/admin/activities/relocation-activities/${id}/edit`);
  };

  const handleDeleteActivity = async (id) => {
    if (confirm('Are you sure you want to delete this relocation activity?')) {
      try {
        await deleteRelocation({ activityId: id });
        toast.success('Relocation activity deleted successfully');
        refetchActivities();
      } catch (error) {
        toast.error('Failed to delete relocation activity');
      }
    }
  };

  const handleCreateRelocation = () => {
    router.push('/admin/activities/relocation-activities/create');
  };

  const handlePageChange = (direction) => {
    const currentPage = pagination?.page || filters?.page || 1;
    const totalPages = pagination?.pages || 1;

    if (direction === 'prev' && currentPage > 1) {
      updateFilters({ page: currentPage - 1 });
    }

    if (direction === 'next' && currentPage < totalPages) {
      updateFilters({ page: currentPage + 1 });
    }
  };

  // Toggle activity selection
  const handleSelectActivity = (id) => {
    setSelectedActivities(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (selectedActivities.length === 0) {
      toast.warning('No activities selected');
      return;
    }

    if (confirm(`Delete ${selectedActivities.length} selected activities?`)) {
      try {
        // You'll need to implement bulk delete in your API
        // For now, delete one by one
        for (const id of selectedActivities) {
          await deleteRelocation({ activityId: id });
        }
        toast.success(`${selectedActivities.length} activities deleted`);
        setSelectedActivities([]);
        refetchActivities();
      } catch (error) {
        toast.error('Failed to delete activities');
      }
    }
  };

  if (isLoadingActivities) {
    return (
      <div className="min-h-screen p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Site Relocation Activities
            </h1>
            <p className="text-sm text-muted-foreground">
              Loading relocation activities...
            </p>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters = localStatusFilter !== 'all' || localTypeFilter !== 'all' || searchQuery.trim();
  const hasSelection = selectedActivities.length > 0;

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Site Relocation Activities
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and track relocation projects between sites
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchActivities()}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button onClick={handleCreateRelocation} className="gap-2 bg-sky-600 hover:bg-sky-700">
              <Plus className="w-4 h-4" />
              Create Relocation
            </Button>
          </div>
        </div>
      </header>

      <main className="space-y-8">
        {/* Stats */}
        <RelocationStats stats={stats} />

        {/* Bulk Actions Bar */}
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
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Controls */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search activities by site name, city, or address..."
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

            {/* View Controls */}
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
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

              {/* Export Button */}
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>

              {/* Filter Button */}
              <Button
                variant={hasActiveFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0">
                    !
                  </Badge>
                )}
              </Button>

              {/* Settings */}
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="bg-white border rounded-lg p-4 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Filter Options</h3>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 gap-2"
                  >
                    <X className="w-3 h-3" />
                    Clear All
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="h-8"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={localStatusFilter}
                    onValueChange={setLocalStatusFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Relocation Type</label>
                  <Select
                    value={localTypeFilter}
                    onValueChange={setLocalTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="B2S">B2S</SelectItem>
                      <SelectItem value="StandAlone">StandAlone</SelectItem>
                      <SelectItem value="OMO">OMO</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={filters.sortBy || 'createdAt'}
                    onValueChange={(value) => updateFilters({ sortBy: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date Created</SelectItem>
                      <SelectItem value="updatedAt">Last Updated</SelectItem>
                      <SelectItem value="overallStatus">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity List */}
        <section>
          {activities.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-xl">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No relocation activities found
                </h3>
                <p className="text-gray-600 mb-6">
                  {hasActiveFilters
                    ? 'Try adjusting your filters or clear them to see all activities.'
                    : 'Create your first relocation activity to get started.'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  )}
                  <Button onClick={handleCreateRelocation} className="gap-2 bg-sky-600 hover:bg-sky-700">
                    <Plus className="w-4 h-4" />
                    Create Relocation Activity
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

                {/* Items per page */}
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

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {activities.map((activity) => (
                    <RelocationCard
                      key={activity._id}
                      activity={activity}
                      onView={handleViewDetail}
                      onEdit={handleEditActivity}
                      onDelete={handleDeleteActivity}
                      users={users}
                    />
                  ))}
                </div>
              )}

              {/* List View (Optional - you can implement this later) */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div
                      key={activity._id}
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleViewDetail(activity._id)}
                    >
                      {/* List item content */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Building2 className="w-5 h-5 text-gray-500" />
                          <div>
                            <h4 className="font-medium">{activity.siteId?.name || 'Unknown Site'}</h4>
                            <p className="text-sm text-gray-600">{activity.relocationType} • {activity.overallStatus}</p>
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

        {/* Pagination */}
        {pagination?.pages > 1 && (
          <section className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages} •{' '}
                {pagination.totalItems} total activities
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

export default RelocationPage;