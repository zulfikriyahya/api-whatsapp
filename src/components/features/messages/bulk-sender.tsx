"use client";

import { useState, useEffect } from "react";
import {
  DeviceViewModel,
  Contact,
  MessageTemplate,
} from "@/types/database.types";
import { Send, Users, FileText, Loader2, Tag, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function BulkSender() {
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: string; text: string } | null>(
    null,
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/devices").then((r) => r.json()),
      fetch("/api/contacts").then((r) => r.json()),
      fetch("/api/templates").then((r) => r.json()),
    ]).then(([d, c, t]) => {
      if (d.success)
        setDevices(d.data.filter((dev: any) => dev.status === "AUTHENTICATED"));
      if (c.success) setContacts(c.data);
      if (t.success) setTemplates(t.data);
    });
  }, []);

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags || [])));

  const filteredContacts =
    selectedTags.length > 0
      ? contacts.filter(
          (c) => c.tags && c.tags.some((tag) => selectedTags.includes(tag)),
        )
      : [];

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tpl = templates.find((t) => t.id === e.target.value);
    if (tpl) setMessage(tpl.content);
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSend = async () => {
    if (!selectedDevice || filteredContacts.length === 0 || !message) return;

    setLoading(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: selectedDevice,
          contacts: filteredContacts.map((c) => ({
            phoneNumber: c.phone_number,
            name: c.name,
          })),
          message: message,
          useRoundRobin: false,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatus({
          type: "success",
          text: `Successfully queued ${json.data.queued} messages`,
        });
        setMessage("");
        setSelectedTags([]);
      } else {
        setStatus({
          type: "error",
          text: json.error?.message || "Failed to send",
        });
      }
    } catch (e) {
      setStatus({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-8">
        <div className="glass-card p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-border pb-4">
            <Users size={20} className="text-primary" /> Target Audience
          </h3>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 flex items-center gap-2">
              <Tag size={14} className="text-muted-foreground" /> Filter by Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200",
                    selectedTags.includes(tag)
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-background border-input text-muted-foreground hover:bg-muted hover:border-border",
                  )}
                >
                  {tag}
                </button>
              ))}
              {allTags.length === 0 && (
                <span className="text-sm text-muted-foreground italic">
                  No tags found in contacts.
                </span>
              )}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center justify-between">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Total Recipients
            </span>
            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {filteredContacts.length}
            </span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl shadow-sm">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-border pb-4">
            <FileText size={20} className="text-primary" /> Message Content
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Load Template
            </label>
            <select
              className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              onChange={handleTemplateSelect}
            >
              <option value="">-- Select Template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <textarea
            className="w-full rounded-xl bg-muted/50 border border-input px-4 py-3 h-48 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-mono resize-none"
            placeholder="Type your broadcast message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            {["{{name}}", "{{phone}}"].map((v) => (
              <span
                key={v}
                className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground font-mono cursor-pointer hover:text-foreground transition-colors"
                onClick={() => setMessage((prev) => prev + v)}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <div className="glass-card p-6 rounded-2xl shadow-sm h-full flex flex-col">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 border-b border-border pb-4">
            <Send size={20} className="text-primary" /> Configuration
          </h3>

          <div className="mb-8">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Smartphone size={14} className="text-muted-foreground" /> Sender
              Device
            </label>
            <select
              className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <option value="">-- Select Active Device --</option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.phone_number})
                </option>
              ))}
            </select>
            {devices.length === 0 && (
              <p className="text-xs text-red-500 mt-2 font-medium">
                No active devices found. Please connect a device first.
              </p>
            )}
          </div>

          {status && (
            <div
              className={cn(
                "p-4 rounded-xl mb-6 text-sm font-medium border animate-in fade-in zoom-in-95",
                status.type === "success"
                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                  : "bg-red-500/10 text-red-600 border-red-500/20",
              )}
            >
              {status.text}
            </div>
          )}

          <div className="mt-auto">
            <button
              onClick={handleSend}
              disabled={
                loading ||
                filteredContacts.length === 0 ||
                !selectedDevice ||
                !message
              }
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex justify-center items-center gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
              Send Broadcast
            </button>
            <p className="text-xs text-center text-muted-foreground mt-4">
              Messages will be queued and sent sequentially to avoid spam
              detection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
