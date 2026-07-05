"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/email";

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
      otpSent?: boolean;
      errors?: {
        newPassword?: string[];
        confirmPassword?: string[];
        otp?: string[];
      };
    }
  | undefined;

// ---------------------------------------------------------------------------
// Schemas — Zod v4 uses `error:` string for custom messages
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

const NewPasswordSchema = z
  .object({
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
// Actions
// ---------------------------------------------------------------------------

export async function updateProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  // 1. Authenticate
  const session = await auth();
  const user = session?.user as { id?: number } | undefined;
  if (!user?.id) {
    return { error: "You must be signed in to update your profile." };
  }
  const userId = Number(user.id);

  // 2. Validate
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
  };

  const parsed = ProfileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fieldErrors.name,
        email: fieldErrors.email,
      },
    };
  }

  const { name, email } = parsed.data;

  // 3. Check if new email is already taken by another user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    return { errors: { email: ["This email address is already in use."] } };
  }

  // 4. Update user
  await prisma.user.update({
    where: { id: userId },
    data: { name, email },
  });

  return { success: "Profile updated successfully." };
}

// ---------------------------------------------------------------------------
// Step 1: Validate new password & send OTP to user's email
// ---------------------------------------------------------------------------
export async function requestOtpAction(
  _prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await auth();
  const user = session?.user as { id?: number } | undefined;
  if (!user?.id) {
    return { error: "You must be signed in to change your password." };
  }
  const userId = Number(user.id);

  // Validate new password
  const raw = {
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };
  const parsed = NewPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        newPassword: fieldErrors.newPassword,
        confirmPassword: fieldErrors.confirmPassword,
      },
    };
  }

  // Fetch user email
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!dbUser) {
    return { error: "User not found." };
  }

  // Rate-limit: don't allow more than 1 OTP per 60 seconds
  const recentOtp = await prisma.otp.findFirst({
    where: {
      email: dbUser.email,
      createdAt: { gte: new Date(Date.now() - 60 * 1000) },
    },
  });
  if (recentOtp) {
    return { error: "Please wait 60 seconds before requesting a new OTP." };
  }

  // Generate 6-digit OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Invalidate old unused OTPs for this email
  await prisma.otp.updateMany({
    where: { email: dbUser.email, used: false },
    data: { used: true },
  });

  // Save OTP
  await prisma.otp.create({
    data: { email: dbUser.email, code, expiresAt },
  });

  // Send email
  try {
    await sendOtpEmail(dbUser.email, code);
  } catch {
    return { error: "Failed to send OTP email. Please try again later." };
  }

  return { otpSent: true };
}

// ---------------------------------------------------------------------------
// Step 2: Verify OTP & change password
// ---------------------------------------------------------------------------
export async function verifyOtpAndChangePasswordAction(
  _prevState: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await auth();
  const user = session?.user as { id?: number } | undefined;
  if (!user?.id) {
    return { error: "You must be signed in to change your password." };
  }
  const userId = Number(user.id);

  const otp = (formData.get("otp") as string)?.trim();
  const newPassword = formData.get("newPassword") as string;

  if (!otp || otp.length !== 6) {
    return { errors: { otp: ["Please enter the 6-digit OTP."] } };
  }
  if (!newPassword) {
    return { error: "New password is missing. Please start over." };
  }

  // Fetch user email
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!dbUser) {
    return { error: "User not found." };
  }

  // Find valid OTP
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email: dbUser.email,
      code: otp,
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return { errors: { otp: ["Invalid or expired OTP. Please try again."] } };
  }

  // Mark OTP as used
  await prisma.otp.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  // Hash and save new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: "Password changed successfully." };
}
