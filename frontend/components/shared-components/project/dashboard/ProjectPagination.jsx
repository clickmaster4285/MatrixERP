// components/shared-components/project/ProjectPagination.jsx
'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProjectPagination = ({ pagination, onPageChange, onLimitChange }) => {
   const { page = 1, limit = 10, pages = 1, total = 0 } = pagination;

   if (pages <= 1 && total <= limit) return null;

   return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200 bg-white/50">
         <div className="text-sm text-slate-600">
            Showing <span className="font-semibold">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold">{total}</span> projects
         </div>

         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <span className="text-sm text-slate-600">Rows per page:</span>
               <Select
                  value={limit.toString()}
                  onValueChange={(value) => onLimitChange(parseInt(value))}
               >
                  <SelectTrigger className="w-20 h-8">
                     <SelectValue>{limit}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="10">10</SelectItem>
                     <SelectItem value="25">25</SelectItem>
                     <SelectItem value="50">50</SelectItem>
                     <SelectItem value="100">100</SelectItem>
                  </SelectContent>
               </Select>
            </div>

            <div className="flex items-center gap-1">
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(1)}
                  disabled={page <= 1}
                  className="h-8 w-8 p-0"
               >
                  <ChevronsLeft className="h-4 w-4" />
               </Button>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page - 1)}
                  disabled={page <= 1}
                  className="h-8 w-8 p-0"
               >
                  <ChevronLeft className="h-4 w-4" />
               </Button>

               <div className="flex items-center gap-1 px-2">
                  <span className="text-sm text-slate-700">
                     Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{pages}</span>
                  </span>
               </div>

               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={page >= pages}
                  className="h-8 w-8 p-0"
               >
                  <ChevronRight className="h-4 w-4" />
               </Button>
               <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pages)}
                  disabled={page >= pages}
                  className="h-8 w-8 p-0"
               >
                  <ChevronsRight className="h-4 w-4" />
               </Button>
            </div>
         </div>
      </div>
   );
};

export default ProjectPagination;