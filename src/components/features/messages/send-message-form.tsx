"use client";

import { useState, useEffect } from "react";
import { DeviceViewModel } from "@/types/database.types";
import { Send, Loader2, Smartphone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SendMessageForm() {
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/devices")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDevices(
            data.data.filter(
              (d: DeviceViewModel) => d.status === "AUTHENTICATED",
            ),
          );
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: selectedDevice,
          toNumber: phone,
          message: message,
        }),
      });

      const json = await res.json();

      if (json.success) {
        setStatus({ type: "success", text: "Message queued successfully" });
        setMessage("");
        setPhone("");
      } else {
        setStatus({
          type: "error",
          text: json.error?.message || "Failed to send",
        });
      }
    } catch (err) {
      setStatus({ type: "error", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 shadow-sm border border-border/50">
      <h3 className="mb-6 text-xl font-bold flex items-center gap-2 border-b border-border pb-4">
        <Send className="text-primary" size={20} /> Quick Send
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium flex items-center gap-2">
            <Smartphone size={14} className="text-muted-foreground" /> Select
            Device
          </label>
          <select
            className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            required
          >
            <option value="">-- Choose a device --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.phone_number})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Phone Number
          </label>
          <input
            type="text"
            className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            placeholder="e.g. 628123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Include country code (e.g. 62)
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium flex items-center gap-2">
            <MessageSquare size={14} className="text-muted-foreground" />{" "}
            Message
          </label>
          <textarea
            className="w-full rounded-xl bg-muted/50 border border-input px-4 py-3 h-32 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        {status && (
          <div
            className={cn(
              "rounded-xl p-4 text-sm font-medium border animate-in fade-in slide-in-from-top-2",
              status.type === "success"
                ? "bg-green-500/10 text-green-600 border-green-500/20"
                : "bg-red-500/10 text-red-600 border-red-500/20",
            )}
          >
            {status.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !selectedDevice}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-3.5 text-white font-medium hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Send size={18} />
          )}
          Send Message
        </button>
      </form>
    </div>
  );
}
