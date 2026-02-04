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
  // Download,
} from "lucide-react";

export function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // State untuk form
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "", // Ubah jadi camelCase sesuai schema Zod
    email: "",
    tags: "",
  });

  // Ref untuk input file import
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
          phoneNumber: formData.phoneNumber, // Kirim camelCase
          email: formData.email,
          tags: formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        // Tampilkan detail error jika ada
        const msg =
          json.error?.details?.validationErrors?.[0]?.message ||
          json.error?.message ||
          "Failed to create contact";
        throw new Error(msg);
      }

      setShowModal(false);
      setFormData({ name: "", phoneNumber: "", email: "", tags: "" });
      fetchContacts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await fetch(`/api/contacts?ids=${id}`, { method: "DELETE" });
    fetchContacts();
  };

  // Handler untuk Import CSV/VCF
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true); // Tampilkan loading di tabel
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        alert(`Imported: ${json.data.imported}, Failed: ${json.data.failed}`);
        fetchContacts();
      } else {
        alert(json.error?.message || "Import failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading file");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  const columns = [
    {
      header: "Name",
      accessorKey: "name" as keyof Contact,
      className: "font-medium",
    },
    {
      header: "Phone",
      cell: (row: Contact) => (
        <span className="font-mono text-muted-foreground text-sm">
          {row.phone_number}
        </span>
      ),
    },
    {
      header: "Tags",
      cell: (row: Contact) => {
        // PERBAIKAN: Pastikan tags adalah array sebelum di-map
        // Gunakan (row.tags || []) atau Array.isArray(row.tags) ? row.tags : []
        const tags = Array.isArray(row.tags) ? row.tags : [];

        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
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
        <div className="flex justify-end">
          <button
            onClick={() => handleDelete(row.id)}
            className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gradient">
            Contacts
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your audience list
          </p>
        </div>
        <div className="flex gap-3">
          {/* Hidden File Input for Import */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.vcf"
            onChange={handleFileChange}
          />

          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-border hover:bg-muted transition-colors font-medium text-sm">
            <Upload size={16} /> Import CSV
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-medium text-sm">
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-1 shadow-sm">
        <DataTable data={contacts} columns={columns} isLoading={loading} />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border">
              <h3 className="text-xl font-bold">Add Contact</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enter contact details below.
              </p>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" /> Name
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="John Doe"
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
                  <Phone size={14} className="text-muted-foreground" /> Phone
                  Number
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail size={14} className="text-muted-foreground" /> Email
                  (Optional)
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag size={14} className="text-muted-foreground" /> Tags
                  (Comma separated)
                </label>
                <input
                  className="w-full rounded-xl bg-muted/50 border border-input px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="vip, new customer"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-muted-foreground font-medium hover:bg-muted transition-colors text-sm"
                  disabled={submitting}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 text-sm flex items-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
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
