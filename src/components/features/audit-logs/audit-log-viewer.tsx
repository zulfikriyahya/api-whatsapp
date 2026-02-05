"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/ui/data-table";
import { AuditLog } from "@/types/database.types";
import { format } from "date-fns";
import { Eye, Clock, Activity, Server } from "lucide-react";

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await fetch(`/api/audit-logs?page=${page}&limit=20`);
    const json = await res.json();
    if (json.success) {
      setLogs(json.data);
      setTotal(json.meta?.pagination?.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const columns = [
    {
      header: "Timestamp",
      cell: (row: AuditLog) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <Clock size={14} />
          {format(new Date(row.created_at), "MMM d, HH:mm:ss")}
        </div>
      ),
    },
    {
      header: "Action",
      accessorKey: "action" as keyof AuditLog,
      cell: (row: AuditLog) => (
        <span className="font-semibold text-foreground">{row.action}</span>
      ),
    },
    {
      header: "Entity",
      cell: (row: AuditLog) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-muted text-xs font-medium text-muted-foreground uppercase">
            {row.entity_type}
          </span>
          <span className="text-xs font-mono text-muted-foreground opacity-70">
            {row.entity_id ? row.entity_id.substring(0, 8) : "-"}
          </span>
        </div>
      ),
    },
    {
      header: "IP Address",
      accessorKey: "ip_address" as keyof AuditLog,
      cell: (row: AuditLog) => (
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Server size={12} />
          {row.ip_address || "N/A"}
        </div>
      ),
    },
    {
      header: "Details",
      className: "text-right",
      cell: (row: AuditLog) => (
        <div className="flex justify-end">
          <button
            onClick={() => setSelectedLog(row)}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable data={logs} columns={columns} isLoading={loading} />

      <div className="flex justify-between items-center text-sm pt-4 border-t border-border/50">
        <div className="text-muted-foreground">
          Total: <span className="font-bold text-foreground">{total}</span> logs
        </div>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
            Previous
          </button>
          <button
            disabled={logs.length < 20}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
            Next
          </button>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="text-blue-500" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Log Details</h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {selectedLog.id}
                </p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Action
                  </label>
                  <p className="font-medium text-foreground">
                    {selectedLog.action}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    User Agent
                  </label>
                  <p
                    className="text-sm text-muted-foreground truncate"
                    title={selectedLog.user_agent || ""}>
                    {selectedLog.user_agent || "-"}
                  </p>
                </div>
              </div>

              {selectedLog.old_value && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Old
                    Value
                  </label>
                  <pre className="rounded-xl bg-slate-950 text-slate-50 p-4 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-green-500 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" /> New
                    Value
                  </label>
                  <pre className="rounded-xl bg-slate-950 text-slate-50 p-4 text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
