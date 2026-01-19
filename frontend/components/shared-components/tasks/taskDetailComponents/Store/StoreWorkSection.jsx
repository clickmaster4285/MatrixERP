'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Truck, ClipboardList } from 'lucide-react';
import { StatusBadge, MaterialsSection } from '../TaskDetailHelpers';
import { TaskAttachmentsCard } from '../TaskAttachmentCard';
import { useUploadTaskAttachments } from '@/features/taskApi';

import SurveyMaterialsAllocateDialog from './MaterialAllocationDialog';

export function StoreWorkSection({
  task,
  items = [],
  isCreating,
  defaultLocation,
  defaultLocationName,
}) {
  
  const { mutate: uploadAttachments } = useUploadTaskAttachments();

  const isInventory = task.activityType === 'cow' && task.workType === 'inventory';
  const workData = isInventory ? task.workData || {} : task.dispatch || {};

  const [allocOpen, setAllocOpen] = useState(false);

  // Survey materials to show in dialog and comparison
  const surveyMaterials =
    task?.siteType === 'destination'
      ? task?.allMaterialLists?.destination_survey?.materials ||
      task?.allMaterialLists?.source_survey?.materials ||
      []
      : task?.allMaterialLists?.source_survey?.materials || [];

  // Current inventory materials (already allocated)
  const inventoryMaterials = workData.materials || [];

  // === CHECK IF ALL SURVEY MATERIALS ARE ALREADY FULLY ALLOCATED ===
  const isAllocationComplete = useMemo(() => {
    if (surveyMaterials.length === 0) return true; // nothing to allocate

    // Build a map of inventory materials: { materialCode_condition: quantity }
    const inventoryMap = new Map();
    inventoryMaterials.forEach((item) => {
      const key = `${item.materialCode.trim().toUpperCase()}_${item.condition || 'good'}`;
      inventoryMap.set(key, (inventoryMap.get(key) || 0) + item.quantity);
    });

    // Check every survey material
    for (const surveyItem of surveyMaterials) {
      const key = `${surveyItem.materialCode.trim().toUpperCase()}_${surveyItem.condition || 'good'}`;
      const allocatedQty = inventoryMap.get(key) || 0;
      if (allocatedQty < surveyItem.quantity) {
        return false; // still need to allocate more
      }
    }

    return true; // all fully allocated
  }, [surveyMaterials, inventoryMaterials]);

  return (
    <div className="space-y-4">
      {!isInventory ? (
        task.dispatch && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Dispatch Status</h4>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <StatusBadge status={task.dispatch?.status} />
                  <span className="text-sm">
                    Storage Location: {task.dispatch?.storageLocation || 'Not set'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Prerequisite: {task.dismantling?.status || 'Dismantling required'}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Truck className="h-4 w-4" />
                Update Dispatch
              </Button>
            </div>
          </div>
        )
      ) : null}

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {isInventory ? 'Inventory Management' : 'Materials & Equipment (Store)'}
          </CardTitle>
        </CardHeader>

     

        {isInventory ? (
          <CardContent>

            {/* Show allocation button only if not complete */}
            {!isAllocationComplete && (
              <div className="-mt-4 mb-6">
                <Button onClick={() => setAllocOpen(true)}>
                  Allocate Survey Materials
                </Button>
              </div>
            )}
            {/* Always show survey materials for reference */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Required Survey Materials</h4>
              <MaterialsSection materials={surveyMaterials} type="survey" task={task} />
            </div>

          

            {/* Optional: Show message when allocation is complete */}
            {isAllocationComplete && surveyMaterials.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ All survey materials have been sucessfully allocated.
                </p>
              </div>
            )}

            {/* Current inventory materials */}
            <div>
              {inventoryMaterials.length > 0 ? (
                <MaterialsSection materials={inventoryMaterials} type="inventory" task={task} />
              ) : (
                <div className="text-center py-12 space-y-4 border-2 border-dashed rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto">
                    <ClipboardList className="h-8 w-8 text-violet-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">No Inventory Items Found</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      No inventory items have been added yet.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Allocation Dialog */}
            <SurveyMaterialsAllocateDialog
              open={allocOpen}
              onOpenChange={setAllocOpen}
              task={task}
              items={items}
              surveyMaterials={surveyMaterials}
              defaultLocation={defaultLocation}
              defaultLocationName={defaultLocationName}
              isCreating={false}
            />
          </CardContent>
        ) : (
          /* Non-inventory view (store operator, etc.) – unchanged */
          <>
            <CardContent>
              <MaterialsSection
                materials={task.survey?.materials || task?.allMaterialLists?.source_survey?.materials}
                type="survey"
                task={task}
              />
            </CardContent>

            <CardContent>
              <MaterialsSection
                materials={
                  task.materialLists?.dismantlingMaterials?.materials ||
                  task?.allMaterialLists?.destination_civil?.materials
                }
                type="dismantling"
                task={task}
              />
            </CardContent>

            <CardContent>
              <MaterialsSection
                materials={
                  task.materialLists?.dispatchMaterials?.materials ||
                  task?.allMaterialLists?.source_storeOperator?.materials
                }
                type="store"
                task={task}
              />
            </CardContent>
          </>
        )}

        <CardContent>
          <TaskAttachmentsCard
            title={isInventory ? 'Inventory Attachments' : 'Store Attachments'}
            attachments={isInventory ? workData.attachments || [] : task?.addAttachments || []}
            activityId={task.parentActivityId}
            activityType={task.activityType}
            attachmentTarget={
              isInventory
                ? `${task.siteType === 'destination' ? 'destinationSite' : 'sourceSite'}.inventoryWork`
                : `${task.siteType === 'destination' ? 'destinationSite' : 'sourceSite'}.storeOperatorWork`
            }
            uploadFn={(id, formData) =>
              uploadAttachments({
                activityType: task.activityType,
                activityId: id,
                formData,
              })
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}