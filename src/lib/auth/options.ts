// src/lib/auth/options.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { query, queryOne } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "@/types/database.types";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const existingUser: any = await queryOne(
            "SELECT * FROM users WHERE email = ?",
            [user.email],
          );

          if (existingUser) {
            if (!existingUser.is_active) {
              return false;
            }
            return true;
          }

          const userId = uuidv4();
          await query(
            `INSERT INTO users (id, email, name, role, is_active, mfa_enabled)
             VALUES (?, ?, ?, ?, true, false)`,
            [userId, user.email, user.name, UserRole.USER_A],
          );

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser: any = await queryOne(
          "SELECT id, email, name, role, mfa_enabled FROM users WHERE email = ?",
          [user.email],
        );

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.mfaEnabled = dbUser.mfa_enabled;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.mfaEnabled = token.mfaEnabled as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
