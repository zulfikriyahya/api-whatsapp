// src/lib/validations/schemas.ts
import { z } from "zod";

// ============================================================================
// Shared Schemas
// ============================================================================

// Phone number validation
// Menerima input string apa saja, lalu membersihkan karakter non-digit
// Otomatis menambahkan '62' jika diawali '0' (asumsi Indonesia)
export const phoneNumberSchema = z
  .string()
  .min(5, "Phone number too short")
  .max(20, "Phone number too long")
  .transform((val) => {
    // Hapus semua karakter kecuali angka
    let cleaned = val.replace(/\D/g, "");

    // Normalize ID (08xx -> 628xx)
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.substring(1);
    }

    return cleaned;
  });

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const searchSchema = paginationSchema.merge(sortSchema).extend({
  search: z.string().optional(),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Stats filter schema
export const statsFilterSchema = z.object({
  deviceId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(["hour", "day", "week", "month"]).default("day"),
});

// ============================================================================
// Entity Schemas
// ============================================================================

// Device schemas
export const createDeviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phoneNumber: phoneNumberSchema,
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z
    .enum([
      "DISCONNECTED",
      "CONNECTING",
      "CONNECTED",
      "QR_READY",
      "AUTHENTICATED",
      "ERROR",
    ])
    .optional(),
});

// Message schemas
export const sendMessageSchema = z.object({
  deviceId: z.string().uuid("Invalid device ID"),
  toNumber: phoneNumberSchema,
  message: z.string().min(1, "Message cannot be empty").max(4096),
  scheduledAt: z.string().datetime().optional(),
});

export const sendBulkMessageSchema = z.object({
  deviceId: z.string().uuid("Invalid device ID").optional(),
  deviceIds: z.array(z.string().uuid()).optional(),
  useRoundRobin: z.boolean().default(true),
  message: z.string().min(1, "Message cannot be empty").max(4096),
  contacts: z
    .array(
      z.object({
        phoneNumber: phoneNumberSchema,
        name: z.string().optional(),
      }),
    )
    .min(1, "At least one contact is required"),
});

// Contact schemas
// PERBAIKAN: Menggunakan camelCase 'phoneNumber'
export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  phoneNumber: phoneNumberSchema,
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
});

export const updateContactSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phoneNumber: phoneNumberSchema.optional(),
  email: z.string().email().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
});

// Template schemas
export const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  content: z.string().min(1, "Content is required"),
  variables: z.record(z.string()).optional().nullable(),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  variables: z.record(z.string()).optional().nullable(),
});

// Auto-response schemas
export const createAutoResponseSchema = z.object({
  keyword: z.string().min(1, "Keyword is required").max(255),
  response: z.string().min(1, "Response is required"),
  deviceId: z.string().uuid("Invalid device ID"),
  priority: z.number().int().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export const updateAutoResponseSchema = z.object({
  keyword: z.string().min(1).max(255).optional(),
  response: z.string().min(1).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  isActive: z.boolean().optional(),
});

// Webhook schemas
export const createWebhookSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  events: z
    .array(z.string())
    .min(1, "At least one event is required")
    .refine(
      (events) =>
        events.every((e) =>
          [
            "message.sent",
            "message.delivered",
            "message.read",
            "message.failed",
            "device.connected",
            "device.disconnected",
          ].includes(e),
        ),
      "Invalid event type",
    ),
  secret: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  secret: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Backup schemas
export const restoreBackupSchema = z.object({
  filepath: z.string().min(1, "Backup filepath is required"),
});

// API Key schemas
export const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
});

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mfaCode: z.string().length(6).optional(),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(1, "Name is required").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ============================================================================
// Helper Functions
// ============================================================================

// Menggunakan Discriminated Union agar TS mengerti context types
type ValidationResult<T> =
  | { success: true; data: T; errors?: undefined }
  | {
      success: false;
      errors: Array<{ field: string; message: string }>;
      data?: undefined;
    };

/**
 * Validate data against schema safely
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.errors.map((err) => ({
    // Menggabungkan path array menjadi string (misal: "contacts.0.name")
    field: err.path.join("."),
    message: err.message,
  }));

  return { success: false, errors };
}
