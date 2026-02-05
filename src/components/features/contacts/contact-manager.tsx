"use client";

import { useState, useEffect, useRef } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Contact } from "@/types/database.types";
import {
  Plus,
  Trash2,
  Upload,
  User,
  Phone,
  Tag,
  Loader2,
  Mail,
  Download,
  MoreHorizontal,
  Edit,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [isAllSelected, setIsAllSelected] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    tags: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
      const json = await res.json();
      if (json.success) setContacts(json.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  // Handle Select All
  useEffect(() => {
    if (isAllSelected) {
      const newSelection: Record<string, boolean> = {};
      contacts.forEach((c) => (newSelection[c.id] = true));
      setSelectedRows(newSelection);
    } else {
      // Hanya reset jika trigger dari checkbox header, bukan update manual row
      if (
        Object.keys(selectedRows).length === contacts.length &&
        contacts.length > 0
      ) {
        setSelectedRows({});
      }
    }
  }, [isAllSelected]);

  // Handle manual row selection update to sync header checkbox
  useEffect(() => {
    const selectedCount = Object.values(selectedRows).filter(Boolean).length;
    if (selectedCount === contacts.length && contacts.length > 0) {
      setIsAllSelected(true);
    } else if (selectedCount < contacts.length) {
      setIsAllSelected(false);
    }
  }, [selectedRows, contacts.length]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create");

      setShowModal(false);
      setFormData({ name: "", phoneNumber: "", email: "", tags: "" });
      fetchContacts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    const ids = Object.keys(selectedRows).filter((k) => selectedRows[k]);
    if (ids.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${ids.length} contacts? This action cannot be undone.`,
      )
    )
      return;

    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?ids=${ids.join(",")}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.success) {
        setSelectedRows({});
        setIsAllSelected(false);
        fetchContacts();
      } else {
        alert("Failed to delete contacts");
      }
    } catch (e) {
      alert("Network error during deletion");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // CSV Template
    const csvContent =
      'data:text/csv;charset=utf-8,name,phone_number,email,tags\nJohn Doe,62812345678,john@example.com,"vip,new customer"';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "contact_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        alert(
          `Successfully imported: ${json.data.imported} contacts.\nFailed: ${json.data.failed}`,
        );
        fetchContacts();
      } else {
        alert(json.error?.message || "Import failed");
      }
    } catch (err) {
      alert("Error uploading file");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
          checked={isAllSelected}
          onChange={(e) => setIsAllSelected(e.target.checked)}
        />
      ),
      cell: (row: Contact) => (
        <input
          type="checkbox"
          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
          checked={!!selectedRows[row.id]}
          onChange={(e) =>
            setSelectedRows((prev) => ({ ...prev, [row.id]: e.target.checked }))
          }
        />
      ),
      className: "w-[50px]",
    },
    {
      header: "Avatar",
      cell: (row: Contact) => (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-sm text-blue-600 dark:text-blue-400">
          {row.name.substring(0, 1).toUpperCase()}
        </div>
      ),
      className: "w-[60px]",
    },
    {
      header: "Name",
      accessorKey: "name" as keyof Contact,
      className: "font-medium text-foreground",
    },
    {
      header: "Phone",
      cell: (row: Contact) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm">{row.phone_number}</span>
          {row.email && (
            <span className="text-[10px] text-muted-foreground">
              {row.email}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Tags",
      cell: (row: Contact) => {
        const tags = Array.isArray(row.tags) ? row.tags : [];
        return (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                {t}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (row: Contact) => (
        <div className="flex justify-end gap-2">
          <button className="p-1.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
            <Edit size={16} />
          </button>
          <button
            onClick={() => {
              if (confirm("Delete this contact?")) {
                // Single delete logic
                fetch(`/api/contacts?ids=${row.id}`, { method: "DELETE" }).then(
                  fetchContacts,
                );
              }
            }}
            className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Contacts
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your customer database
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.vcf"
            onChange={handleFileChange}
          />

          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-border hover:bg-muted transition-colors font-medium text-sm shadow-sm">
            <Download size={16} /> Template
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-border hover:bg-muted transition-colors font-medium text-sm shadow-sm">
            <Upload size={16} /> Import
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium text-sm shadow-md shadow-primary/20">
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-1 shadow-sm overflow-hidden">
        <DataTable data={contacts} columns={columns} isLoading={loading} />
      </div>

      {/* Sticky Bulk Action Bar */}
      {Object.values(selectedRows).filter(Boolean).length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 glass bg-foreground/90 text-background backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-6 shadow-2xl animate-in slide-in-from-bottom-4 border border-white/10">
          <div className="flex items-center gap-2 border-r border-white/20 pr-6">
            <span className="font-bold text-sm bg-white/20 px-2 py-0.5 rounded text-white">
              {Object.values(selectedRows).filter(Boolean).length}
            </span>
            <span className="text-sm font-medium text-white/90">Selected</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedRows({});
                setIsAllSelected(false);
              }}
              className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg shadow-red-500/30">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
              <div>
                <h3 className="text-xl font-bold">Add New Contact</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Manual entry
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm rounded-lg font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} className="text-primary" /> Full Name
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. John Doe"
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
                  <Phone size={16} className="text-primary" /> Phone Number
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. 62812345678"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  required
                />
                <p className="text-[10px] text-muted-foreground ml-1">
                  Must include country code (e.g., 62)
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail size={16} className="text-primary" /> Email Address
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="optional@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag size={16} className="text-primary" /> Tags
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="e.g. vip, new lead (comma separated)"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border/50 mt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-muted-foreground font-medium hover:bg-muted transition-colors text-sm"
                  disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 text-sm flex items-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
