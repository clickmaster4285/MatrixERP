// @/app/admin/tasks/TaskDetailPage.jsx - REFACTORED
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTaskManagement } from '@/hooks/useTaskManagement';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Activity as ActivityIcon, ArrowLeft } from 'lucide-react';
import OverviewTab from '@/components/shared-components/tasks/taskDetailComponents/OverView';
import TaskWorkTab from '@/components/shared-components/tasks/taskDetailComponents/RoleBasedTabHeader';
import { StatusBadge, normalizeRole } from '@/components/shared-components/tasks/taskDetailComponents/TaskDetailHelpers';
import { resolveTaskById } from '../utils/taskutils';
import { useTaskWorkHandlers } from '@/hooks/useTaskWorkHandlers';
import { getRoleConfig, getActivityConfig } from '@/components/shared-components/tasks/taskWorkConfig';
import { DialogManager } from '@/components/shared-components/tasks/taskDetailComponents/DialogManager';

export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { tasks, tasksLoading } = useTaskManagement();

  // Use centralized handlers
  const {
    dialogStates,
    activeDialog,
    activeDialogType,
    getHandlerForRole,
    closeWorkDialog
  } = useTaskWorkHandlers();

  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'work' ? 'work' : 'activity');
  const [task, setTask] = useState(null);

  // Sync tab with URL
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'work' || t === 'activity') setActiveTab(t);
  }, [searchParams]);

  // Resolve task
  useEffect(() => {
    if (!tasks || !id) return;
    const resolved = resolveTaskById(id, tasks);
    setTask(resolved || null);
  }, [id, tasks]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const normalizedRole = task ? normalizeRole(task.myRole) : '';
  const roleConfig = getRoleConfig(normalizedRole);
  const activityConfig = task ? getActivityConfig(task.activityType) : {};

  // Get all handlers as a single object
  const getWorkHandlers = () => ({
    onAddSurvey: () => getHandlerForRole('survey')(),
    onStartCivilWork: () => getHandlerForRole('civil engineer')(),
    onStartTEWork: () => getHandlerForRole('telecom engineer')(),
    onStartStoreWork: () => getHandlerForRole('store')(),
    onStartDismantling: () => getHandlerForRole('dismantling')(),
    onStartInventory: () => getHandlerForRole('inventory')(),
    onStartInstallation: () => getHandlerForRole('installation')(),  // Add this
    onStartTransportation: () => getHandlerForRole('transportation')() // Add this
  });

  // Update task after work completion
  const handleWorkUpdated = (updated) => {
    setTask(prev => {
      if (!prev) return prev;

      // Handle updates based on active dialog type
      if (activeDialog === 'survey') {
        return { ...prev, ...updated };
      }
      // Add other dialog type handlers as needed

      return prev;
    });
  };



  // Loading and error states
  if (tasksLoading && !task) return <LoadingState />;
  if (!task) return <NotFoundState router={router} />;

  return (
    <div className="px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/tasks')} className="gap-2 h-9 px-3">
            <ArrowLeft className="h-4 w-4" /> Back to Tasks
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Badge variant="outline" className="text-sm font-medium capitalize">
            {task.activityType}
          </Badge>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{task.title || 'Untitled Task'}</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={task.status} />
              <Badge variant="secondary" className="text-sm">
                {task.phaseStatus === 'completed' ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Phase: {task.currentPhase || task.phase} ({task.phaseStatus || 'In Progress'})
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full flex mb-8">
          <TabsTrigger value="activity" className="flex-1 gap-2">
            <ActivityIcon className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="work" className="flex-1 gap-2">
            <roleConfig.icon className="h-4 w-4" /> {roleConfig.label} Work
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-6">
          <OverviewTab task={task} />
        </TabsContent>

        <TabsContent value="work" className="space-y-6">
          <TaskWorkTab task={task} {...getWorkHandlers()} />
        </TabsContent>
      </Tabs>

      {/* Dialog Manager - Handles all dialog types */}
      <DialogManager
        activeDialog={activeDialog}
        dialogStates={dialogStates}
        onClose={closeWorkDialog}
        task={task}
        onUpdated={handleWorkUpdated}
        dialogType={activeDialogType}
      />
    </div>
  );
}

// Helper components (same as before)
function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading task details...</p>
      </div>
    </div>
  );
}

function NotFoundState({ router }) {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <ActivityIcon className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Task Not Found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            The task you're looking for doesn't exist or has been removed.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/admin/tasks')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Tasks
        </Button>
      </div>
    </div>
  );
}