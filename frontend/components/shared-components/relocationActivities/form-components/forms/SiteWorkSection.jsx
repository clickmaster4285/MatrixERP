// components/shared-components/relocationActivities/form-components/forms/SiteWorkSection.jsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SiteConfiguration } from './SiteConfiguration';
import { WorkAssignmentModal } from './WorkAssignmentModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, SkipForward, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';

// CHANGED: storeOperator to store_operator
const SOURCE_WORK_TYPES = [
  { value: 'survey', label: 'Survey Work', icon: '📋' },
  { value: 'dismantling', label: 'Dismantling Work', icon: '🔧' },
  { value: 'store_operator', label: 'Store Operator Work', icon: '📦' }, // CHANGED
];

const DESTINATION_WORK_TYPES = [
  { value: 'civil', label: 'Civil Work', icon: '🏗️' },
  { value: 'telecom', label: 'Telecom Work', icon: '📡' },
];

// Helper function to transform work type keys
const getWorkKey = (workType) => {
  // Convert store_operator to storeOperatorWork
  if (workType === 'store_operator') return 'storeOperatorWork';
  return `${workType}Work`;
};

// Helper function to get work type from key
const getWorkTypeFromKey = (workKey) => {
  if (workKey === 'storeOperatorWork') return 'store_operator';
  return workKey.replace('Work', '');
};

export const SiteWorkSection = ({
  siteType,
  formData,
  sites,
  users = [],
  onChange,
  getSelectValue,
}) => {
  const siteData = formData[`${siteType}Site`] || {};
  const workTypes = siteType === 'source' ? SOURCE_WORK_TYPES : DESTINATION_WORK_TYPES;
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkType, setSelectedWorkType] = useState(null);

  const handleSkip = () => {
    onChange(`${siteType}Site.siteRequired`, false);
    toast.success(`${siteType === 'source' ? 'Source' : 'Destination'} site skipped`);
  };

  const openModal = (workType) => {
    setSelectedWorkType(workType);
    setModalOpen(true);
  };

  const handleSaveWork = (workType, workData) => {
    const workKey = getWorkKey(workType); // Use helper

    // Update work configuration
    onChange(`${siteType}Site.${workKey}`, {
      ...workData,
      required: true,
    });

    // Add to workTypes array if not already there
    if (!siteData.workTypes?.includes(workType)) {
      onChange(`${siteType}Site.workTypes`, [
        ...(siteData.workTypes || []),
        workType,
      ]);
    }

    toast.success(`${workType} work configured successfully`);
  };

  const handleRemoveWork = (workType) => {
    // Remove from workTypes array
    const updatedWorkTypes = (siteData.workTypes || []).filter(wt => wt !== workType);
    onChange(`${siteType}Site.workTypes`, updatedWorkTypes);

    // Reset work configuration
    const workKey = getWorkKey(workType); // Use helper
    onChange(`${siteType}Site.${workKey}`, {
      required: false,
      status: 'not-started',
      assignedUsers: [],
      notes: '',
    });

    toast.success(`${workType} work removed`);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6" />
            <CardTitle>
              {siteType === 'source' ? 'Source' : 'Destination'} Site
              <span className="ml-2 text-sm font-normal text-gray-600">
                {siteData.siteRequired ? '(Required)' : '(Skipped)'}
              </span>
            </CardTitle>
          </div>

          {siteData.siteRequired && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              className="border-orange-500 text-orange-700 hover:bg-orange-50"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip This Site
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Site Configuration */}
        <SiteConfiguration
          siteData={siteData}
          siteType={siteType}
          sites={sites}
          onChange={onChange}
        />

        {/* Work Types Selection */}
        {siteData.siteRequired && (
          <div className="pt-6 border-t">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Work Types Configuration</h3>
              <span className="text-sm text-gray-600">
                {siteData.workTypes?.length || 0} of {workTypes.length} selected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {workTypes.map(({ value, label, icon }) => {
                const workKey = getWorkKey(value); // Use helper
                const work = siteData[workKey] || {};
                const isSelected = siteData.workTypes?.includes(value);
                const assignedCount = work.assignedUsers?.length || 0;

                return (
                  <Card
                    key={value}
                    className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-primary/80 border-primary' : ''
                      }`}
                    onClick={() => openModal(value)}
                  >
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-2xl">{icon}</div>
                        {isSelected && (
                          <Badge className="bg-green-100 text-green-800">
                            Configured
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-bold text-lg">{label}</h4>

                      {isSelected ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            <span>{assignedCount} team member{assignedCount !== 1 ? 's' : ''}</span>
                          </div>
                          {work.notes && (
                            <div className="flex items-start gap-2">
                              <FileText className="h-3 w-3 mt-0.5" />
                              <span className="truncate">{work.notes}</span>
                            </div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveWork(value);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">Click to configure</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <WorkAssignmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        workType={selectedWorkType}
        workData={selectedWorkType ? siteData[getWorkKey(selectedWorkType)] || {} : {}}
        users={users}
        onSave={(updatedData) => handleSaveWork(selectedWorkType, updatedData)}
      />
    </Card>
  );
};