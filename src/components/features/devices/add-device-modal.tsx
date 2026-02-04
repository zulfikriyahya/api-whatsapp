"use client";

import { useState } from "react";
import { X, Smartphone, Loader2, Phone } from "lucide-react";

interface AddDeviceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddDeviceModal({ onClose, onSuccess }: AddDeviceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to add device");
      }

      // Berhasil
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
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-bold text-xl">Add New Device</h3>
            <p className="text-sm text-muted-foreground">
              Register a WhatsApp number.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Smartphone size={16} className="text-muted-foreground" /> Device
              Name
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g. Sales CS 1"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone size={16} className="text-muted-foreground" /> Phone Number
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="e.g. 62812345678"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  phoneNumber: e.target.value.replace(/\D/g, ""),
                })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter number with country code (e.g., 62 for Indonesia).
            </p>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all flex items-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Device
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
