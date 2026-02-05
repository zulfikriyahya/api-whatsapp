import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .min(5, "Nomor terlalu pendek")
  .max(20, "Nomor terlalu panjang")
  .transform((val) => {
    let cleaned = val.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1);
    }
    if (!cleaned.startsWith("62")) {
      cleaned = "62" + cleaned;
    }
    return cleaned.slice(0, 15);
  });

export const createDeviceSchema = z.object({
  name: z.string().min(1, "Nama device wajib diisi").max(50),
  phoneNumber: phoneNumberSchema,
});

export const sendMessageSchema = z.object({
  deviceId: z.string().uuid("Device ID tidak valid").optional(),
  toNumber: phoneNumberSchema,
  message: z.string().min(1, "Pesan tidak boleh kosong"),
});

export const sendBulkMessageSchema = z.object({
  deviceId: z.string().uuid().optional(),
  deviceIds: z.array(z.string().uuid()).optional(),
  message: z.string().min(1, "Pesan tidak boleh kosong"),
  contacts: z
    .array(
      z.object({
        phoneNumber: phoneNumberSchema,
        name: z.string().optional(),
      }),
    )
    .min(1, "Minimal 1 kontak tujuan")
    .max(1000, "Maksimal 1000 kontak per batch"),
  useRoundRobin: z.boolean().default(true),
});

export const createContactSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  phoneNumber: phoneNumberSchema,
  email: z.string().email("Email tidak valid").optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Nama template wajib diisi"),
  content: z.string().min(1, "Isi template wajib diisi"),
  variables: z.record(z.string(), z.string()).optional().nullable(),
});

export const createAutoResponseSchema = z.object({
  keyword: z.string().min(1, "Keyword wajib diisi"),
  response: z.string().min(1, "Response wajib diisi"),
  deviceId: z.string().uuid("Device ID tidak valid"),
  priority: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const createApiKeySchema = z.object({
  name: z.string().min(1, "Nama API Key wajib diisi").max(50),
});

export const updateWebhookSchema = z.object({
  url: z.string().url("URL tidak valid").optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  is_active: z.boolean().optional(),
});

export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true as const, data: result.data };
  }
  return {
    success: false as const,
    errors: result.error.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  };
}
