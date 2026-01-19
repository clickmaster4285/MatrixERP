// app/dismantling/[id]/ActivityDetail.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  useParams,
  useRouter,
  usePathname,
  useSearchParams,
} from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Wrench, Truck } from 'lucide-react';

import { useGetDismantlingActivity } from '@/features/dismantlingApi';
import { useUsers } from '@/features/userApi';
import { useAuth } from '@/hooks/useAuth';

import { ActivityDetailHeader } from '@/components/shared-components/dismantlingActivities/DismantlingDetails/ActivityDetailHeader';
import { ActivityProgressOverview } from '@/components/shared-components/dismantlingActivities/DismantlingDetails/ActivityProgressOverview';

import { OverviewTab } from '@/components/shared-components/dismantlingActivities/DismantlingDetails/tabs/OverviewTab';
import { SurveyTab } from '@/components/shared-components/dismantlingActivities/DismantlingDetails/tabs/SurveyTab';
import { DismantlingTab } from '@/components/shared-components/dismantlingActivities/DismantlingDetails/tabs/DismantlingTab';
import { DispatchTab } from '@/components/shared-components/dismantlingActivities/DismantlingDetails/tabs/StoreTab';
import { DocumentsTab } from '@/components/shared-components/dismantlingActivities/DismantlingDetails/tabs/DocumentsTab';

import { createEmptyActivity } from '@/utils/InventoryStaticList';
import { ActivitySummaryCard } from '@/components/shared-components/dismantlingActivities/DismantlingDetails/ActivitySummaryCard';

export default function DismentlingDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { data: detailRaw, isLoading, error } = useGetDismantlingActivity(id);
  const { data: usersRaw } = useUsers();
  const { user, isLoading: authLoading } = useAuth();

  // ---------- USERS NORMALIZATION ----------
  const users = useMemo(() => {
    if (!usersRaw) return [];
    if (Array.isArray(usersRaw.data?.users)) return usersRaw.data.users;
    if (Array.isArray(usersRaw.users)) return usersRaw.users;
    if (Array.isArray(usersRaw.data)) return usersRaw.data;
    if (Array.isArray(usersRaw)) return usersRaw;
    return [];
  }, [usersRaw]);

  const [activity, setActivity] = useState(createEmptyActivity());
  const [activeTab, setActiveTab] = useState(null); // will be decided after permissions

  // ---------- NORMALIZE ACTIVITY FROM API ----------
  useEffect(() => {
    if (!detailRaw) return;

    const apiData = detailRaw.data || detailRaw;

    if (apiData) {
      const normalized = {
        ...createEmptyActivity(),
        ...apiData,
        survey: {
          ...createEmptyActivity().survey,
          ...apiData.survey,
        },
        dismantling: {
          ...createEmptyActivity().dismantling,
          ...apiData.dismantling,
        },
        dispatch: {
          ...createEmptyActivity().dispatch,
          ...apiData.dispatch,
        },
        documents: Array.isArray(apiData.documents) ? apiData.documents : [],
        location: Array.isArray(apiData.location) ? apiData.location : [],
        assignment: {
          ...createEmptyActivity().assignment,
          ...apiData.assignment,
        },
        assignActivityTasks: {
          ...(createEmptyActivity().assignActivityTasks || {}),
          ...(apiData.assignActivityTasks || {}),
        },
        timeline: {
          ...createEmptyActivity().timeline,
          ...apiData.timeline,
        },
        notes: apiData.notes || '',
        status: apiData.status || 'planned',
        completionPercentage: apiData.completionPercentage || 0,
      };

      setActivity(normalized);
    }
  }, [detailRaw]);

  // ---------- PERMISSION CALCULATION (MIRROR BACKEND) ----------
  const {
    canViewOverview,
    canViewSurvey,
    canViewDismantling,
    canViewDispatch,
    allowedTabs,
  } = useMemo(() => {
    if (!user || !activity?._id) {
      return {
        canViewOverview: false,
        canViewSurvey: false,
        canViewDismantling: false,
        canViewDispatch: false,
        allowedTabs: [],
      };
    }

    const userIdStr = user._id || user.id;
    if (!userIdStr) {
      return {
        canViewOverview: false,
        canViewSurvey: false,
        canViewDismantling: false,
        canViewDispatch: false,
        allowedTabs: [],
      };
    }

    const isAdminOrManager = ['admin', 'manager'].includes(user.role);

    const isMainAssignee =
      Array.isArray(activity.assignment?.assignedTo) &&
      activity.assignment.assignedTo.some((u) => {
        const idVal = u?._id || u?.id || u;
        return idVal?.toString() === userIdStr.toString();
      });

    const isSurveyTaskAssignee =
      Array.isArray(activity.assignActivityTasks?.assignSurveyTo) &&
      activity.assignActivityTasks.assignSurveyTo.some(
        (u) => u?.toString() === userIdStr.toString()
      );

    const isDismantlingTaskAssignee =
      Array.isArray(activity.assignActivityTasks?.assignDismantlingTo) &&
      activity.assignActivityTasks.assignDismantlingTo.some(
        (u) => u?.toString() === userIdStr.toString()
      );

    const isStoreTaskAssignee =
      Array.isArray(activity.assignActivityTasks?.assignStoreTo) &&
      activity.assignActivityTasks.assignStoreTo.some(
        (u) => u?.toString() === userIdStr.toString()
      );

    const isSurveyOwner =
      activity.survey?.conductedBy &&
      ((activity.survey.conductedBy._id &&
        activity.survey.conductedBy._id.toString() === userIdStr.toString()) ||
        activity.survey.conductedBy.toString?.() === userIdStr.toString());

    const isDismantlingTeam =
      Array.isArray(activity.dismantling?.teamMembers) &&
      activity.dismantling.teamMembers.some((m) => {
        const idVal = m?._id || m?.id || m;
        return idVal?.toString() === userIdStr.toString();
      });

    const canSurvey =
      isAdminOrManager ||
      isMainAssignee ||
      isSurveyTaskAssignee ||
      isSurveyOwner;

    const canDismantling =
      isAdminOrManager ||
      isMainAssignee ||
      isDismantlingTaskAssignee ||
      isDismantlingTeam;

    const canStore = isAdminOrManager || isMainAssignee || isStoreTaskAssignee;

    // IMPORTANT: Overview only for admin/manager/main assignee
    const canOverview = isAdminOrManager || isMainAssignee;

    const tabs = [];
    if (canOverview) tabs.push('overview');
    if (canSurvey) tabs.push('survey');
    if (canDismantling) tabs.push('dismantling');
    if (canStore) tabs.push('dispatch');
    // if you want documents later, can also gate it here

    return {
      canViewOverview: canOverview,
      canViewSurvey: canSurvey,
      canViewDismantling: canDismantling,
      canViewDispatch: canStore,
      allowedTabs: tabs,
    };
  }, [user, activity]);

  // ---------- INITIAL ACTIVE TAB (RESPECT ?tab BUT CLAMP TO ALLOWED) ----------
  useEffect(() => {
    if (!activity?._id || !user || allowedTabs.length === 0) return;

    const urlTab = searchParams.get('tab');
    const defaultTab = allowedTabs[0] || 'overview';

    setActiveTab(allowedTabs.includes(urlTab) ? urlTab : defaultTab);
  }, [activity, user, searchParams, allowedTabs]);

  // keep state in sync if URL tab changes *and* is allowed
  useEffect(() => {
    if (!activeTab || allowedTabs.length === 0) return;
    const urlTab = searchParams.get('tab');
    if (urlTab && allowedTabs.includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, allowedTabs, activeTab]);

  const handleTabChange = (value) => {
    // ignore clicks on forbidden tabs (defensive)
    if (!allowedTabs.includes(value)) return;

    setActiveTab(value);

    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  const findUserById = (userId) => {
    if (!userId) return null;
    return (
      users.find((u) => (u._id || u.id)?.toString() === userId.toString()) ||
      null
    );
  };

  // ---------- LOADING / ERROR STATES ----------
  if (isLoading || authLoading || !activity?._id || activeTab === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading activity details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-destructive mb-2">
          Failed to load activity details.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No activity data found.</p>
      </div>
    );
  }

  if (allowedTabs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-destructive mb-2">
          You don&apos;t have permission to view this activity.
        </p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen">
      {/* Header can stay same for now, or you can also hide some info later */}
      <ActivityDetailHeader activity={activity} router={router} id={id} />

      <main className="mx-auto px-6 py-8 space-y-6">
        {/* Top row: Progress + Summary – only for people who can see overview */}
        {canViewOverview && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <ActivityProgressOverview activity={activity} />
            <ActivitySummaryCard activity={activity} />
          </div>
        )}

        {/* Tabs full width */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6 w-full"
        >
          <TabsList className="flex w-full bg-card border border-border/50 p-1">
            {canViewOverview && (
              <TabsTrigger
                value="overview"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Overview
              </TabsTrigger>
            )}

            {canViewSurvey && (
              <TabsTrigger
                value="survey"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Survey
              </TabsTrigger>
            )}

            {canViewDismantling && (
              <TabsTrigger
                value="dismantling"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Wrench className="w-4 h-4 mr-2" />
                Dismantling
              </TabsTrigger>
            )}

            {canViewDispatch && (
              <TabsTrigger
                value="dispatch"
                className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Truck className="w-4 h-4 mr-2" />
                Store
              </TabsTrigger>
            )}

            {/* If later you want to gate documents, you can add a canViewDocuments flag */}
            {/* <TabsTrigger ...>Documents</TabsTrigger> */}
          </TabsList>

          {canViewOverview && (
            <TabsContent value="overview" className="space-y-6">
              <OverviewTab activity={activity} setActivity={setActivity} />
            </TabsContent>
          )}

          {canViewSurvey && (
            <TabsContent value="survey" className="space-y-6">
              <SurveyTab
                canViewSurvey={canViewSurvey}
                activity={activity}
                setActivity={setActivity}
                users={users}
                findUserById={findUserById}
              />
            </TabsContent>
          )}

          {canViewDismantling && (
            <TabsContent value="dismantling" className="space-y-6">
              <DismantlingTab
                canViewDismantling={canViewDismantling}
                activity={activity}
                setActivity={setActivity}
                users={users}
                findUserById={findUserById}
              />
            </TabsContent>
          )}

          {canViewDispatch && (
            <TabsContent value="dispatch" className="space-y-6">
              <DispatchTab
                activity={activity}
                setActivity={setActivity}
                users={users}
              />
            </TabsContent>
          )}

          {/* Documents can be handled later similarly */}
          <TabsContent value="documents" className="space-y-6">
            <DocumentsTab activity={activity} setActivity={setActivity} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
