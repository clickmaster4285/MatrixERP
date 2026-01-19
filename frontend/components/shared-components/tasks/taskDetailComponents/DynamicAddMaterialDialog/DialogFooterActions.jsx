'use client';

import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

export function DialogFooterActions({ saving, onCancel, onSave }) {
  return (
    <div className="flex justify-between items-center pt-4 border-t border-border gap-3 flex-col md:flex-row">
      <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>

      <Button onClick={onSave} disabled={saving}>
        <Save className="w-4 h-4 mr-2" />
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </div>
  );
}
