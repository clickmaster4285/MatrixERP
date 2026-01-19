// components/dismantling/ActivityDetailHeader.jsx
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import { getStatusColor, getTypeColor } from '@/utils/InventoryStaticList';

export function ActivityDetailHeader({ activity, router, id }) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-foreground">
                {activity.site?.name || 'Site'}
              </h1>
              <Badge
                variant="outline"
                className={getTypeColor(activity.dismantlingType)}
              >
                {activity.dismantlingType}
              </Badge>
              <Badge className={getStatusColor(activity.status)}>
                {activity.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
            Created by{' '}
              {activity.createdBy?.name || '—'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
