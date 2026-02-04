import { UserManagement } from "@/components/features/admin/user-management";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          User Administration
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage system users, roles and access.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <UserManagement />
      </div>
    </div>
  );
}
