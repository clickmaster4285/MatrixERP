// components/shared-components/activities/dismantlingActivities/DismantlingDetails/tabs/DismantlingTab.jsx
'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import { useDismantlingManagement } from '@/hooks/useDismantlingManagement';

import { getStatusColor, getConditionColor } from '@/utils/InventoryStaticList';
import { DismantlingDetailsCard } from '../tabComponents/DismantlingTabComponents/DismantlingDetailsCard';
import { DismantledMaterialsCard } from '../tabComponents/DismantlingTabComponents/DismantledMaterialsCard';
import { DismantlingAssignmentCard } from '../tabComponents/DismantlingTabComponents/DismantlingAssignmentCard.jsx.jsx';
import { DismantlingAttachmentsCard } from '../tabComponents/DismantlingTabComponents/DismantlingAttachmentsCard';

export function DismantlingTab({
  canViewDismantling,
  activity,
  setActivity,
  users,
  findUserById,
}) {
  const { user: authUser } = useAuth();
  const { updateDismantling, isUpdating } = useDismantlingManagement();

  const activityId = activity?._id;

  const [isDismantlingModalOpen, setIsDismantlingModalOpen] = useState(false);
  const [isDismantlingSetupModalOpen, setIsDismantlingSetupModalOpen] =
    useState(false);

  // keyed by materialId:
  // dismantlingFormData[materialId] = { quantityDismantled, conditionAfterDismantling, dismantlingDate, damageNotes }
  const [dismantlingFormData, setDismantlingFormData] = useState({});
  const [dismantlingSetupData, setDismantlingSetupData] = useState({
    startDate: '',
    endDate: '',
    teamLeader: '',
    teamMembers: [],
    issuesEncountered: '',
    markCompleted: false,
  });

  const todayISO = new Date().toISOString().slice(0, 10);

  const resolveUserById = (id) => {
    if (!id) return null;
    const fromUsers = users.find((u) => (u._id || u.id) === id);
    if (fromUsers) return fromUsers;
    if (findUserById) return findUserById(id);
    return null;
  };

  const teamLeaderUser = (() => {
    const tl = activity.dismantling?.teamLeader;
    if (!tl) return null;
    const id = tl._id || tl.id || tl;
    return resolveUserById(id) || tl;
  })();

  const teamMemberUsers = (() => {
    const list = activity.dismantling?.teamMembers || [];
    return list.map((m) => {
      const id = m._id || m.id || m;
      return resolveUserById(id) || m;
    });
  })();

  const handleTeamMemberToggle = (userId) => {
    setDismantlingSetupData((prev) => {
      const exists = prev.teamMembers.includes(userId);
      return {
        ...prev,
        teamMembers: exists
          ? prev.teamMembers.filter((id) => id !== userId)
          : [...prev.teamMembers, userId],
      };
    });
  };

  const handleOpenSetup = (open) => {
    setIsDismantlingSetupModalOpen(open);

    if (!open || !activity) return;

    const d = activity.dismantling || {};
    const existingLeaderId =
      d.teamLeader?._id || d.teamLeader?.id || d.teamLeader || '';

    const fallbackLeaderId = authUser?._id || authUser?.id || '';

    setDismantlingSetupData({
      startDate: (d.startDate && String(d.startDate).slice(0, 10)) || todayISO,
      endDate: d.endDate ? String(d.endDate).slice(0, 10) : '',
      teamLeader: existingLeaderId || fallbackLeaderId || '',
      teamMembers: Array.isArray(d.teamMembers)
        ? d.teamMembers.map((m) => m._id || m.id || m)
        : [],
      issuesEncountered: d.issuesEncountered || '',
      markCompleted: d.status === 'completed',
    });
  };

  const handleDismantlingSetupSave = async () => {
    if (!activityId) return;

    if (!dismantlingSetupData.teamLeader) {
      toast.error('Please select a team leader');
      return;
    }

    const leaderUser = resolveUserById(dismantlingSetupData.teamLeader) || null;

    const memberUsers = users.filter((u) =>
      dismantlingSetupData.teamMembers.includes(u._id || u.id)
    );

    const markCompleted = !!dismantlingSetupData.markCompleted;

    const newStatus = markCompleted
      ? 'completed'
      : activity.dismantling?.status &&
        activity.dismantling.status !== 'pending'
        ? activity.dismantling.status
        : 'in-progress';

    const payload = {
      dismantling: {
        startDate:
          activity.dismantling?.startDate ||
          dismantlingSetupData.startDate ||
          todayISO,
        endDate: dismantlingSetupData.endDate || null,
        teamLeader: dismantlingSetupData.teamLeader,
        teamMembers: dismantlingSetupData.teamMembers,
        issuesEncountered: dismantlingSetupData.issuesEncountered || '',
        status: newStatus,
      },
    };

    if (markCompleted) {
      const today = new Date().toISOString().slice(0, 10);
      payload.timeline = {
        ...(activity.timeline || {}),
        dismantlingCompletionDate:
          activity.timeline?.dismantlingCompletionDate || today,
      };
    }

    try {
      await updateDismantling(activityId, payload);

      setActivity((prev) => ({
        ...prev,
        dismantling: {
          ...(prev.dismantling || {}),
          ...payload.dismantling,
          teamLeader: leaderUser || prev.dismantling?.teamLeader,
          teamMembers: memberUsers.length
            ? memberUsers
            : prev.dismantling?.teamMembers || [],
        },
        timeline: payload.timeline
          ? {
            ...(prev.timeline || {}),
            ...payload.timeline,
          }
          : prev.timeline,
      }));

      toast.success('Dismantling info saved');
      setIsDismantlingSetupModalOpen(false);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save dismantling info';
      toast.error(msg);
    }
  };

  /**
   * 🔧 Dismantling materials logic:
   * - Take survey.materials as base
   * - If dismantling.materials has entries, merge them
   * - If user edits via form, override
   * - If user doesn't edit, we still save defaults based on survey
   */
  const handleDismantlingSubmit = async (manualMaterialsOverride) => {
    if (!activityId) return;

    const today = new Date().toISOString().slice(0, 10);
    let finalMaterials = [];

    // 🔹 Case 1: No survey → manualMaterialsOverride is used
    if (
      Array.isArray(manualMaterialsOverride) &&
      manualMaterialsOverride.length > 0
    ) {
      finalMaterials = manualMaterialsOverride
        .filter((m) => (Number(m.quantityDismantled) || 0) > 0)
        .map((m) => ({
          materialId: m.materialId,
          name: m.name,
          quantityDismantled: Number(m.quantityDismantled) || 0,
          conditionAfterDismantling: m.conditionAfterDismantling || '',
          damageNotes: m.damageNotes || '',
          dismantlingDate: today,
        }));
    } else {
      // 🔹 Case 2: Survey-based flow (existing logic)
      const currentMaterials = Array.isArray(activity.dismantling?.materials)
        ? [...activity.dismantling.materials]
        : [];

      const surveyMaterials = Array.isArray(activity.survey?.materials)
        ? activity.survey.materials
        : [];

      surveyMaterials.forEach((surveyMaterial) => {
        const form = dismantlingFormData[surveyMaterial.materialId];
        if (!form || form.quantityDismantled == null) return;

        const quantity = Number(form.quantityDismantled) || 0;
        if (quantity <= 0) return;

        const existingIndex = currentMaterials.findIndex(
          (m) => m.materialId === surveyMaterial.materialId
        );

        const basePayload = {
          materialId: surveyMaterial.materialId,
          name: surveyMaterial.name,
          quantityDismantled: quantity,
          conditionAfterDismantling:
            form.conditionAfterDismantling || surveyMaterial.condition,
          dismantlingDate: today,
          damageNotes: form.damageNotes || '',
        };

        if (existingIndex > -1) {
          const existing = currentMaterials[existingIndex];
          currentMaterials[existingIndex] = {
            ...existing,
            ...basePayload,
          };
        } else {
          currentMaterials.push(basePayload);
        }
      });

      finalMaterials = currentMaterials;
    }

    const payload = {
      dismantling: {
        ...(activity.dismantling || {}),
        materials: finalMaterials,
      },
    };

    try {
      await updateDismantling(activityId, payload);

      setActivity((prev) => ({
        ...prev,
        dismantling: {
          ...(prev.dismantling || {}),
          materials: finalMaterials,
        },
      }));

      setDismantlingFormData({});
      setIsDismantlingModalOpen(false);
      toast.success('Dismantling records saved');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to save dismantling records';
      toast.error(msg);
    }
  };


  const handleCompleteDismantling = async () => {
    if (!activityId) return;

    const today = new Date().toISOString().slice(0, 10);

    // If no dismantling.materials yet, auto-build them from survey.materials
    let finalMaterials =
      Array.isArray(activity.dismantling?.materials) &&
        activity.dismantling.materials.length > 0
        ? activity.dismantling.materials
        : [];

    if (finalMaterials.length === 0) {
      const surveyMaterials = Array.isArray(activity.survey?.materials)
        ? activity.survey.materials
        : [];

      finalMaterials = surveyMaterials.map((m) => ({
        materialId: m.materialId,
        name: m.name,
        quantityDismantled: m.quantity || 0,
        conditionAfterDismantling: m.condition || 'good',
        damageNotes: '',
        dismantlingDate: today,
      }));
    }

    const payload = {
      dismantling: {
        ...(activity.dismantling || {}),
        status: 'completed',
        materials: finalMaterials,
      },
      timeline: {
        ...(activity.timeline || {}),
        dismantlingCompletionDate: today,
      },
    };

    try {
      await updateDismantling(activityId, payload);

      setActivity((prev) => ({
        ...prev,
        dismantling: {
          ...(prev.dismantling || {}),
          status: 'completed',
          materials: finalMaterials,
        },
        timeline: {
          ...(prev.timeline || {}),
          dismantlingCompletionDate: today,
        },
      }));

      toast.success('Dismantling marked as completed');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to mark dismantling as completed';
      toast.error(msg);
    }
  };


  const surveyMaterials = Array.isArray(activity.survey?.materials)
    ? activity.survey.materials
    : [];

  const dismantlingStatus = activity.dismantling?.status || 'pending';
  const isCompleted = dismantlingStatus === 'completed';

  // 🔄 Use dismantling.materials now instead of "actualMaterials"
  const dismantlingMaterials =
    Array.isArray(activity.dismantling?.materials) &&
      activity.dismantling.materials.length > 0
      ? activity.dismantling.materials
      : [];

  const showingDismantled = dismantlingMaterials.length > 0;
  const materialsToShow = showingDismantled
    ? dismantlingMaterials
    : surveyMaterials;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN: Assignment + Details + Attachments */}
        <div className="w-full lg:w-1/2 space-y-4">
          <DismantlingAssignmentCard
            activity={activity}
            setActivity={setActivity}
            users={users}
          />

          {/* Dismantling Details Card */}
          <DismantlingDetailsCard
            activity={activity}
            users={users}
            teamLeaderUser={teamLeaderUser}
            teamMemberUsers={teamMemberUsers}
            dismantlingStatus={dismantlingStatus}
            isUpdating={isUpdating}
            isDismantlingSetupModalOpen={isDismantlingSetupModalOpen}
            dismantlingSetupData={dismantlingSetupData}
            setDismantlingSetupData={setDismantlingSetupData}
            handleOpenSetup={handleOpenSetup}
            handleDismantlingSetupSave={handleDismantlingSetupSave}
            getStatusColor={getStatusColor}
            onMarkAsCompleted={handleCompleteDismantling}
          />

          <DismantlingAttachmentsCard
            activity={activity}
            setActivity={setActivity}
          />
        </div>

        {/* RIGHT COLUMN: Dismantled Materials */}
        <div className="w-full lg:w-1/2">
          <DismantledMaterialsCard
            activity={activity}
            surveyMaterials={surveyMaterials}
            actualMaterials={dismantlingMaterials} // 👈 still passed as actualMaterials for compatibility
            showingDismantled={showingDismantled}
            materialsToShow={materialsToShow}
            getConditionColor={getConditionColor}
            isCompleted={isCompleted}
            isDismantlingModalOpen={isDismantlingModalOpen}
            setIsDismantlingModalOpen={setIsDismantlingModalOpen}
            dismantlingFormData={dismantlingFormData}
            setDismantlingFormData={setDismantlingFormData}
            handleDismantlingSubmit={handleDismantlingSubmit}
            isUpdating={isUpdating}
            WrenchIcon={Wrench}
            BadgeComponent={Badge}
          />
        </div>
      </div>
    </div>
  );
}