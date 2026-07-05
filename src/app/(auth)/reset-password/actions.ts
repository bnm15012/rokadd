"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type ResetPasswordState =
  | {
      success?: boolean;
      error?: string;
      errors?: {
        otp?: string[];
        newPassword?: string[];
        confirmPassword?: string[];
      };
    }
  | undefined;

const ResetSchema = z
  .object({
    email: z
      .string()
      .email({ error: "Invalid email." })
      .trim()
      .toLowerCase(),
    otp: z
      .string()
      .length(6, { error: "OTP must be 6 digits." })
      .regex(/^\d+$/, { error: "OTP must contain only numbers." }),
    newPassword: z
      .string()
      .min(8, { error: "Password must be at least 8 characters." })
      .regex(/[a-zA-Z]/, {
        error: "Password must contain at least one letter.",
      })
      .regex(/[0-9]/, {
        error: "Password must contain at least one number.",
      }),
    confirmPassword: z
      .string()
      .min(1, { error: "Please confirm your password." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const raw = {
    email: formData.get("email"),
    otp: formData.get("otp"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = ResetSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        otp: fieldErrors.otp,
        newPassword: fieldErrors.newPassword,
        confirmPassword: fieldErrors.confirmPassword,
      },
    };
  }

  const { email, otp, newPassword } = parsed.data;

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    return { error: "Invalid OTP or email. Please try again." };
  }

  // Find valid OTP
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
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
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return { success: true };
}
