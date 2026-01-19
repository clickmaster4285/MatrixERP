'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DismantlingHeader = ({ onOpenCreate }) => {
  return (
    <header>
      <div className="mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1>Dismantling Manager</h1>
            <p className="text-sm text-muted-foreground">
              Telecom Site Operations
            </p>
          </div>
        </div>

        <Button
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
          onClick={onOpenCreate}
        >
          <Plus className="w-4 h-4" />
          New Activity
        </Button>
      </div>
    </header>
  );
};

export default DismantlingHeader;
