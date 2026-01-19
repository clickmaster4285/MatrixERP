'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, CheckCircle, AlertCircle, Hammer, Plus } from 'lucide-react';
import {
  getMaterialTypeLabel,
  getMaterialIcon,
  getMaterialSectionTitle,
  normalizeMaterialType,
  formatAddedByInfo
} from '@/components/shared-components/tasks/taskDetailComponents/DynamicAddMaterialDialog/taskWorkUtils';

// Small detail row with optional icon
export const DetailItem = ({ label, value, icon: Icon }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
    </div>
    <p className="text-sm font-semibold text-foreground wrap-break-word">
      {value || '-'}
    </p>
  </div>
);

// Section wrapper used inside tabs
export const Section = ({ title, icon: Icon, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="h-4 w-4 text-primary" />}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg border">
      {children}
    </div>
  </div>
);

// Status badge (success / warning / error / default)
export const StatusBadge = ({ status }) => {
  const getVariant = (status) => {
    if (typeof status !== 'string') return 'outline';
    const s = status.toLowerCase();
    if (s.includes('complete') || s.includes('done') || s.includes('approved'))
      return 'default';
    if (
      s.includes('progress') ||
      s.includes('ongoing') ||
      s.includes('pending')
    )
      return 'secondary';
    if (s.includes('failed') || s.includes('error') || s.includes('rejected'))
      return 'destructive';
    return 'outline';
  };

  return (
    <Badge
      variant={getVariant(status)}
      className="capitalize text-xs font-medium px-3 py-1"
    >
      {status || 'Not Started'}
    </Badge>
  );
};

// Normalize role text to one of: survey / dismantling / store
export const normalizeRole = (role) => {
  const r = (role || '').toLowerCase();

  // Check for exact patterns or word boundaries
  if (r.includes('install')) return 'installation';
  if (r.includes('survey')) return 'survey';
  if (r.includes('dismant')) return 'dismantling';
  if (r.includes('store') || r.includes('inventory')) return 'inventory';
  if (r.includes('civil')) return 'civil engineer';
  if (r === 'telecom engineer' || r === 'te' || r === 'telecom') return 'telecom engineer';
  if (r.includes('transport')) return 'transportation';
  if (r.includes('team member')) return 'team member';

  return r;
};
// Normalize work type to: survey / dismantling / civil / telecom / other
export const normalizeWorkType = (wt) => {
  const w = (wt || '').toLowerCase();
  if (w.startsWith('survey')) return 'survey';
  if (w.startsWith('dismant')) return 'dismantling';
  if (w.startsWith('civil')) return 'civil';
  if (w.startsWith('tele')) return 'telecom';
  if (w.startsWith('install')) return 'installation';
  if (w.startsWith('transport')) return 'transportation';
  if (w.startsWith('invent')) return 'inventory';
  return w;
};

// Material card used in the materials list
export const MaterialCard = ({ material, type = 'survey' }) => {
  const normalizedType = normalizeMaterialType(type);
  const iconConfig = getMaterialIcon(normalizedType);
  const addedByInfo = formatAddedByInfo(material);


  const getConditionColor = (condition) => {
    switch ((condition || '').toLowerCase()) {
      case 'excellent':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'good':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'fair':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'poor':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'scrap':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getConditionIcon = (condition) => {
    switch ((condition || '').toLowerCase()) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'fair':
      case 'poor':
      case 'scrap':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const condition = material.condition || material.conditionAfterDismantling;

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconConfig.bgColor}`}>
            {normalizedType === 'dismantling' ? (
              <Hammer className={`h-5 w-5 ${iconConfig.color}`} />
            ) : (
              <Package className={`h-5 w-5 ${iconConfig.color}`} />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-sm">{material.name}</h4>
            <p className="text-xs text-muted-foreground">
              ID: {material.materialId || material.materialCode || 'N/A'}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`${getConditionColor(
            condition
          )} text-xs font-medium px-2 py-1`}
        >
          <div className="flex items-center gap-1">
            {getConditionIcon(condition)}
            {condition || 'Unknown'}
          </div>
        </Badge>
      </div>

      <div className="mt-2 pt-2 border-t">
        <p className="text-xs text-muted-foreground">Added By</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="text-sm font-medium">{addedByInfo.name }</div>
          {addedByInfo.role && (
            <Badge variant="outline" className="text-xs">
              {addedByInfo.role}
            </Badge>
          )}
          {addedByInfo.date && (
            <p className="text-xs text-muted-foreground">{addedByInfo.date}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {type === 'dismantling' ? 'Quantity Dismantled' : 'Quantity'}
          </p>
          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">
              {type === 'dismantling'
                ? material.quantityDismantled
                : material.quantity || 1}
            </div>
          </div>
        </div>

        {type !== 'dismantling' && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Reusable</p>
            <div className="flex items-center gap-2">
              {material.canBeReused ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Yes</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">No</span>
                </div>
              )}
            </div>
          </div>
        )}

        {type === 'dismantling' && material.dismantlingDate && (
          <div className="space-y-1 col-span-2">
            <p className="text-xs text-muted-foreground">Dismantling Date</p>
            <p className="text-sm font-medium">
              {new Date(material.dismantlingDate).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {(material.notes || material.damageNotes) && (
        <div className="mt-3 pt-3 border-top border-t">
          <p className="text-xs text-muted-foreground mb-1">
            {type === 'dismantling' ? 'Damage Notes' : 'Notes'}
          </p>
          <p className="text-sm">{material.notes || material.damageNotes}</p>
        </div>
      )}

      {type === 'dismantling' && material.dismantledBy && (
        <div className="mt-2 pt-2 border-t">
          <p className="text-xs text-muted-foreground">Dismantled By</p>
          <p className="text-sm font-medium">{material.dismantledBy}</p>
        </div>
      )}
    </div>
  );
};

// Materials list section (used in the Work tab)
export const MaterialsSection = ({
  materials,
  type = 'survey',
  onAddSurvey,
  task,
}) => {
  const normalizedType = normalizeMaterialType(type);
  const iconConfig = getMaterialIcon(normalizedType);

  // Check if user is a surveyor
  const isSurveyor = normalizeRole(task.myRole) === 'survey';

  // Determine if we should show the add button
  const shouldShowAddButton = type === 'survey' && isSurveyor;

  if (!materials || materials.length === 0) {
    return (
      <div className="text-center py-12 space-y-4 border-2 border-dashed rounded-xl">
        <div className={`w-16 h-16 rounded-full ${iconConfig.bgColor} flex items-center justify-center mx-auto`}>
          <Package className={`h-8 w-8 ${iconConfig.color}`} />
        </div>
        <div>
          <h4 className="font-medium">No Materials Found</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {shouldShowAddButton
              ? 'Start a survey to add materials to this task.'
              : `No ${getMaterialTypeLabel(normalizedType)} materials found.`}
          </p>
        </div>
        {shouldShowAddButton && (
          <Button size="sm" onClick={onAddSurvey} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Materials to Survey
          </Button>
        )}
      </div>
    );
  }

  const totalQty = materials.reduce(
    (sum, m) => sum + (m.quantity || m.quantityDismantled || 1),
    0
  );

  // Get site type from first material if available
  const siteType = materials[0]?.siteType || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className={`p-2 rounded-lg ${iconConfig.bgColor}`}>
              <Package className={`h-5 w-5 ${iconConfig.color}`} />
            </div>
            {getMaterialSectionTitle(normalizedType, siteType)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {materials.length} items • Total Quantity: {totalQty}
          </p>
        </div>
        {type === 'survey' && normalizeRole(task.myRole) === 'survey' && (
          <Button size="sm" onClick={onAddSurvey} className="gap-2">
            <Plus className="h-4 w-4" />
            Add More Materials
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {materials.map((material, index) => (
          <MaterialCard
            key={material._id || index}
            material={material}
            type={normalizedType}
          />
        ))}
      </div>
    </div>
  );
};