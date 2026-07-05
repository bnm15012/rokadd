'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getPermissions } from '@/lib/permissions';
import type { ActionState, PermissionKey } from '@/types';

// All 26 permission keys (everything except id and shopMemberId)
const ALL_PERMISSION_KEYS: PermissionKey[] = [
  'canViewDashboard',
  'canViewProducts',
  'canManageProducts',
  'canViewInventory',
  'canLogStockInward',
  'canAdjustStock',
  'canCreateSales',
  'canViewSalesHistory',
  'canViewVendors',
  'canManageVendors',
  'canLogPurchases',
  'canMakeVendorPayments',
  'canViewExpenses',
  'canLogExpenses',
  'canViewCashFlow',
  'canFinalizeCashFlow',
  'canViewCustomers',
  'canManageCustomers',
  'canCollectCreditPayments',
  'canViewAnalytics',
  'canExportReports',
  'canManageStaff',
  'canViewSettings',
  'canViewCostPrices',
  'canViewProfitMargins',
  'canViewVendorPayAmounts',
  'canViewNetCashBalance',
];

function parsePermissions(
  formData: FormData,
  allowedKeys: PermissionKey[]
): Record<PermissionKey, boolean> {
  const result = {} as Record<PermissionKey, boolean>;
  for (const key of ALL_PERMISSION_KEYS) {
    // Only set true if the key is in allowedKeys AND the checkbox was checked
    result[key] = allowedKeys.includes(key) ? formData.get(key) === 'on' : false;
  }
  return result;
}

export async function addStaffMember(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for your account' };

    const ctx = await getPermissions(shopId);
    const role = formData.get('role') as string;

    // Authorization: only OWNER can add MANAGERs; MANAGER can add STAFF if they have canManageStaff
    if (role === 'MANAGER') {
      if (!ctx.isOwner && !ctx.isSuperAdmin) {
        return { success: false, error: 'Only shop owners can add managers' };
      }
    } else {
      if (!ctx.isOwner && !ctx.isSuperAdmin && !ctx.permissions?.canManageStaff) {
        return { success: false, error: 'You do not have permission to manage staff' };
      }
    }

    const email = (formData.get('email') as string)?.trim().toLowerCase();
    const name = (formData.get('name') as string)?.trim();

    if (!email || !name) {
      return { success: false, error: 'Name and email are required' };
    }
    if (!['MANAGER', 'STAFF'].includes(role)) {
      return { success: false, error: 'Invalid role' };
    }

    // Determine which permissions the editor is allowed to grant
    let allowedKeys: PermissionKey[];
    if (ctx.isOwner || ctx.isSuperAdmin) {
      allowedKeys = ALL_PERMISSION_KEYS;
    } else {
      // MANAGER can only grant permissions they themselves have
      allowedKeys = ALL_PERMISSION_KEYS.filter((k) => !!ctx.permissions?.[k]);
    }

    const permissionData = parsePermissions(formData, allowedKeys);

    // Find or create user
    let targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      const hashedPassword = await bcrypt.hash('Welcome@123', 12);
      targetUser = await prisma.user.create({
        data: { email, name, password: hashedPassword },
      });
    }

    // Check if already a member
    const existingMember = await prisma.shopMember.findUnique({
      where: { userId_shopId: { userId: targetUser.id, shopId } },
    });
    if (existingMember) {
      return { success: false, error: 'This user is already a member of your shop' };
    }

    // Determine managerId
    const managerId = (!ctx.isOwner && !ctx.isSuperAdmin) ? ctx.memberId : null;

    // Create ShopMember + MemberPermission in a transaction
    await prisma.$transaction(async (tx) => {
      const member = await tx.shopMember.create({
        data: {
          userId: targetUser!.id,
          shopId,
          role: role as 'MANAGER' | 'STAFF',
          managerId,
          isActive: true,
        },
      });

      await tx.memberPermission.create({
        data: { shopMemberId: member.id, ...permissionData },
      });
    });

    revalidatePath('/dashboard/settings/staff');
    return { success: true, data: { message: `${name} has been added successfully` } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add staff member';
    return { success: false, error: message };
  }
}

export async function updateMemberPermissions(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for your account' };

    const ctx = await getPermissions(shopId);
    if (!ctx.isOwner && !ctx.isSuperAdmin && !ctx.permissions?.canManageStaff) {
      return { success: false, error: 'You do not have permission to manage staff' };
    }

    const memberId = formData.get('memberId') as string;
    if (!memberId) return { success: false, error: 'Member ID is required' };

    // Fetch the target member to validate they belong to this shop
    const targetMember = await prisma.shopMember.findUnique({
      where: { id: memberId },
      include: { permissions: true },
    });
    if (!targetMember || targetMember.shopId !== shopId) {
      return { success: false, error: 'Member not found' };
    }

    // MANAGERs can only update their own staff
    if (!ctx.isOwner && !ctx.isSuperAdmin) {
      if (targetMember.managerId !== ctx.memberId) {
        return { success: false, error: 'You can only manage your own staff members' };
      }
    }

    // Determine allowed keys based on editor permissions
    let allowedKeys: PermissionKey[];
    if (ctx.isOwner || ctx.isSuperAdmin) {
      allowedKeys = ALL_PERMISSION_KEYS;
    } else {
      allowedKeys = ALL_PERMISSION_KEYS.filter((k) => !!ctx.permissions?.[k]);
    }

    const permissionData = parsePermissions(formData, allowedKeys);

    if (targetMember.permissions) {
      await prisma.memberPermission.update({
        where: { shopMemberId: memberId },
        data: permissionData,
      });
    } else {
      await prisma.memberPermission.create({
        data: { shopMemberId: memberId, ...permissionData },
      });
    }

    revalidatePath('/dashboard/settings/staff');
    return { success: true, data: { message: 'Permissions updated successfully' } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update permissions';
    return { success: false, error: message };
  }
}

export async function deactivateMember(memberId: string): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for your account' };

    const ctx = await getPermissions(shopId);
    if (!ctx.isOwner && !ctx.isSuperAdmin && !ctx.permissions?.canManageStaff) {
      return { success: false, error: 'You do not have permission to manage staff' };
    }

    const targetMember = await prisma.shopMember.findUnique({ where: { id: memberId } });
    if (!targetMember || targetMember.shopId !== shopId) {
      return { success: false, error: 'Member not found' };
    }

    // MANAGERs can only deactivate their own staff
    if (!ctx.isOwner && !ctx.isSuperAdmin) {
      if (targetMember.managerId !== ctx.memberId) {
        return { success: false, error: 'You can only deactivate your own staff members' };
      }
    }

    // Cannot deactivate OWNERs
    if (targetMember.role === 'OWNER') {
      return { success: false, error: 'Cannot deactivate the shop owner' };
    }

    await prisma.shopMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });

    revalidatePath('/dashboard/settings/staff');
    return { success: true, data: { message: 'Member deactivated successfully' } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to deactivate member';
    return { success: false, error: message };
  }
}

export async function reactivateMember(memberId: string): Promise<ActionState> {
  try {
    const user = await getSessionUser();
    const shopId = user.shopMembers[0]?.shopId;
    if (!shopId) return { success: false, error: 'No shop found for your account' };

    const ctx = await getPermissions(shopId);
    if (!ctx.isOwner && !ctx.isSuperAdmin) {
      return { success: false, error: 'Only shop owners can reactivate members' };
    }

    const targetMember = await prisma.shopMember.findUnique({ where: { id: memberId } });
    if (!targetMember || targetMember.shopId !== shopId) {
      return { success: false, error: 'Member not found' };
    }

    await prisma.shopMember.update({
      where: { id: memberId },
      data: { isActive: true },
    });

    revalidatePath('/dashboard/settings/staff');
    return { success: true, data: { message: 'Member reactivated successfully' } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to reactivate member';
    return { success: false, error: message };
  }
}
