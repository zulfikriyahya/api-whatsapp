"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { User } from "@/types/database.types";
import { format } from "date-fns";
import { Shield, Ban, CheckCircle, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users?limit=50");
    const json = await res.json();
    if (json.success) setUsers(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (user: User) => {
    const newStatus = !user.is_active;
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: newStatus }),
    });
    fetchUsers();
  };

  const columns = [
    {
      header: "User",
      cell: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
            {user.name?.[0]?.toUpperCase() || <UserIcon size={16} />}
          </div>
          <div>
            <div className="font-semibold text-foreground">{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      cell: (user: User) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border",
            user.role === "ADMIN"
              ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
              : "bg-blue-500/10 text-blue-600 border-blue-500/20",
          )}
        >
          <Shield size={12} /> {user.role}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (user: User) => (
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
            user.is_active
              ? "bg-green-500/10 text-green-600 border-green-500/20"
              : "bg-red-500/10 text-red-600 border-red-500/20",
          )}
        >
          {user.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Joined",
      cell: (user: User) => (
        <span className="text-sm text-muted-foreground font-mono">
          {format(new Date(user.created_at), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (user: User) => (
        <div className="flex justify-end">
          <button
            onClick={() => toggleStatus(user)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              user.is_active
                ? "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20"
                : "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
            )}
          >
            {user.is_active ? (
              <>
                <Ban size={14} /> Deactivate
              </>
            ) : (
              <>
                <CheckCircle size={14} /> Activate
              </>
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-border/50">
        <div className="text-sm font-medium text-muted-foreground">
          Total Users:{" "}
          <span className="text-foreground font-bold">{users.length}</span>
        </div>
      </div>
      <DataTable data={users} columns={columns} isLoading={loading} />
    </div>
  );
}
