"use client";

import { useState } from "react";
import {
  Plus,
  Eye,
  Image as ImageIcon,
  FileText,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";

interface StatusItem {
  id: number;
  text: string;
  time: Date;
  views: number;
  type: "text" | "image" | "video";
  mediaUrl?: string;
}

export default function StatusPage() {
  const [statuses, setStatuses] = useState<StatusItem[]>([
    // Contoh data awal (nantinya fetch API)
    {
      id: 1,
      text: "Special Offer Today!",
      time: new Date(Date.now() - 1000 * 60 * 10),
      views: 24,
      type: "text",
    },
    {
      id: 2,
      text: "Product Launch.jpg",
      time: new Date(Date.now() - 1000 * 60 * 60),
      views: 56,
      type: "image",
    },
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-gradient">
          WhatsApp Status
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage and post status updates to your connected devices.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Add New Status Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center border-dashed border-2 border-primary/20 cursor-pointer hover:bg-primary/5 hover:border-primary/50 transition-all group h-[200px]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform">
            <Plus size={28} />
          </div>
          <h3 className="font-bold text-foreground">Add New Status</h3>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Post text or media to all active devices
          </p>
        </div>

        {/* Status Cards */}
        {statuses.map((status) => (
          <div
            key={status.id}
            className="glass-card p-5 rounded-2xl relative overflow-hidden group h-[200px] flex flex-col justify-between hover:shadow-lg transition-all border border-white/10">
            <div className="flex justify-between items-start">
              <div
                className={`p-2 rounded-xl ${
                  status.type === "text"
                    ? "bg-blue-500/10 text-blue-600"
                    : "bg-purple-500/10 text-purple-600"
                }`}>
                {status.type === "text" ? (
                  <FileText size={20} />
                ) : (
                  <ImageIcon size={20} />
                )}
              </div>
              <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div className="flex-1 flex items-center">
              <h3 className="font-bold text-lg line-clamp-2 leading-tight">
                {status.text}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
              <span>{format(status.time, "HH:mm")}</span>
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Eye size={14} /> {status.views}
              </div>
            </div>

            {/* Decorative background blur */}
            <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}
