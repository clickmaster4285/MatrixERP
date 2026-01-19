'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

export function WorkFieldsSection({
  task,
  resolved,
  mode,
  fields,
  onFieldChange,
}) {
  const isDismantling = task?.activityType === 'dismantling';
  const isRelocation = task?.activityType === 'relocation';

  const showTopNotes =
    isRelocation || (isDismantling && resolved?.phase === 'dismantling');

  const topNotesLabel =
    isDismantling && resolved?.phase === 'dismantling'
      ? 'Damage Notes'
      : 'Notes';

  return (
    <div className="space-y-4">
      {/* STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-xs font-medium">Status</Label>
          <Select
            value={fields.status || 'in-progress'}
            onValueChange={(v) => onFieldChange('status', v)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dismantling Survey Report */}
      {isDismantling && resolved?.phase === 'survey' && (
        <div>
          <Label className="text-xs font-medium">Survey Report</Label>
          <Textarea
            rows={3}
            className="mt-1 bg-secondary/40"
            placeholder="Write survey summary / findings..."
            value={fields.report || ''}
            onChange={(e) => onFieldChange('report', e.target.value)}
          />
        </div>
      )}

      {/* Relocation Survey Type */}
      {/* {isRelocation && resolved?.subPhase === 'surveyWork' && (
        <div className="max-w-md">
          <Label className="text-xs font-medium">Survey Type</Label>
          <Input
            className="mt-1"
            value={fields.surveyType || ''}
            onChange={(e) => onFieldChange('surveyType', e.target.value)}
            placeholder="Pre-move survey..."
          />
        </div>
      )} */}

      {/* Notes / Damage Notes */}
      {showTopNotes && (
        <div>
          <Label className="text-xs font-medium">{topNotesLabel}</Label>
          <Textarea
            rows={3}
            className="mt-1 bg-secondary/40"
            placeholder={
              topNotesLabel === 'Damage Notes'
                ? 'Write damage notes...'
                : 'Write notes...'
            }
            value={fields.notes || ''}
            onChange={(e) => onFieldChange('notes', e.target.value)}
          />
        </div>
      )}

      {/* Dispatch / Store fields (Dismantling dispatch) */}
      {isDismantling && resolved?.phase === 'dispatch' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-medium">Destination Location</Label>
            <Select
              value={fields.destinationlocation || 'own-store'}
              onValueChange={(v) => onFieldChange('destinationlocation', v)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="own-store">Own Store</SelectItem>
                <SelectItem value="ufone">Ufone</SelectItem>
                <SelectItem value="ptcl">PTCL</SelectItem>
                <SelectItem value="zong">Zong</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs font-medium">Destination Details</Label>
            <Input
              className="mt-1"
              value={fields.destinationDetails || ''}
              onChange={(e) =>
                onFieldChange('destinationDetails', e.target.value)
              }
              placeholder="Warehouse / city / address..."
            />
          </div>

          <div className="md:col-span-2">
            <Label className="text-xs font-medium">Receiver Name</Label>
            <Input
              className="mt-1"
              value={fields.receiverName || ''}
              onChange={(e) => onFieldChange('receiverName', e.target.value)}
              placeholder="Receiver name..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
