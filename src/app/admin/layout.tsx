import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/permissions';
import { AdminSidebar } from './_components/admin-sidebar';
import { AdminHeaderDropdown } from './_components/admin-header-dropdown';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  if (!user.isSuperAdmin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Dark sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Super Admin Console
            </span>
          </div>
          <AdminHeaderDropdown adminName={user.name} adminEmail={user.email} />
        </header>

        <main className="flex-1 overflow-auto bg-white p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
