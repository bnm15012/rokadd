"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// State types
// ---------------------------------------------------------------------------
export type ProfileState =
  | {
      success?: string;
      error?: string;
      errors?: {
        name?: string[];
        email?: string[];
      };
    }
  | undefined;

export type PasswordState =
  | {
      success?: string;
      error?: string;
      errors?: {
        currentPassword?: string[];
        newPassword?: string[];
        confirmPassword?: string[];
      };
    }
  | undefined;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const ProfileSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Name must be at least 2 characters." })
    .max(80, { error: "Name must be at most 80 characters." })
    .trim(),
  email: z
    .string()
    .email({ error: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
});

const PasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { error: "Current password is required." }),
    newPassword: z
      .string()
      .min(8, { error: "New password must be at least 8 characters." })
      .regex(/[a-zA-Z]/, {
        error: "New password must contain at least one letter.",
      })
      .regex(/[0-9]/, {
        error: "New password must contain at least one number.",
      }),
    confirmPassword: z
      .string()
      .min(1, { error: "Please confirm your new password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getSuperAdminId(): Promise<string | null> {
  const session = await auth();
  const user = session?.user as { id?: string; isSuperAdmin?: boolean } | undefined;
  if (!user?.id || !user.isSuperAdmin) return null;
  return user.id;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function updateAdminProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const adminId = await getSuperAdminId();
  if (!adminId) return { error: "You must be signed in as a super admin." };

  const raw = { name: formData.get("name"), email: formData.get("email") };
  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return { errors: { name: fe.name, email: fe.email } };
  }

  const { name, email } = parsed.data;

  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  if (existing && existing.id !== adminId) {
    return { errors: { email: ["This email address is already in use."] } };
  }

  await prisma.superAdmin.update({
    where: { id: adminId },
    data: { name, email },
  });

  return { success: "Profile updated successfully." };
}

export async function changeAdminPasswordAction(
  _prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const adminId = await getSuperAdminId();
  if (!adminId) return { error: "You must be signed in as a super admin." };

  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = PasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        currentPassword: fe.currentPassword,
        newPassword: fe.newPassword,
        confirmPassword: fe.confirmPassword,
      },
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  const dbAdmin = await prisma.superAdmin.findUnique({
    where: { id: adminId },
    select: { id: true, password: true },
  });
  if (!dbAdmin) return { error: "Admin not found." };

  const isValid = await bcrypt.compare(currentPassword, dbAdmin.password);
  if (!isValid) {
    return { errors: { currentPassword: ["Current password is incorrect."] } };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.superAdmin.update({
    where: { id: adminId },
    data: { password: hashedPassword },
  });

  return { success: "Password changed successfully." };
}
