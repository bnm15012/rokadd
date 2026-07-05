"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (!email || typeof email !== "string" || !email.trim()) {
    return { error: "Email is required." };
  }
  if (!password || typeof password !== "string" || !password) {
    return { error: "Password is required." };
  }

  try {
    await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password. Please try again." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    // Re-throw NEXT_REDIRECT so Next.js can handle it
    throw err;
  }

  redirect("/dashboard");
}
