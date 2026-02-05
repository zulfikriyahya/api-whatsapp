import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { queryOne, query } from "@/lib/db";
import { UserRole } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      try {
        const existing: any = await queryOne(
          "SELECT * FROM users WHERE email = ?",
          [user.email],
        );

        if (!existing) {
          await query(
            "INSERT INTO users (id, email, name, role, is_active) VALUES (?, ?, ?, ?, true)",
            [uuidv4(), user.email, user.name || "User", UserRole.USER_A],
          );
        } else if (!existing.is_active) {
          return false;
        }
        return true;
      } catch (e) {
        console.error("SignIn Error:", e);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser: any = await queryOne(
          "SELECT id, role FROM users WHERE email = ?",
          [user.email],
        );
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
