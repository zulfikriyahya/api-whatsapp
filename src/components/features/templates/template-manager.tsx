"use client";

import { useState, useEffect } from "react";
import { MessageTemplate } from "@/types/database.types";
import { Plus, Trash2, Edit2, FileText, Code } from "lucide-react";

export function TemplateManager() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MessageTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    const res = await fetch("/api/templates");
    const json = await res.json();
    if (json.success) setTemplates(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/templates/${editing.id}` : "/api/templates";
    const method = editing ? "PATCH" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });

    closeModal();
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete template?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  };

  const openModal = (tpl?: MessageTemplate) => {
    if (tpl) {
      setEditing(tpl);
      setName(tpl.name);
      setContent(tpl.content);
    } else {
      setEditing(null);
      setName("");
      setContent("");
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  if (loading)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-muted/20 animate-pulse" />
        ))}
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Message Templates
          </h2>
          <p className="text-muted-foreground mt-1">
            Create reusable message patterns
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium"
        >
          <Plus size={18} /> New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="glass-card rounded-2xl p-6 flex flex-col group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText size={100} />
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText size={16} />
                </span>
                {tpl.name}
              </h3>

              <div className="flex-grow bg-muted/50 rounded-xl p-3 mb-4 text-sm text-muted-foreground whitespace-pre-wrap font-mono border border-border">
                {tpl.content}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <button
                  onClick={() => openModal(tpl)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold">
                {editing ? "Edit Template" : "New Template"}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome Message"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex justify-between">
                  Content
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Code size={12} /> Supports {"{{variables}}"}
                  </span>
                </label>
                <textarea
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-3 h-40 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm resize-none"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hello {{name}}, welcome to our service!"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-muted-foreground font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
