'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useDismantlingManagement } from '@/hooks/useDismantlingManagement';
import { useGetSites } from '@/features/siteApi';
import { useUsers } from '@/features/userApi';
import DismantlingHeader from '@/components/shared-components/dismantlingActivities/dismantlingActivityPageComponents/DismantlingHeader';
import DismantlingCreateDialog from '@/components/shared-components/dismantlingActivities/dismantlingActivityPageComponents/DismantlingCreateDialog';
import DismantlingStats from '@/components/shared-components/dismantlingActivities/dismantlingActivityPageComponents/DismantlingStats';
import DismantlingFilters from '@/components/shared-components/dismantlingActivities/dismantlingActivityPageComponents/DismantlingFilters';
import DismantlingList from '@/components/shared-components/dismantlingActivities/dismantlingActivityPageComponents/DismantlingList';
import DismantlingPagination from '@/components/shared-components/dismantlingActivities/dismantlingActivityPageComponents/DismantlingPagination';
import { useAuth } from '@/hooks/useAuth';

const DismentlingPage = () => {
  const router = useRouter();
  const { user } = useAuth();

  const role = user?.role;

  // MAIN API / STATE
  const {
    activities,
    pagination,
    filters,
    updateFilters,
    createDismantling,
    deleteDismantling,
    isLoading,
  } = useDismantlingManagement({
    initialFilters: { page: 1, limit: 10 },
  });

  // SUPPORT DATA
  const { data: sitesRaw } = useGetSites({ page: 1, limit: 100 });
  const { data: usersRaw } = useUsers({ page: 1, limit: 100 });

  const sites = useMemo(() => {
    if (!sitesRaw) return [];
    if (Array.isArray(sitesRaw?.data?.sites)) return sitesRaw.data.sites;
    if (Array.isArray(sitesRaw?.sites)) return sitesRaw.sites;
    if (Array.isArray(sitesRaw?.data)) return sitesRaw.data;
    if (Array.isArray(sitesRaw)) return sitesRaw;
    return [];
  }, [sitesRaw]);

  const users = useMemo(() => {
    if (!usersRaw) return [];
    if (Array.isArray(usersRaw?.data?.users)) return usersRaw.data.users;
    if (Array.isArray(usersRaw?.users)) return usersRaw.users;
    if (Array.isArray(usersRaw?.data)) return usersRaw.data;
    if (Array.isArray(usersRaw)) return usersRaw;
    return [];
  }, [usersRaw]);

  // LOCAL UI STATE
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const initialFormData = {
    siteId: '',
    dismantlingType: '',
    state: '',
    address: '',
    city: '',
    assignedTo: [],

    // new task-level assignments
    surveyAssignedTo: '',
    dismantlingAssignedTo: '',
    storeAssignedTo: '',

    plannedStartDate: '',
    plannedEndDate: '',
    notes: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  // CREATE HANDLER
  const handleCreateActivity = async () => {
    if (
      !formData.siteId ||
      !formData.dismantlingType ||
      !formData.state ||
      !formData.city ||
      formData.assignedTo.length === 0
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // Build assignActivityTasks from dialog fields
      const assignActivityTasks = {
        assignSurveyTo: formData.surveyAssignedTo
          ? [formData.surveyAssignedTo]
          : [],
        assignDismantlingTo: formData.dismantlingAssignedTo
          ? [formData.dismantlingAssignedTo]
          : [],
        assignStoreTo: formData.storeAssignedTo
          ? [formData.storeAssignedTo]
          : [],
      };

      const hasAnyTaskAssignee =
        assignActivityTasks.assignSurveyTo.length > 0 ||
        assignActivityTasks.assignDismantlingTo.length > 0 ||
        assignActivityTasks.assignStoreTo.length > 0;

      const basePayload = {
        site: formData.siteId,
        dismantlingType: formData.dismantlingType,
        location: [
          {
            state: formData.state,
            address: formData.address,
            city: formData.city,
          },
        ],
        assignment: {
          assignedTo: formData.assignedTo, // main manager
          status: 'assigned',
        },
        timeline: {
          plannedStartDate: formData.plannedStartDate || null,
          plannedEndDate: formData.plannedEndDate || null,
        },
        notes: formData.notes || '',
      };

      // Only include assignActivityTasks if something is selected
      const payload = hasAnyTaskAssignee
        ? { ...basePayload, assignActivityTasks }
        : basePayload;

      await createDismantling(payload);
      toast.success('Dismantling activity created');

      setIsCreateOpen(false);
      setFormData(initialFormData);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Error creating dismantling activity';
      toast.error(msg);
    }
  };

  // FILTERED ACTIVITIES
  const filteredActivities = useMemo(() => {
    return (activities || []).filter((activity) => {
      const siteName = activity.site?.name || '';
      const city = activity.location?.[0]?.city || '';
      const status = activity.status || '';

      const matchesSearch =
        siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' || status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [activities, searchQuery, filterStatus]);

  // STATS
  const stats = useMemo(() => {
    const list = activities || [];
    const total = list.length;
    const completed = list.filter((a) => a.status === 'completed').length;
    const inProgress = list.filter((a) =>
      ['surveying', 'dismantling', 'dispatching', 'in-progress'].includes(
        a.status
      )
    ).length;
    const pending = list.filter((a) =>
      ['planned', 'assigned', 'pending'].includes(a.status)
    ).length;

    return { total, completed, inProgress, pending };
  }, [activities]);

  // DELETE HANDLER
  const handleDelete = async (id) => {
    try {
      await deleteDismantling(id);
      toast.success('Activity deleted');
    } catch (err) {
      toast.error('Failed to delete activity');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8">
        <h1>Dismantling Manager</h1>
        <p className="text-muted-foreground">
          Loading dismantling activities...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header + Create */}
      <DismantlingHeader onOpenCreate={() => setIsCreateOpen(true)} />

      <DismantlingCreateDialog
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        formData={formData}
        setFormData={setFormData}
        sites={sites}
        users={users}
        onSubmit={handleCreateActivity}
        isSubmitting={createDismantling.isLoading} // Add this line
      />

      <main className="container mx-auto py-4">
        <DismantlingStats stats={stats} />

        <DismantlingFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />

        <DismantlingList
          activities={filteredActivities}
          onDelete={handleDelete}
          onOpenDetail={(id) =>
            router.push(`/${role}/activities/dismantling/${id}`)
          }
        />

        {filteredActivities.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No activities found
            </h3>
            <p className="text-muted-foreground mb-6">
              Create a new dismantling activity to get started
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
            >
              New Activity
            </button>
          </div>
        )}

        {pagination?.pages > 1 && (
          <DismantlingPagination
            pagination={pagination}
            filters={filters}
            updateFilters={updateFilters}
          />
        )}
      </main>
    </div>
  );
};

export default DismentlingPage;
