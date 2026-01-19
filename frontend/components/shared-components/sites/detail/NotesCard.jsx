// components/shared-components/sites/detail/NotesCard.jsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';

const NotesCard = ({ notes }) => {
   if (!notes) return null;

   return (
      <Card>
         <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <ClipboardList className="h-5 w-5" />
               Notes
            </CardTitle>
         </CardHeader>
         <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
         </CardContent>
      </Card>
   );
};

export default NotesCard;