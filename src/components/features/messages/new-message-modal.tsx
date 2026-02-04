"use client";

import { useState, useEffect } from "react";
import {
  X,
  Send,
  Loader2,
  Smartphone,
  User,
  FileText,
  MessageSquare,
} from "lucide-react";
import {
  DeviceViewModel,
  Contact,
  MessageTemplate,
} from "@/types/database.types";

interface NewMessageModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function NewMessageModal({ onClose, onSuccess }: NewMessageModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Data Lists
  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  // Form State
  const [selectedDevice, setSelectedDevice] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Fetch Data (Devices, Contacts, Templates) saat modal dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, conRes, tplRes] = await Promise.all([
          fetch("/api/devices"),
          fetch("/api/contacts"),
          fetch("/api/templates"),
        ]);

        const devJson = await devRes.json();
        const conJson = await conRes.json();
        const tplJson = await tplRes.json();

        if (devJson.success) {
          // Hanya ambil device yang CONNECTED/AUTHENTICATED
          const activeDevices = devJson.data.filter(
            (d: any) => d.status === "AUTHENTICATED",
          );
          setDevices(activeDevices);
          // Auto select jika hanya ada 1 device
          if (activeDevices.length === 1)
            setSelectedDevice(activeDevices[0].id);
        }
        if (conJson.success) setContacts(conJson.data);
        if (tplJson.success) setTemplates(tplJson.data);
      } catch (err) {
        console.error("Failed to fetch initial data", err);
        setError("Failed to load required data. Please check your connection.");
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tplId = e.target.value;
    if (!tplId) return;

    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setMessage(tpl.content);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !toNumber || !message) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: selectedDevice,
          toNumber: toNumber.replace(/\D/g, ""), // Bersihkan nomor dari karakter non-digit
          message: message,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to send message");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-bold text-xl">New Message</h3>
            <p className="text-sm text-muted-foreground">
              Send a WhatsApp message instantly.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading resources...
              </p>
            </div>
          ) : (
            <form
              id="message-form"
              onSubmit={handleSubmit}
              className="space-y-5">
              {/* Device Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Smartphone size={16} className="text-muted-foreground" />{" "}
                  Sender Device
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  required>
                  <option value="">-- Select Active Device --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone_number})
                    </option>
                  ))}
                </select>
                {devices.length === 0 && (
                  <p className="text-xs text-red-500">
                    No authenticated devices found. Please connect a device
                    first.
                  </p>
                )}
              </div>

              {/* Recipient Input with Datalist */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} className="text-muted-foreground" /> Recipient
                  Number
                </label>
                <input
                  list="contacts-list"
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Type number or search contact..."
                  value={toNumber}
                  onChange={(e) => setToNumber(e.target.value)}
                  required
                  autoComplete="off"
                />
                <datalist id="contacts-list">
                  {contacts.map((c) => (
                    <option key={c.id} value={c.phone_number}>
                      {c.name} ({c.phone_number})
                    </option>
                  ))}
                </datalist>
                <p className="text-xs text-muted-foreground">
                  Example: 628123456789
                </p>
              </div>

              {/* Template Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText size={16} className="text-muted-foreground" /> Use
                  Template (Optional)
                </label>
                <select
                  className="w-full px-4 py-2 rounded-xl bg-muted/30 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                  onChange={handleTemplateChange}
                  defaultValue="">
                  <option value="" disabled>
                    -- Load a Template --
                  </option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message Textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare size={16} className="text-muted-foreground" />{" "}
                  Message
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all min-h-[120px] resize-none"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            disabled={loading}>
            Cancel
          </button>
          <button
            form="message-form"
            type="submit"
            disabled={loading || fetching || !selectedDevice}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2 disabled:opacity-50">
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Send Now
          </button>
        </div>
      </div>
    </div>
  );
}
