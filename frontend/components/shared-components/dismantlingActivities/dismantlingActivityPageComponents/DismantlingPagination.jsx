'use client';

import { Button } from '@/components/ui/button';

const DismantlingPagination = ({ pagination, filters, updateFilters }) => {
  const currentPage = filters.page || 1;
  const totalPages = pagination.pages;

  return (
    <div className="flex items-center gap-2 mt-8 justify-center">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() =>
          updateFilters((prev) => ({
            ...prev,
            page: (prev.page || 1) - 1,
          }))
        }
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() =>
          updateFilters((prev) => ({
            ...prev,
            page: (prev.page || 1) + 1,
          }))
        }
      >
        Next
      </Button>
    </div>
  );
};

export default DismantlingPagination;
