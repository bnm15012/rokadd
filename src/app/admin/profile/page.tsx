import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AdminProfileForm from './_components/admin-profile-form';
import AdminPasswordForm from './_components/admin-password-form';

export default async function AdminProfilePage() {
  const user = await getSessionUser().catch(() => null);
  if (!user?.isSuperAdmin) redirect('/');

  const admin = await prisma.superAdmin.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });
  if (!admin) redirect('/');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your super admin account settings.
        </p>
        <div className="mt-3 h-1 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
      </div>

      <AdminProfileForm name={admin.name} email={admin.email} />
      <AdminPasswordForm />
    </div>
  );
}
