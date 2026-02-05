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
  Bell,
  Lock,
  Globe,
} from "lucide-react";
import { format } from "date-fns";

interface UserPreferences {
  notifications_enabled?: boolean;
  mfa_enabled?: boolean;
  timezone?: string;
  theme?: "light" | "dark" | "system";
}

interface ApiKey {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  last_used?: string;
}

export function UserSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<UserPreferences>({});
  const [saving, setSaving] = useState(false);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchKeys();
    fetchSettings();
  }, []);

  const fetchKeys = async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/api-keys");
      const json = await res.json();
      if (json.success) setApiKeys(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingKeys(false);
    }
  };

  const fetchSettings = async () => {
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
      // Optional: Add toast notification here
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      setSaving(false);
    }
  };

  const createKey = async () => {
    const name = prompt(
      "Enter a name for this API Key (e.g. Zapier Integration):",
    );
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

  const revokeKey = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API Key? Any application using it will stop working.",
      )
    )
      return;
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    fetchKeys();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      {/* SECTION 1: General Preferences */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Shield className="text-primary" size={20} /> General Preferences
          </h3>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-medium text-sm shadow-lg shadow-primary/20 disabled:opacity-50 hover:-translate-y-0.5">
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Notifications */}
          <div className="flex items-center justify-between pb-6 border-b border-border/50">
            <div className="flex gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600 h-fit">
                <Bell size={20} />
              </div>
              <div>
                <p className="font-semibold text-lg">Email Notifications</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Receive email alerts for new logins, failed message queues,
                  and system updates.
                </p>
              </div>
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
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* MFA */}
          <div className="flex items-center justify-between pb-6 border-b border-border/50">
            <div className="flex gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 h-fit">
                <Lock size={20} />
              </div>
              <div>
                <p className="font-semibold text-lg">
                  Two-Factor Authentication
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Secure your account with TOTP (Google Authenticator/Authy).
                </p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors">
              Configure
            </button>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl text-green-600 h-fit">
                <Globe size={20} />
              </div>
              <div>
                <p className="font-semibold text-lg">Timezone</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Set your local timezone for accurate reporting and scheduling.
                </p>
              </div>
            </div>
            <select
              className="px-4 py-2 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              value={
                settings.timezone ||
                Intl.DateTimeFormat().resolvedOptions().timeZone
              }
              onChange={(e) =>
                setSettings({ ...settings, timezone: e.target.value })
              }>
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 2: API Keys Management */}
      <div className="glass-card rounded-2xl overflow-hidden shadow-sm border border-border">
        <div className="p-6 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Key className="text-primary" size={20} /> API Keys
          </h3>
          <button
            onClick={createKey}
            className="flex items-center gap-2 bg-white dark:bg-white/5 border border-border px-4 py-2 rounded-xl hover:bg-muted transition-colors text-sm font-medium hover:shadow-sm">
            <RefreshCw size={14} /> Generate New Key
          </button>
        </div>

        <div className="p-6 space-y-6">
          {newKey && (
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5 animate-in slide-in-from-top-2 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500 rounded-full text-white mt-1">
                  <Check size={16} />
                </div>
                <div className="flex-1">
                  <p className="mb-2 text-base font-bold text-green-700 dark:text-green-400">
                    New API Key Generated!
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Please copy this key immediately. For security reasons, it
                    will not be shown again.
                  </p>
                  <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-input shadow-inner">
                    <code className="flex-1 overflow-hidden text-ellipsis font-mono text-sm text-primary font-bold">
                      {newKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newKey)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg"
                      title="Copy to clipboard">
                      {copied ? (
                        <Check size={18} className="text-green-500" />
                      ) : (
                        <Copy size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {loadingKeys ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-muted rounded-xl">
                <Key className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">
                  No API keys found. Create one to integrate external apps.
                </p>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border p-4 bg-background/50 hover:bg-background transition-colors group">
                  <div className="mb-3 sm:mb-0">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">{key.name}</p>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${key.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-gray-500/10 text-gray-500 border-gray-500/20"}`}>
                        {key.is_active ? "Active" : "Revoked"}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground font-mono">
                      <span>
                        Created:{" "}
                        {format(new Date(key.created_at), "MMM d, yyyy")}
                      </span>
                      {key.last_used && (
                        <span>
                          Last Used:{" "}
                          {format(new Date(key.last_used), "MMM d, HH:mm")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg transition-colors">
                      Revoke
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
