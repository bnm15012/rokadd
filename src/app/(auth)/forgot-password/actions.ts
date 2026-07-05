"use server";

import * as z from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetOtpEmail } from "@/lib/email";

export type ForgotPasswordState =
  | {
      success?: boolean;
      error?: string;
      errors?: { email?: string[] };
    }
  | undefined;

const EmailSchema = z.object({
  email: z
    .string()
    .email({ error: "Please enter a valid email address." })
    .trim()
    .toLowerCase(),
});

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const raw = { email: formData.get("email") };
  const parsed = EmailSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return { errors: { email: fieldErrors.email } };
  }

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    // Don't reveal whether the email exists
    return { success: true };
  }

  // Rate-limit: 1 OTP per 60 seconds per email
  const recentOtp = await prisma.otp.findFirst({
    where: {
      email,
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
    where: { email, used: false },
    data: { used: true },
  });

  // Save OTP
  await prisma.otp.create({
    data: { email, code, expiresAt },
  });

  // Send email
  try {
    await sendPasswordResetOtpEmail(email, code);
  } catch {
    return { error: "Failed to send OTP email. Please try again later." };
  }

  return { success: true };
}
