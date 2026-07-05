import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        if (!email || !password) return null;

        // Check Super Admin first
        const superAdmin = await prisma.superAdmin.findUnique({
          where: { email },
        });
        if (superAdmin) {
          const isValid = await bcrypt.compare(password, superAdmin.password);
          if (!isValid) return null;
          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            isSuperAdmin: true,
            shopMembers: [],
          } as any;
        }

        // Normal user login
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            shopMembers: {
              where: { isActive: true },
              include: { shop: true, permissions: true },
            },
          },
        });
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: false,
          shopMembers: user.shopMembers.map((m) => ({
            id: m.id,
            shopId: m.shopId,
            shopName: m.shop.name,
            shopSlug: m.shop.slug,
            role: m.role,
            managerId: m.managerId,
            permissions: m.permissions,
          })),
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.userId = u.id;
        token.isSuperAdmin = u.isSuperAdmin || false;
        token.shopMembers = u.shopMembers || [];
      }
      return token;
    },
    session({ session, token }) {
      (session.user as any).id = token.userId;
      (session.user as any).isSuperAdmin = token.isSuperAdmin;
      (session.user as any).shopMembers = token.shopMembers;
      return session;
    },
  },
});
