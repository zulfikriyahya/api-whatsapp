import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { UserRole } from "@/types/database.types";

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.user.role as UserRole)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getSession() {
  return getServerSession(authOptions);
}
