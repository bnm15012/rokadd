"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { Role } from "@/generated/prisma/enums";
import { AuthError } from "next-auth";

// ---------------------------------------------------------------------------
// Schema — Zod v4 uses `error:` string for custom messages
// ---------------------------------------------------------------------------
const RegisterSchema = z.object({
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
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .max(72, { error: "Password must be at most 72 characters." })
    .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
    .regex(/[0-9]/, { error: "Password must contain at least one number." }),
  shopName: z
    .string()
    .min(2, { error: "Shop name must be at least 2 characters." })
    .max(100, { error: "Shop name must be at most 100 characters." })
    .trim(),
});

// ---------------------------------------------------------------------------
// State type
// ---------------------------------------------------------------------------
export type RegisterState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        shopName?: string[];
      };
      message?: string;
    }
  | undefined;

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------
function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueShopSlug(base: string): Promise<string> {
  let slug = toSlug(base);
  let attempt = 0;
  while (true) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`;
    const existing = await prisma.shop.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    attempt++;
  }
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------
export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  // 1. Validate
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    shopName: formData.get("shopName"),
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        name: fieldErrors.name,
        email: fieldErrors.email,
        password: fieldErrors.password,
        shopName: fieldErrors.shopName,
      },
    };
  }

  const { name, email, password, shopName } = parsed.data;

  // 2. Check if email is already taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["This email address is already registered."] } };
  }

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // 4. Build a unique shop slug
  const shopSlug = await uniqueShopSlug(shopName);

  // 5. Create User + Shop + ShopMember in a transaction; also ensure a
  //    default SubscriptionPlan exists and create a Subscription for the shop.
  await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
    // Ensure a default (free/trial) subscription plan exists
    let plan = await tx.subscriptionPlan.findFirst({
      where: { slug: "free" },
    });
    if (!plan) {
      plan = await tx.subscriptionPlan.create({
        data: {
          name: "Free Trial",
          slug: "free",
          description: "14-day free trial with core features",
          priceMonthly: 0,
          priceYearly: 0,
          maxProducts: 100,
          maxStaff: 3,
          maxShops: 1,
          features: {
            dashboard: true,
            sales: true,
            inventory: true,
            purchases: true,
            expenses: true,
            customers: true,
            vendors: true,
          },
          isActive: true,
        },
      });
    }

    // Create the user
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Create the shop
    const shop = await tx.shop.create({
      data: {
        name: shopName,
        slug: shopSlug,
        isActive: true,
      },
    });

    // Create the ShopMember (owner)
    await tx.shopMember.create({
      data: {
        userId: user.id,
        shopId: shop.id,
        role: Role.OWNER,
        isActive: true,
      },
    });

    // Create a trial Subscription for the shop
    await tx.subscription.create({
      data: {
        shopId: shop.id,
        planId: plan.id,
        status: "TRIALING",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });
  });

  // 6. Sign the user in
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        message:
          "Account created, but automatic sign-in failed. Please sign in manually.",
      };
    }
    throw err;
  }

  // 7. Redirect — called outside try/catch so NEXT_REDIRECT propagates
  redirect("/dashboard");
}
