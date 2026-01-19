// @/components/shared-components/tasks/taskDetailComponents/RoleBasedTabHeader.jsx - FINAL
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DetailItem, normalizeRole } from './TaskDetailHelpers';
import { getRoleConfig, getActivityConfig } from '../taskWorkConfig';

// Import all section components
import { SurveyWorkSection } from './Survey/SurveyWorkSection';
import { DismantlingWorkSection } from './Dismantling/DismantlingWorkSection';
import { StoreWorkSection } from './Store/StoreWorkSection';
import { CivilWorkSection } from './Civil/CivilWorkSection';
import { TeWorkSection } from './TE/TeWorkSection';
import { InstallationWorkSection } from './Installation/InstallationWorkSection';
import { TransportationWorkSection } from './Transportation/TransportationWorkSection';
import { Button } from '@/components/ui/button';

export function TaskWorkHeader({ task, onStartWork }) {
  const normalizedRole = normalizeRole(task.myRole);
  const roleConfig = getRoleConfig(normalizedRole);
  const activityConfig = getActivityConfig(task.activityType);
  const Icon = roleConfig.icon;



  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${roleConfig.bgColor}`}>
              <Icon className={`h-6 w-6 ${roleConfig.color}`} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{roleConfig.label} Work</CardTitle>
              <p className="text-sm text-muted-foreground">
                {activityConfig.label} • Status: <span className="font-medium">{task.workStatus || 'not-started'}</span>
              </p>
            </div>
          </div>

    

          {(task.activityType === 'cow' && roleConfig.buttonText(task) === 'Start Store Work') || (roleConfig.buttonText && onStartWork && roleConfig.buttonText(task) && (
            <Button onClick={onStartWork} className="gap-2">
              {roleConfig.buttonText(task)}
            </Button>
          ))}
          
       
        </div>
      </CardHeader>

      {/* Activity-specific details */}
      {['relocation', 'cow'].includes(task.activityType) && (
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg border ${activityConfig.color} ${activityConfig.borderColor}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DetailItem label="Work Type" value={task.workType} />
              <DetailItem label="Work Status" value={task.workStatus} />
              <DetailItem label="Site Type" value={task.siteType} />
              {task.activityType === 'relocation' ? (
                <DetailItem label="Relocation Type" value={task.relocationType} />
              ) : (
                  <DetailItem label="assigned By" value={task.assignedBy} />
              )}
            </div>
            {task.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground mt-1">{task.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function TaskWorkTab({ task, ...handlers }) {
  const normalizedRole = normalizeRole(task.myRole);
  const roleConfig = getRoleConfig(normalizedRole);

  // Map role to section component
  const roleToComponent = {
    'survey': SurveyWorkSection,
    'dismantling': DismantlingWorkSection,
    'store': StoreWorkSection,
    'inventory': StoreWorkSection,
    'civil engineer': CivilWorkSection,
    'telecom engineer': TeWorkSection,
    'installation': InstallationWorkSection,
    'transportation': TransportationWorkSection,
    'team member': TeamMemberSection
  };

  const WorkSection = roleToComponent[normalizedRole] || DefaultWorkSection;

  return (
    <div className="space-y-8">
      <TaskWorkHeader
        task={task}
        onStartWork={handlers[`onStart${roleConfig.label.replace(' ', '')}`] ||
          (roleConfig.label === 'Installation' && handlers.onStartInstallation) ||
          (roleConfig.label === 'Transportation' && handlers.onStartTransportation) ||
          handlers.onAddSurvey}
      />
      <WorkSection task={task} {...handlers} />
    </div>
  );
}

// Default/Team Member Section
function TeamMemberSection({ task }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Team Member Access</h3>
          <p className="text-sm text-muted-foreground mb-6">
            As a team member, you have view access to this project.
            Specific work assignments will be shown when available.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium">Project</p>
              <p className="text-lg font-semibold">{task.activityName || task.title}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-medium">Purpose</p>
              <p className="text-lg font-semibold">{task.purpose || 'N/A'}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DefaultWorkSection({ task }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6">
        <p>No specific work section configured for this role.</p>
      </CardContent>
    </Card>
  );
}