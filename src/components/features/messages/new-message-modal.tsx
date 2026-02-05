"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Loader2,
  Smartphone,
  User,
  FileText,
  MessageSquare,
  Paperclip,
  Image as ImageIcon,
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

  const [devices, setDevices] = useState<DeviceViewModel[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  const [selectedDevice, setSelectedDevice] = useState("");
  const [toNumber, setToNumber] = useState("");
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          const active = devJson.data.filter(
            (d: any) => d.status === "AUTHENTICATED",
          );
          setDevices(active);
          if (active.length === 1) setSelectedDevice(active[0].id);
        }
        if (conJson.success) setContacts(conJson.data);
        if (tplJson.success) setTemplates(tplJson.data);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data.");
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tpl = templates.find((t) => t.id === e.target.value);
    if (tpl) setMessage(tpl.content);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !toNumber) {
      setError("Device dan Nomor Tujuan wajib diisi.");
      return;
    }
    if (!message && !selectedFile) {
      setError("Isi pesan atau pilih file.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // PENTING: Gunakan FormData untuk support File Upload
      const formData = new FormData();
      formData.append("deviceId", selectedDevice);
      formData.append("toNumber", toNumber.replace(/\D/g, ""));
      formData.append("message", message);

      if (selectedFile) {
        formData.append("media", selectedFile);
      }

      // API Routes akan membaca ini dengan req.formData()
      const res = await fetch("/api/messages/send", {
        method: "POST",
        body: formData,
        // Jangan set Content-Type header manual saat pakai FormData, browser akan handle boundary-nya
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error?.message || "Gagal mengirim pesan");

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
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="font-bold text-xl">Kirim Pesan</h3>
            <p className="text-sm text-muted-foreground">
              Kirim pesan teks atau media.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {fetching ? (
            <div className="py-10 text-center">
              <Loader2 className="animate-spin mx-auto text-primary" />
            </div>
          ) : (
            <form id="msg-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Smartphone size={16} /> Sender Device
                </label>
                <select
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  required>
                  <option value="">-- Pilih Device --</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} /> Nomor Tujuan
                </label>
                <input
                  list="contacts-list"
                  type="text"
                  className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="08123xxxxx"
                  value={toNumber}
                  onChange={(e) => setToNumber(e.target.value)}
                  required
                />
                <datalist id="contacts-list">
                  {contacts.map((c) => (
                    <option key={c.id} value={c.phone_number}>
                      {c.name}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText size={16} /> Template
                </label>
                <select
                  className="w-full px-4 py-2 rounded-xl bg-muted/30 border border-input text-sm"
                  onChange={handleTemplateChange}
                  defaultValue="">
                  <option value="" disabled>
                    -- Load Template --
                  </option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare size={16} /> Pesan / Caption
                </label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-input outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none"
                  placeholder="Ketik pesan..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {/* Media Upload Area */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Paperclip size={16} /> Lampiran Media (Opsional)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,video/*,application/pdf"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors">
                  {selectedFile ? (
                    <div className="flex items-center gap-3 text-sm text-primary font-medium">
                      <ImageIcon size={20} /> {selectedFile.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-red-500 hover:text-red-600">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground text-sm">
                      <span className="font-semibold text-primary">
                        Klik upload
                      </span>{" "}
                      atau drag file
                      <br />
                      <span className="text-xs">
                        (Gambar, Video, PDF max 10MB)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted"
            disabled={loading}>
            Batal
          </button>
          <button
            form="msg-form"
            type="submit"
            disabled={loading || fetching || !selectedDevice}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-lg flex items-center gap-2">
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}{" "}
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
