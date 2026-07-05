import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSessionUser, getPermissions } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { AddStaffDialog } from './_components/add-staff-dialog';
import { StaffActions } from './_components/staff-actions';

export default async function StaffPage() {
  let user;
  try {
    user = await getSessionUser();
  } catch {
    redirect('/');
  }

  const shopId = user.shopMembers[0]?.shopId;
  if (!shopId) {
    return (
      <div className="py-12 text-center text-slate-500">No shop found for your account.</div>
    );
  }

  const ctx = await getPermissions(shopId);
  if (!ctx.isOwner && !ctx.isSuperAdmin && !ctx.permissions?.canManageStaff) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500 font-medium">You don&apos;t have permission to manage staff.</p>
      </div>
    );
  }

  // Build query: OWNERs see all; MANAGERs see only their own staff
  const whereClause =
    ctx.isOwner || ctx.isSuperAdmin
      ? { shopId }
      : { shopId, managerId: ctx.memberId };

  const members = await prisma.shopMember.findMany({
    where: whereClause,
    include: {
      user: { select: { email: true, name: true } },
      permissions: true,
    },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  });

  const roleColors: Record<string, string> = {
    OWNER: 'bg-indigo-100 text-indigo-700',
    MANAGER: 'bg-amber-100 text-amber-700',
    STAFF: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/dashboard/settings" className="hover:text-indigo-600 transition">Settings</Link>
            <span>/</span>
            <span>Staff</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {members.length} member{members.length !== 1 ? 's' : ''} in your shop
          </p>
        </div>
        {(ctx.isOwner || ctx.isSuperAdmin || ctx.permissions?.canManageStaff) && (
          <AddStaffDialog editorIsOwner={ctx.isOwner || ctx.isSuperAdmin} />
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {members.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No staff members yet. Add your first team member.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Joined
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">
                    {m.user.name}
                    {m.userId === user.id && (
                      <span className="ml-1.5 text-xs text-slate-400">(you)</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{m.user.email}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        roleColors[m.role] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        m.isActive
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          m.isActive ? 'bg-emerald-500' : 'bg-red-500'
                        }`}
                      />
                      {m.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400">
                    {new Date(m.joinedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {m.role !== 'OWNER' && (
                      <StaffActions
                        memberId={m.id}
                        memberName={m.user.name}
                        isActive={m.isActive}
                        isSelf={m.userId === user.id}
                        canEdit={ctx.isOwner || ctx.isSuperAdmin || m.managerId === ctx.memberId}
                        isOwnerEditor={ctx.isOwner || ctx.isSuperAdmin}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
