import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string) {
  const from = process.env.SMTP_USER || "support@rokadd.in";

  await transporter.sendMail({
    from: `"Rokadd" <${from}>`,
    to,
    subject: "Your OTP for Password Change — Rokadd",
    html: otpEmailHtml("Password Change Verification", "You requested to change your password. Use the OTP below to verify:", otp),
  });
}

export async function sendPasswordResetOtpEmail(to: string, otp: string) {
  const from = process.env.SMTP_USER || "support@rokadd.in";

  await transporter.sendMail({
    from: `"Rokadd" <${from}>`,
    to,
    subject: "Password Reset OTP — Rokadd",
    html: otpEmailHtml("Password Reset", "We received a request to reset your password. Use the OTP below to proceed:", otp),
  });
}

function otpEmailHtml(heading: string, message: string, otp: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e293b; font-size: 24px; margin: 0;">Rokadd</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">${heading}</p>
      </div>
      <div style="background: white; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
        <p style="color: #334155; font-size: 14px; margin: 0 0 16px;">
          ${message}
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #eef2ff; border: 2px dashed #6366f1; border-radius: 8px; padding: 16px 32px; letter-spacing: 8px; font-size: 32px; font-weight: bold; color: #4f46e5;">
            ${otp}
          </div>
        </div>
        <p style="color: #64748b; font-size: 13px; margin: 16px 0 0; text-align: center;">
          This OTP is valid for <strong>5 minutes</strong>.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 16px 0 0; text-align: center;">
          If you did not request this, please ignore this email.
        </p>
      </div>
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 24px;">
        &copy; ${new Date().getFullYear()} Rokadd. All rights reserved.
      </p>
    </div>
  `;
}
