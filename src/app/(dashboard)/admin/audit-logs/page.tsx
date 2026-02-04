import { AuditLogViewer } from "@/components/features/audit-logs/audit-log-viewer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { UserRole } from "@/types/database.types";
import { redirect } from "next/navigation";

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.DST)
  ) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          System Audit Logs
        </h2>
        <p className="text-muted-foreground mt-1">
          Track system activities and security events.
        </p>
      </div>

      <div className="glass-card rounded-2xl p-6 shadow-sm">
        <AuditLogViewer />
      </div>
    </div>
  );
}
