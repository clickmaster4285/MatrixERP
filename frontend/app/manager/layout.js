// app/manager/layout.jsx
'use client';
import { ROLES } from '@/constants/roles';
import ProtectedRoute from '../ProtectedRoute';
import DynamicSidebar from '@/components/layout/DynamicSidebar';
import DynamicNavbar from '@/components/layout/DynamicNavbar';
import { Toaster } from '@/components/ui/sonner';

export default function ManagerLayout({ children }) {
   return (
     <ProtectedRoute allowedRoles={[ROLES.MANAGER]}>
       <div className="flex h-screen overflow-hidden">
         <DynamicSidebar />
         <div className="flex-1 flex flex-col overflow-auto">
           <DynamicNavbar />
           <main className="flex-1 p-4 overflow-auto">{children}</main>
           <Toaster position="top-right" richColors />
         </div>
       </div>
     </ProtectedRoute>
   );
}