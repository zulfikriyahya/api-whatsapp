"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Message, MessageStatus } from "@/types/database.types";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { RefreshCcw, Search } from "lucide-react";

// Update Interface Props
interface MessageListProps {
  refreshTrigger?: number;
}

export function MessageList({ refreshTrigger = 0 }: MessageListProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchMessages = async () => {
    // setLoading(true); // Opsional: disable agar tidak flash saat auto-refresh
    try {
      let url = `/api/messages?page=${page}&limit=10`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setMessages(json.data);
        setTotal(json.meta?.pagination?.total || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Effect untuk refresh trigger & pagination
  useEffect(() => {
    fetchMessages();
  }, [page, refreshTrigger]); // Hapus 'search' dari sini jika ingin search hanya via tombol/enter

  // Effect khusus untuk debounce search (opsional) atau search on enter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) fetchMessages();
      else setPage(1); // Ini akan trigger effect pertama
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const columns = [
    {
      header: "Date",
      cell: (row: Message) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground">
            {format(new Date(row.created_at), "MMM d")}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {format(new Date(row.created_at), "HH:mm")}
          </span>
        </div>
      ),
    },
    {
      header: "Device",
      cell: (row: any) => (
        <span
          className="text-xs text-muted-foreground max-w-[100px] truncate block"
          title={row.device_name}>
          {row.device_name || "Unknown"}
        </span>
      ),
    },
    {
      header: "To",
      accessorKey: "to_number" as keyof Message,
      className: "font-mono text-xs",
    },
    {
      header: "Message",
      cell: (row: Message) => (
        <span
          className="block max-w-[200px] md:max-w-xs truncate text-sm text-foreground/80"
          title={row.message}>
          {row.message}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row: Message) => {
        const colors: Record<string, string> = {
          [MessageStatus.PENDING]:
            "text-yellow-600 bg-yellow-500/10 border-yellow-500/20",
          [MessageStatus.QUEUED]:
            "text-orange-600 bg-orange-500/10 border-orange-500/20",
          [MessageStatus.SENDING]:
            "text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse",
          [MessageStatus.SENT]:
            "text-blue-600 bg-blue-600/10 border-blue-600/20",
          [MessageStatus.DELIVERED]:
            "text-indigo-600 bg-indigo-600/10 border-indigo-600/20",
          [MessageStatus.READ]:
            "text-green-600 bg-green-600/10 border-green-600/20",
          [MessageStatus.FAILED]:
            "text-red-600 bg-red-600/10 border-red-600/20",
        };
        const colorClass =
          colors[row.status] ||
          "text-gray-600 bg-gray-500/10 border-gray-500/20";
        return (
          <span
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border",
              colorClass,
            )}>
            {row.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar & Manual Refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/50 border border-input text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={fetchMessages}
          className="p-2 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground"
          title="Refresh">
          <RefreshCcw size={18} />
        </button>
      </div>

      <DataTable data={messages} columns={columns} isLoading={loading} />

      {/* Pagination */}
      <div className="flex justify-between items-center pt-2">
        <p className="text-xs text-muted-foreground">Total: {total} messages</p>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
          </button>
          <button
            disabled={messages.length < 10}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
