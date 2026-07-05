import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser, getPermissions } from '@/lib/permissions';
import { Users, CreditCard, Store, ChevronRight, UserCircle } from 'lucide-react';

export default async function SettingsPage() {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) {
    return (
      <div className="py-12 text-center text-slate-500">
        No shop associated with your account.
      </div>
    );
  }

  const ctx = await getPermissions(shopId);
  if (!ctx.isOwner && !ctx.isSuperAdmin && !ctx.permissions?.canViewSettings) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500 font-medium">You don&apos;t have permission to view settings.</p>
      </div>
    );
  }

  const canManageStaff = ctx.isOwner || ctx.isSuperAdmin || !!ctx.permissions?.canManageStaff;

  const settingsSections = [
    {
      href: '/dashboard/settings/profile',
      icon: UserCircle,
      title: 'My Profile',
      description: 'Update your name, email, and change your password.',
      available: true,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      href: '/dashboard/settings/staff',
      icon: Users,
      title: 'Staff Management',
      description: 'Manage team members, roles, and granular permissions for your shop.',
      available: canManageStaff,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      href: '/dashboard/settings/billing',
      icon: CreditCard,
      title: 'Billing & Subscription',
      description: 'View your current plan, payment history, and upgrade or change plans.',
      available: ctx.isOwner || ctx.isSuperAdmin,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      href: '#',
      icon: Store,
      title: 'Shop Profile',
      description: 'Update your shop name, address, GSTIN, logo, and contact details.',
      available: ctx.isOwner || ctx.isSuperAdmin,
      color: 'bg-amber-50 text-amber-600',
      comingSoon: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your shop configuration, staff, and billing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map(
          ({ href, icon: Icon, title, description, available, color, comingSoon }) => {
            if (!available) return null;
            return (
              <div key={title} className="relative">
                {comingSoon ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 opacity-60 cursor-not-allowed">
                    <div className={`inline-flex rounded-lg p-2.5 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-3 font-semibold text-slate-800">{title}</h2>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                    <span className="mt-3 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      Coming soon
                    </span>
                  </div>
                ) : (
                  <Link
                    href={href}
                    className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
                  >
                    <div className={`inline-flex rounded-lg p-2.5 ${color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-3 font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                      {title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{description}</p>
                    <div className="mt-3 flex items-center text-sm font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </Link>
                )}
              </div>
            );
          }
        )}
      </div>


    </div>
  );
}
