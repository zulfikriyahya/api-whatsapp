"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  RefreshCw,
  Shield,
  Key,
  Check,
  Save,
  Loader2,
} from "lucide-react";
// import { cn } from "@/lib/utils/cn";

// Interface untuk Settings
interface UserPreferences {
  mfa_enabled?: boolean;
  notifications_enabled?: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function UserSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // State untuk Settings
  const [settings, setSettings] = useState<UserPreferences>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchKeys();
    fetchSettings();
  }, []);

  const fetchKeys = async () => {
    const res = await fetch("/api/api-keys");
    const json = await res.json();
    if (json.success) setApiKeys(json.data);
  };

  const fetchSettings = async () => {
    // Kita asumsikan endpoint user settings sudah ada di /api/settings
    // Jika belum ada data, default ke empty
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) setSettings(json.data || {});
    } catch (e) {
      console.error("Failed to fetch settings", e);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "user",
          settings: settings,
        }),
      });
      // Tampilkan toast success jika ada library toast
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      setSaving(false);
    }
  };

  const createKey = async () => {
    const name = prompt("Enter a name for this API Key:");
    if (!name) return;

    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await res.json();
    if (json.success) {
      setNewKey(json.data.key);
      fetchKeys();
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Revoke this API Key?")) return;
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    fetchKeys();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* SECTION 1: General Preferences */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-primary" size={20} /> General Preferences
          </h3>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-lg">Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive email alerts for new logins.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.notifications_enabled || false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications_enabled: e.target.checked,
                  })
                }
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-4">
            <div>
              <p className="font-medium text-lg">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Secure your account with OTP.
              </p>
            </div>
            {/* Di sini bisa ditambahkan logika untuk membuka modal QR MFA */}
            <button className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-medium">
              Configure
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: API Keys (Kode lama Anda) */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Key className="text-primary" size={20} /> API Keys
          </h3>
          <button
            onClick={createKey}
            className="flex items-center gap-2 bg-white dark:bg-white/5 border border-border px-4 py-2 rounded-xl hover:bg-muted transition-colors text-sm font-medium">
            <RefreshCw size={14} /> Generate New Key
          </button>
        </div>

        <div className="p-6 space-y-6">
          {newKey && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5 animate-in slide-in-from-top-2">
              <p className="mb-2 text-sm font-bold text-green-600 dark:text-green-400">
                New Key Generated!
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Copy this key now. You won't be able to see it again.
              </p>
              <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-input">
                <code className="flex-1 overflow-hidden text-ellipsis font-mono text-sm text-primary">
                  {newKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newKey)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  {copied ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-xl border border-border p-4 bg-background/50 hover:bg-background transition-colors">
                <div>
                  <p className="font-semibold">{key.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Created: {new Date(key.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full ${
                      key.is_active
                        ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                        : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                    }`}>
                    {key.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    onClick={() => deleteKey(key.id)}
                    className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline decoration-red-500/30">
                    Revoke
                  </button>
                </div>
              </div>
            ))}
            {apiKeys.length === 0 && (
              <div className="text-center py-8 text-muted-foreground italic">
                No API keys found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
