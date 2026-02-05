"use client";

import { useState, useEffect } from "react";
import { AutoResponseRule } from "@/types/database.types";
import { Trash2, Edit2, Plus, MessageSquare, Zap } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AutoResponseListProps {
  deviceId: string;
}

export function AutoResponseList({ deviceId }: AutoResponseListProps) {
  const [rules, setRules] = useState<AutoResponseRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    keyword: "",
    response: "",
    priority: 0,
    isActive: true,
  });

  const fetchRules = async () => {
    const res = await fetch(`/api/auto-response?deviceId=${deviceId}`);
    const json = await res.json();
    if (json.success) setRules(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, [deviceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId
      ? `/api/auto-response/${editingId}`
      : "/api/auto-response";
    const method = editingId ? "PATCH" : "POST";
    const body = editingId ? formData : { ...formData, deviceId };

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    closeModal();
    fetchRules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    await fetch(`/api/auto-response/${id}`, { method: "DELETE" });
    fetchRules();
  };

  const openModal = (rule?: AutoResponseRule) => {
    if (rule) {
      setEditingId(rule.id);
      setFormData({
        keyword: rule.keyword,
        response: rule.response,
        priority: rule.priority,
        isActive: rule.is_active,
      });
    } else {
      setEditingId(null);
      setFormData({ keyword: "", response: "", priority: 0, isActive: true });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  if (loading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Zap className="text-yellow-500" size={20} /> Auto-Reply Rules
          </h3>
          <p className="text-sm text-muted-foreground">
            Configure automated responses for incoming messages.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5">
          <Plus size={16} /> Add Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.length === 0 && (
          <div className="text-center py-12 glass-card rounded-2xl">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">
              No auto-reply rules configured.
            </p>
          </div>
        )}
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="glass-card p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start gap-4 group hover:border-primary/30 transition-all">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sm font-bold bg-muted px-3 py-1 rounded-lg border border-border text-foreground">
                  {rule.keyword}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border",
                    rule.is_active
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : "bg-gray-500/10 text-gray-500 border-gray-500/20",
                  )}>
                  {rule.is_active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted/30 px-2 py-0.5 rounded-md">
                  Priority: {rule.priority}
                </span>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-1 border-l-2 border-primary/20">
                {rule.response}
              </p>
            </div>

            <div className="flex gap-2 self-start sm:self-center opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openModal(rule)}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => handleDelete(rule.id)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-xl mb-1">
              {editingId ? "Edit Rule" : "New Rule"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Define keyword triggers and responses.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Keyword Trigger
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={formData.keyword}
                  onChange={(e) =>
                    setFormData({ ...formData, keyword: e.target.value })
                  }
                  placeholder="e.g. !help, info"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Response Message
                </label>
                <textarea
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 h-32 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  value={formData.response}
                  onChange={(e) =>
                    setFormData({ ...formData, response: e.target.value })
                  }
                  placeholder="Enter the automated reply..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Priority
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div
                      className={cn(
                        "w-12 h-6 rounded-full p-1 transition-colors duration-200 flex items-center",
                        formData.isActive ? "bg-primary" : "bg-muted",
                      )}>
                      <div
                        className={cn(
                          "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
                          formData.isActive ? "translate-x-6" : "translate-x-0",
                        )}
                      />
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                    />
                    <span className="text-sm font-medium group-hover:text-foreground transition-colors">
                      Active
                    </span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-muted-foreground font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
