// app/admin/layout.jsx
'use client';
import { ROLES } from '@/constants/roles';
import ProtectedRoute from '../ProtectedRoute';
import DynamicSidebar from '@/components/layout/DynamicSidebar';
import DynamicNavbar from '@/components/layout/DynamicNavbar';

export default function AdminLayout({ children }) {

  return (
    <ProtectedRoute allowedRoles={[ROLES.SUPERVISOR]}>
      <div className="flex h-screen overflow-hidden">
        <DynamicSidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          <DynamicNavbar />
          <main className="flex-1 p-4 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}